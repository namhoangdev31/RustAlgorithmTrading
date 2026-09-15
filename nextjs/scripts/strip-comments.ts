import fs from "fs";
import path from "path";
import * as ts from "typescript";

const TARGET_DIRS = [
  "app",
  "components",
  "contracts",
  "hooks",
  "lib",
  "types",
  "tests",
];

const VALID_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const args = process.argv.slice(2);
const isWrite = args.includes("--write") || args.includes("-w");
const removeDirectives = args.includes("--all") || args.includes("--remove-directives");

console.log("==================================================================");
console.log("    SAFE AST-BASED COMMENT REMOVAL SCRIPT FOR NEXT.JS PROJECT     ");
console.log("==================================================================");
console.log(`- Mode: ${isWrite ? "WRITE TO FILES (--write)" : "DRY RUN PREVIEW"}`);
console.log(`- Preserve TS/ESLint directives (@ts-*, eslint-*): ${removeDirectives ? "NO (Delete all)" : "YES (Protected)"}`);
console.log(`- Target Dirs: ${TARGET_DIRS.join(", ")}`);
console.log("------------------------------------------------------------------");

interface StripStats {
  filesScanned: number;
  filesModified: number;
  commentsRemoved: number;
}

const stats: StripStats = {
  filesScanned: 0,
  filesModified: 0,
  commentsRemoved: 0,
};

interface RemovalRange {
  start: number;
  end: number;
  text: string;
}

function getRemovalRanges(sourceFile: ts.SourceFile): RemovalRange[] {
  const ranges: RemovalRange[] = [];
  const visitedRanges = new Set<string>();

  function addRange(start: number, end: number, text: string) {
    const key = `${start}-${end}`;
    if (!visitedRanges.has(key)) {
      visitedRanges.add(key);
      ranges.push({ start, end, text });
    }
  }

  function checkComment(range: ts.CommentRange, parentNode?: ts.Node) {
    const commentText = sourceFile.text.slice(range.pos, range.end);
    
    // Check if comment is inside a JSX expression block like `{/* comment */}`
    if (parentNode && ts.isJsxExpression(parentNode)) {
      // If the JsxExpression contains no other real expression (or only comments)
      if (!parentNode.expression) {
        const jsxStart = parentNode.getStart(sourceFile);
        const jsxEnd = parentNode.getEnd();
        addRange(jsxStart, jsxEnd, commentText);
        return;
      }
    }

    addRange(range.pos, range.end, commentText);
  }

  function walk(node: ts.Node) {
    const nodePos = node.pos;
    const nodeStart = node.getStart(sourceFile);

    if (nodeStart > nodePos) {
      const leadingComments = ts.getLeadingCommentRanges(sourceFile.text, nodePos);
      if (leadingComments) {
        for (const c of leadingComments) checkComment(c, node);
      }
    }

    const trailingComments = ts.getTrailingCommentRanges(sourceFile.text, node.end);
    if (trailingComments) {
      for (const c of trailingComments) checkComment(c, node);
    }

    ts.forEachChild(node, walk);
  }

  walk(sourceFile);
  return ranges.sort((a, b) => a.start - b.start);
}

function stripCommentsFromCode(sourceText: string, isJsx: boolean): { result: string; count: number } {
  const scriptKind = isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile("file.tsx", sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const ranges = getRemovalRanges(sourceFile);

  if (ranges.length === 0) {
    return { result: sourceText, count: 0 };
  }

  let result = "";
  let lastPos = 0;
  let count = 0;

  for (const range of ranges) {
    if (!removeDirectives) {
      if (/^\/\/\s*@(ts-|eslint-)|^(\/\*)\s*@(ts-|eslint-)/.test(range.text)) {
        continue;
      }
    }

    if (range.start < lastPos) {
      continue; // Skip overlapping ranges
    }

    count++;
    result += sourceText.slice(lastPos, range.start);
    lastPos = range.end;
  }
  result += sourceText.slice(lastPos);

  // Clean up excess blank lines (>2 consecutive newlines -> 2)
  result = result.replace(/\n\s*\n\s*\n/g, "\n\n");

  return { result, count };
}

function processDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name.startsWith(".")) {
        continue;
      }
      processDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!VALID_EXTENSIONS.has(ext)) {
        continue;
      }

      stats.filesScanned++;

      try {
        const originalContent = fs.readFileSync(fullPath, "utf-8");
        const isJsx = ext === ".tsx" || ext === ".jsx";
        const { result: strippedContent, count } = stripCommentsFromCode(originalContent, isJsx);

        if (count > 0 && strippedContent !== originalContent) {
          stats.filesModified++;
          stats.commentsRemoved += count;

          const relPath = path.relative(process.cwd(), fullPath);
          console.log(`[CLEAN] ${relPath}: found ${count} comments`);

          if (isWrite) {
            fs.writeFileSync(fullPath, strippedContent, "utf-8");
          }
        }
      } catch (err: any) {
        console.error(`[ERROR] Failed to process ${fullPath}:`, err?.message);
      }
    }
  }
}

const rootDir = process.cwd();
for (const dir of TARGET_DIRS) {
  const targetPath = path.join(rootDir, dir);
  processDirectory(targetPath);
}

console.log("------------------------------------------------------------------");
console.log("SUMMARY:");
console.log(`- Files scanned: ${stats.filesScanned}`);
console.log(`- Files with comments: ${stats.filesModified}`);
console.log(`- Total comments removed: ${stats.commentsRemoved}`);

if (!isWrite) {
  console.log("\n⚠️  NOTE: Dry run completed (no files modified).");
  console.log("👉 To write changes to disk, run:");
  console.log("   yarn tsx scripts/strip-comments.ts --write\n");
} else {
  console.log("\n✅ COMPLETED REMOVING COMMENTS FROM TARGET FILES!\n");
}
