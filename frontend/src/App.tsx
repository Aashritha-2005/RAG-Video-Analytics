import { VideoInputForm } from './components/VideoInputForm'
import { VideoComparison } from './components/VideoComparison'
import { ChatPanel } from './components/ChatPanel'
import { useAppStore } from './store'

type Tab = 'setup' | 'compare' | 'chat'

interface TabButtonProps {
  tab: Tab
  label: string
  disabled?: boolean
}

function TabButton({ tab, label, disabled = false }: TabButtonProps) {
  const { activeTab, setActiveTab } = useAppStore()
  const isActive = activeTab === tab

  return (
    <button
      onClick={() => !disabled && setActiveTab(tab)}
      disabled={disabled}
      className={`border-b-2 px-1 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
        isActive
          ? 'border-[#8B3A1A] text-[#1C1208]'
          : disabled
            ? 'cursor-not-allowed border-transparent text-[#B6A994]'
            : 'border-transparent text-[#1C1208] hover:border-[#D4C9B0] hover:text-[#8B3A1A]'
      }`}
    >
      {label}
    </button>
  )
}

function App() {
  const { activeTab, sessionId, videoA, videoB } = useAppStore()

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C1208]">
      <header className="flex items-center justify-between gap-4 border-b border-[#D4C9B0] bg-white px-10 py-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold tracking-widest text-[#1C1208]">VIDEOIQ</span>
            <span className="border border-[#8B3A1A] px-2 py-0.5 text-xs font-bold tracking-widest text-[#8B3A1A]">RAG</span>
          </div>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#8B3A1A]">
            MATCH THE VIDEO. PROVE THE PERFORMANCE.
          </p>
        </div>
        <nav className="flex gap-6">
          <TabButton tab="setup" label="Setup" />
          <TabButton tab="compare" label="Compare" disabled={!sessionId} />
          <TabButton tab="chat" label="Chat" disabled={!sessionId} />
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-12">
        {activeTab === 'setup' && <VideoInputForm />}
        {activeTab === 'compare' && videoA && videoB && <VideoComparison />}
        {activeTab === 'chat' && <ChatPanel />}
      </main>
    </div>
  )
}

export default App
