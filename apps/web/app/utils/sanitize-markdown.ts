/** Fix common migration artifacts in CMS markdown before Comark render. */
export function sanitizePublicMarkdown(markdown: string): string {
  if (!markdown) {
    return markdown;
  }

  let output = markdown;

  output = output.replaceAll("/blog/undefined/", "/blog/uncategorized/");
  output = output.replace(/\/blog\/undefined(?=[/"'\s)>]|$)/g, "/blog/uncategorized");

  output = output.replace(
    /\/uploads\/[^"'()\s]*undefinedundefined/g,
    "",
  );

  output = output.replace(
    /\/images\/[^"'()\s]*undefinedundefined/g,
    "",
  );

  return output;
}
