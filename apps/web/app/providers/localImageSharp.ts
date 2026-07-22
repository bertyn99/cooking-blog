import { joinURL } from 'ufo'
import { createOperationsGenerator, defineProvider } from '#image'
import { toPublicMediaKey } from "#shared/media-public-path";

const operationsGenerator = createOperationsGenerator({
  keyMap: {
    width: "width",
    height: "height",
    resize: "resize",
    fit: "fit",
    position: "position", // Fixed typo: "positon" -> "position"
    trim: "trim",
    format: "format",
    quality: "quality",
    rotate: "rotate",
    enlarge: "enlarge",
    flip: "flip",
    flop: "flop",
    sharpen: "sharpen",
    median: "median",
    gamma: "gamma",
    negate: "negate",
    normalize: "normalize",
    threshold: "threshold",
    grayscale: "grayscale",
    animated: "animated",
  },
  joinWith: ",",
  formatter: (key: string, value: string) => `${key}_${value}`,
})

export default defineProvider<{ baseURL?: string }>({
  getImage(src, { modifiers, baseURL = "/images/" }) {
    const operations = operationsGenerator(modifiers);
    const publicKey = toPublicMediaKey(src);

    return {
      url: joinURL(baseURL, operations, publicKey),
    };
  },
});
