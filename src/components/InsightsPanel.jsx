import React, { useState } from 'react'

// Stage 2 result — extracted insights with evidence. Compact, scannable.
export default function InsightsPanel({ insights }) {
  const [tab, setTab] = useState('themes')
  const tabs = [
    { key: 'themes', label: 'Themes', data: insights.themes },
    { key: 'objections', label: 'Objections', data: insights.objections },
    { key: 'unansweredQuestions', label: 'Open Qs', data: insights.unansweredQuestions },
    { key: 'intentSignals', label: 'Intent', data: insights.intentSignals },
    { key: 'hiddenStrengths', label: 'Hidden', data: insights.hiddenStrengths }
  ].filter((t) => Array.isArray(t.data) && t.data.length)

  const active = tabs.find((t) => t.key === tab) || tabs[0]

  return (
    <div className="surface p-4 sm:p-5">
      <h3 className="panel-heading mb-3">
        Stage 2 · Extracted insights
      </h3>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
                'rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition ' +
              (active.key === t.key ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')
            }
          >
            {t.label} {t.data.length}
          </button>
        ))}
      </div>
      <div className="stream-scroll max-h-[560px] space-y-2 overflow-y-auto pr-1">
        {(active?.data || []).map((item, i) => (
          <div key={i} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-slate-800">
              {item.label || item.question || item.segment || item.strength}
            </p>
            {item.summary && <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.summary}</p>}
            {item.signal && <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.signal}</p>}
            {item.whyHidden && <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.whyHidden}</p>}
            {Array.isArray(item.evidence) && item.evidence[0]?.quote && (
              <p className="mt-2 border-l-2 border-blue-300 pl-2 text-[11px] italic leading-relaxed text-slate-500">
                &bdquo;{item.evidence[0].quote}&ldquo;
                {item.evidence[0].reviewId ? ` (${item.evidence[0].reviewId})` : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
