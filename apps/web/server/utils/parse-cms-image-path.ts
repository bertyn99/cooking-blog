import {
  stripUploadsPrefix,
  toCmsStoragePath,
} from "../../shared/media-public-path";

/** Parse `/images/{ops}/{publicKey}` paths from `localImageSharp` provider. */
export function parseImageOperationsSegment(segment: string): Record<string, string> {
  const operations: Record<string, string> = {};
  for (const part of segment.split(",")) {
    const separator = part.indexOf("_");
    if (separator <= 0) {
      continue;
    }
    operations[part.slice(0, separator)] = part.slice(separator + 1);
  }
  return operations;
}

export function parseCmsImagePath(fullPath: string): {
  assetPath: string;
  operations: Record<string, string>;
} {
  const normalized = fullPath.replace(/^\/+/, "");

  const legacyUploadsIndex = normalized.indexOf("uploads/");
  if (legacyUploadsIndex !== -1) {
    const legacyAsset = normalized.slice(legacyUploadsIndex);
    if (legacyUploadsIndex === 0) {
      return { assetPath: legacyAsset, operations: {} };
    }
    const opsSegment = normalized.slice(0, legacyUploadsIndex - 1);
    return {
      assetPath: legacyAsset,
      operations: parseImageOperationsSegment(opsSegment),
    };
  }

  const slash = normalized.lastIndexOf("/");
  if (slash > 0 && normalized.slice(0, slash).includes(",")) {
    const opsSegment = normalized.slice(0, slash);
    const publicKey = normalized.slice(slash + 1);
    return {
      assetPath: toCmsStoragePath(publicKey),
      operations: parseImageOperationsSegment(opsSegment),
    };
  }

  return {
    assetPath: toCmsStoragePath(stripUploadsPrefix(normalized)),
    operations: {},
  };
}

export function hasImageTransformOps(operations: Record<string, string>): boolean {
  return Boolean(
    operations.width
    || operations.height
    || operations.format
    || operations.quality
    || operations.fit,
  );
}
