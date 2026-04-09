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
    const {
      inquiry_text,
      event_type_label,
      variants_summary,
      total_value,
      services_summary,
      people_count,
      event_date,
      client_name,
      discount_info,
      delivery_cost,
      pricing_mode_label,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const contextParts: string[] = [];
    if (event_type_label) contextParts.push(`Typ wydarzenia: ${event_type_label}`);
    if (client_name) contextParts.push(`Klient: ${client_name}`);
    if (people_count) contextParts.push(`Liczba osób: ${people_count}`);
    if (event_date) contextParts.push(`Data: ${event_date}`);
    if (pricing_mode_label) contextParts.push(`Tryb wyceny: ${pricing_mode_label}`);
    if (inquiry_text) contextParts.push(`Zapytanie klienta:\n${inquiry_text}`);
    if (variants_summary) contextParts.push(`Warianty menu:\n${variants_summary}`);
    if (services_summary) contextParts.push(`Usługi dodatkowe: ${services_summary}`);
    if (discount_info) contextParts.push(discount_info);
    if (delivery_cost) contextParts.push(`Koszt dostawy: ${delivery_cost} zł`);
    if (total_value) contextParts.push(`Łączna wartość oferty: ${total_value} zł`);

    const userPrompt = contextParts.length > 0
      ? `Napisz podsumowanie oferty na podstawie poniższych informacji:\n\n${contextParts.join("\n\n")}`
      : "Napisz ogólne podsumowanie oferty cateringowej.";

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
              'Jesteś ekspertem od ofert cateringowych firmy "Catering Śląski". Napisz krótkie podsumowanie przygotowanej oferty (3-5 zdań) na podstawie WYŁĄCZNIE podanych danych.\n\nZASADY:\n- Opisuj TYLKO to co faktycznie jest w danych — nie wymyślaj dań, usług, szczegółów ani prognoz\n- Jeśli brakuje wariantów lub dań — napisz że oferta jest w trakcie przygotowania\n- Nie wspominaj o cenach konkretnych dań — podaj tylko łączną wartość oferty\n- Wspomnij liczbę wariantów, wymień kilka kluczowych dań z listy, wspomnij usługi dodatkowe jeśli są\n- Jeśli jest rabat — wspomnij o nim\n- Ton: profesjonalny, ciepły, po polsku\n- Nie używaj markdown\n- Zwracaj sam tekst',
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
        JSON.stringify({ error: "Błąd generowania podsumowania" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ summary: text.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-summary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
