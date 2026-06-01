import { FormEvent, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { processVideos } from '../api'
import { useAppStore } from '../store'

export function VideoInputForm() {
  const [progressMsg, setProgressMsg] = useState('')
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

    setProcessingError('')
    setIsProcessing(true)
    setProgressMsg('Fetching video metadata and transcripts...')
    await new Promise((r) => setTimeout(r, 2000))
    setProgressMsg('Chunking and embedding transcripts into vector DB...')
    await new Promise((r) => setTimeout(r, 1000))
    setProgressMsg('Building RAG index...')
    try {
      const result = await processVideos(urlA.trim(), urlB.trim())
      setProcessingResult(result.session_id, result.video_a, result.video_b)
      setActiveTab('compare')
      setProgressMsg('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process videos'
      setProcessingError(message)
      setProgressMsg('')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <section>
      <form onSubmit={handleSubmit} className="animate-fade-in-up mx-auto max-w-2xl border border-[#D4C9B0] bg-white p-12 shadow-sm">
        <div className="mb-10">
          <h1 className="mb-2 text-4xl font-bold text-[#1C1208]">Analyze Your Videos</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-[#8B3A1A]">RAG-Powered Creator Analytics</p>
        </div>

        <div className="space-y-8">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#8B3A1A]">Video A</span>
            <input
              value={urlA}
              onChange={(event) => setUrlA(event.target.value)}
              placeholder="YouTube URL (e.g. youtube.com/watch?v=...)"
              className="w-full border-0 border-b-2 border-[#D4C9B0] bg-transparent py-4 text-lg text-[#1C1208] outline-none transition-colors placeholder:text-[#9B8E7E] focus:border-[#8B3A1A] focus:outline-none"
              disabled={isProcessing}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#8B3A1A]">Video B</span>
            <input
              value={urlB}
              onChange={(event) => setUrlB(event.target.value)}
              placeholder="Instagram Reel URL (e.g. instagram.com/reel/...)"
              className="w-full border-0 border-b-2 border-[#D4C9B0] bg-transparent py-4 text-lg text-[#1C1208] outline-none transition-colors placeholder:text-[#9B8E7E] focus:border-[#8B3A1A] focus:outline-none"
              disabled={isProcessing}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="mt-10 inline-flex w-full items-center justify-center gap-2 bg-[#1C1208] px-12 py-4 text-sm font-bold uppercase tracking-widest text-[#F5F0E8] transition-colors duration-300 hover:bg-[#8B3A1A] disabled:cursor-not-allowed disabled:bg-[#9B8E7E]"
        >
          {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
          {isProcessing ? 'Processing...' : 'Analyze Videos'}
        </button>

        {progressMsg && (
          <p className="mt-3 text-sm italic text-[#8B3A1A]">
            {progressMsg}
          </p>
        )}

        {processingError && (
          <p className="mt-3 text-sm text-[#8B3A1A]">
            {processingError}
          </p>
        )}
      </form>
    </section>
  )
}
