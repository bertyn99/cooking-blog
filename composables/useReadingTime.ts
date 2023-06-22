export const useReadingTime = (content: string) => {
  function readingTime(text: string) {
    const wpm = 265;
    const words = text.trim().split(/\s+/).length;
    return {
      text: `${Math.ceil(words / wpm)} min read`,
      minutes: Math.ceil(words / wpm),
      time: Math.ceil(words / wpm) * 60 * 1000,
      words,
    };
  }
  const stat = readingTime(content);
  return {
    text: stat.text,
    words: stat.words,
    minutes: stat.minutes,
    time: stat.time,
  };
};
