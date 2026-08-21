import React from 'react'

const STAGES = ['Advisory', 'Assisted', 'Autonomous']

// Autonomy dial — labels EXACTLY as specified. "Advisory" is the current mode.
export default function AutonomyDial() {
  const current = 'Advisory'
  return (
    <div className="surface h-full p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="panel-heading">Autonomy dial</h3>
        <span className="text-[10px] font-semibold uppercase text-slate-400">Human-led → AI-led</span>
      </div>
      <div className="flex items-center gap-2">
        {STAGES.map((s, i) => {
          const active = s === current
          return (
            <React.Fragment key={s}>
              <div className="flex-1 flex flex-col items-center">
                <div
                  className={
                    'w-full rounded-md px-2 py-2 text-center text-sm font-semibold transition ' +
                    (active
                      ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md shadow-blue-900/20'
                      : 'border border-slate-200 bg-slate-50 text-slate-500')
                  }
                >
                  {s}
                </div>
                {active && (
                  <span className="mt-1 text-[10px] font-bold uppercase text-blue-700">
                    Current mode
                  </span>
                )}
              </div>
              {i < STAGES.length - 1 && <div className="h-px w-3 bg-slate-300" />}
            </React.Fragment>
          )
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        AI freedom increases step by step, never beyond the guardrails Cyberport defines. In this demo the engine
        only <span className="font-semibold text-slate-900">proposes</span>; humans decide.
      </p>
    </div>
  )
}
