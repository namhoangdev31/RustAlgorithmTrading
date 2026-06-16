import { prisma } from "@/lib/server/prisma";

export async function createAiDiagnostic(input: {
  projectId: string;
  crashReportId?: string;
  logs?: string;
}) {
  const crash = input.crashReportId
    ? await prisma.nativeCrashReport.findUnique({ where: { id: input.crashReportId } })
    : await prisma.nativeCrashReport.findFirst({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
      });

  const prompt = [
    "Analyze this LepoS crash and propose a concise fix.",
    crash ? `Error: ${crash.errorMessage}` : "No crash report was supplied.",
    crash?.errorStack ? `Stack:\n${crash.errorStack}` : "",
    input.logs ? `Logs:\n${input.logs}` : "",
  ].join("\n\n");

  const generated = await runGemini(prompt).catch(() => null);
  const summary =
    generated ||
    (crash
      ? `Crash ${crash.fingerprint} likely originates from ${crash.errorMessage}. Inspect the mapped stack and release ${crash.releaseVersion}.`
      : "No crash report is available yet. Collect runtime logs and source maps before requesting an autofix.");

  return prisma.nativeAiDiagnostic.create({
    data: {
      projectId: input.projectId,
      crashReportId: crash?.id || null,
      summary,
      suggestedDiff: generated ? extractDiff(generated) : null,
      model: generated ? "gemini" : "fallback",
      metadata: { promptLength: prompt.length },
    },
  });
}

async function runGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function extractDiff(text: string) {
  const match = text.match(/```diff\n([\s\S]*?)```/);
  return match?.[1]?.trim() || null;
}
