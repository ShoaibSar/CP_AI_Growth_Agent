import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[render error]', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <section className="w-full max-w-lg rounded-lg border border-rose-200 bg-white p-6 shadow-lg">
          <AlertTriangle className="h-7 w-7 text-rose-600" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-bold text-slate-950">The workspace hit a rendering error</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">Your source data is unchanged. Reload the workspace to restore the current workflow.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reload workspace
          </button>
        </section>
      </main>
    )
  }
}
