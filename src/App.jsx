import React, { useEffect, useMemo, useRef, useState } from 'react'
import macbookAirData from './data/macbook.json'
import macbookProData from './data/macbook-pro-m5-cyberport.json'
import fallback from './data/fallback.json'
import { checkHealth, runStage } from './engine.js'
import {
  buildInsightPrompt,
  buildHypothesisPrompt,
  buildTestDesignPrompt,
  buildDyPayload
} from './prompts/prompts.js'
import { PipelineStrip, ReasoningStream } from './components/Pipeline.jsx'
import ProductPanel from './components/ProductPanel.jsx'
import AutonomyDial from './components/AutonomyDial.jsx'
import ScopePanel from './components/ScopePanel.jsx'
import HypothesisCard from './components/HypothesisCard.jsx'
import AuditLog from './components/AuditLog.jsx'
import DyPushModal from './components/DyPushModal.jsx'
import InsightsPanel from './components/InsightsPanel.jsx'
import { normalizeTestDesign } from './normalizers.js'
import { Activity, AlertTriangle, DatabaseZap, FileJson2, Play, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'

const now = () => new Date().toLocaleTimeString('de-DE', { hour12: false })
const DATASET_OPTIONS = [
  { file: 'macbook-pro-m5-cyberport.json', label: 'MacBook Pro 14 M5 · real Cyberport snapshot', data: macbookProData },
  { file: 'macbook.json', label: 'MacBook Air 13 M3 · representative demo', data: macbookAirData }
]
const DATASETS = Object.fromEntries(DATASET_OPTIONS.map((option) => [option.file, option.data]))

export default function App() {
  const [live, setLive] = useState(null) // null=unknown, true/false
  const [modelName, setModelName] = useState('')
  const [statuses, setStatuses] = useState({})
  const [activeKey, setActiveKey] = useState('intake')
  const [reasoning, setReasoning] = useState('')
  const [reasoningTitle, setReasoningTitle] = useState('Agent reasoning')
  const [running, setRunning] = useState(false)
  const [insights, setInsights] = useState(null)
  const [hypotheses, setHypotheses] = useState([])
  const [decisions, setDecisions] = useState({}) // id -> 'approved'|'rejected'
  const [designs, setDesigns] = useState({}) // id -> design json
  const [designing, setDesigning] = useState({}) // id -> bool
  const [audit, setAudit] = useState([])
  const [pushPayload, setPushPayload] = useState(null)
  const [selectedFile, setSelectedFile] = useState('')
  const [intakeReady, setIntakeReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)
  const [runError, setRunError] = useState('')
  const abortRef = useRef(null)
  const initializedRef = useRef(false)
  const data = DATASETS[selectedFile] || null

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    checkHealth().then((h) => {
      setLive(Boolean(h.liveAvailable))
      setModelName(h.model || '')
      log('system', 'System', `Glass Box initialized · live LLM ${h.liveAvailable ? 'available' : 'unavailable → fallback'}`)
    })
  }, [])

  function log(kind, actor, msg) {
    setAudit((a) => [...a, { time: now(), kind, actor, msg }])
  }

  function setStage(key, status) {
    setStatuses((s) => ({ ...s, [key]: status }))
  }

  function intakeData() {
    if (!data) return
    setIntakeReady(true)
    setStage('intake', 'done')
    setActiveKey('insights')
    log('system', 'System', `Ingested ${selectedFile}: ${data.product.name} (${data.ratingSummary.count} reviews)`)
  }

  // ---- Live stage runners with silent fallback ----
  async function streamInto({ system, user, title, maxTokens }) {
    setReasoning('')
    setReasoningTitle(title)
    setRunning(true)
    const controller = new AbortController()
    abortRef.current = controller
    const { json } = await runStage({
      system,
      user,
      temperature: 0.2,
      maxTokens,
      onDelta: (t) => setReasoning((r) => r + t),
      signal: controller.signal
    })
    setRunning(false)
    return json
  }

  async function runPipeline() {
    setStarted(true)
    setRunError('')
    // Stage 2: insights
    setActiveKey('insights')
    setStage('insights', 'running')
    log('agent', 'Insight agent', 'Analysiere Rezensionen und Seiteninhalte…')
    let insightJson = null
    try {
      if (!live) throw new Error('no_live')
      const { system, user } = buildInsightPrompt(data)
      insightJson = await streamInto({ system, user, title: 'Stage 2 · Insight agent — reasoning', maxTokens: 9000 })
      if (!insightJson) throw new Error('parse_failed')
    } catch (e) {
      if (selectedFile !== 'macbook.json') {
        setRunning(false)
        setStage('insights', 'error')
        setActiveKey(null)
        setRunError(e.message)
        log('system', 'System', `Live insight run failed: ${e.message}`)
        return
      }
      insightJson = fallback.insights
      setUsedFallback(true)
      setRunning(false)
      log('system', 'System', 'Live insight run unavailable — using cached fallback result.')
    }
    setInsights(insightJson)
    setStage('insights', 'done')

    // Stage 3: hypotheses
    setActiveKey('hypotheses')
    setStage('hypotheses', 'running')
    log('agent', 'Hypothesis agent', 'Generiere evidenzbasierte A/B-Test-Hypothesen…')
    let hypJson = null
    try {
      if (!live) throw new Error('no_live')
      const { system, user } = buildHypothesisPrompt(data, insightJson)
      hypJson = await streamInto({ system, user, title: 'Stage 3 · Hypothesis agent — reasoning', maxTokens: 9000 })
      if (!hypJson?.hypotheses?.length) throw new Error('parse_failed')
    } catch (e) {
      if (selectedFile !== 'macbook.json') {
        setRunning(false)
        setStage('hypotheses', 'error')
        setActiveKey(null)
        setRunError(e.message)
        log('system', 'System', `Live hypothesis run failed: ${e.message}`)
        return
      }
      hypJson = fallback.hypotheses
      setUsedFallback(true)
      setRunning(false)
      log('system', 'System', 'Live hypothesis run unavailable — using cached fallback result.')
    }
    const list = hypJson.hypotheses || []
    setHypotheses(list)
    setStage('hypotheses', 'done')
    log('agent', 'Hypothesis agent', `${list.length} Hypothesen erzeugt, nach Priorität sortiert.`)
    setActiveKey(null)
  }

  function decide(id, decision) {
    setDecisions((d) => ({ ...d, [id]: decision }))
    log('human', 'Growth team', `${decision === 'approved' ? 'Approved' : 'Rejected'} ${id}`)
  }

  async function designTest(hyp) {
    setActiveKey('design')
    setStage('design', 'running')
    setDesigning((d) => ({ ...d, [hyp.id]: true }))
    log('agent', 'Test-design agent', `Entwerfe Test-Design für ${hyp.id}…`)
    let designJson = null
    try {
      if (!live) throw new Error('no_live')
      const { system, user } = buildTestDesignPrompt(data, hyp)
      designJson = await streamInto({ system, user, title: `Stage 4 · Test-design agent — ${hyp.id}`, maxTokens: 5000 })
      if (!designJson) throw new Error('parse_failed')
    } catch (e) {
      if (selectedFile !== 'macbook.json') {
        setRunning(false)
        setDesigning((d) => ({ ...d, [hyp.id]: false }))
        setStage('design', 'error')
        setActiveKey(null)
        log('system', 'System', `Live test-design failed for ${hyp.id}: ${e.message}`)
        return
      }
      designJson = (fallback.designs && fallback.designs[hyp.id]) || fallback.designs?.default
      setUsedFallback(true)
      setRunning(false)
      log('system', 'System', `Live test-design unavailable for ${hyp.id} — using cached fallback.`)
    }
    const normalizedDesign = normalizeTestDesign(designJson, hyp.id)
    setDesigns((d) => ({ ...d, [hyp.id]: normalizedDesign }))
    setDesigning((d) => ({ ...d, [hyp.id]: false }))
    setStage('design', 'done')
    setActiveKey(null)
    log('agent', 'Test-design agent', `Design für ${hyp.id} bereit.`)
  }

  function pushToDy(hyp) {
    const design = designs[hyp.id]
    const payload = buildDyPayload(data, hyp, design)
    setPushPayload(payload)
    setStage('push', 'done')
    log('push', 'DY push (sim)', `Simulated payload rendered for ${hyp.id}.`)
  }

  const sortedHyps = useMemo(
    () => [...hypotheses].sort((a, b) => (b.priority?.score ?? 0) - (a.priority?.score ?? 0)),
    [hypotheses]
  )

  return (
    <div className="min-h-full bg-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 shadow-lg shadow-slate-900/10">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
              <Sparkles className="h-5 w-5 text-sky-300" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white sm:text-lg">
                Hypothesis Engine <span className="text-sky-400">/</span> Glass Box
              </h1>
              <p className="text-xs text-slate-400">OMMAX × Cyberport · AI growth operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-semibold ${live ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-slate-600 bg-slate-800 text-slate-300'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              {live === null ? 'checking…' : live ? `Live · ${modelName}` : 'Fallback mode'}
            </span>
            {usedFallback && (
              <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2.5 py-1.5 font-semibold text-amber-200">Cached result</span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-blue-700">
              <Activity className="h-4 w-4" aria-hidden="true" /> Operational workspace
            </div>
            <h2 className="text-2xl font-bold text-slate-950">Evidence-to-experiment workflow</h2>
            <p className="mt-1 text-sm text-slate-600">Review agent reasoning, evidence and human decisions in one workspace.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Human approval required
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8"><ScopePanel /></div>
          <div className="xl:col-span-4"><AutonomyDial /></div>
        </div>

        <div className="mt-5">
          <PipelineStrip statuses={statuses} activeKey={activeKey} />
        </div>

        {!intakeReady && (
          <div className="mt-5 overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-r from-white to-blue-50 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white shadow-md shadow-blue-900/20">
                  <DatabaseZap className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950">Stage 1 · Intake the source data</p>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">Choose the JSON evidence file the agents should analyze. No dataset is selected automatically.</p>
                  <label className="mt-3 block max-w-xl">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Dataset file</span>
                    <span className="relative block">
                      <FileJson2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <select
                        value={selectedFile}
                        onChange={(event) => setSelectedFile(event.target.value)}
                        className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white pl-9 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        aria-label="Dataset file"
                      >
                        <option value="">Select a JSON file...</option>
                        {DATASET_OPTIONS.map((option) => (
                          <option key={option.file} value={option.file}>{option.file} — {option.label}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">▼</span>
                    </span>
                  </label>
                </div>
              </div>
              <button
                onClick={intakeData}
                disabled={!selectedFile}
                className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <DatabaseZap className="h-4 w-4" aria-hidden="true" /> Intake data
              </button>
            </div>
          </div>
        )}

        {intakeReady && !started && (
          <div className="surface mt-5 flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">The cached product intake is ready</p>
              <p className="mt-0.5 text-xs text-slate-500">Run the live insight and hypothesis stages with visible reasoning.</p>
            </div>
            <button
              onClick={runPipeline}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-700 to-blue-900 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition hover:from-blue-600 hover:to-blue-800"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" /> Run engine
            </button>
          </div>
        )}

        {intakeReady && runError && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-rose-900">Agent output could not be completed</p>
                <p className="mt-0.5 text-xs text-rose-700">{runError}</p>
              </div>
            </div>
            <button
              onClick={runPipeline}
              className="inline-flex items-center gap-2 rounded-md bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Retry agents
            </button>
          </div>
        )}

        <section className="mt-5">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-950">Agent activity</h2>
            <p className="text-xs text-slate-500">Live model output and system events</p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="h-[440px] sm:h-[520px] xl:col-span-8">
              <ReasoningStream title={reasoningTitle} text={reasoning} running={running} />
            </div>
            <div className="h-[360px] sm:h-[420px] xl:h-[520px] xl:col-span-4">
              <AuditLog entries={audit} />
            </div>
          </div>
        </section>

        {intakeReady && <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-4">
            <ProductPanel data={data} />
            {insights && <InsightsPanel insights={insights} />}
          </div>

          <div className="surface overflow-hidden xl:col-span-8">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Hypothesis review queue</h2>
                <p className="mt-0.5 text-xs text-slate-500">Prioritized proposals awaiting human review</p>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{sortedHyps.length} items</span>
            </div>
            <div className="stream-scroll max-h-[780px] space-y-3 overflow-y-auto bg-slate-50 p-3 sm:p-4">
              {sortedHyps.length ? sortedHyps.map((h) => (
                <HypothesisCard
                  key={h.id}
                  hyp={h}
                  status={decisions[h.id] || 'pending'}
                  design={designs[h.id]}
                  designing={designing[h.id]}
                  onApprove={() => decide(h.id, 'approved')}
                  onReject={() => decide(h.id, 'rejected')}
                  onDesign={() => designTest(h)}
                  onPush={() => pushToDy(h)}
                />
              )) : (
                <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                  <div>
                    <Sparkles className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
                    <p className="mt-2 text-sm font-semibold text-slate-700">No hypotheses generated yet</p>
                    <p className="mt-1 text-xs text-slate-500">Run the engine to populate the review queue.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>}
      </main>

      <DyPushModal payload={pushPayload} onClose={() => setPushPayload(null)} />
    </div>
  )
}
