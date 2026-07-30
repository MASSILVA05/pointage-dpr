import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const UNLOCK_KEY = 'pointage-manager-unlocked'
const MANAGER_PIN = import.meta.env.VITE_MANAGER_PIN

function formatTime(value) {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (pin === MANAGER_PIN) {
      sessionStorage.setItem(UNLOCK_KEY, '1')
      onUnlock()
    } else {
      setError('Code incorrect')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label htmlFor="pin" className="font-display text-sm text-ink-muted">
        Code manager
      </label>
      <input
        id="pin"
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="min-h-14 w-full rounded-lg border border-border bg-bg-soft px-4 text-center text-2xl tracking-widest text-ink focus:border-terracotta focus:outline-none"
      />
      {error && <p className="text-sm text-terracotta">{error}</p>}
      <button
        type="submit"
        className="min-h-14 w-full rounded-lg bg-terracotta font-display text-lg font-semibold text-ink hover:bg-terracotta-hover"
      >
        Déverrouiller
      </button>
    </form>
  )
}

function PointageList() {
  const [pointages, setPointages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('pointages')
        .select('*')
        .order('time', { ascending: false })
      if (!active) return
      if (fetchError) {
        setError(`Erreur de chargement : ${fetchError.message}`)
      } else {
        setPointages(data ?? [])
        setError('')
      }
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('pointages-manager')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pointages' }, (payload) => {
        setPointages((current) => [payload.new, ...current])
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) return <p className="text-ink-muted">Chargement...</p>
  if (error) return <p className="text-terracotta">{error}</p>
  if (pointages.length === 0) return <p className="text-ink-muted">Aucun pointage pour le moment</p>

  return (
    <ul className="flex flex-col gap-3">
      {pointages.map((p) => (
        <li
          key={p.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-bg-soft p-3"
        >
          <img
            src={p.photo_url}
            alt={p.name}
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display font-medium text-ink">{p.name}</p>
            <p className="text-sm text-ink-muted">{formatTime(p.time)}</p>
          </div>
          <a
            href={`https://www.google.com/maps?q=${p.lat},${p.lon}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-ocre px-3 py-2 text-sm whitespace-nowrap text-ocre"
          >
            Position
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function ManagerView() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === '1')

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />
  return <PointageList />
}
