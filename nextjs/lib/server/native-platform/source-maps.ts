import { prisma } from "@/lib/server/prisma";

type SourceMapDocument = {
  sources?: unknown;
  sourcesContent?: unknown;
};

type SourcePreviewLine = {
  number: number;
  content: string;
  isCrash: boolean;
};

export type SourcePreviewResult =
  | {
      status: "available";
      fileName: string;
      line: number;
      excerpt: SourcePreviewLine[];
    }
  | {
      status: "unavailable";
      fileName: string;
      line: number;
      reason: "missing_map" | "missing_source" | "missing_content";
    };

function asSourceMapDocument(mapJson: unknown): SourceMapDocument | null {
  if (!mapJson || typeof mapJson !== "object") {
    return null;
  }

  return mapJson as SourceMapDocument;
}

function normalizeSourceName(value: string) {
  return value
    .replace(/^webpack:\/\//, "")
    .replace(/^file:\/\//, "")
    .replace(/^\.?\//, "")
    .replace(/\?.*$/, "")
    .replace(/\\/g, "/");
}

function hasSourcesContent(mapJson: unknown) {
  const doc = asSourceMapDocument(mapJson);
  if (!doc || !Array.isArray(doc.sourcesContent)) {
    return false;
  }

  return doc.sourcesContent.some((entry) => typeof entry === "string" && entry.length > 0);
}

function findSourceIndex(mapJson: unknown, sourceName: string) {
  const doc = asSourceMapDocument(mapJson);
  if (!doc || !Array.isArray(doc.sources)) {
    return -1;
  }

  const normalizedTarget = normalizeSourceName(sourceName);
  return doc.sources.findIndex((entry) => {
    if (typeof entry !== "string") {
      return false;
    }

    const normalizedCandidate = normalizeSourceName(entry);
    return (
      normalizedCandidate === normalizedTarget ||
      normalizedCandidate.endsWith(normalizedTarget) ||
      normalizedTarget.endsWith(normalizedCandidate)
    );
  });
}

function buildExcerpt(content: string, line: number, contextLines = 4): SourcePreviewLine[] {
  const sourceLines = content.split(/\r?\n/);
  const start = Math.max(1, line - contextLines);
  const end = Math.min(sourceLines.length, line + contextLines);
  const excerpt: SourcePreviewLine[] = [];

  for (let current = start; current <= end; current += 1) {
    excerpt.push({
      number: current,
      content: sourceLines[current - 1] || "",
      isCrash: current === line,
    });
  }

  return excerpt;
}

export async function listProjectSourceMaps(projectId: string) {
  const sourceMaps = await prisma.nativeSourceMap.findMany({
    where: { projectId },
    select: {
      id: true,
      projectId: true,
      deploymentId: true,
      releaseVersion: true,
      fileName: true,
      storagePath: true,
      mapJson: true,
      uploadedAt: true,
    },
    orderBy: { uploadedAt: "desc" },
  });

  return sourceMaps.map((sourceMap) => ({
    id: sourceMap.id,
    projectId: sourceMap.projectId,
    deploymentId: sourceMap.deploymentId,
    releaseVersion: sourceMap.releaseVersion,
    fileName: sourceMap.fileName,
    storagePath: sourceMap.storagePath,
    uploadedAt: sourceMap.uploadedAt,
    hasSourcesContent: hasSourcesContent(sourceMap.mapJson),
  }));
}

export async function getSourcePreview(options: {
  projectId: string;
  source: string;
  line: number;
  sourceMapId?: string;
  releaseVersion?: string;
}) : Promise<SourcePreviewResult> {
  const sourceMap = options.sourceMapId
    ? await prisma.nativeSourceMap.findFirst({
        where: { id: options.sourceMapId, projectId: options.projectId },
      })
    : await prisma.nativeSourceMap.findFirst({
        where: {
          projectId: options.projectId,
          releaseVersion: options.releaseVersion,
        },
        orderBy: { uploadedAt: "desc" },
      });

  if (!sourceMap?.mapJson) {
    return {
      status: "unavailable",
      fileName: options.source,
      line: options.line,
      reason: "missing_map",
    };
  }

  const sourceIndex = findSourceIndex(sourceMap.mapJson, options.source);
  if (sourceIndex === -1) {
    return {
      status: "unavailable",
      fileName: options.source,
      line: options.line,
      reason: "missing_source",
    };
  }

  const doc = asSourceMapDocument(sourceMap.mapJson);
  if (!doc || !Array.isArray(doc.sourcesContent)) {
    return {
      status: "unavailable",
      fileName: options.source,
      line: options.line,
      reason: "missing_content",
    };
  }

  const content = doc.sourcesContent[sourceIndex];
  if (typeof content !== "string" || !content.length) {
    return {
      status: "unavailable",
      fileName: options.source,
      line: options.line,
      reason: "missing_content",
    };
  }

  return {
    status: "available",
    fileName: options.source,
    line: options.line,
    excerpt: buildExcerpt(content, options.line),
  };
}
