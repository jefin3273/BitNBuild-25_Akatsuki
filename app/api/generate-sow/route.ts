import { NextResponse } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";  // Groq provider

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobDescription } = body as { jobDescription?: string };

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 10) {
      return new NextResponse("Invalid job description. Please provide more details.", {
        status: 400,
      });
    }

    const systemPrompt = [
      "You are an expert contract writer for software and creative projects.",
      "Generate a clear, unambiguous Statement of Work (SOW) tailored to the provided job description.",
      "Structure strictly with the following sections and headings (keep them exact):",
      "Project Title",
      "Scope of Work",
      "Deliverables",
      "Milestones (with timelines)",
      "Acceptance Criteria",
      "Payment Terms",
      "Write in concise, professional language. Use lists where appropriate.",
      "Where details are missing, infer reasonable specifics and flag assumptions clearly."
    ].join("\n");

    const userPrompt = [
      "Job Description:",
      "```",
      jobDescription,
      "```",
      "",
      "Now produce the SOW with the exact headings listed above. Use Markdown formatting with clear headings and bullet points where appropriate."
    ].join("\n");

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 1200,
      temperature: 0.2,
    });


    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Error generating SOW:", err);
    return new NextResponse(err?.message || "Failed to generate SOW", {
      status: 500,
    });
  }
}
