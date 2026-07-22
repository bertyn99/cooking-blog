import { createRender } from "@comark/html";

const renderMarkdown = createRender();

export const useComark = (content: string) => {
  return renderMarkdown(content);
};
