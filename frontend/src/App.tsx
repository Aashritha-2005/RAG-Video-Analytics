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
      className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
        isActive
          ? 'bg-blue-600 text-white'
          : disabled
            ? 'cursor-not-allowed bg-gray-900 text-gray-600'
            : 'bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

function App() {
  const { activeTab, sessionId, videoA, videoB } = useAppStore()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between gap-4 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-tight">VideoIQ</span>
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold">RAG</span>
        </div>
        <nav className="flex gap-2">
          <TabButton tab="setup" label="Setup" />
          <TabButton tab="compare" label="Compare" disabled={!sessionId} />
          <TabButton tab="chat" label="Chat" disabled={!sessionId} />
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {activeTab === 'setup' && <VideoInputForm />}
        {activeTab === 'compare' && videoA && videoB && <VideoComparison />}
        {activeTab === 'chat' && <ChatPanel />}
      </main>
    </div>
  )
}

export default App
