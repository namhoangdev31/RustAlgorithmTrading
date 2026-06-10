import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  let payload: Record<string, any> = {};

  try {
    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = value;
      });
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid form payload." }, { status: 400 });
  }

  // Get Form identifier and project ID
  const formName = payload["form-name"] || payload["formName"] || "Default Contact Form";
  const projectId = payload["projectId"] || payload["project-id"];

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId parameter." }, { status: 400 });
  }

  // Verify Project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  // Find or create the Form config in DB (Netlify-like auto detection)
  let form = await prisma.form.findFirst({
    where: { projectId, name: formName },
  });

  if (!form) {
    form = await prisma.form.create({
      data: {
        id: crypto.randomUUID(),
        name: formName,
        projectId,
      },
    });
  }

  // Filter out meta keys before storing submission data
  const submissionData: Record<string, any> = {};
  for (const [key, val] of Object.entries(payload)) {
    if (key !== "form-name" && key !== "formName" && key !== "projectId" && key !== "project-id" && key !== "g-recaptcha-response") {
      submissionData[key] = val;
    }
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "";

  // Akismet Spam Protection Check
  const akismetApiKey = process.env.AKISMET_API_KEY;
  const blogUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://lepos.sh";

  if (akismetApiKey) {
    try {
      const emailKey = Object.keys(submissionData).find(k => k.toLowerCase().includes("email") || k.toLowerCase().includes("mail"));
      const nameKey = Object.keys(submissionData).find(k => k.toLowerCase().includes("name") || k.toLowerCase().includes("author"));
      const messageKey = Object.keys(submissionData).find(k => k.toLowerCase().includes("message") || k.toLowerCase().includes("content") || k.toLowerCase().includes("body") || k.toLowerCase().includes("text"));

      const author = nameKey ? submissionData[nameKey] : "";
      const email = emailKey ? submissionData[emailKey] : "";
      const content = messageKey ? submissionData[messageKey] : Object.entries(submissionData).map(([k, v]) => `${k}: ${v}`).join("\n");

      const akismetParams = new URLSearchParams({
        blog: blogUrl,
        user_ip: ip,
        user_agent: userAgent,
        referrer: request.headers.get("referer") || "",
        comment_type: "contact-form",
        comment_author: String(author),
        comment_author_email: String(email),
        comment_content: String(content),
      });

      const akismetRes = await fetch(`https://${akismetApiKey}.rest.akismet.com/1.1/comment-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "LepoS/1.0.0",
        },
        body: akismetParams.toString(),
      });

      if (akismetRes.ok) {
        const result = await akismetRes.text();
        if (result === "true") {
          return NextResponse.json({ error: "Spam detected by Akismet." }, { status: 400 });
        }
      }
    } catch (err) {
      console.error("Akismet check error:", err);
    }
  }

  // Create submission record
  const submission = await prisma.formSubmission.create({
    data: {
      id: crypto.randomUUID(),
      formId: form.id,
      data: submissionData,
      ipAddress: ip,
      userAgent,
    },
  });

  // Support redirecting if configured
  const redirectUrl = payload["redirect"] || payload["_next"];
  if (redirectUrl) {
    return NextResponse.redirect(new URL(redirectUrl, request.url), 303);
  }

  return NextResponse.json({
    success: true,
    submissionId: submission.id,
    formName: form.name,
  }, { status: 201 });
}
