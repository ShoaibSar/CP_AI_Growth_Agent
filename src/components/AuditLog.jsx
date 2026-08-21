import React from 'react'

// Audit log — every action/decision, human-in-the-loop made visible.
export default function AuditLog({ entries }) {
  return (
    <div className="surface flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="panel-heading">Audit log</h3>
        <p className="mt-0.5 text-xs text-slate-400">Immutable run history</p>
      </div>
      <div className="stream-scroll flex-1 space-y-2 overflow-y-auto p-3">
        {entries.length === 0 && <p className="px-1 text-xs text-slate-400">No actions yet.</p>}
        {entries.map((e, i) => (
          <div key={i} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={`font-bold ${toneOf(e.kind)}`}>{e.actor}</span>
              <span className="shrink-0 font-mono text-[10px] text-slate-400">{e.time}</span>
            </div>
            <p className="leading-relaxed text-slate-600">{e.msg}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function toneOf(kind) {
  return {
    system: 'text-sky-700',
    agent: 'text-amber-700',
    human: 'text-emerald-700',
    push: 'text-rose-700'
  }[kind] || 'text-slate-700'
}
