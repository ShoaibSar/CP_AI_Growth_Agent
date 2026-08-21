// Prompt builders for the three live agent stages.
// Design goals (from the briefing):
//  - Strong reasoning model, LOW temperature.
//  - EVIDENCE requirement pressed HARD: every hypothesis must cite verbatim
//    review quotes (with review id) or observed page/competitor facts, or it is dropped.
//  - Generic CRO advice ("make the CTA bigger") is an explicit failure mode.
//  - UI labels are English; GENERATED CONTENT is German (audience + source reviews are German).
//  - We ask the model to "think out loud" first (streamed to the glass box), then emit a
//    single fenced ```json block that the UI parses.

function compactData(data) {
  // Trim to what the model needs; keep reviews verbatim (German) with ids.
  return {
    product: data.product,
    price: data.price,
    competitor: data.competitor,
    page: data.page,
    specs: data.specs,
    ratingSummary: data.ratingSummary,
    reviews: data.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      text: r.text
    }))
  }
}

const COMMON_RULES = `
GRUNDREGELN (nicht verhandelbar):
- Sprache der Ausgabe: DEUTSCH. Zitate wörtlich aus den Originalrezensionen übernehmen.
- Jede Aussage muss auf konkreter Evidenz beruhen: entweder ein wörtliches Rezensionszitat MIT review-id (z. B. r08) oder eine beobachtbare Tatsache von der Produktseite / beim Wettbewerber.
- Keine generischen CRO-Floskeln ("CTA größer machen", "mehr Vertrauen schaffen") ohne konkrete, datenbelegte Begründung. Solche Vorschläge sind wertlos und werden verworfen.
- Erfinde keine Zitate. Wenn du ein Zitat nutzt, muss es exakt so in den Daten stehen.
`

export function buildInsightPrompt(data) {
  const payload = compactData(data)
  const system = `Du bist ein Senior Conversion- & Voice-of-Customer-Analyst bei OMMAX. Du analysierst echte Produktseiten- und Rezensionsdaten eines deutschen Elektronikhändlers (Cyberport). Du arbeitest präzise, evidenzbasiert und ohne Ausschmückung.${COMMON_RULES}`

  const user = `AUFGABE — STUFE 2: INSIGHT-EXTRAKTION.
Analysiere die folgenden Daten zu EINEM Produkt. Denke zuerst laut nach (höchstens 8 kurze Stichpunkte; Rohdaten nicht wiederholen): Welche Themen wiederholen sich? Welche Einwände tauchen auf? Welche Fragen bleiben auf der Seite unbeantwortet? Welche Kaufsignale/Zielgruppen erkennst du (z. B. Pendler, B2B, Studierende, Preisbewusste)? Welche gelobten Stärken sind auf der Seite schlecht sichtbar?

Gib danach GENAU EINEN JSON-Block aus (in \`\`\`json ... \`\`\`) mit dieser Struktur:
{
  "themes": [ { "label": "...", "summary": "...", "evidence": [ { "reviewId": "rXX", "quote": "wörtliches Zitat" } ], "frequency": <int, Anzahl belegender Rezensionen> } ],
  "objections": [ { "label": "...", "evidence": [ { "reviewId": "rXX", "quote": "..." } ] } ],
  "unansweredQuestions": [ { "question": "...", "evidence": [ { "reviewId": "rXX", "quote": "..." } ] } ],
  "intentSignals": [ { "segment": "...", "signal": "...", "evidence": [ { "reviewId": "rXX", "quote": "..." } ] } ],
  "hiddenStrengths": [ { "strength": "...", "whyHidden": "...", "evidence": [ { "reviewId": "rXX", "quote": "..." } ] } ]
}
Ziel: 4-6 Themen, die stärksten Einwände, 2-4 unbeantwortete Fragen, 2-4 Intent-Signale. Priorisiere nach Häufigkeit und Geschäftsrelevanz.

DATEN:
${JSON.stringify(payload, null, 2)}`

  return { system, user }
}

