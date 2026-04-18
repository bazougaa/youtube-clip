import express from "express";
import { execFile, spawn } from "child_process";
import fs from "fs/promises";
import { existsSync } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import ytdl from "@distube/ytdl-core";
import ffmpegStatic from "ffmpeg-static";
import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";

const execFileAsync = promisify(execFile);

// Redis Connection for BullMQ
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

// Setup Queue to handle concurrent media processing requests
const mediaQueue = new Queue("media-processing", { connection: redisConnection });
const queueEvents = new QueueEvents("media-processing", { connection: redisConnection });

// Setup Worker that processes the jobs
const mediaWorker = new Worker("media-processing", async (job) => {
  if (job.name === "trim") {
    const { url, startTime, endTime } = job.data;
    console.log(`[Worker] Processing trim job ${job.id} for ${url}`);
    return await createTrimmedClip(url, startTime, endTime);
  } else if (job.name === "download") {
    const { url, kind, quality } = job.data;
    console.log(`[Worker] Processing download job ${job.id} for ${url}`);
    return await createMediaDownload(url, kind, quality);
  }
}, {
  connection: redisConnection,
  concurrency: 4, // Upgraded to 4 concurrent jobs to utilize the 6 CPU cores optimally without maxing out the server
});

mediaWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

function runSpawn(command: string, args: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let stderrData = "";
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    
    if (child.stderr) {
      child.stderr.on("data", (data) => {
        stderrData += data.toString();
        // keep stderr bounded to avoid memory issues
        if (stderrData.length > 50000) {
          stderrData = stderrData.slice(-50000);
        }
      });
    }

    const timeoutId = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Process timed out"));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve();
      } else {
        console.error(`yt-dlp exited with code ${code}\nStderr: ${stderrData}`);
        reject(new Error(`Process exited with code ${code}: ${stderrData}`));
      }
    });
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const FALLBACK_DURATION_SECONDS = 600;
const METADATA_TIMEOUT_MS = 12000;

