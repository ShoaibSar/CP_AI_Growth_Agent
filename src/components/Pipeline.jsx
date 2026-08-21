import React, { useEffect, useRef } from 'react'
import { Check, ChevronRight, LoaderCircle } from 'lucide-react'

const STAGE_META = [
  { key: 'intake', n: 1, label: 'Data intake', sub: 'cached' },
  { key: 'insights', n: 2, label: 'Insight extraction', sub: 'live LLM' },
  { key: 'hypotheses', n: 3, label: 'Hypothesis agent', sub: 'live LLM' },
  { key: 'design', n: 4, label: 'Test design', sub: 'live LLM' },
  { key: 'push', n: 5, label: 'DY push', sub: 'simulated' }
]

function Dot({ status, number, active }) {
  if (status === 'done') return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm"><Check className="h-4 w-4" strokeWidth={3} /></span>
  if (status === 'running') return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100"><LoaderCircle className="h-5 w-5 animate-spin text-amber-700" /></span>
  if (status === 'error') return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">!</span>
  return <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${active ? 'bg-blue-700 text-white shadow-sm' : 'border border-slate-300 bg-white text-slate-500'}`}>{number}</span>
}

// Horizontal 5-stage pipeline strip.
export function PipelineStrip({ statuses, activeKey }) {
  return (
    <div className="surface flex items-stretch gap-1 overflow-x-auto bg-white p-2.5">
      {STAGE_META.map((s, i) => {
        const status = statuses[s.key] || 'idle'
        const active = activeKey === s.key
        return (
          <React.Fragment key={s.key}>
            <div
              className={
                'flex min-w-[160px] flex-1 flex-col rounded-md border px-3 py-3 transition ' +
                (active
                  ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm ring-1 ring-blue-100'
                  : status === 'done'
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-slate-200 bg-slate-50')
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">Stage {s.n}</span>
                <Dot status={status} number={s.n} active={active} />
              </div>
              <span className="mt-1 text-sm font-semibold text-slate-800">{s.label}</span>
              <span className="text-[10px] uppercase text-slate-400">{s.sub}</span>
            </div>
            {i < STAGE_META.length - 1 && (
              <div className="flex shrink-0 items-center px-0.5">
                <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// Live streaming reasoning panel ("thinking out loud").
export function ReasoningStream({ title, text, running }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [text])
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 shadow-xl shadow-slate-900/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <span className="text-xs font-bold uppercase text-slate-300">{title}</span>
        {running && (
          <span className="flex items-center gap-1.5 rounded-md bg-amber-400/10 px-2 py-1 text-[11px] font-semibold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Reasoning live
          </span>
        )}
      </div>
      <div
        ref={ref}
        className="stream-scroll reasoning-scroll flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-4 font-mono text-sm leading-7 text-slate-200 sm:px-6 sm:py-5 sm:text-[15px]"
      >
        {text || <span className="text-slate-500">Waiting for the agent to start...</span>}
        {running && <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-slate-300 animate-blink" />}
      </div>
    </div>
  )
}
