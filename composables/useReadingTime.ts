import readingTime from "reading-time";

export const useReadingTime = (content: string) => {
  const stat = readingTime(content);
  return {
    text: stat.text,
    words: stat.words,
    minutes: stat.minutes,
    time: stat.time,
  };
};
