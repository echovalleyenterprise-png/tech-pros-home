import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./embeddings";

// ── Types ─────────────────────────────────────────────────────────────────────
export type MatchedChunk = {
  id: string;
  document_id: string;
  content: string;
  page_number: number | null;
  metadata: Record<string, unknown>;
  similarity: number;
  doc_title: string;
  doc_brand: string | null;
  doc_model: string | null;
  doc_type: string;
};

// ── Supabase client (anon — RPC is security definer) ─────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

// ── Model/brand extraction ────────────────────────────────────────────────────
const MODEL_PATTERNS = [
  /\b(QN\d{2}[A-Z0-9]+)\b/i,
  /\b(OLED\d{2}[A-Z0-9]+)\b/i,
  /\b(XBR-\d{2}[A-Z0-9]+)\b/i,
  /\b(KD-\d{2}[A-Z0-9]+)\b/i,
  /\b(HW-[A-Z]\d{3}[A-Z]?)\b/i,
  /\b(Arc|Beam|Playbar|Sub)\b/,
  /\b(C[12]\s?Pro|C[12]\b)/i,
  /\b(Frame|Serif|Terrace)\b/i,
  /\b([A-Z]{1,3}\d{2,4}[A-Z0-9]*)\b/,
];

const BRAND_PATTERNS: Record<string, string> = {
  samsung: "Samsung",
  lg: "LG",
  sony: "Sony",
  vizio: "Vizio",
  tcl: "TCL",
  sonos: "Sonos",
  bose: "Bose",
  nest: "Nest",
  ring: "Ring",
  arlo: "Arlo",
  eero: "Eero",
  netgear: "Netgear",
  "tp-link": "TP-Link",
  tplink: "TP-Link",
};

export function extractModelAndBrand(text: string): {
  model: string | null;
  brand: string | null;
} {
  const lower = text.toLowerCase();

  let brand: string | null = null;
  for (const [key, val] of Object.entries(BRAND_PATTERNS)) {
    if (lower.includes(key)) {
      brand = val;
      break;
    }
  }

  let model: string | null = null;
  for (const pattern of MODEL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      model = match[1] || match[0];
      break;
    }
  }

  return { model, brand };
}

// ── Main retrieval function ───────────────────────────────────────────────────
export async function retrieveRelevantChunks(
  query: string,
  options: {
    matchCount?: number;
    matchThreshold?: number;
    filterBrand?: string | null;
    filterModel?: string | null;
  } = {}
): Promise<MatchedChunk[]> {
  const {
    matchCount = 5,
    matchThreshold = 0.65,
    filterBrand = null,
    filterModel = null,
  } = options;

  try {
    const embedding = await generateEmbedding(query);
    const supabase = getSupabase();

    const { data, error } = await supabase.rpc("match_chunks", {
      query_embedding: `[${embedding.join(",")}]`,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_brand: filterBrand,
      filter_model: filterModel,
    });

    if (error) {
      console.error("[Retrieval] match_chunks error:", error);
      return [];
    }

    return (data as MatchedChunk[]) ?? [];
  } catch (err) {
    console.error("[Retrieval] Error:", err);
    return [];
  }
}

// ── Format retrieved chunks for the system prompt ────────────────────────────
export function formatRetrievedContext(chunks: MatchedChunk[]): string {
  if (chunks.length === 0) return "";

  const sections = chunks.map((chunk, i) => {
    const source = [
      chunk.doc_title,
      chunk.doc_brand,
      chunk.doc_model,
      chunk.page_number ? `p.${chunk.page_number}` : null,
    ]
      .filter(Boolean)
      .join(" — ");

    return `[${i + 1}] ${source}\n${chunk.content}`;
  });

  return `\n\n---\nRELEVANT DOCUMENTATION (use this to answer accurately):\n\n${sections.join("\n\n---\n\n")}`;
}
