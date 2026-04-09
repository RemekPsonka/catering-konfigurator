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
      requirements,
      inquiry_text,
      event_type,
      event_date,
      people_count,
      pricing_mode,
      variants_summary,
      services_summary,
      total_value,
      price_per_person,
      discount_info,
      budget_info,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Brak klucza API" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Jesteś asystentem firmy cateringowej "Catering Śląski". Porównaj przygotowaną ofertę z wymaganiami klienta i oceń zgodność. Bądź konkretny i pomocny. Odpowiadaj po polsku.`;

    const userPrompt = `WYMAGANIA KLIENTA:
${JSON.stringify(requirements, null, 2)}

TREŚĆ ZAPYTANIA KLIENTA:
${inquiry_text || "Brak"}

PRZYGOTOWANA OFERTA:
- Typ wydarzenia: ${event_type}
- Data: ${event_date || "Nie ustalona"}
- Liczba osób: ${people_count}
- Tryb cenowy: ${pricing_mode}
- Warianty menu: ${variants_summary}
- Usługi dodatkowe: ${services_summary}
- Łączna wartość: ${total_value} zł
- Cena za osobę: ${price_per_person} zł
- Rabat: ${discount_info || "Brak"}
- Budżet klienta: ${budget_info || "Nie podany"}

Dla KAŻDEGO wymagania oceń zgodność oferty. Podaj ostrzeżenia i sugestie ulepszeń.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "validate_offer",
                description:
                  "Zwróć wynik walidacji oferty wobec wymagań klienta",
                parameters: {
                  type: "object",
                  properties: {
                    validations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          requirement_text: { type: "string" },
                          status: {
                            type: "string",
                            enum: [
                              "met",
                              "partially_met",
                              "not_met",
                              "unclear",
                            ],
                          },
                          explanation: { type: "string" },
                          suggestion: {
                            type: "string",
                            description: "Sugestia poprawy lub null",
                          },
                        },
                        required: [
                          "requirement_text",
                          "status",
                          "explanation",
                        ],
                        additionalProperties: false,
                      },
                    },
                    overall_score: {
                      type: "string",
                      description: "np. 4/6 wymagań spełnionych",
                    },
                    overall_status: {
                      type: "string",
                      enum: ["ready", "needs_attention", "major_gaps"],
                    },
                    summary: {
                      type: "string",
                      description: "2-3 zdania podsumowania po polsku",
                    },
                    warnings: {
                      type: "array",
                      items: { type: "string" },
                    },
                    suggestions: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: [
                    "validations",
                    "overall_score",
                    "overall_status",
                    "summary",
                    "warnings",
                    "suggestions",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "validate_offer" },
          },
        }),
      }
    );

    if (!response.ok) {
      const statusCode = response.status;
      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ error: "Zbyt wiele zapytań. Spróbuj za chwilę." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (statusCode === 402) {
        return new Response(
          JSON.stringify({ error: "Brak środków na AI. Doładuj konto." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", statusCode, errorText);
      return new Response(
        JSON.stringify({ error: "Błąd AI gateway" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "AI nie zwróciło wyników walidacji" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validation = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ validation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-offer error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Nieznany błąd",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
