import express from "express";
import { execFile, spawn } from "child_process";
import fs from "fs/promises";
import { existsSync } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import ffmpegStatic from "ffmpeg-static";
import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";

const execFileAsync = promisify(execFile);

// Redis Connection for BullMQ & Caching
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

import { LocalProxy } from "./src/utils/local-proxy.js";

async function runSpawnWithRetry(
  baseArgs: string[],
  timeoutMs: number
): Promise<void> {
  let attempt = 0;
  const videoUrl = baseArgs[baseArgs.length - 1];

  while (attempt <= MAX_RETRIES) {
    const useProxy = attempt > 0 && proxyManager.hasProxy();
    const proxyUrl = useProxy ? proxyManager.getProxyWithSession() : null;
    
    let localProxy: LocalProxy | null = null;
    let localProxyPort = 0;

    const args = [...baseArgs];
    if (proxyUrl) {
      try {
        const u = new URL(proxyUrl);
        localProxy = new LocalProxy(u.hostname, parseInt(u.port || '1080'), decodeURIComponent(u.username), decodeURIComponent(u.password));
        localProxyPort = await localProxy.start();

        args.push("--proxy", `socks5://${u.username}:${u.password}@${u.hostname}:${u.port}`);
        // We must explicitly tell ffmpeg to use the local HTTP proxy, because ffmpeg does not support SOCKS5.
        // The local proxy will forward the HTTP request to the SOCKS5 proxy-jet server.
        args.push("--downloader-args", `ffmpeg:-http_proxy http://127.0.0.1:${localProxyPort}`);
      } catch (err) {
        console.error("Failed to start local proxy", err);
      }
    }

    if (attempt > 0) {
      const humanDelay = 1000 + Math.random() * 2000;
      await new Promise(r => setTimeout(r, humanDelay));
    }

    try {
      console.log(`[yt-dlp Spawn] Attempt ${attempt} (Proxy: ${useProxy ? 'Yes (Session rotated)' : 'No'})`);
      await new Promise<void>((resolve, reject) => {
        let stderrData = "";
        const child = spawn(ytDlpPath, args, { stdio: ["ignore", "ignore", "pipe"] });
        
        if (child.stderr) {
          child.stderr.on("data", (data) => {
            stderrData += data.toString();
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
          if (localProxy) localProxy.stop().catch(console.error);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Process exited with code ${code}: ${stderrData}`));
          }
        });
      });
      healthTracker.logSuccess(attempt, videoUrl);
      return; // Success
    } catch (error: any) {
      if (localProxy) localProxy.stop().catch(console.error);
      console.warn(`[yt-dlp Spawn] Attempt ${attempt} failed. Proxy: ${proxyUrl ? 'Yes' : 'No'}. Error: ${error.message}`);
      
      attempt++;
      if (attempt > MAX_RETRIES) {
        healthTracker.logFailure("Exhausted all retries", videoUrl);
        throw error;
      }
      
      const backoff = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500;
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw new Error("yt-dlp spawn failed after all retries");
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

// Resolve yt-dlp binary path
const ytDlpPath = process.platform === "win32" 
  ? path.join(process.cwd(), "bin", "yt-dlp.exe")
  : "/usr/local/bin/yt-dlp"; // On Linux/Vercel, we'll assume yt-dlp is available in the PATH

const cookiesPath = path.join(process.cwd(), "cookies.txt");

// --- PROXY MANAGER & RETRY LOGIC (Step 2 & 5) ---
class ProxyManager {
  private proxyUrl: string | null = null;

  constructor() {
    // The rotating SOCKS5 proxy from proxy-jet.io
    // Using -session-{session} in the username to force IP rotation on every retry
    const defaultProxy = "socks5://260421fYsD1-resi-US-session-{session}:9AAzjCS2c54jxjz@ca.proxy-jet.io:2020";
    
    this.proxyUrl = process.env.PROXY_URL || process.env.PROXY_LIST || defaultProxy;
  }

  getProxyWithSession(): string | null {
    if (!this.proxyUrl) return null;
    
    // Generate a random session ID for each request to force rotation
    const sessionId = Math.random().toString(36).substring(2, 10);
    
    // If the proxy URL contains a {session} placeholder, replace it
    if (this.proxyUrl.includes("{session}")) {
      return this.proxyUrl.replace(/{session}/g, sessionId);
    }
    
    // If the provider rotates via query parameter like ?session=xyz
    if (this.proxyUrl.includes("?session=")) {
      return this.proxyUrl.replace(/\?session=[^&]*/, `?session=${sessionId}`);
    }

    return this.proxyUrl;
  }

  hasProxy() {
    return !!this.proxyUrl;
  }
}
const proxyManager = new ProxyManager();

// --- HEALTH TRACKER (Step 7) ---
class HealthTracker {
  private stats = {
    success: 0,
    failures: 0,
    retries: 0,
  };

  logSuccess(attempt: number, videoUrl?: string) {
    this.stats.success++;
    if (attempt > 0) this.stats.retries += attempt;
    console.log(`[Health Tracker] SUCCESS. Total Success: ${this.stats.success}, Failures: ${this.stats.failures}, Total Retries: ${this.stats.retries}`);
  }

  logFailure(errorMsg: string, videoUrl?: string) {
    this.stats.failures++;
    console.log(`[Health Tracker] FAILURE on ${videoUrl || 'unknown'}: ${errorMsg}. Total Failures: ${this.stats.failures}`);
  }
}
const healthTracker = new HealthTracker();

const MAX_RETRIES = 3;

async function executeYtDlpWithRetry(
  args: string[],
  options: { timeout?: number, maxBuffer?: number } = {}
): Promise<{ stdout: string; stderr: string }> {
  let attempt = 0;
  const videoUrl = args[args.length - 1];

  while (attempt <= MAX_RETRIES) {
    // Attempt 0: No proxy. Attempt 1+: Use proxy with fresh session.
    const useProxy = attempt > 0 && proxyManager.hasProxy();
    const proxyUrl = useProxy ? proxyManager.getProxyWithSession() : null;
    
    const currentArgs = [...args];
    if (proxyUrl) {
      currentArgs.push("--proxy", proxyUrl);
    }

    // Add 1-3s random delay before request to mimic human behavior (Step 6)
    if (attempt > 0) {
      const humanDelay = 1000 + Math.random() * 2000;
      await new Promise(r => setTimeout(r, humanDelay));
    }

    try {
      console.log(`[yt-dlp] Attempt ${attempt} (Proxy: ${useProxy ? 'Yes (Session rotated)' : 'No'})`);
      const result = await execFileAsync(ytDlpPath, currentArgs, {
        maxBuffer: options.maxBuffer || 1024 * 1024 * 10,
        timeout: options.timeout || 1000 * 45,
      });
      healthTracker.logSuccess(attempt, videoUrl);
      return result;
    } catch (error: any) {
      console.warn(`[yt-dlp] Attempt ${attempt} failed. Proxy: ${proxyUrl ? 'Yes' : 'No'}. Error: ${error.message}`);
      
      attempt++;
      if (attempt > MAX_RETRIES) {
        healthTracker.logFailure("Exhausted all retries", videoUrl);
        throw error;
      }
      
      // Backoff delay before the next attempt
      const backoff = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500;
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw new Error("yt-dlp failed after all retries");
}

function getBaseYtDlpArgs() {
  const args: string[] = [];
  if (existsSync(cookiesPath)) {
    args.push("--cookies", cookiesPath);
  }
  
  // Headers + Cookies simulation (Step 4)
  // yt-dlp automatically extracts cookies from browsers or uses the --cookies file.
  // We can add realistic headers to avoid blocks.
  args.push(
    "--add-header", "Accept-Language:en-US,en;q=0.9",
    "--add-header", "Sec-Fetch-Mode:navigate",
    "--add-header", "Referer:https://www.youtube.com/",
    "--add-header", "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  
  return args;
}

if (process.platform === "win32" && !existsSync(ytDlpPath)) {
  console.warn(`WARNING: yt-dlp binary not found at ${ytDlpPath}`);
}

const streamUrlPromises = new Map<string, Promise<string>>();

async function getPlayableVideoUrl(url: string) {
  // Request Deduplication (Step 10)
  if (streamUrlPromises.has(url)) {
    console.log(`[Deduplication] Joining existing stream URL request for ${url}`);
    return streamUrlPromises.get(url)!;
  }

  const promise = (async () => {
    // Use yt-dlp as the primary and only reliable extraction engine
    try {
      const { stdout } = await executeYtDlpWithRetry([
        ...getBaseYtDlpArgs(),
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

      // Double check the stream URL actually works
      const verifyResponse = await fetch(streamUrl, { method: 'HEAD' });
      if (!verifyResponse.ok) {
        throw new Error(`yt-dlp URL returned ${verifyResponse.status}`);
      }

      return streamUrl;
    } catch (ytDlpError) {
      console.error("yt-dlp failed to get playable video URL:", ytDlpError);
    }

    // If node library fails, return the embedded youtube URL directly for the player
    console.warn("All direct stream methods failed, falling back to standard youtube watch url");
    return url;
  })();

  streamUrlPromises.set(url, promise);
  try {
    return await promise;
  } finally {
    streamUrlPromises.delete(url);
  }
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

const metadataPromises = new Map<string, Promise<{ title: string; duration: number; formats: YtDlpFormat[] }>>();

async function getVideoDetails(url: string) {
  // Request Deduplication (Step 10)
  if (metadataPromises.has(url)) {
    console.log(`[Deduplication] Joining existing metadata request for ${url}`);
    return metadataPromises.get(url)!;
  }

  const promise = (async () => {
    // Check Redis Cache First
    const cacheKey = `metadata:${url}`;
    try {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        console.log(`[Cache Hit] Video metadata for ${url}`);
        return JSON.parse(cached) as { title: string; duration: number; formats: YtDlpFormat[] };
      }
    } catch (redisError) {
      console.warn("Redis cache read failed:", redisError);
    }

    console.log(`[Cache Miss] Fetching video metadata for ${url} via yt-dlp...`);

    if (process.platform === "win32" && !existsSync(ytDlpPath)) {
      console.warn("yt-dlp binary is unavailable, returning safe fallback metadata.");
      return fallbackVideoDetails();
    }

    try {
      const { stdout } = await executeYtDlpWithRetry([
        ...getBaseYtDlpArgs(),
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
      const result = {
        title: parsed.title || "YouTube Video",
        duration: Number(parsed.duration) || FALLBACK_DURATION_SECONDS,
        formats: Array.isArray(parsed.formats) ? parsed.formats : [],
      };

      // Save to Cache (expire in 24 hours)
      try {
        await redisConnection.set(cacheKey, JSON.stringify(result), "EX", 60 * 60 * 24);
      } catch (redisError) {
        console.warn("Redis cache write failed:", redisError);
      }

      return result;
    } catch (error) {
      console.error("All metadata extractions failed, returning safe defaults:", error);
      return fallbackVideoDetails();
    }
  })();

  metadataPromises.set(url, promise);
  try {
    return await promise;
  } finally {
    metadataPromises.delete(url);
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
    ...getBaseYtDlpArgs(),
    "--no-playlist",
    "--no-warnings",
    "--no-progress",
    "--force-ipv4",
    "--force-keyframes-at-cuts",
    "--force-overwrites",
    "--no-continue",
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
    await runSpawnWithRetry(args, 1000 * 60 * 10); // 10 minute timeout

    const files = await fs.readdir(tempDir);
    const clipFile = files.find((file) => file.toLowerCase().endsWith(".mp4")) || files[0];
    if (!clipFile) {
      throw new Error("yt-dlp did not create a clip file");
    }

    const finalPath = path.join(tempDir, clipFile);

    return {
      filePath: finalPath,
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
    ...getBaseYtDlpArgs(),
    "--no-playlist",
    "--no-warnings",
    "--no-progress",
    "--force-ipv4",
    "--force-overwrites",
    "--no-continue",
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
    await runSpawnWithRetry(args, 1000 * 60 * 30); // 30 minute timeout

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

  // Basic Anti-Abuse Rate Limiter (Step 15) using Redis
  app.use("/api/", async (req, res, next) => {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown') as string;
    const clientIp = ip.split(',')[0].trim();
    
    const key = `rate-limit:${clientIp}`;
    try {
      const current = await redisConnection.incr(key);
      if (current === 1) {
        await redisConnection.expire(key, 60); // 1 minute window
      }
      
      // Limit to 20 API requests per minute per IP
      if (current > 20) {
        console.warn(`[Rate Limit] Blocked request from ${clientIp}`);
        return res.status(429).json({ error: "Too many requests. Please try again later." });
      }
      next();
    } catch (error) {
      console.warn("Rate limiter redis error, bypassing:", error);
      next();
    }
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
      
      res.json({ jobId: job.id, message: "Trim job started" });
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
      
      res.json({ jobId: job.id, message: "Download job started" });
    } catch (error) {
      console.error('Error downloading media:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to queue download media job." });
      }
    }
  });

  app.get("/api/job-status/:id", async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    try {
      const job = await mediaQueue.getJob(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const state = await job.getState();
      const progress = job.progress;
      const failedReason = job.failedReason;

      res.json({
        id: job.id,
        state,
        progress,
        failedReason,
      });
    } catch (error: any) {
      console.error('Error checking job status:', error);
      res.status(500).json({ error: "Failed to check job status" });
    }
  });

  app.get("/api/download-file/:id", async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    try {
      const job = await mediaQueue.getJob(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const state = await job.getState();
      if (state !== "completed") {
        return res.status(400).json({ error: `Job is not completed yet (current state: ${state})` });
      }

      const result = job.returnvalue;
      if (!result || !result.filePath || !existsSync(result.filePath)) {
        return res.status(500).json({ error: "File not found or already deleted." });
      }

      const { url, startTime, endTime, kind, quality } = job.data;
      let title = "youtube_video";
      try {
        const metadata = await getVideoMetadata(url);
        title = safeFileName(metadata.title);
      } catch (metadataError) {
        console.warn("Metadata lookup failed, falling back to default media name:", metadataError);
      }

      let filename = "download.mp4";
      if (job.name === "trim") {
        filename = `${title}_${formatSectionTime(startTime)}-${formatSectionTime(endTime)}.mp4`;
        res.setHeader('Content-Type', 'video/mp4');
      } else if (job.name === "download") {
        const qualityLabel = kind === "audio" ? "audio" : String(quality);
        filename = `${title}_${qualityLabel}.${result.extension || 'mp4'}`;
        res.setHeader('Content-Type', kind === "audio" ? 'audio/m4a' : 'video/mp4');
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.download(result.filePath, filename, async (downloadError) => {
        // Clean up temp directory after successful download
        try {
          if (result.tempDir) {
            await fs.rm(result.tempDir, { recursive: true, force: true });
          }
        } catch (rmError) {
          console.error("Failed to remove temp dir:", rmError);
        }
        if (downloadError && !res.headersSent) {
          res.status(500).json({ error: "Failed to download media" });
        }
      });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to download file." });
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

// --- ROBUST TEMPORARY FILE CLEANUP (Cron) ---
// Run every hour to delete orphaned temporary folders (older than 2 hours)
function startTempFileCleanupCron() {
  const CLEANUP_INTERVAL_MS = 1000 * 60 * 60; // 1 hour
  const MAX_AGE_MS = 1000 * 60 * 60 * 2; // 2 hours

  setInterval(async () => {
    try {
      const tmpDir = os.tmpdir();
      const files = await fs.readdir(tmpDir);
      const now = Date.now();

      let cleanedCount = 0;

      for (const file of files) {
        if (file.startsWith("youtube-clip-") || file.startsWith("youtube-download-")) {
          const fullPath = path.join(tmpDir, file);
          try {
            const stats = await fs.stat(fullPath);
            if (now - stats.mtimeMs > MAX_AGE_MS) {
              await fs.rm(fullPath, { recursive: true, force: true });
              cleanedCount++;
            }
          } catch (statError) {
            // Ignore individual file stat/rm errors (e.g. permission issues or file already deleted)
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`[Cleanup Cron] Successfully removed ${cleanedCount} stale temporary directories.`);
      }
    } catch (err) {
      console.error("[Cleanup Cron] Failed to read temporary directory:", err);
    }
  }, CLEANUP_INTERVAL_MS);
  
  console.log("[Cleanup Cron] Initialized. Running every 1 hour.");
}

// Only start the cron if not in a serverless environment (Vercel kills background tasks)
if (!process.env.VERCEL) {
  startTempFileCleanupCron();
}
