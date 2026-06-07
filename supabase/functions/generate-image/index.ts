import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIMEOUT_MS = 50_000;  // 50s per attempt
const MAX_ATTEMPTS = 2;     // 2 attempts total (~100s worst-case)
const RETRY_DELAY_MS = 3_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "'prompt' string is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reduce resolution to 512×512 — sana generates faster and is less likely to time out.
    const pollinationsUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?model=sana&width=512&height=512&nologo=true`;

    console.log(`Fetching image (prompt: "${prompt.slice(0, 80)}…")`);

    let lastStatus = 0;
    let lastError = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let imageResponse: Response | undefined;
      try {
        imageResponse = await fetch(pollinationsUrl, { signal: controller.signal });
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        const isTimeout = fetchErr?.name === "AbortError";
        lastError = isTimeout ? "Request timed out" : fetchErr?.message ?? "fetch failed";
        console.warn(`Attempt ${attempt}/${MAX_ATTEMPTS} — ${lastError}`);
        if (attempt < MAX_ATTEMPTS) { await sleep(RETRY_DELAY_MS); continue; }
        return new Response(
          JSON.stringify({ error: lastError }),
          { status: isTimeout ? 504 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      clearTimeout(timeoutId);

      lastStatus = imageResponse.status;

      if (!imageResponse.ok) {
        lastError = `Pollinations returned HTTP ${lastStatus}`;
        console.warn(`Attempt ${attempt}/${MAX_ATTEMPTS} — ${lastError}`);
        // Retry on rate-limit or server errors; give up on 4xx (other than 429)
        if ((lastStatus === 429 || lastStatus >= 500) && attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return new Response(
          JSON.stringify({ error: lastError }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
      const buffer = await imageResponse.arrayBuffer();

      // Convert to base64 in chunks to avoid stack overflow on large images
      const uint8Array = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8Array.subarray(i, i + chunkSize));
      }
      const imageData = btoa(binary);

      console.log(`✓ Image generated on attempt ${attempt} — ${uint8Array.length} bytes`);

      return new Response(
        JSON.stringify({ imageData, mimeType: contentType }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Should not reach here
    return new Response(
      JSON.stringify({ error: lastError || "Image generation failed after retries" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    const msg: string = error?.message || "Image generation failed";
    console.error("Unexpected error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
