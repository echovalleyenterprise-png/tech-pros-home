// Voyage AI embeddings — voyage-2 model, 1024 dimensions
// https://docs.voyageai.com/reference/embeddings-api

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-2";

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("Missing VOYAGE_API_KEY");

  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: "query",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage AI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding as number[];
}

export async function generateDocumentEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("Missing VOYAGE_API_KEY");

  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: "document",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage AI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding as number[];
}

// Batch embed for ingestion (more efficient than one-by-one)
export async function generateDocumentEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("Missing VOYAGE_API_KEY");

  const BATCH_SIZE = 64;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    let attempt = 0;
    const MAX_ATTEMPTS = 5;
    while (attempt < MAX_ATTEMPTS) {
      const res = await fetch(VOYAGE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: VOYAGE_MODEL,
          input: batch,
          input_type: "document",
        }),
      });

      if (res.status === 429) {
        attempt++;
        if (attempt >= MAX_ATTEMPTS) {
          const err = await res.text();
          throw new Error(`Voyage AI batch error ${res.status}: ${err}`);
        }
        const waitMs = 25_000 * attempt;
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Voyage AI batch error ${res.status}: ${err}`);
      }

      const data = await res.json();
      results.push(...data.data.map((d: { embedding: number[] }) => d.embedding));
      break;
    }

    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}
