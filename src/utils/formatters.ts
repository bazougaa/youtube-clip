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
  const parts = value.split(":").reverse();
  let total = 0;

  for (let i = 0; i < parts.length; i++) {
    const num = parseFloat(parts[i]);
    if (!Number.isFinite(num)) continue;
    total += num * Math.pow(60, i);
  }

  return total;
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!Number.isFinite(bytes) || bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
