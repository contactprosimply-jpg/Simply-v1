export function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY manquant");
  return key;
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export function requireGroqConfig():
  | { error: string; code: string; status: number }
  | null {
  if (!process.env.GROQ_API_KEY) {
    return {
      error: "GROQ_API_KEY non configurée sur le serveur.",
      code: "GROQ_NOT_CONFIGURED",
      status: 503,
    };
  }
  return null;
}
