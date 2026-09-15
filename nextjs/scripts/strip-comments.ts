import fs from "fs";
import path from "path";
import ts from "typescript";

// Danh sách các thư mục mục tiêu theo yêu cầu của người dùng
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

// CLI Flags
const args = process.argv.slice(2);
const isWrite = args.includes("--write") || args.includes("-w");
const removeDirectives = args.includes("--all") || args.includes("--remove-directives");

console.log("==================================================================");
console.log("       SCRIPT XOÁ COMMENT CODE TRONG TOÀN BỘ DỰ ÁN NEXTJS        ");
console.log("==================================================================");
console.log(`- Chế độ: ${isWrite ? "THỰC THI GHI ĐÈ FILE (--write)" : "CHẠY THỬ XEM TRƯỚC (DRY-RUN)"}`);
console.log(`- Giữ lại chỉ thị TypeScript/ESLint (@ts-*, eslint-*): ${removeDirectives ? "KHÔNG (Xoá hết)" : "CÓ (Bảo vệ để tránh lỗi build)"}`);
console.log(`- Thư mục quét: ${TARGET_DIRS.join(", ")}`);
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

/**
 * Xoá comment một cách an toàn bằng TypeScript Lexer Scanner
 * Tuyệt đối không làm hỏng URL (https://), Regex literal, Template String
 */
function stripCommentsFromCode(sourceText: string, isJsx: boolean): { result: string; count: number } {
  const languageVariant = isJsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, languageVariant, sourceText);

  let result = "";
  let lastPos = 0;
  let count = 0;

  while (true) {
    const token = scanner.scan();
    if (token === ts.SyntaxKind.EndOfFileToken) {
      result += sourceText.slice(lastPos);
      break;
    }

    const tokenPos = scanner.getTokenPos();
    const tokenEnd = scanner.getTextPos();

    if (
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      const commentText = sourceText.slice(tokenPos, tokenEnd);

      // Nếu không yêu cầu xoá hết, bảo lưu các chỉ thị quan trọng của TS và ESLint
      if (!removeDirectives) {
        if (/^\/\/\s*@(ts-|eslint-)|^(\/\*)\s*@(ts-|eslint-)/.test(commentText)) {
          continue;
        }
      }

      count++;
      result += sourceText.slice(lastPos, tokenPos);

      // Nếu comment nằm nguyên 1 dòng, kiểm tra để xoá luôn khoảng trắng thừa nếu cần
      lastPos = tokenEnd;
    }
  }

  // Dọn dẹp các khối comment JSX rỗng dạng: {/* */} hoặc { } thừa sau khi xoá comment
  if (isJsx) {
    result = result.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");
  }

  // Dọn dẹp các dòng trống liên tiếp sinh ra sau khi xoá comment
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
      // Bỏ qua các thư mục đặc biệt
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
          console.log(`[CLEAN] ${relPath}: đã tìm thấy ${count} comment`);

          if (isWrite) {
            fs.writeFileSync(fullPath, strippedContent, "utf-8");
          }
        }
      } catch (err: any) {
        console.error(`[ERROR] Không thể xử lý file ${fullPath}:`, err?.message);
      }
    }
  }
}

// Bắt đầu quét các thư mục mục tiêu
const rootDir = process.cwd();
for (const dir of TARGET_DIRS) {
  const targetPath = path.join(rootDir, dir);
  processDirectory(targetPath);
}

console.log("------------------------------------------------------------------");
console.log("KẾT QUẢ TỔNG KẾT:");
console.log(`- Tổng số file đã quét: ${stats.filesScanned}`);
console.log(`- Số file có comment: ${stats.filesModified}`);
console.log(`- Tổng số comment được phát hiện / loại bỏ: ${stats.commentsRemoved}`);

if (!isWrite) {
  console.log("\n⚠️  LƯU Ý: Đây là chế độ DRY-RUN (chưa ghi đè file).");
  console.log("👉 Để thực thi ghi đè và xoá toàn bộ comment trên file thật, hãy chạy lệnh:");
  console.log("   yarn tsx scripts/strip-comments.ts --write\n");
} else {
  console.log("\n✅ ĐÃ HOÀN TẤT GHI ĐÈ VÀ XOÁ TOÀN BỘ COMMENT TRÊN CÁC FILE MỤC TIÊU!\n");
}
