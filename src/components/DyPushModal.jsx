import React from 'react'
import { X } from 'lucide-react'

// Modal showing the SIMULATED Dynamic Yield API payload.
export default function DyPushModal({ payload, onClose }) {
  if (!payload) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Dynamic Yield — Experience payload</h3>
            <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase text-amber-700">
              Simulated · no DY connection
            </span>
          </div>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Close modal"><X className="h-4 w-4" /></button>
        </div>
        <div className="stream-scroll max-h-[70vh] overflow-auto p-5">
          <pre className="whitespace-pre-wrap break-words rounded-md bg-slate-950 p-4 font-mono text-[12px] leading-relaxed text-emerald-300">
{JSON.stringify(payload, null, 2)}
          </pre>
        </div>
        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          This payload is rendered locally to illustrate the Phase 3 DY API call. Nothing is sent anywhere.
        </div>
      </div>
    </div>
  )
}
