# Hypothesis Engine in a Glass Box

**OMMAX × Cyberport — AI Growth Team demo.** A sales artifact (not production code) that shows a 5‑stage agentic pipeline working on **one real Cyberport product**: it mines German customer reviews, extracts insights, generates evidence‑grounded A/B‑test hypotheses, designs the tests in Dynamic‑Yield style, and renders a **simulated** DY push payload — all with the LLM reasoning streamed live in a glass box.

---

## Quick start

```bash
cd glassbox
npm install
cp .env.example .env   # then paste your OPENAI_API_KEY into .env
npm run dev
```

Open **http://localhost:5173** and click **▶ Run the engine**.

- `npm run dev` starts both the local API proxy (port **8787**) and the Vite app (port **5173**).
- The API key lives only on the server (`server/index.js`) — it is never shipped to the browser.

### Windows note
The scripts use `concurrently`, which is cross‑platform. If you prefer two terminals:

```bash
npm run server
```
```bash
npm run client
```

---

## How the demo runs

| Stage | What happens | Source |
|------|---------------|--------|
| 1. Data intake | Cached product page, specs, price, competitor, 34 German reviews | `src/data/macbook.json` |
| 2. Insight extraction | LLM mines themes, objections, open questions, intent signals | **live** |
| 3. Hypothesis agent | 3–5 prioritized, **evidence‑grounded** hypotheses (real review quotes) | **live** |
| 4. Test‑design agent | DY‑style test spec per approved hypothesis | **live** |
| 5. Simulated DY push | Plausible DY API payload (JSON), clearly labeled **SIMULATED** | local |

Stages 2–4 stream the model's reasoning into the **glass box** panel ("thinking out loud"). Every action and human decision is written to the **audit log**. Hypotheses have **Approve / Reject** buttons; only approved ones can be designed and pushed.

- **UI language:** English. **Generated content (hypotheses, evidence, quotes):** German.
- **Autonomy dial:** Advisory → Assisted → Autonomous, with **Advisory** highlighted as the current mode.
- **"What this is / what this is not"** panel is always visible.

## Reliability (the live run must not fail)

- Every input is cached. If a live LLM call errors or fails to parse, the app **silently falls back** to a pre‑generated result set (`src/data/fallback.json`) — the meeting never breaks. A small "cached result shown" badge appears so *you* know, without derailing the demo.
- Low temperature (0.2) and a hard evidence requirement in the prompts (`src/prompts/prompts.js`): a hypothesis without traceable evidence is dropped.

## Running on REAL Cyberport data

Swap **one file**: `src/data/macbook.json`. Keep the same shape (`product`, `price`, `competitor`, `page`, `specs`, `ratingSummary`, `reviews[]`). Paste the real cyberport.de reviews into `reviews` (keep them in original German, keep the `id`s). The live pipeline then reasons over genuine data with no other change. If you also want a matching silent fallback, regenerate `src/data/fallback.json` from a live run.

## Model

Default `claude-sonnet-5` (override with `ANTHROPIC_MODEL` in `.env`). Any strong reasoning model works.

## What this is / is not

Outside‑in public data only · one product · human‑in‑the‑loop · **no** DY integration (push simulated) · **no** live crawling · **no** learning loop yet. Phase 2 runs this engine on Cyberport's real data exports; Phase 3 deploys via the DY API.