function fallbackVideoDetails() {
  return {
    title: "YouTube Video",
    duration: FALLBACK_DURATION_SECONDS,
    formats: [] as YtDlpFormat[],
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// Resolve yt-dlp binary path
const ytDlpPath = process.platform === "win32" 
  ? path.join(process.cwd(), "bin", "yt-dlp.exe")
  : "/usr/local/bin/yt-dlp"; // On Linux/Vercel, we'll assume yt-dlp is available in the PATH

if (process.platform === "win32" && !existsSync(ytDlpPath)) {
  console.warn(`WARNING: yt-dlp binary not found at ${ytDlpPath}`);
}

async function getPlayableVideoUrl(url: string) {
  try {
    // Attempt to use ytdl-core first for Vercel compatibility
    const info = await ytdl.getInfo(url);
    
    // Check if decipher failed based on number of formats
    if (info.formats && info.formats.length >= 5) {
      // Sometimes 'audioandvideo' filter fails if a combined stream isn't available at highest quality.
      // So we use a custom filter to ensure we get a combined mp4 stream if possible.
      const format = ytdl.chooseFormat(info.formats, { 
        filter: (format) => format.container === 'mp4' && format.hasVideo && format.hasAudio 
      }) || ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
      
      if (format && format.url) {
        // Verify the URL actually works (ytdl-core sometimes returns 403 URLs)
        const response = await fetch(format.url, { method: 'HEAD' });
        if (response.ok) {
          return format.url;
        } else {
          console.warn(`ytdl-core URL returned ${response.status}, falling back to yt-dlp...`);
        }
      }
    } else {
      console.warn("ytdl-core returned too few formats, skipping to yt-dlp stream URL lookup.");
    }
  } catch (ytdlError) {
    console.warn("ytdl-core stream URL lookup failed, falling back to yt-dlp:", ytdlError);
  }

  // Fallback to yt-dlp if available
  try {
    const { stdout } = await execFileAsync(ytDlpPath, [
      "--no-playlist",
      "--no-warnings",
      "--force-ipv4",
      "-f",
      "best[ext=mp4][vcodec!=none][acodec!=none]/best[ext=mp4]/best",
      "--get-url",
      url,
    ]);

    const streamUrl = stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
    if (!streamUrl) {
      throw new Error("yt-dlp did not return a playable URL");
    }

    // Double check the stream URL actually works, because yt-dlp can sometimes return 403s on Windows
    const verifyResponse = await fetch(streamUrl, { method: 'HEAD' });
    if (!verifyResponse.ok) {
      throw new Error(`yt-dlp URL returned ${verifyResponse.status}`);
    }

    return streamUrl;
  } catch (ytDlpError) {
    console.error("yt-dlp failed:", ytDlpError);
  }

  // If both node libraries fail, return the embedded youtube URL directly for the player
  // This ensures the frontend doesn't crash entirely and can at least fall back to youtube embed
  console.warn("All direct stream methods failed, falling back to standard youtube watch url");
  return url;
}

type YtDlpFormat = {
  format_id?: string;
  ext?: string;
  height?: number;
  width?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
};

async function getVideoDetails(url: string) {
  try {
    // Attempt to use ytdl-core first as it's purely Node.js and works cleanly on Vercel
    // Add a hard timeout so serverless requests fail fast into fallback metadata.
    const info = await withTimeout(
      ytdl.getInfo(url, {
        requestOptions: {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
        },
      }),
      METADATA_TIMEOUT_MS,
      "ytdl-core metadata lookup timed out",
    );

    const formatList = Array.isArray((info as { formats?: unknown }).formats) ? info.formats : [];
    const formats: YtDlpFormat[] = formatList.map((f) => ({
      format_id: String(f.itag),
      ext: f.container,
      height: f.height,
      width: f.width,
      fps: f.fps,
      vcodec: f.hasVideo ? f.videoCodec : "none",
      acodec: f.hasAudio ? f.audioCodec : "none",
      filesize: Number(f.contentLength) || undefined,
    }));

    // If ytdl-core decipher failed, it often returns very few or 0 formats.
    // Force yt-dlp fallback if we don't get a good list of qualities.
    if (formats.length < 5) {
      throw new Error("ytdl-core returned too few formats, likely due to decipher failure.");
    }

    return {
      title: info.videoDetails.title,
      duration: Number(info.videoDetails.lengthSeconds),
      formats,
    };
  } catch (ytdlError) {
    console.warn("ytdl-core metadata lookup failed, attempting yt-dlp fallback:", ytdlError);

    if (process.platform === "win32" && !existsSync(ytDlpPath)) {
      console.warn("yt-dlp binary is unavailable, returning safe fallback metadata.");
      return fallbackVideoDetails();
    }

    try {
      const { stdout } = await execFileAsync(ytDlpPath, [
        "--no-playlist",
        "--no-warnings",
        "--force-ipv4",
        "--socket-timeout",
        "15",
        "--dump-single-json",
        url,
      ], {
        maxBuffer: 1024 * 1024 * 10,
        timeout: 1000 * 45,
      });

      const parsed = JSON.parse(stdout) as { title?: string; duration?: number; formats?: YtDlpFormat[] };
      return {
        title: parsed.title || "YouTube Video",
        duration: Number(parsed.duration) || FALLBACK_DURATION_SECONDS,
        formats: Array.isArray(parsed.formats) ? parsed.formats : [],
      };
    } catch (fallbackError) {
      console.error("All metadata fallbacks failed, returning safe defaults:", fallbackError);
      return fallbackVideoDetails();
    }
  }
}

function getAvailableQualities(formats: YtDlpFormat[] = []) {
  const qualitiesByHeight = new Map<number, {
    height: number;
    label: string;
    width?: number;
    fps?: number;
    approxSize?: number;
  }>();

  for (const format of formats) {
    if (
      !format.height ||
      format.height <= 0 ||
      format.ext !== "mp4" ||
      format.vcodec === "none"
    ) {
      continue;
    }

    const current = qualitiesByHeight.get(format.height);
    const nextFps = format.fps || current?.fps;
    qualitiesByHeight.set(format.height, {
      height: format.height,
      label: `${format.height}p${nextFps && nextFps > 30 ? nextFps : ""}`,
      width: Math.max(current?.width || 0, format.width || 0) || undefined,
      fps: nextFps,
      approxSize: format.filesize || format.filesize_approx || current?.approxSize,
    });
  }

  return Array.from(qualitiesByHeight.values()).sort((a, b) => b.height - a.height);
}

async function getVideoMetadata(url: string) {
  const info = await getVideoDetails(url);
  return {
    title: info.title || "YouTube video",
    duration: Number(info.duration) || 0,
    qualities: getAvailableQualities(info.formats),
  };
}

function formatSectionTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toFixed(1).padStart(4, "0"),
  ].join(":");
}

