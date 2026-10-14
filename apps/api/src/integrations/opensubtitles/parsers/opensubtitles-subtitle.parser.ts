import type {
  OpenSubtitlesSubtitleContent,
  OpenSubtitlesSubtitleCue,
} from "../opensubtitles.types";

const TIMING_LINE_PATTERN =
  /^(?<start>\d{2}:\d{2}(?::\d{2})?[,.]\d{3})\s+-->\s+(?<end>\d{2}:\d{2}(?::\d{2})?[,.]\d{3})/;

const stripSubtitleMarkup = (value: string): string =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/\{\\[^}]+\}/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

const parseCue = (block: string, index: number): OpenSubtitlesSubtitleCue | null => {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const timingLineIndex = lines.findIndex((line) =>
    TIMING_LINE_PATTERN.test(line),
  );
  const timingLine = lines[timingLineIndex];

  if (!timingLine) {
    return null;
  }

  const timingMatch = timingLine.match(TIMING_LINE_PATTERN);

  if (!timingMatch?.groups) {
    return null;
  }

  const text = lines
    .slice(timingLineIndex + 1)
    .map(stripSubtitleMarkup)
    .filter(Boolean)
    .join(" ");

  if (!text) {
    return null;
  }

  return {
    index,
    startTime: timingMatch.groups.start,
    endTime: timingMatch.groups.end,
    text,
  };
};

export const parseOpenSubtitlesContent = (
  content: string,
  fileName: string,
): OpenSubtitlesSubtitleContent => {
  const normalizedContent = content
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .trim();
  const isVtt = /^WEBVTT(?:\s|$)/i.test(normalizedContent);
  const blocks = normalizedContent.split(/\n{2,}/);
  const cues = blocks
    .map((block, index) => parseCue(block, index + 1))
    .filter((cue): cue is OpenSubtitlesSubtitleCue => cue !== null);

  return {
    fileName,
    format: isVtt ? "vtt" : cues.length > 0 ? "srt" : "text",
    cues,
    text: cues.length > 0
      ? cues.map((cue) => cue.text).join("\n")
      : normalizedContent,
  };
};
