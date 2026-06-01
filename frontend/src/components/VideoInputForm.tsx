import { FormEvent } from 'react'
import { Loader2, PlayCircle } from 'lucide-react'
import { processVideos } from '../api'
import { useAppStore } from '../store'

export function VideoInputForm() {
  const {
    urlA,
    urlB,
    setUrlA,
    setUrlB,
    isProcessing,
    processingError,
    setIsProcessing,
    setProcessingError,
    setProcessingResult,
    setActiveTab
  } = useAppStore()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!urlA.trim() || !urlB.trim()) {
      setProcessingError('Both video URLs are required.')
      return
    }

    setIsProcessing(true)
    setProcessingError('')
    try {
      const result = await processVideos(urlA.trim(), urlB.trim())
      setProcessingResult(result.session_id, result.video_a, result.video_b)
      setActiveTab('compare')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process videos'
      setProcessingError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-2xl shadow-black/30">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">VideoIQ</h1>
            <p className="mt-2 text-base text-gray-400">RAG-Powered Creator Analytics</p>
          </div>
          <PlayCircle className="h-10 w-10 text-blue-400" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-300">Video A</span>
            <input
              value={urlA}
              onChange={(event) => setUrlA(event.target.value)}
              placeholder="YouTube URL (e.g. youtube.com/watch?v=...)"
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              disabled={isProcessing}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-300">Video B</span>
            <input
              value={urlB}
              onChange={(event) => setUrlB(event.target.value)}
              placeholder="Instagram Reel URL (e.g. instagram.com/reel/...)"
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              disabled={isProcessing}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-300"
        >
          {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
          {isProcessing ? 'Processing...' : 'Analyze Videos'}
        </button>

        {processingError && (
          <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {processingError}
          </p>
        )}
      </form>
    </section>
  )
}
