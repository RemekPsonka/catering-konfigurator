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
    const { inquiry_text } = await req.json();

    if (!inquiry_text || typeof inquiry_text !== "string" || inquiry_text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Zapytanie musi mieć minimum 20 znaków." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Jesteś asystentem firmy cateringowej "Catering Śląski". Przeanalizuj poniższe zapytanie klienta i wyodrębnij z niego informacje.

Zasady:
- Jeśli nie możesz wyodrębnić informacji — ustaw null
- type_confidence: "high" gdy klient wprost mówi (komunia, wesele), "medium" gdy wynika z kontekstu, "low" gdy domyślasz się
- requirements: wylistuj WSZYSTKO czego klient oczekuje lub wspomina — to będzie checklistka do weryfikacji
- Typ imprezy: instytucja/firma/urząd/organizacja zamawiająca catering = NIGDY nie klasyfikuj jako PRY (impreza prywatna). PRY to wyłącznie prywatne spotkania domowe/rodzinne.
- BUDŻET — KRYTYCZNE ZASADY:
  * Wpisz kwotę TYLKO jeśli klient DOSŁOWNIE podaje liczbę z kontekstem pieniężnym (np. "budżet 5000 zł", "do 100 zł/os", "max 8000", "w granicach 150 zł na osobę")
  * Jeśli klient podaje kwotę jako SZACUNEK WŁASNY lub PYTANIE ("czy 32 zł/os to realna cena?", "orientacyjnie 50 zł") — wpisz kwotę ale dodaj w notes: "Kwota podana jako pytanie/szacunek, nie jako twardy budżet"
  * Jeśli klient NIE podaje ŻADNEJ kwoty — budget.per_person = null, budget.total = null. NIE LICZ, NIE SZACUJ, NIE WYMYŚLAJ.
  * NIGDY nie obliczaj budżetu per_person z total÷osoby ani total z per_person×osoby. Tylko dosłowne wartości z tekstu.
  * Jeśli klient pisze "chciałbym poznać cenę" lub "proszę o wycenę" — to NIE jest budżet. Ustaw null.
- Nie wymyślaj danych — ABSOLUTNIE nic co nie jest dosłownie w tekście. Lepiej null niż zgadywanie.
- Nie wyliczaj wartości z innych pól (np. nie mnóż ceny × osoby, nie dziel łącznej kwoty przez osoby)
- Kody typów wydarzeń: KOM=Komunia, WES=Wesele, FIR=Firmowy, KON=Konferencja, PRY=Przyjęcie prywatne, GAL=Gala, STY=Stypa, GRI=Grill, B2B=Spotkanie B2B, BOX=Catering pudełkowy, KAW=Przerwa kawowa, SPE=Specjalny`;

    const eventTypeDescription = `Kod typu imprezy. Wybierz NAJLEPIEJ pasujący z listy:
KOM = Komunia (dziecko, kościół, rodzina)
WES = Wesele (ślub, wesele)
FIR = Impreza firmowa (integracja, event firmowy, firma zamawia)
KON = Konferencja (konferencja, szkolenie, seminarium)
PRY = Impreza prywatna DOMOWA (urodziny w domu, imieniny, spotkanie rodzinne w domu)
GAL = Gala / bankiet (elegancki event, bal)
STY = Stypa (pogrzeb, stypa, wspomnienie)
GRI = Grill / piknik (plener, grill, piknik)
B2B = Catering biznesowy (zamówienie od firmy/instytucji, regularny catering, catering biurowy)
BOX = Box cateringowy (lunch box, dostawa pudełek)
KAW = Serwis kawowy (kawa, ciasto, przerwa kawowa, drobny poczęstunek)
SPE = Specjalne / inne (nie pasuje do żadnego powyższego)

WSKAZÓWKI WYBORU:
- Jeśli zamawiający to instytucja/firma/urząd/fundacja/stowarzyszenie → rozważ B2B, FIR lub KAW (NIE PRY!)
- Jeśli zamówienie to głównie kawa+ciasto+lekki posiłek → KAW
- Jeśli zamówienie to pełny obiad/kolacja dla instytucji → B2B
- PRY używaj TYLKO gdy kontekst jasno wskazuje prywatne spotkanie rodzinne/domowe
- Jeśli nie jesteś pewien między dwoma typami → wybierz bardziej specyficzny i ustaw confidence na medium

lub null jeśli kompletnie nie da się określić`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `ZAPYTANIE:\n${inquiry_text}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_inquiry",
              description: "Wyodrębnij dane z zapytania klienta cateringowego",
              parameters: {
                type: "object",
                properties: {
                  client: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Imię i nazwisko klienta lub null" },
                      email: { type: "string", description: "Email klienta lub null" },
                      phone: { type: "string", description: "Telefon klienta lub null" },
                      company: { type: "string", description: "Nazwa firmy lub null" },
                    },
                    required: ["name", "email", "phone", "company"],
                  },
                  event: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["KOM", "WES", "FIR", "KON", "PRY", "GAL", "STY", "GRI", "B2B", "BOX", "KAW", "SPE"],
                        description: eventTypeDescription,
                      },
                      type_confidence: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                        description: "Pewność co do typu wydarzenia",
                      },
                      date: { type: "string", description: "Data w formacie YYYY-MM-DD lub null" },
                      time_from: { type: "string", description: "Godzina rozpoczęcia HH:MM lub null" },
                      time_to: { type: "string", description: "Godzina zakończenia HH:MM lub null" },
                      people_count: { type: "number", description: "Liczba osób lub null" },
                      location: { type: "string", description: "Adres/miejsce lub null" },
                      delivery_type: {
                        type: "string",
                        enum: ["COLD", "HEATED", "FULL_SERVICE"],
                        description: "Typ dostawy lub null",
                      },
                    },
                    required: ["type", "type_confidence", "date", "time_from", "time_to", "people_count", "location", "delivery_type"],
                  },
                  pricing_mode_suggestion: {
                    type: "string",
                    enum: ["PER_PERSON", "FIXED_QUANTITY"],
                    description: "Sugerowany tryb kalkulacji na podstawie typu eventu",
                  },
                  requirements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "Opis wymagania po polsku" },
                        category: {
                          type: "string",
                          enum: ["menu", "budget", "service", "logistics", "dietary", "special"],
                        },
                        priority: {
                          type: "string",
                          enum: ["must", "nice_to_have"],
                        },
                      },
                      required: ["text", "category", "priority"],
                    },
                    description: "Lista wymagań klienta",
                  },
                  budget: {
                    type: "object",
                    properties: {
                      per_person: { type: ["number", "null"], description: "Budżet na osobę TYLKO jeśli klient dosłownie podał kwotę. Jeśli nie podał — MUSI być null. NIGDY nie obliczaj z total÷osoby." },
                      total: { type: ["number", "null"], description: "Budżet łączny TYLKO jeśli klient dosłownie podał kwotę. Jeśli nie podał — MUSI być null. NIGDY nie obliczaj z per_person×osoby." },
                      currency: { type: "string", description: "Waluta, domyślnie PLN" },
                    },
                    required: ["per_person", "total", "currency"],
                  },
                  notes: {
                    type: "string",
                    description: "Dodatkowe obserwacje, np. ton klienta, niuanse",
                  },
                },
                required: ["client", "event", "pricing_mode_suggestion", "requirements", "budget", "notes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_inquiry" } },
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
        JSON.stringify({ error: "Błąd analizy zapytania" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI nie zwróciło wyników analizy" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: "Błąd parsowania wyników AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-inquiry error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
