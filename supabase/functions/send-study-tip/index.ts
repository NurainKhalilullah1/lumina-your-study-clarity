import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Curated tip bank ───────────────────────────────────────────────────────
// 60 tips across 3 categories. Picked randomly on each send.
const TIPS = [
  // 📚 Study Techniques (30)
  { title: "📚 Study Tip", body: "Try the Pomodoro technique — 25 min focused study, 5 min break. Short breaks actually improve retention by up to 40%." },
  { title: "📚 Study Tip", body: "Teach what you've just learned out loud — to yourself or a friend. The 'protégé effect' is one of the fastest ways to solidify knowledge." },
  { title: "📚 Study Tip", body: "Active recall beats re-reading every time. Close your notes and try to write down everything you remember. Struggling to recall is what builds memory." },
  { title: "📚 Study Tip", body: "Spaced repetition: review material after 1 day, then 3 days, then 1 week. Your brain retains information much longer this way." },
  { title: "📚 Study Tip", body: "Write summaries in your own words, not the textbook's. If you can't explain it simply, you don't understand it yet." },
  { title: "📚 Study Tip", body: "Study in the same place consistently. Your brain associates the environment with focus — it will get easier to enter deep work mode." },
  { title: "📚 Study Tip", body: "Interleaving works: mix different subjects or problem types in one session instead of blocking. It feels harder but leads to better long-term retention." },
  { title: "📚 Study Tip", body: "Before you start studying, write down exactly what you want to accomplish this session. A clear goal cuts procrastination significantly." },
  { title: "📚 Study Tip", body: "Don't highlight everything — it creates an illusion of learning. Instead, take notes in your own words as you read." },
  { title: "📚 Study Tip", body: "Read headings and subheadings before reading a chapter fully. Pre-reading activates your brain to look for key ideas while reading." },
  { title: "📚 Study Tip", body: "Studying in 90-minute blocks aligns with your brain's natural ultradian rhythm — after which, a proper 10-20 min break is essential." },
  { title: "📚 Study Tip", body: "Practice problems > reading theory. In subjects like maths or physics, doing more questions is far more effective than re-reading the textbook." },
  { title: "📚 Study Tip", body: "Turn your notes into questions. For every key point, write a 'who, what, why, how' question. Then quiz yourself later." },
  { title: "📚 Study Tip", body: "Study the hardest subject first when your mental energy is highest — usually in the morning or right after a good rest." },
  { title: "📚 Study Tip", body: "Use the Feynman Technique: pick a concept, explain it as if teaching a 12-year-old, then spot gaps in your explanation." },
  { title: "📚 Study Tip", body: "Group similar information with mind maps. Visual organisation helps you see relationships between concepts rather than memorising in isolation." },
  { title: "📚 Study Tip", body: "Reading a chapter takes 30 mins but you'll forget 70% by tomorrow. Doing 20 active recall questions takes 30 mins and you'll remember 90% next week." },
  { title: "📚 Study Tip", body: "Mix up your study materials — switch between your notes, textbook, practice questions, and past papers. Variety prevents passive reading." },
  { title: "📚 Study Tip", body: "Review yesterday's notes for 5 minutes before starting today's session. This bridges concepts and strengthens long-term memory." },
  { title: "📚 Study Tip", body: "Don't multitask. Studying with notifications on or a show in the background can reduce comprehension by over 30%." },
  { title: "📚 Study Tip", body: "Set a timer before you start. Knowing a session ends in 25 minutes makes it easier to start and easier to stay focused." },
  { title: "📚 Study Tip", body: "Past papers are gold. They show exactly what examiners value — and doing them under timed conditions is the most effective exam prep." },
  { title: "📚 Study Tip", body: "If a concept confuses you, try to find 2 different explanations from 2 different sources. Sometimes a different analogy clicks instantly." },
  { title: "📚 Study Tip", body: "Use the '2-minute rule' for getting started: tell yourself you'll only study for 2 minutes. You'll almost always continue longer." },
  { title: "📚 Study Tip", body: "Write down distracting thoughts on a piece of paper when they pop up during study. This clears your mind without losing the thought." },
  { title: "📚 Study Tip", body: "Summarise each lecture in 5 bullet points within 24 hours of attending. Waiting longer means losing over half the content." },
  { title: "📚 Study Tip", body: "Don't just re-read your notes — rewrite them from scratch without looking. This is one of the highest-value study activities you can do." },
  { title: "📚 Study Tip", body: "Colour coding can help, but only if the colours have meaning (e.g. green = key term, red = formula). Random highlighting is just decoration." },
  { title: "📚 Study Tip", body: "Explain concepts aloud in your own words while pacing around. Physical movement slightly boosts cognitive retention." },
  { title: "📚 Study Tip", body: "If you're stuck on a problem for more than 15 minutes, move on and come back. A fresh perspective after a break often unlocks it." },

  // 💡 App Tips (20)
  { title: "💡 StudyFlow Tip", body: "Upload your lecture slides to the AI Tutor and ask it to summarise the key points in under 200 words. Great for quick review." },
  { title: "💡 StudyFlow Tip", body: "After uploading a document, ask the AI Tutor: 'What are the 5 most important concepts I should understand from this?' — it gives a focused breakdown." },
  { title: "💡 StudyFlow Tip", body: "Use the Quiz feature right before an exam. Turn on shuffle mode so you can't accidentally memorise the order of answers." },
  { title: "💡 StudyFlow Tip", body: "Generate flashcards from your uploaded notes, then review them on your phone during commutes or breaks — micro-revision adds up." },
  { title: "💡 StudyFlow Tip", body: "Try asking the AI Tutor to 'quiz me on [topic]' — it creates ad-hoc questions based on your actual document content." },
  { title: "💡 StudyFlow Tip", body: "Upload past exam questions into the AI Tutor and ask it to explain the model answer step-by-step." },
  { title: "💡 StudyFlow Tip", body: "Ask the AI Tutor to identify weaknesses: 'Based on this document, what concepts are students most likely to find difficult?'" },
  { title: "💡 StudyFlow Tip", body: "After a lecture, upload your notes and ask: 'What gaps or missing details should I research further?' — it acts like a study buddy." },
  { title: "💡 StudyFlow Tip", body: "The flashcard generator works best with structured content. Try uploading topic summaries rather than entire textbook chapters." },
  { title: "💡 StudyFlow Tip", body: "You can chat naturally with the AI Tutor — ask it to rephrase a confusing explanation in simpler terms or use a different analogy." },
  { title: "💡 StudyFlow Tip", body: "Use the AI Tutor to create a study plan: 'I have 3 weeks before my exam on this topic. Give me a daily revision schedule.'" },
  { title: "💡 StudyFlow Tip", body: "Generate a quiz with a high difficulty setting to stress-test your knowledge — if you can pass the hard version, the real exam is easier." },
  { title: "💡 StudyFlow Tip", body: "Save your flashcard sets per topic and revisit them weekly. Consistent spaced repetition is more effective than cramming the night before." },
  { title: "💡 StudyFlow Tip", body: "Ask the AI: 'Explain [concept] as if I'm a first-year student' for simplified explanations, or 'go deeper' for advanced detail." },
  { title: "💡 StudyFlow Tip", body: "Upload your essay draft and ask the AI Tutor: 'What arguments am I missing?' or 'How can I strengthen this paragraph?'" },
  { title: "💡 StudyFlow Tip", body: "Use the library to organise documents by module — this makes it easy to switch context between subjects during a multi-subject session." },
  { title: "💡 StudyFlow Tip", body: "Ask the AI Tutor to create a comparison table between two concepts from your document — visual comparisons are easier to remember." },
  { title: "💡 StudyFlow Tip", body: "Challenge yourself: after reading a section, close it and ask the AI Tutor what you should have learned. Then try to answer without looking." },
  { title: "💡 StudyFlow Tip", body: "The AI Tutor retains context within a session. You can ask follow-up questions naturally — no need to repeat what you've already said." },
  { title: "💡 StudyFlow Tip", body: "Use the AI to predict exam questions: 'Based on this topic, what 3 questions are most likely to appear in a final exam?'" },

  // 🧠 Wellness & Mindset (10)
  { title: "🧠 Mindset Tip", body: "Sleep is when your brain consolidates memories. Reviewing material before sleep and getting 7–9 hours can improve retention by up to 40%." },
  { title: "🧠 Mindset Tip", body: "Exercise boosts brain-derived neurotrophic factor (BDNF), which improves learning speed. Even a 20-minute walk before studying helps." },
  { title: "🧠 Mindset Tip", body: "Dehydration impairs focus and memory. Keep a water bottle at your desk — even mild dehydration (1–2%) reduces cognitive performance." },
  { title: "🧠 Mindset Tip", body: "Anxiety before exams is normal — it means you care. Use it: reframe 'I'm anxious' as 'I'm prepared and alert'. Research shows this improves performance." },
  { title: "🧠 Mindset Tip", body: "Progress, not perfection. Missing one study session doesn't ruin your preparation — consistency over weeks matters far more than any single day." },
  { title: "🧠 Mindset Tip", body: "Your brain needs downtime to form connections. Periods of 'doing nothing' aren't wasted — they're when unconscious processing happens." },
  { title: "🧠 Mindset Tip", body: "Comparing yourself to classmates is a losing game. Focus on your own progress — you're competing with who you were last week, not others." },
  { title: "🧠 Mindset Tip", body: "Eat a protein-rich meal before a long study session. Blood sugar crashes from high-carb meals lead to post-lunch brain fog." },
  { title: "🧠 Mindset Tip", body: "If you're struggling to focus, try 5 deep breaths — box breathing (inhale 4s, hold 4s, exhale 4s) activates the parasympathetic nervous system." },
  { title: "🧠 Mindset Tip", body: "Celebrate small wins. Finished a chapter? Completed a quiz set? That deserves a moment of acknowledgment — it reinforces the study habit loop." },
];

