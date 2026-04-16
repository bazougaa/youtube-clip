import express from "express";
import { execFile } from "child_process";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
const execFileAsync = promisify(execFile);
const ytDlpPath = path.join(process.cwd(), "bin", process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
// Set ffmpeg path
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}
async function getPlayableVideoUrl(url) {
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
    return streamUrl;
}
async function getVideoDetails(url) {
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
    return JSON.parse(stdout);
}
function getAvailableQualities(formats = []) {
    const qualitiesByHeight = new Map();
    for (const format of formats) {
        if (!format.height ||
            format.height <= 0 ||
            format.ext !== "mp4" ||
            format.vcodec === "none") {
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
async function getVideoMetadata(url) {
    const info = await getVideoDetails(url);
    return {
        title: info.title || "YouTube video",
        duration: Number(info.duration) || 0,
        qualities: getAvailableQualities(info.formats),
    };
}
function formatSectionTime(totalSeconds) {
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
function safeFileName(value) {
    return value
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120) || "youtube_clip";
}
async function createTrimmedClip(url, startTime, endTime) {
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
        args.push("--ffmpeg-location", ffmpegStatic);
    }
    args.push(url);
    try {
        await execFileAsync(ytDlpPath, args, {
            maxBuffer: 1024 * 1024 * 20,
            timeout: 1000 * 60 * 10,
        });
        const files = await fs.readdir(tempDir);
        const clipFile = files.find((file) => file.toLowerCase().endsWith(".mp4")) || files[0];
        if (!clipFile) {
            throw new Error("yt-dlp did not create a clip file");
        }
        return {
            filePath: path.join(tempDir, clipFile),
            tempDir,
        };
    }
    catch (error) {
        await fs.rm(tempDir, { recursive: true, force: true });
        throw error;
    }
}
function getVideoFormatSelector(quality) {
    if (quality === "best") {
        return "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best";
    }
    const height = Number(quality.replace(/p\d*$/i, ""));
    if (!Number.isFinite(height) || height <= 0) {
        throw new Error(`Invalid quality: ${quality}`);
    }
    return `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/best[height<=${height}]`;
}
async function createMediaDownload(url, kind, quality) {
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
    }
    else {
        args.push("-f", getVideoFormatSelector(quality), "--merge-output-format", "mp4");
    }
    if (ffmpegStatic) {
        args.push("--ffmpeg-location", ffmpegStatic);
    }
    args.push(url);
    try {
        await execFileAsync(ytDlpPath, args, {
            maxBuffer: 1024 * 1024 * 20,
            timeout: 1000 * 60 * 30,
        });
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
    }
    catch (error) {
        await fs.rm(tempDir, { recursive: true, force: true });
        throw error;
    }
}
// Initialize express app outside startServer so Vercel can find it immediately
const app = express();

async function startServer() {
    const PORT = Number(process.env.PORT ?? 3000);
    if (!Number.isInteger(PORT) || PORT <= 0) {
        throw new Error(`Invalid PORT value: ${process.env.PORT}`);
    }
    app.use(express.json());
    // API Route for trimming
    app.get("/api/trim", async (req, res) => {
        const { url, start, end } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: "URL is required" });
        }
        const startTime = parseFloat(start) || 0;
        const endTime = parseFloat(end) || 10;
        const duration = endTime - startTime;
        if (duration <= 0) {
            return res.status(400).json({ error: "Invalid duration" });
        }
        try {
            console.log(`Trimming video: ${url} from ${startTime} to ${endTime}`);
            const clip = await createTrimmedClip(url, startTime, endTime);
            let title = "youtube_clip";
            try {
                const metadata = await getVideoMetadata(url);
                title = safeFileName(metadata.title);
            }
            catch (metadataError) {
                console.warn("Metadata lookup failed, falling back to default clip name:", metadataError);
            }
            const filename = `${title}_${formatSectionTime(startTime)}-${formatSectionTime(endTime)}.mp4`;
            res.download(clip.filePath, filename, async (downloadError) => {
                await fs.rm(clip.tempDir, { recursive: true, force: true });
                if (downloadError && !res.headersSent) {
                    res.status(500).json({ error: "Failed to download clip" });
                }
            });
        }
        catch (error) {
            console.error('Error processing video:', error);
            res.status(500).json({ error: "Failed to process video. YouTube might be blocking the request." });
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
            console.log(`Downloading ${kind}: ${url} quality=${quality}`);
            const media = await createMediaDownload(url, kind, String(quality));
            let title = "youtube_video";
            try {
                const metadata = await getVideoMetadata(url);
                title = safeFileName(metadata.title);
            }
            catch (metadataError) {
                console.warn("Metadata lookup failed, falling back to default media name:", metadataError);
            }
            const qualityLabel = kind === "audio" ? "audio" : String(quality);
            const filename = `${title}_${qualityLabel}.${media.extension}`;
            res.download(media.filePath, filename, async (downloadError) => {
                await fs.rm(media.tempDir, { recursive: true, force: true });
                if (downloadError && !res.headersSent) {
                    res.status(500).json({ error: "Failed to download media" });
                }
            });
        }
        catch (error) {
            console.error('Error downloading media:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: "Failed to download media." });
            }
        }
    });

    app.get("/api/frame", async (req, res) => {
        const { url, time } = req.query;
        if (!url || typeof url !== 'string')
            return res.status(400).send("URL required");
        const timestamp = parseFloat(time) || 0;
        try {
            const videoStream = ytdl(url, {
                quality: 'highestvideo',
                filter: 'videoonly'
            });
            res.setHeader('Content-Type', 'image/jpeg');
            ffmpeg(videoStream)
                .seekInput(timestamp)
                .frames(1)
                .format('image2')
                .on('error', (err) => {
                console.error('Frame extraction error:', err);
                if (!res.headersSent)
                    res.status(500).send("Error");
            })
                .pipe(res, { end: true });
        }
        catch (error) {
            console.error('Frame extraction error:', error);
            res.status(500).send("Error");
        }
    });

    app.get("/api/video-info", async (req, res) => {
        const { url } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: "URL is required" });
        }
        try {
            const info = await getVideoMetadata(url);
            res.json(info);
        }
        catch (error) {
            console.error('Error reading video info:', error);
            res.status(500).json({ error: "Failed to read video info." });
        }
    });

    app.get("/api/stream", async (req, res) => {
        const { url } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: "URL is required" });
        }
        try {
            const streamUrl = await getPlayableVideoUrl(url);
            res.redirect(302, streamUrl);
        }
        catch (error) {
            console.error('Error streaming video:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: "Failed to stream video." });
            }
        }
    });

    // Vite middleware for development (disabled in Vercel production)
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }
    else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            if (!req.path.startsWith("/api/")) {
                res.sendFile(path.join(distPath, 'index.html'));
            }
        });
    }
    
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
