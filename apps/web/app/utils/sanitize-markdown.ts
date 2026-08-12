/** Fix common migration artifacts in CMS markdown before Comark render. */
export function sanitizePublicMarkdown(markdown: string): string {
  if (!markdown) {
    return markdown;
  }

  let output = markdown;

  output = output.replaceAll("/blog/undefined/", "/blog/uncategorized/");
  output = output.replace(/\/blog\/undefined(?=[/"'\s)>]|$)/g, "/blog/uncategorized");

  // Legacy absolute paths from older CMS / Storyblok exports.
  output = output.replaceAll("/articles/", "/blog/");
  output = output.replace(/\/collections\/recettes-[^/\s)"']+\//g, "/recette/");

  // Relative links resolve against the current URL and produce doubled paths
  // (e.g. /blog/inspiration-culinaire/blog/inspiration-culinaire/...).
  output = output.replace(/\]\((?:\.\.?\/)*(?:blog|articles)\//g, "](/blog/");
  output = output.replace(/\]\((?:\.\.?\/)*recette\//g, "](/recette/");
  output = output.replace(
    /\]\((?:\.\.?\/)*collections\/recettes-[^/\s)"']+\//g,
    "](/recette/",
  );
  output = output.replace(/href="(?:\.\.?\/)*(?:blog|articles)\//g, 'href="/blog/');
  output = output.replace(/href="(?:\.\.?\/)*recette\//g, 'href="/recette/');
  output = output.replace(
    /href="(?:\.\.?\/)*collections\/recettes-[^/\s)"']+\//g,
    'href="/recette/',
  );

  // Collapse already-doubled category segments in stored content.
  output = output.replace(/\/blog\/([^/]+)\/blog\/\1\//g, "/blog/$1/");

  output = output.replace(
    /!\[[^\]]*]\([^)]*undefinedundefined[^)]*\)/g,
    "",
  );

  output = output.replace(
    /\/uploads\/[^"'()\s]*undefinedundefined[^"'()\s]*/g,
    "",
  );

  output = output.replace(
    /\/images\/[^"'()\s]*undefinedundefined[^"'()\s]*/g,
    "",
  );

  return output;
}