function safeFileName(value: string) {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "youtube_clip";
}

async function createTrimmedClip(url: string, startTime: number, endTime: number) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "youtube-clip-"));
  const outputTemplate = path.join(tempDir, "clip.%(ext)s");
  const args = [
    "--no-playlist",
    "--no-warnings",
    "--no-progress",
    "--force-ipv4",
    "--force-keyframes-at-cuts",
    "--download-sections",
    `*${formatSectionTime(startTime)}-${formatSectionTime(endTime)}`,
    "-f",
    "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
    "--merge-output-format",
    "mp4",
    "-o",
    outputTemplate,
  ];

  if (ffmpegStatic) {
    args.push("--ffmpeg-location", ffmpegStatic as unknown as string);
  }

  args.push(url);

  try {
    console.log("Running yt-dlp to trim video:", ytDlpPath, args);
    await runSpawn(ytDlpPath, args, 1000 * 60 * 10); // 10 minute timeout

    const files = await fs.readdir(tempDir);
    const clipFile = files.find((file) => file.toLowerCase().endsWith(".mp4")) || files[0];
    if (!clipFile) {
      throw new Error("yt-dlp did not create a clip file");
    }

    return {
      filePath: path.join(tempDir, clipFile),
      tempDir,
    };
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

function getVideoFormatSelector(quality: string) {
  if (quality === "best") {
    return "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best";
  }

  const height = Number(quality.replace(/p\d*$/i, ""));
  if (!Number.isFinite(height) || height <= 0) {
    throw new Error(`Invalid quality: ${quality}`);
  }

  return `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/best[height<=${height}]`;
}

async function createMediaDownload(url: string, kind: string, quality: string) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "youtube-download-"));
  const outputTemplate = path.join(tempDir, "download.%(ext)s");
  const args = [
    "--no-playlist",
    "--no-warnings",
    "--no-progress",
    "--force-ipv4",
    "-o",
    outputTemplate,
  ];

  if (kind === "audio") {
    args.push("-f", "bestaudio/best", "-x", "--audio-format", "mp3");
  } else {
    args.push("-f", getVideoFormatSelector(quality), "--merge-output-format", "mp4");
  }

  if (ffmpegStatic) {
    args.push("--ffmpeg-location", ffmpegStatic as unknown as string);
  }

  args.push(url);

  try {
    await runSpawn(ytDlpPath, args, 1000 * 60 * 30); // 30 minute timeout

    const files = await fs.readdir(tempDir);
    const mediaFile = files.find((file) => /\.(mp4|mp3|m4a|webm)$/i.test(file)) || files[0];
    if (!mediaFile) {
      throw new Error("yt-dlp did not create a media file");
    }

    return {
      filePath: path.join(tempDir, mediaFile),
      tempDir,
      extension: path.extname(mediaFile).slice(1) || (kind === "audio" ? "mp3" : "mp4"),
    };
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

// Initialize express app outside startServer so Vercel can find it immediately
const app = express();
const PORT = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(PORT) || PORT <= 0) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

