import { joinURL } from 'ufo'
import { createOperationsGenerator, defineProvider } from '#image'

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
  getImage(src, { modifiers, baseURL = "http://localhost:1337/uploads" }) {
    const operations = operationsGenerator(modifiers)
    
    // Check if src already starts with /uploads to avoid double path
    let finalSrc = src
    if (src.startsWith('/uploads/')) {
      // Remove the /uploads prefix since baseURL already contains it
      finalSrc = src.replace('/uploads/', '')
    }
    
    return {
      url: joinURL(baseURL, operations, finalSrc)
    }
  }
})
