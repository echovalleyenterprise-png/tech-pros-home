// Brave Search API — web + YouTube results for live home tech support

const BRAVE_API_BASE = "https://api.search.brave.com/res/v1";

export interface WebResult {
  title: string;
  url: string;
  description: string;
}

export interface VideoResult {
  title: string;
  url: string;
  videoId: string;
  thumbnail: string;
}

export interface SearchResults {
  web: WebResult[];
  videos: VideoResult[];
}

function extractYouTubeId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  return null;
}

const TECH_TERMS = [
  "samsung", "lg", "sony", "vizio", "tcl", "hisense",
  "sonos", "bose", "denon", "yamaha",
  "nest", "ring", "arlo", "wyze",
  "eero", "orbi", "netgear", "tp-link", "deco", "asus",
  "alexa", "echo", "google home", "homepod",
  "soundbar", "sound bar",
  "thermostat", "ecobee",
  "tv", "television",
  "hdmi", "arc", "earc",
  "mount", "wall mount",
  "router", "wifi", "mesh", "modem",
  "doorbell", "security camera",
  "smart tv", "smart thermostat",
  "streaming", "roku", "fire tv", "apple tv", "chromecast",
  "installation", "setup",
];

function buildVideoSearchQuery(rawQuery: string): string {
  const lower = rawQuery.toLowerCase();
  const found: string[] = [];

  for (const term of TECH_TERMS) {
    if (lower.includes(term)) found.push(term);
  }

  if (found.length > 0) {
    const top = found.sort((a, b) => b.length - a.length).slice(0, 4);
    return `${top.join(" ")} how to fix setup`;
  }

  return `${rawQuery.slice(0, 60).trim()} home tech guide`;
}

function isVideoRelevant(videoTitle: string, originalQuery: string): boolean {
  const title = videoTitle.toLowerCase();
  const query = originalQuery.toLowerCase();

  const queryTerms = TECH_TERMS.filter((t) => query.includes(t));
  if (queryTerms.length === 0) return true;

  return queryTerms.some((t) => title.includes(t));
}

export async function searchInstallHelp(query: string): Promise<SearchResults> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return { web: [], videos: [] };

  const headers = {
    Accept: "application/json",
    "Accept-Encoding": "gzip",
    "X-Subscription-Token": apiKey,
  };

  const webQuery = encodeURIComponent(`${query} fix how to`);
  const videoSearchQuery = buildVideoSearchQuery(query);
  const videoQuery = encodeURIComponent(videoSearchQuery);

  const [webRes, videoRes] = await Promise.allSettled([
    fetch(`${BRAVE_API_BASE}/web/search?q=${webQuery}&count=4&safesearch=moderate`, {
      headers,
      signal: AbortSignal.timeout(5000),
    }),
    fetch(`${BRAVE_API_BASE}/videos/search?q=${videoQuery}&count=8&safesearch=moderate`, {
      headers,
      signal: AbortSignal.timeout(5000),
    }),
  ]);

  const web: WebResult[] = [];
  const videos: VideoResult[] = [];

  if (webRes.status === "fulfilled" && webRes.value.ok) {
    try {
      const data = await webRes.value.json();
      const results: Array<{ title: string; url: string; description?: string }> =
        data?.web?.results ?? [];
      for (const r of results.slice(0, 3)) {
        web.push({
          title: r.title,
          url: r.url,
          description: (r.description ?? "").slice(0, 200),
        });
      }
    } catch {
      // Ignore parse errors
    }
  }

  if (videoRes.status === "fulfilled" && videoRes.value.ok) {
    try {
      const data = await videoRes.value.json();
      const results: Array<{ title: string; url: string }> = data?.results ?? [];
      for (const r of results) {
        const videoId = extractYouTubeId(r.url);
        if (videoId && videos.length < 3 && isVideoRelevant(r.title, query)) {
          videos.push({
            title: r.title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            videoId,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          });
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  return { web, videos };
}

export function formatSearchContext(results: SearchResults): string {
  const { web } = results;
  if (web.length === 0) return "";

  const lines: string[] = ["\n\n--- LIVE SEARCH RESULTS ---"];

  lines.push("WEB:");
  web.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.title}`);
    lines.push(`   URL: ${r.url}`);
    if (r.description) lines.push(`   ${r.description}`);
  });

  lines.push("\nUse these results to give accurate, current information.", "---");

  return lines.join("\n");
}
