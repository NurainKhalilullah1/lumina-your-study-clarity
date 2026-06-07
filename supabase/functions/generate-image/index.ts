import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      throw new Error("'prompt' string is required");
    }

    const seed = Math.floor(Math.random() * 2_000_000_000);
    const pollinationsUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?model=sana&width=1024&height=768&nologo=true&seed=${seed}`;

    console.log(`Fetching image for prompt: "${prompt.slice(0, 80)}…"`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000); // 90s server-side timeout

    let imageResponse: Response;
    try {
      imageResponse = await fetch(pollinationsUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!imageResponse.ok) {
      throw new Error(`Pollinations returned HTTP ${imageResponse.status}`);
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

    console.log(`✓ Image generated — ${uint8Array.length} bytes, type: ${contentType}`);

    return new Response(
      JSON.stringify({ imageData, mimeType: contentType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Image generation failed:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Image generation failed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
