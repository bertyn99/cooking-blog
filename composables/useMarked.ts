import { marked } from "marked";
export const useMarked = (content: string) => {
  return marked.parse(content);
};
