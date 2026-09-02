/** Keep sentence boundaries and balance long cues without losing alignment indexes. */
export function groupCaptionWords(words) {
  const length = (items) => items.map((word) => word[0]).join(" ").length;
  const split = (sentence) => {
    if (length(sentence) <= 76 || sentence.length < 2) return [sentence];
    // Keep at least two words on either side where possible: no dangling "it." cue.
    const minimum = sentence.length >= 4 ? 2 : 1;
    let boundary = minimum;
    for (let index = minimum; index <= sentence.length - minimum; index++) {
      if (
        Math.abs(length(sentence.slice(0, index)) - length(sentence) / 2) <
        Math.abs(length(sentence.slice(0, boundary)) - length(sentence) / 2)
      )
        boundary = index;
    }
    return [
      ...split(sentence.slice(0, boundary)),
      ...split(sentence.slice(boundary)),
    ];
  };
  const groups = [];
  let sentence = [];
  for (const word of words) {
    sentence.push(word);
    if (/[.!?]$/.test(word[0])) {
      groups.push(...split(sentence));
      sentence = [];
    }
  }
  if (sentence.length) groups.push(...split(sentence));
  return groups;
}
