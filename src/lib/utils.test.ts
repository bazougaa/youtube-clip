import { describe, expect, it } from "vitest";
import { cn } from "./utils";
import { getYouTubeVideoId, normalizeYouTubeInputUrl } from "../utils/youtube";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("dedupes tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("youtube helpers", () => {
  it("normalizes bare watch urls", () => {
    expect(normalizeYouTubeInputUrl("youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
  });

  it("normalizes short share urls", () => {
    expect(normalizeYouTubeInputUrl("youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
  });

  it("extracts ids from live urls", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
});

