import React from 'react'

// Non-negotiable scope panel — the client must not think the demo is the end state.
export default function ScopePanel() {
  const isList = [
    'Outside-in, public data only',
    'One single product (depth over breadth)',
    'Human-in-the-loop: every hypothesis is approved or rejected'
  ]
  const isNotList = [
    'No Dynamic Yield integration — the push is simulated',
    'No live crawling — inputs are cached',
    'No learning loop yet'
  ]
  return (
    <div className="surface h-full p-4 sm:p-5">
      <h3 className="panel-heading mb-3">
        What this is / what this is not
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase text-emerald-700">What this is</div>
          <ul className="space-y-1">
            {isList.map((t) => (
              <li key={t} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                <span className="font-bold text-emerald-600">✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase text-rose-700">What this is not</div>
          <ul className="space-y-1">
            {isNotList.map((t) => (
              <li key={t} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                <span className="font-bold text-rose-600">×</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
        <span className="font-semibold text-blue-900">Roadmap:</span> Phase 2 runs this engine on Cyberport&rsquo;s
        real data exports; Phase 3 deploys via the DY API.
      </p>
    </div>
  )
}