async function startServer() {
  app.use(express.json());

  // Add a simple request logger
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  });

  // API Route for trimming
  app.get("/api/trim", async (req, res) => {
    const { url, start, end } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL is required" });
    }

    const startTime = parseFloat(start as string) || 0;
    const endTime = parseFloat(end as string) || 10;
    const duration = endTime - startTime;

    if (duration <= 0) {
      return res.status(400).json({ error: "Invalid duration" });
    }

    try {
      console.log(`Queueing trim job: ${url} from ${startTime} to ${endTime}`);
      const job = await mediaQueue.add("trim", { url, startTime, endTime });
      
      // Wait for the worker to finish the job
      const clip = await job.waitUntilFinished(queueEvents);
      
      if (!clip || !clip.filePath || !existsSync(clip.filePath)) {
        throw new Error("Clip file was not generated properly.");
      }

      let title = "youtube_clip";
      try {
        const metadata = await getVideoMetadata(url);
        title = safeFileName(metadata.title);
      } catch (metadataError) {
        console.warn("Metadata lookup failed, falling back to default clip name:", metadataError);
      }

      const filename = `${title}_${formatSectionTime(startTime)}-${formatSectionTime(endTime)}.mp4`;
      
      // Ensure we send correct disposition headers
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'video/mp4');

      res.download(clip.filePath, filename, async (downloadError) => {
        try {
          await fs.rm(clip.tempDir, { recursive: true, force: true });
        } catch (rmError) {
          console.error("Failed to remove temp dir:", rmError);
        }
        if (downloadError && !res.headersSent) {
          res.status(500).json({ error: "Failed to download clip" });
        }
      });

    } catch (error: any) {
      console.error('Error processing video:', error);
      res.status(500).json({ error: error.message || "Failed to process video. YouTube might be blocking the request." });
    }
  });

  app.get("/api/download-media", async (req, res) => {
    const { url, kind = "video", quality = "best" } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL is required" });
    }

    if (kind !== "video" && kind !== "audio") {
      return res.status(400).json({ error: "Download kind must be video or audio" });
    }

    try {
      console.log(`Queueing download job: ${kind} for ${url} quality=${quality}`);
      const job = await mediaQueue.add("download", { url, kind, quality: String(quality) });
      
      // Wait for the worker to finish the job
      const media = await job.waitUntilFinished(queueEvents);

      let title = "youtube_video";
      try {
        const metadata = await getVideoMetadata(url);
        title = safeFileName(metadata.title);
      } catch (metadataError) {
        console.warn("Metadata lookup failed, falling back to default media name:", metadataError);
      }

      const qualityLabel = kind === "audio" ? "audio" : String(quality);
      const filename = `${title}_${qualityLabel}.${media.extension}`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', kind === "audio" ? 'audio/m4a' : 'video/mp4');

      res.download(media.filePath, filename, async (downloadError) => {
        try {
          await fs.rm(media.tempDir, { recursive: true, force: true });
        } catch (rmError) {
          console.error("Failed to remove temp dir:", rmError);
        }
        if (downloadError && !res.headersSent) {
          res.status(500).json({ error: "Failed to download media" });
        }
      });
    } catch (error) {
      console.error('Error downloading media:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to download media." });
      }
    }
  });

  app.get("/api/frame", async (req, res) => {
    res.status(501).json({ error: "Frame extraction is currently unavailable." });
  });

  app.get("/api/video-info", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const info = await getVideoMetadata(url);
      res.json(info);
    } catch (error) {
      console.error('Error reading video info:', error);
      // Fail soft: keep the app usable even when metadata providers are blocked.
      res.status(200).json({
        title: "YouTube video",
        duration: FALLBACK_DURATION_SECONDS,
        qualities: [],
        warning: "Could not read exact duration, using a fallback so preview can continue.",
      });
    }
  });

  // Allow .mp4 extension for players that require it (like ReactPlayer)
  app.get(["/api/stream", "/api/stream.mp4"], async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const streamUrl = await getPlayableVideoUrl(url);
      res.redirect(302, streamUrl);
    } catch (error) {
      console.error('Error streaming video:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream video." });
      }
    }
  });

  // Vite middleware for development (disabled in Vercel production)
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      if (!req.path.startsWith("/api/")) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express global error handler:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  });

  // Only listen if not running in a serverless environment like Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

// Export for Vercel serverless
export default app;
