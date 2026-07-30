import { useState } from 'react'
import EmployeeView from './components/EmployeeView'
import ManagerView from './components/ManagerView'
import InstallPrompt from './components/InstallPrompt'

const TABS = [
  { id: 'employee', label: 'Employé' },
  { id: 'manager', label: 'Manager' },
]

function App() {
  const [tab, setTab] = useState('employee')

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col px-4 py-6">
      <header className="mb-6">
        <p className="text-xs tracking-widest text-ocre uppercase">SARL DPR AXXAM</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Pointage</h1>
      </header>

      <nav className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-11 flex-1 rounded-lg border px-4 py-2 font-display transition-colors ${
              tab === t.id
                ? 'border-terracotta bg-terracotta text-ink'
                : 'border-border bg-bg-soft text-ink-muted hover:border-terracotta/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="rounded-xl border border-border bg-bg-card p-4">
        {tab === 'employee' ? <EmployeeView /> : <ManagerView />}
      </main>

      <InstallPrompt />
    </div>
  )
}

export default App
