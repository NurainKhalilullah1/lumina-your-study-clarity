import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

interface RequestBody {
  contents: Message[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const body: RequestBody = await req.json();
    const { contents } = body;

    if (!contents || !Array.isArray(contents)) {
      throw new Error("Invalid request: 'contents' array is required");
    }

    // Try gemini-2.5-flash first, fall back to gemini-1.5-flash if unavailable
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
    let response: Response | null = null;
    let lastError = "";

    for (const model of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents }),
            signal: controller.signal,
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        console.log(`Using model: ${model}`);
        break;
      }

      // If 404 or 400, this model isn't available — try next
      if (response.status === 404 || response.status === 400) {
        lastError = `Model ${model} not available (${response.status})`;
        console.warn(lastError);
        response = null;
        continue;
      }

      // For other errors (rate limit, auth, etc.) stop immediately
      const errorBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    if (!response) {
      throw new Error(`No available Gemini model. Last error: ${lastError}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response text received from Gemini API");
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    // Always return 200 — if we return non-2xx, Supabase's client swallows the
    // real error body and replaces it with "Edge Function returned a non-2xx status code".
    return new Response(
      JSON.stringify({ error: (error as Error).message, text: null }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