// ── FCM v1 helper ──────────────────────────────────────────────────────────
// Gets a short-lived OAuth2 access token using the service account credentials

/** Converts a standard base64 string to base64url (required for JWTs) */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getFCMAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // JWT parts must use base64url encoding, not standard base64
  const header = toBase64Url(btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = toBase64Url(btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })));

  // Import the private key
  const pemKey = serviceAccount.private_key;
  const keyData = pemKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  // Signature must also be base64url encoded
  const sigBase64Url = toBase64Url(btoa(String.fromCharCode(...new Uint8Array(signature))));
  const jwt = `${signingInput}.${sigBase64Url}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error("Failed to get FCM access token");
  return tokenData.access_token;
}

// ── Main handler ───────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Load secrets
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT secret not configured");

    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = serviceAccount.project_id;

    // Get FCM access token
    const accessToken = await getFCMAccessToken(serviceAccount);

    // Fetch all push tokens from the database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token, platform, id")
      .not("token", "is", null);

    if (error) throw new Error(`Failed to fetch tokens: ${error.message}`);
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No tokens registered" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick a random tip
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

    // Send to each token, collecting expired/invalid ones for cleanup
    const invalidTokenIds: string[] = [];
    let sentCount = 0;

    await Promise.all(
      tokens.map(async ({ token, id }) => {
        try {
          const res = await fetch(
            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: {
                  token,
                  notification: { title: tip.title, body: tip.body },
                  android: { priority: "normal" },
                  webpush: {
                    notification: { icon: "/favicon.png", badge: "/favicon.png" },
                  },
                },
              }),
            }
          );

          if (res.ok) {
            sentCount++;
          } else {
            const err = await res.json();
            const errCode = err?.error?.details?.[0]?.errorCode;
            // Mark invalid/expired tokens for removal
            if (errCode === "UNREGISTERED" || errCode === "INVALID_ARGUMENT") {
              invalidTokenIds.push(id);
            }
            console.warn(`FCM send failed for token: ${errCode}`);
          }
        } catch (e) {
          console.error("FCM send error:", e);
        }
      })
    );

    // Clean up dead tokens
    if (invalidTokenIds.length > 0) {
      await supabase.from("push_tokens").delete().in("id", invalidTokenIds);
      console.log(`Cleaned up ${invalidTokenIds.length} invalid tokens`);
    }

    console.log(`Tip sent: "${tip.title}" → ${sentCount}/${tokens.length} devices`);

    return new Response(
      JSON.stringify({ sent: sentCount, total: tokens.length, tip: tip.title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-study-tip error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
