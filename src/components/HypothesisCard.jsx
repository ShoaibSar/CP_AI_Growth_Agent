import React, { useState } from 'react'
import { Check, ChevronDown, ChevronRight, FlaskConical, Send, X } from 'lucide-react'

function PriorityBadge({ score }) {
  const tone = score >= 75 ? 'border-rose-200 bg-rose-50 text-rose-700'
    : score >= 50 ? 'border-amber-200 bg-amber-50 text-amber-700'
    : 'border-slate-200 bg-slate-50 text-slate-600'
  return (
    <span className={`rounded-md border px-2 py-1 text-[11px] font-bold ${tone}`}>
      Priority {score}
    </span>
  )
}

function StatusPill({ status }) {
  if (status === 'approved') return <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Approved</span>
  if (status === 'rejected') return <span className="rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">Rejected</span>
  return <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Pending review</span>
}

// One hypothesis card: statement, expandable evidence (original German quotes),
// reasoning trace, priority, Approve/Reject, and the test design + simulated DY push.
export default function HypothesisCard({
  hyp, status, design, designing, onApprove, onReject, onDesign, onPush
}) {
  const [open, setOpen] = useState(false)
  const ev = hyp.evidence || []

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-white">{hyp.id}</span>
          <PriorityBadge score={hyp.priority?.score ?? 0} />
        </div>
        <StatusPill status={status} />
      </div>

      <p className="mt-3 text-[15px] font-semibold leading-6 text-slate-900">{hyp.statement}</p>

      {hyp.expectedEffect && (
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-900">Expected effect:</span>{' '}
          {hyp.expectedEffect.metric} {hyp.expectedEffect.direction === 'up' ? '↑' : hyp.expectedEffect.direction === 'down' ? '↓' : ''} — {hyp.expectedEffect.reasoning}
        </p>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 transition hover:text-blue-900"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />} Evidence ({ev.length}) &amp; reasoning
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {ev.map((e, i) => (
            <blockquote key={i} className="rounded-md border-l-2 border-blue-400 bg-blue-50/70 px-3 py-2.5">
              <div className="mb-1 text-[10px] font-semibold uppercase text-slate-400">
                {e.type || 'review'}{e.reviewId ? ` · ${e.reviewId}` : ''}
              </div>
              <p className="text-xs italic leading-relaxed text-slate-600">&bdquo;{e.quote}&ldquo;</p>
            </blockquote>
          ))}
          {hyp.priority?.rationale && (
            <p className="text-xs leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-900">Priority rationale:</span> {hyp.priority.rationale}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={onApprove}
          disabled={status === 'approved'}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </button>
        <button
          onClick={onReject}
          disabled={status === 'rejected'}
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" /> Reject
        </button>
        {status === 'approved' && !design && (
          <button
            onClick={onDesign}
            disabled={designing}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            <FlaskConical className="h-3.5 w-3.5" /> {designing ? 'Designing test…' : 'Design test'}
          </button>
        )}
      </div>

      {design && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-[11px] font-bold uppercase text-slate-500">
            Test design · Dynamic-Yield style
          </div>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
            <Row k="Experiment" v={design.experimentName} />
            <Row k="Segment" v={design.targetSegment} />
            <Row k="Control" v={design.variantControl} />
            <Row k="Treatment" v={design.variantTreatment} />
            <Row k="Primary metric" v={design.primaryMetric} />
            <Row k="Success" v={design.successCriterion} />
            <Row k="Duration" v={design.suggestedDurationDays ? `${design.suggestedDurationDays} Tage` : undefined} />
            <Row k="Sample" v={design.minSampleNote} />
          </dl>
          <button
            onClick={onPush}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
          >
            <Send className="h-3.5 w-3.5" /> Push to Dynamic Yield
          </button>
        </div>
      )}
    </article>
  )
}

function Row({ k, v }) {
  if (!v) return null
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] font-semibold uppercase text-slate-400">{k}</dt>
      <dd className="text-slate-700">{v}</dd>
    </div>
  )
}
