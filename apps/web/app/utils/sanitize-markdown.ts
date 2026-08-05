/** Fix common migration artifacts in CMS markdown before Comark render. */
export function sanitizePublicMarkdown(markdown: string): string {
  if (!markdown) {
    return markdown;
  }

  let output = markdown;

  output = output.replaceAll("/blog/undefined/", "/blog/uncategorized/");
  output = output.replace(/\/blog\/undefined(?=[/"'\s)>]|$)/g, "/blog/uncategorized");

  output = output.replace(
    /!\[[^\]]*]\([^)]*undefinedundefined[^)]*\)/g,
    '',
  )

  output = output.replace(
    /\/uploads\/[^"'()\s]*undefinedundefined[^"'()\s]*/g,
    '',
  )

  output = output.replace(
    /\/images\/[^"'()\s]*undefinedundefined[^"'()\s]*/g,
    '',
  )

  return output;
}
