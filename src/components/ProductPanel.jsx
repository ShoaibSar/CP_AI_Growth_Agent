import React from 'react'

// Stage 1 — cached product intake, shown as evidence of the "data intake" step.
export default function ProductPanel({ data }) {
  const p = data.product
  const price = data.price
  const rs = data.ratingSummary
  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="panel-heading">Stage 1 · Data intake</h3>
        <span className="rounded-md bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase text-sky-700">
          {rs.count} reviews
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-snug text-slate-900">{p.name}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span><span className="font-bold text-slate-900">{price.current.toFixed(2)} €</span> (UVP {price.listUvp.toFixed(2)} €)</span>
        <span className="text-amber-600">★ <span className="font-bold text-slate-900">{rs.average}</span> / 5</span>
        <span>{data.meta.source}</span>
      </div>
      {data.competitor && (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Competitor:</span> {data.competitor.retailer} — {data.competitor.price.toFixed(2)} €
        </div>
      )}
    </div>
  )
}
