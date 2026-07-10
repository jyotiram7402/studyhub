const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const GENERATION_MODEL = "gemini-2.0-flash";
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GenerateOptions {
  system?: string;
  temperature?: number;
  json?: boolean;
  maxOutputTokens?: number;
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return key;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const MAX_ATTEMPTS = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function post<T>(path: string, body: unknown): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(`${API_BASE}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey(),
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    const detail = await response.text().catch(() => "");

    // Retry transient per-minute rate limits with exponential backoff
    if (response.status === 429 && attempt < MAX_ATTEMPTS) {
      await delay(attempt * 5000);
      continue;
    }

    if (response.status === 429) {
      throw new Error(
        "The AI is busy right now (free-tier rate limit). Please wait a minute and try again."
      );
    }

    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  throw new Error("The AI is busy right now. Please wait a minute and try again.");
}

interface GenerateContentResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
}

export async function generateText(
  contents: GeminiContent[],
  options: GenerateOptions = {}
): Promise<string> {
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (options.system) {
    body.systemInstruction = { parts: [{ text: options.system }] };
  }

  const data = await post<GenerateContentResponse>(
    `models/${GENERATION_MODEL}:generateContent`,
    body
  );

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}

export async function generateFromPrompt(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  return generateText([{ role: "user", parts: [{ text: prompt }] }], options);
}

export async function generateJson<T>(
  prompt: string,
  options: Omit<GenerateOptions, "json"> = {}
): Promise<T> {
  const raw = await generateFromPrompt(prompt, { ...options, json: true, temperature: options.temperature ?? 0.2 });
  const cleaned = raw.replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();
  return JSON.parse(cleaned) as T;
}

interface EmbedContentResponse {
  embedding: { values: number[] };
}

interface BatchEmbedResponse {
  embeddings: { values: number[] }[];
}

export async function embedText(text: string): Promise<number[]> {
  const data = await post<EmbedContentResponse>(`models/${EMBEDDING_MODEL}:embedContent`, {
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text: text.slice(0, 6000) }] },
    outputDimensionality: EMBEDDING_DIMENSIONS,
  });
  return data.embedding.values;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results: number[][] = [];
  for (let start = 0; start < texts.length; start += 100) {
    const batch = texts.slice(start, start + 100);
    const data = await post<BatchEmbedResponse>(
      `models/${EMBEDDING_MODEL}:batchEmbedContents`,
      {
        requests: batch.map((text) => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text: text.slice(0, 6000) }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
        })),
      }
    );
    results.push(...data.embeddings.map((embedding) => embedding.values));
  }
  return results;
}

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
