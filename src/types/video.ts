export type VideoQuality = {
  height: number;
  label: string;
  width?: number;
  fps?: number;
  approxSize?: number;
};

export type JobStatusResponse = {
  id: string;
  state: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  failedReason?: string;
};
