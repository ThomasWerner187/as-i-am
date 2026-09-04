import { groupCaptionWords } from "./caption-groups.mjs";

export const storyText = (story) => story.map((part) => part.text).join(" ");

/** The single speech track is the clock. Chapter markers never split its audio. */
export function alignStory(story, alignment, audioSeconds) {
  const text = storyText(story);
  const starts = alignment?.character_start_times_seconds;
  const ends = alignment?.character_end_times_seconds;
  if (
    !story.length ||
    alignment?.characters?.join("") !== text ||
    starts?.length !== text.length ||
    ends?.length !== text.length ||
    !Number.isFinite(audioSeconds) ||
    audioSeconds <= 0
  )
    throw new Error("Speech alignment does not match the complete script.");
  for (let i = 0; i < text.length; i++) {
    if (
      !Number.isFinite(starts[i]) ||
      !Number.isFinite(ends[i]) ||
      starts[i] < 0 ||
      ends[i] < starts[i] ||
      ends[i] > audioSeconds + 0.1 ||
      (i && starts[i] < starts[i - 1])
    )
      throw new Error("Invalid speech timing.");
  }
  let offset = 0;
  const chapters = story.map((part, index) => {
    const start = index === 0 ? 0 : starts[offset];
    offset += part.text.length + 1;
    return { chapter: part.chapter, sourceChapter: part.sourceChapter, start };
  });
  const duration = audioSeconds + 0.6;
  chapters.forEach((part, index) => {
    part.end = chapters[index + 1]?.start ?? duration;
    if (part.end <= part.start) throw new Error("Empty spoken chapter.");
  });
  const cues = groupCaptionWords([...text.matchAll(/\S+/g)]).map((group) => ({
    start: starts[group[0].index],
    end: ends[group.at(-1).index + group.at(-1)[0].length - 1],
    text: group
      .map((word) => word[0])
      .join(" ")
      .replaceAll("Web M C P", "WebMCP"),
  }));
  return { duration, audioSeconds, chapters, cues };
}

/** Short motion intervals stay real-time; only the long recorded holds change. */
export function fitIntervals(intervals, targetSeconds) {
  const motion = intervals.filter((item) => item.seconds <= 0.2);
  const holds = intervals.filter((item) => item.seconds > 0.2);
  const motionSeconds = motion.reduce((sum, item) => sum + item.seconds, 0);
  const holdSeconds = holds.reduce((sum, item) => sum + item.seconds, 0);
  const remaining = targetSeconds - motionSeconds;
  if (
    !Number.isFinite(targetSeconds) ||
    targetSeconds <= 0 ||
    !intervals.length ||
    intervals.some(
      (item) => !Number.isFinite(item.seconds) || item.seconds <= 0,
    )
  )
    throw new Error("Invalid capture intervals.");
  if (!holdSeconds || remaining < holds.length / 30)
    throw new Error(
      "The speech is too short for the real clicks; choose a longer visual beat.",
    );
  const minimum = 1 / 30;
  const extra = remaining - holds.length * minimum;
  return intervals.map((item) => ({
    ...item,
    seconds:
      item.seconds <= 0.2
        ? item.seconds
        : minimum + (extra * item.seconds) / holdSeconds,
  }));
}

export function retimeCapture(manifest, plan) {
  if (manifest.failure || !manifest.frames?.length || !manifest.events?.length)
    throw new Error("Incomplete source capture.");
  const first = manifest.frames[0].at_ms;
  const sourceDuration = (manifest.total_ms - first) / 1000;
  const sourceFrames = manifest.frames.map((frame, index) => {
    if (!/^\d+\.jpg$/.test(frame.file))
      throw new Error("Invalid source frame path.");
    return {
      file: frame.file,
      start: (frame.at_ms - first) / 1000,
      end:
        ((manifest.frames[index + 1]?.at_ms ?? manifest.total_ms) - first) /
        1000,
    };
  });
  if (sourceFrames.some((frame) => frame.end <= frame.start))
    throw new Error("Source frames are not ordered.");
  const frames = [];
  const reports = [];
  let previousSourceEnd = 0;
  for (const chapter of plan.chapters) {
    const seconds = chapter.end - chapter.start;
    if (chapter.sourceChapter === null) {
      frames.push({ file: sourceFrames[0].file, seconds });
      reports.push({ chapter: chapter.chapter, seconds, type: "opening hold" });
      continue;
    }
    const index = manifest.events.findIndex(
      (event) => event.caption === chapter.sourceChapter,
    );
    if (index < 0)
      throw new Error(`Missing recorded chapter: ${chapter.sourceChapter}`);
    const start = Math.max(0, (manifest.events[index].at_ms - first) / 1000);
    const end =
      index + 1 < manifest.events.length
        ? (manifest.events[index + 1].at_ms - first) / 1000
        : sourceDuration;
    if (Math.abs(start - previousSourceEnd) > 0.001)
      throw new Error(
        "The source story must remain in order without omitted chapters.",
      );
    previousSourceEnd = end;
    const intervals = sourceFrames
      .filter((frame) => frame.end > start && frame.start < end)
      .map((frame) => ({
        file: frame.file,
        seconds: Math.min(end, frame.end) - Math.max(start, frame.start),
      }));
    frames.push(...fitIntervals(intervals, seconds));
    reports.push({
      chapter: chapter.chapter,
      seconds,
      sourceStart: start,
      sourceEnd: end,
      type: "holds retimed; motion unchanged",
    });
  }
  if (Math.abs(previousSourceEnd - sourceDuration) > 0.001)
    throw new Error("The end of the recorded story is missing.");
  return { frames, reports };
}

export function wrapCaption(text) {
  if (text.length <= 42) return text;
  const breaks = [...text.matchAll(/ /g)]
    .map((match) => match.index)
    .filter((index) => index <= 42 && text.length - index - 1 <= 42);
  if (!breaks.length) return text;
  const boundary = breaks.reduce((best, index) =>
    Math.abs(index - text.length / 2) < Math.abs(best - text.length / 2)
      ? index
      : best,
  );
  return text.slice(0, boundary) + "\n" + text.slice(boundary + 1);
}

export function subtitleFiles(cues) {
  const stamp = (seconds) =>
    new Date(Math.round(seconds * 1000)).toISOString().slice(11, 23);
  const srt = cues
    .map(
      (cue, index) =>
        `${index + 1}\n${stamp(cue.start).replace(".", ",")} --> ${stamp(cue.end).replace(".", ",")}\n${wrapCaption(cue.text)}\n`,
    )
    .join("\n");
  return {
    srt,
    vtt: "WEBVTT\n\n" + srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2"),
  };
}
