import { generateText } from "@/lib/ai/gemini";

// Gemini reads PDFs and images natively, which doubles as OCR for scanned
// and handwritten notes. Other formats fall back to listing metadata so the
// note is still semantically searchable.
const GEMINI_READABLE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const MAX_EXTRACTION_BYTES = 12 * 1024 * 1024;

const EXTRACTION_PROMPT = [
  "Extract the full text content of this document.",
  "It may contain handwritten notes — transcribe handwriting as accurately as possible.",
  "Preserve headings, lists, and paragraph structure as plain text.",
  "Return only the extracted text with no commentary.",
].join(" ");

export interface ExtractionResult {
  text: string;
  method: "gemini" | "plain_text" | "metadata_only";
}

export async function extractDocumentText(
  fileBuffer: ArrayBuffer,
  fileType: string,
  metadataText: string
): Promise<ExtractionResult> {
  if (fileType === "txt") {
    const text = new TextDecoder("utf-8").decode(fileBuffer).trim();
    if (text) return { text, method: "plain_text" };
  }

  const mimeType = GEMINI_READABLE_TYPES[fileType];
  if (mimeType && fileBuffer.byteLength <= MAX_EXTRACTION_BYTES) {
    const base64 = Buffer.from(fileBuffer).toString("base64");
    const text = await generateText(
      [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: EXTRACTION_PROMPT },
          ],
        },
      ],
      { temperature: 0, maxOutputTokens: 8192 }
    );
    if (text.trim()) {
      return { text: text.trim(), method: "gemini" };
    }
  }

  return { text: metadataText, method: "metadata_only" };
}
