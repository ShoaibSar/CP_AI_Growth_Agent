# AI Growth Hypothesis Engine

An interactive, human-in-the-loop growth agent for product-page optimization. The application ingests product data and customer reviews, uses an OpenAI model to extract evidence-backed insights, generates prioritized A/B-test hypotheses, creates experiment designs, and renders a simulated Dynamic Yield payload.

The interface exposes model output and system events in a glass-box reasoning view so every recommendation can be reviewed before it advances.

## Workflow

1. **Data intake** - choose and ingest a product JSON file.
2. **Insight extraction** - identify themes, objections, unanswered questions, intent signals, and hidden strengths.
3. **Hypothesis generation** - create prioritized, evidence-backed A/B-test hypotheses.
4. **Human review** - approve or reject each hypothesis.
5. **Test design** - turn approved hypotheses into structured experiments.
6. **Simulated push** - preview a Dynamic Yield-style payload without publishing it.

## Technology

- React 18, Vite, and Tailwind CSS
- Express
- OpenAI JavaScript SDK and Responses API
- Server-Sent Events for streamed model output

## Requirements

- Git
- Node.js 24 or newer
- npm
- An OpenAI API key with available API credits

The user only needs to provide their own OpenAI API key. Everything else can be installed, built, started, and verified from the commands below. Create or manage a key in the [OpenAI API dashboard](https://platform.openai.com/api-keys).

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/ShoaibSar/CP_AI_Growth_Agent.git
cd CP_AI_Growth_Agent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add the OpenAI API key

Copy the public environment template to a local file named exactly `.env`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS or Linux:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder with your own key:

```env
OPENAI_API_KEY=your_real_openai_api_key
OPENAI_MODEL=gpt-5.5
PORT=8787
```

- `OPENAI_API_KEY` is the only value the user must supply.
- `OPENAI_MODEL` selects the model. The configured default is `gpt-5.5`; it can be replaced with another model available to the user's OpenAI API project.
- `PORT` controls the Express API port. The Vite proxy expects port `8787` by default.

Never commit `.env`. It is excluded by `.gitignore`. Do not put a real key in `.env.example`, source code, screenshots, issues, chat messages, or logs.

### 4. Validate the project

```bash
npm run build
```

A successful build creates the ignored `dist/` directory and exits without errors.

### 5. Start the application

```bash
npm run dev
```

This starts both services:

- Frontend: [http://localhost:5173](http://localhost:5173)
- API health check: [http://localhost:8787/api/health](http://localhost:8787/api/health)

The health endpoint should return a response similar to:

```json
{
  "ok": true,
  "liveAvailable": true,
  "model": "gpt-5.5"
}
```

If `liveAvailable` is `false`, stop the server, confirm `.env` is in the repository root and contains `OPENAI_API_KEY`, then restart `npm run dev`.

## Use the application

1. Open [http://localhost:5173](http://localhost:5173).
2. Select a JSON file in **Data intake**.
3. Click **Ingest dataset**.
4. Click **Run agents** and wait for insight extraction and hypothesis generation.
5. Review the reasoning, evidence, and audit log.
6. Approve or reject hypotheses.
7. Click **Design test** on an approved hypothesis.
8. Review the test design and simulated Dynamic Yield payload.

## Product JSON examples

Users can analyze the included product examples or add their own product and review data as JSON.

Included datasets:

- `src/data/macbook-pro-m5-cyberport.json` - real Cyberport snapshot with 14 supplied reviews. This dataset requires a successful live model call.
- `src/data/macbook.json` - representative demonstration dataset with a cached fallback.

A custom dataset should follow this structure:

```json
{
  "product": {
    "sku": "PRODUCT-001",
    "name": "Example product",
    "brand": "Example brand",
    "category": "Example category",
    "url": "https://example.com/product"
  },
  "price": {
    "currency": "EUR",
    "current": 999
  },
  "competitor": null,
  "page": {
    "headline": "Example product",
    "bullets": ["Primary feature"],
    "ctaPrimary": "Add to cart"
  },
  "specs": {
    "memory": "16 GB",
    "storage": "512 GB"
  },
  "ratingSummary": {
    "average": 4.5,
    "count": 1,
    "distribution": { "5": 1, "4": 0, "3": 0, "2": 0, "1": 0 }
  },
  "reviews": [
    {
      "id": "review-001",
      "rating": 5,
      "title": "Excellent product",
      "author": "Customer",
      "verified": true,
      "date": "2026-01-01",
      "text": "Detailed customer review text."
    }
  ]
}
```

To add a bundled product example:

1. Save the JSON file in `src/data/`.
2. Import it near the top of `src/App.jsx`.
3. Add it to `DATASET_OPTIONS` with a filename, label, and imported data value.
4. Run `npm run build` to validate the JSON and application.
5. Restart `npm run dev`. The dataset will appear in the intake selector.

Example registration in `src/App.jsx`:

```js
import exampleProduct from './data/example-product.json'

const DATASET_OPTIONS = [
  { file: 'example-product.json', label: 'Example product', data: exampleProduct }
]
```

Keep the existing entries when adding a new one; the shortened array above only demonstrates the required object shape.

## Instructions for OpenAI Codex

Codex can perform the complete setup and verification workflow except supplying the user's private API key.

When asked to run this repository, Codex should:

1. Confirm Node.js and npm are installed.
2. Run `npm install`.
3. Check whether `.env` exists without displaying or logging its contents.
4. If `.env` is missing, copy `.env.example` to `.env` and ask the user to add `OPENAI_API_KEY`. Never invent, request in chat, print, modify, or commit the key.
5. Run `npm run build` and resolve build errors before starting the application.
6. Run `npm run dev` and keep the process active.
7. Verify `http://localhost:8787/api/health` returns `ok: true` and report whether `liveAvailable` is enabled.
8. Open or provide `http://localhost:5173` for testing.
9. Never add `.env`, `node_modules/`, `dist/`, or log files to Git.

Copy-paste request for Codex:

```text
Set up and run this repository by following README.md. Do not read, print, modify, or commit my API key. Build the project, start both services, verify the API health endpoint, and give me the local frontend URL. If .env is missing, create it from .env.example and wait for me to add OPENAI_API_KEY.
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express API and Vite frontend together |
| `npm run server` | Start only the API on port `8787` |
| `npm run client` | Start only the Vite frontend on port `5173` |
| `npm run build` | Create a production frontend build |
| `npm run preview` | Preview the production build locally |

## Project structure

```text
server/index.js                 Express proxy and OpenAI streaming endpoint
src/App.jsx                     Main workflow and application state
src/engine.js                   Health check and stream client
src/prompts/prompts.js          Agent prompts and simulated payload builder
src/normalizers.js              Model-output normalization
src/components/                 Interface components
src/data/                       Product datasets and demo fallback
.env.example                    Public environment-variable template
```

## Troubleshooting

### The live model is unavailable

- Confirm `.env` is in the repository root beside `package.json`.
- Restart `npm run dev` after changing `.env`.
- Open the health endpoint and confirm `liveAvailable` is `true`.
- Confirm the key has API access and available credits.

### The API reports a model error

Change `OPENAI_MODEL` in `.env` to a model available to the user's OpenAI API project, restart the server, and verify the health endpoint reports the new model name.

### A port is already in use

Stop the process using ports `5173` or `8787`. If the API port changes, update the proxy target in `vite.config.js` too.

### Windows certificate errors

The server command uses Node's `--use-system-ca` option so the OpenAI SDK can use certificates trusted by Windows.

## Scope

This is a demonstration application based on local product snapshots and review data. Dynamic Yield integration is simulated. The project does not perform live crawling, production deployment, or autonomous experiment publishing.
