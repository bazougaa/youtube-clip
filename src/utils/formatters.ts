export function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";

  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds / 60) % 60).toString();
  const hours = Math.floor(totalSeconds / 3600);

  return hours ? `${hours}:${minutes.padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

export function formatPreciseTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00.0";

  const tenths = Math.round(totalSeconds * 10) % 10;
  const wholeSeconds = Math.floor(totalSeconds);
  const seconds = (wholeSeconds % 60).toString().padStart(2, "0");
  const minutes = Math.floor((wholeSeconds / 60) % 60).toString();
  const hours = Math.floor(wholeSeconds / 3600);

  return hours
    ? `${hours}:${minutes.padStart(2, "0")}:${seconds}.${tenths}`
    : `${minutes}:${seconds}.${tenths}`;
}

export function parseTimeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return NaN;

  if (!trimmed.includes(":")) {
    return Number(trimmed);
  }

  const parts = trimmed.split(":").map((part) => part.trim());
  if (parts.some((part) => part === "")) return NaN;

  const numbers = parts.map(Number);
  if (numbers.some((part) => !Number.isFinite(part))) return NaN;

  return numbers.reduce((total, part) => total * 60 + part, 0);
}

export function formatBytes(bytes?: number) {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return "";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}
