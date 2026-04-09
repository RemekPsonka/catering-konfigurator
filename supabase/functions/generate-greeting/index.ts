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
    const { event_type_label, event_date, inquiry_text, client_name, people_count, location, company, requirements, notes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine if we have rich AI-parsed data
    const hasRichContext = !!(requirements?.length || location || company || notes);

    const contextParts: string[] = [];
    if (client_name) contextParts.push(`Klient: ${client_name}${company ? ` z ${company}` : ''}`);
    if (event_type_label) contextParts.push(`Typ imprezy: ${event_type_label}`);
    if (event_date) contextParts.push(`Data: ${event_date}`);
    if (people_count) contextParts.push(`Liczba osób: ${people_count}`);
    if (location) contextParts.push(`Lokalizacja: ${location}`);
    if (requirements?.length) contextParts.push(`Wymagania klienta:\n${requirements.map((r: string) => `- ${r}`).join('\n')}`);
    if (notes) contextParts.push(`Notatki: ${notes}`);
    if (inquiry_text) contextParts.push(`Treść zapytania klienta:\n${inquiry_text}`);

    let systemContent: string;
    let userPrompt: string;

    if (hasRichContext) {
      systemContent = `Jesteś copywriterem firmy cateringowej "Catering Śląski". Napisz tekst powitalny do oferty cateringowej.

ZASADY:
- Napisz 3-5 zdań, ciepły ale profesjonalny ton
- NAWIĄŻ do konkretnych elementów zapytania klienta (lokalizacja, typ eventu, szczególne wymagania)
- Pokaż że przeczytaliśmy i rozumiemy potrzeby klienta
- Wspomnij o doświadczeniu Catering Śląski w tego typu wydarzeniach
- NIE podawaj cen ani szczegółów menu — to będzie dalej w ofercie
- Zwracaj się: "Szanowna Pani [nazwisko]" / "Szanowny Panie [nazwisko]" (jeśli znamy) lub "Szanowni Państwo"
- Po polsku, bez emoji, bez markdown
- Zwracaj sam tekst`;

      userPrompt = `Napisz spersonalizowany tekst powitalny do oferty cateringowej na podstawie poniższych informacji:\n\n${contextParts.join('\n')}`;
    } else {
      systemContent = 'Jesteś copywriterem firmy cateringowej "Catering Śląski". Napisz elegancki, profesjonalny tekst powitalny do oferty cateringowej. Max 3-4 zdania. Język polski. Nie używaj markdown. Zwracaj sam tekst.';

      userPrompt = contextParts.length > 0
        ? `Napisz tekst powitalny do oferty cateringowej na podstawie poniższych informacji:\n\n${contextParts.join("\n")}`
        : "Napisz ogólny tekst powitalny do oferty cateringowej.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
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
