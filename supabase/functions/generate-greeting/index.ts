import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_type_label, event_date, inquiry_text, client_name, people_count } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const contextParts: string[] = [];
    if (event_type_label) contextParts.push(`Typ imprezy: ${event_type_label}`);
    if (event_date) contextParts.push(`Data: ${event_date}`);
    if (people_count) contextParts.push(`Liczba osób: ${people_count}`);
    if (client_name) contextParts.push(`Klient: ${client_name}`);
    if (inquiry_text) contextParts.push(`Treść zapytania klienta:\n${inquiry_text}`);

    const userPrompt = contextParts.length > 0
      ? `Napisz tekst powitalny do oferty cateringowej na podstawie poniższych informacji:\n\n${contextParts.join("\n")}`
      : "Napisz ogólny tekst powitalny do oferty cateringowej.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              'Jestes copywriterem firmy cateringowej "Catering Slaski". Napisz elegancki, profesjonalny tekst powitalny do oferty cateringowej. Max 3-4 zdania. Jezyk polski. Nie uzywaj markdown. Zwracaj sam tekst.',
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zbyt wiele zapytań. Spróbuj ponownie za chwilę." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Brak środków na generowanie AI. Doładuj kredyty w ustawieniach workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Błąd generowania tekstu" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ greeting: text.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-greeting error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
