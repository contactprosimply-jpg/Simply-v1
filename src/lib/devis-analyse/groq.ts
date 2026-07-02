import type { BudgetPosteTypeLigne, DevisDocumentType } from "@/lib/database.types";
import {
  DEVIS_ANALYSE_SYSTEM_PROMPT,
  buildDevisAnalyseUserPrompt,
} from "@/lib/devis-analyse/prompt";
import type { DevisAnalyseAiResult, DevisAnalysePosteRaw } from "@/lib/devis-analyse/types";
import { DevisAnalyserError } from "@/lib/devis-analyse/types";
import { getGroqApiKey, getGroqModel } from "@/lib/groq/env";

interface GroqChatResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

const VALID_DOC_TYPES = new Set<DevisDocumentType>(["devis", "dpgf", "bordereau", "autre"]);
const VALID_TYPE_LIGNE = new Set<BudgetPosteTypeLigne>(["poste", "titre_lot", "sous_total"]);

export async function analyseDevisWithGroq(
  rawContent: string,
  fileName: string,
): Promise<DevisAnalyseAiResult> {
  const apiKey = getGroqApiKey();
  const model = getGroqModel();

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DEVIS_ANALYSE_SYSTEM_PROMPT },
        { role: "user", content: buildDevisAnalyseUserPrompt(rawContent, fileName) },
      ],
    }),
  });

  const json = (await response.json()) as GroqChatResponse;

  if (!response.ok) {
    throw new DevisAnalyserError(
      json.error?.message ?? `Erreur Groq (${response.status})`,
      502,
      "GROQ_API_ERROR",
    );
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new DevisAnalyserError("Réponse IA vide.", 502, "GROQ_EMPTY_RESPONSE");
  }

  return parseAiJsonResponse(content);
}

export function parseAiJsonResponse(raw: string): DevisAnalyseAiResult {
  const cleaned = stripJsonFences(raw.trim());

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new DevisAnalyserError(
      "Impossible de parser la réponse IA en JSON.",
      502,
      "AI_JSON_PARSE_ERROR",
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new DevisAnalyserError("Structure JSON IA invalide.", 502, "AI_JSON_INVALID");
  }

  const obj = parsed as Record<string, unknown>;
  const document = normalizeDocument(obj.document);
  const postes = normalizePostes(obj.postes);

  return { document, postes };
}

function stripJsonFences(text: string): string {
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

function normalizeDocument(raw: unknown): DevisAnalyseAiResult["document"] {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const typeRaw = String(d.type_document ?? "autre").toLowerCase();
  const type_document = VALID_DOC_TYPES.has(typeRaw as DevisDocumentType)
    ? (typeRaw as DevisDocumentType)
    : "autre";

  return {
    type_document,
    metiers_detectes: toStringArray(d.metiers_detectes),
    devise: typeof d.devise === "string" && d.devise.trim() ? d.devise.trim() : "EUR",
    total_ht: toNullableNumber(d.total_ht),
    total_ttc: toNullableNumber(d.total_ttc),
    taux_tva: toNullableNumber(d.taux_tva),
    remarques: toStringArray(d.remarques),
  };
}

function normalizePostes(raw: unknown): DevisAnalysePosteRaw[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const p = item as Record<string, unknown>;
      const designation = typeof p.designation === "string" ? p.designation.trim() : "";
      if (!designation) return null;

      const typeRaw = String(p.type_ligne ?? "poste").toLowerCase();
      const type_ligne = VALID_TYPE_LIGNE.has(typeRaw as BudgetPosteTypeLigne)
        ? (typeRaw as BudgetPosteTypeLigne)
        : "poste";

      return {
        numero_position: toNullableString(p.numero_position),
        lot: toNullableString(p.lot),
        metier: toNullableString(p.metier),
        designation,
        unite: toNullableString(p.unite),
        quantite: toNullableNumber(p.quantite),
        prix_unitaire: toNullableNumber(p.prix_unitaire),
        prix_total: toNullableNumber(p.prix_total),
        type_ligne,
      };
    })
    .filter((p): p is DevisAnalysePosteRaw => p !== null);
}

function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}