export function buildHypothesisPrompt(data, insights) {
  const system = `Du bist ein Growth-/Experimentation-Lead bei OMMAX und entwickelst A/B-Test-Hypothesen für die Produktseite von Cyberport. Du bist bekannt dafür, dass jede Hypothese hart auf Evidenz fußt. Generische Vorschläge lehnst du selbst ab.${COMMON_RULES}`

  const user = `AUFGABE — STUFE 3: HYPOTHESEN-AGENT.
Auf Basis der extrahierten Insights: entwickle 3-5 PRIORISIERTE, evidenzbasierte A/B-Test-Hypothesen für die Produktseite.

Denke zuerst laut nach (höchstens 6 kurze Stichpunkte; Rohdaten nicht wiederholen): Welche Insights haben den größten Hebel auf Conversion/Umsatz? Welche lassen sich sauber testen? Verwirf im Denken laut mindestens eine schwache/generische Idee mit Begründung ("verworfen, weil ...").

Gib danach GENAU EINEN JSON-Block aus (\`\`\`json ... \`\`\`):
{
  "hypotheses": [
    {
      "id": "H1",
      "statement": "Konkrete Wenn-dann-Hypothese (was ändern wir, welche Wirkung erwarten wir).",
      "evidence": [ { "type": "review|page|competitor", "reviewId": "rXX (falls review)", "quote": "wörtliches Zitat oder beobachtete Tatsache" } ],
      "expectedEffect": { "metric": "z. B. Add-to-Cart-Rate", "direction": "up|down", "reasoning": "warum, gestützt auf die Evidenz" },
      "priority": { "score": <1-100>, "rationale": "Begründung: Hebel x Belegdichte x Umsetzbarkeit" }
    }
  ]
}
Regeln: mindestens 2 Evidenz-Belege pro Hypothese. Hypothesen ohne belastbare Evidenz NICHT ausgeben. Sortiere absteigend nach priority.score.

INSIGHTS (aus Stufe 2):
${JSON.stringify(insights, null, 2)}

ROHDATEN (zur Zitatprüfung):
${JSON.stringify(compactData(data), null, 2)}`

  return { system, user }
}

export function buildTestDesignPrompt(data, hypothesis) {
  const system = `Du bist ein Experimentation-Engineer bei OMMAX und übersetzt eine Hypothese in ein ausführbares A/B-Test-Design im Stil von Dynamic Yield (DY). Präzise, umsetzbar, messbar.${COMMON_RULES}`

  const user = `AUFGABE — STUFE 4: TEST-DESIGN-AGENT.
Übersetze die folgende Hypothese in ein konkretes, ausführbares Test-Design in Dynamic-Yield-Begriffen.

Denke kurz laut nach (welches Segment, welche Metrik, wie lange). Gib danach GENAU EINEN JSON-Block aus (\`\`\`json ... \`\`\`):
{
  "hypothesisId": "${hypothesis.id}",
  "experimentName": "kurzer sprechender Name",
  "variantControl": "Beschreibung Kontrolle (Ist-Zustand der Seite)",
  "variantTreatment": "Was genau ändert sich auf der Seite (konkret, umsetzbar)",
  "targetSegment": "DY-Zielsegment (z. B. Neukunden, mobil, B2B via Referrer/OS)",
  "primaryMetric": "primäre Erfolgsmetrik",
  "secondaryMetrics": ["..."],
  "successCriterion": "quantitatives Erfolgskriterium inkl. Signifikanz",
  "suggestedDurationDays": <int>,
  "minSampleNote": "kurzer Hinweis zur Stichprobengröße/Traffic-Annahme"
}

HYPOTHESE:
${JSON.stringify(hypothesis, null, 2)}

PRODUKTKONTEXT:
${JSON.stringify({ product: data.product, price: data.price, page: data.page, specs: data.specs }, null, 2)}`

  return { system, user }
}

// Build a plausible (SIMULATED) Dynamic Yield API payload from a test design.
// This is rendered locally — no network, clearly labeled SIMULATED in the UI.
export function buildDyPayload(data, hypothesis, design) {
  return {
    _simulated: true,
    _note: 'SIMULATED payload — no Dynamic Yield connection exists in this demo.',
    apiVersion: 'dy/experiences/v2',
    method: 'POST',
    endpoint: '/v2/experiences',
    body: {
      name: design?.experimentName || `Cyberport · ${hypothesis.id}`,
      type: 'AB_TEST',
      status: 'DRAFT',
      page: {
        type: 'PRODUCT',
        selector: { sku: data.product.sku, url: data.product.url }
      },
      audience: {
        segment: design?.targetSegment || 'ALL_USERS',
        allocationPercent: 50
      },
      variations: [
        { id: 'control', name: 'Control', trafficPercent: 50, description: design?.variantControl },
        { id: 'treatment', name: 'Treatment', trafficPercent: 50, description: design?.variantTreatment }
      ],
      metrics: {
        primary: design?.primaryMetric || 'ADD_TO_CART_RATE',
        secondary: design?.secondaryMetrics || []
      },
      schedule: { durationDays: design?.suggestedDurationDays || 14 },
      meta: {
        hypothesis: hypothesis.statement,
        createdBy: 'OMMAX AI Growth Team (Advisory Mode)',
        source: 'glass-box-demo'
      }
    }
  }
}
