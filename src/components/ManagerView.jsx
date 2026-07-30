import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { downloadPointagesExcel } from '../lib/excel'
import { dateKey, formatDateTimeStr, monthKey } from '../lib/dateFormat'

const UNLOCK_KEY = 'pointage-manager-unlocked'
const MANAGER_PIN = import.meta.env.VITE_MANAGER_PIN

const SELECT_CLASS =
  'min-h-11 w-full rounded-lg border border-border bg-bg-card px-3 text-ink focus:border-terracotta focus:outline-none'

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

function Filters({
  names,
  employee,
  onEmployeeChange,
  periodMode,
  onPeriodModeChange,
  dayValue,
  onDayChange,
  monthValue,
  onMonthChange,
  startValue,
  onStartChange,
  endValue,
  onEndChange,
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-bg-soft p-3">
      <div>
        <label htmlFor="filter-employee" className="mb-1 block text-xs text-ink-muted">
          Employé
        </label>
        <select
          id="filter-employee"
          value={employee}
          onChange={(e) => onEmployeeChange(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="Tous">Tous</option>
          {names.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-period" className="mb-1 block text-xs text-ink-muted">
          Période
        </label>
        <select
          id="filter-period"
          value={periodMode}
          onChange={(e) => onPeriodModeChange(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="all">Toutes les dates</option>
          <option value="day">Jour précis</option>
          <option value="month">Mois précis</option>
          <option value="custom">Plage personnalisée</option>
        </select>
      </div>

      {periodMode === 'day' && (
        <input
          type="date"
          aria-label="Jour"
          value={dayValue}
          onChange={(e) => onDayChange(e.target.value)}
          className={SELECT_CLASS}
        />
      )}

      {periodMode === 'month' && (
        <input
          type="month"
          aria-label="Mois"
          value={monthValue}
          onChange={(e) => onMonthChange(e.target.value)}
          className={SELECT_CLASS}
        />
      )}

      {periodMode === 'custom' && (
        <div className="flex gap-2">
          <input
            type="date"
            aria-label="Date de début"
            value={startValue}
            onChange={(e) => onStartChange(e.target.value)}
            className={SELECT_CLASS}
          />
          <input
            type="date"
            aria-label="Date de fin"
            value={endValue}
            onChange={(e) => onEndChange(e.target.value)}
            className={SELECT_CLASS}
          />
        </div>
      )}
    </div>
  )
}

function buildFilename({ periodMode, dayValue, monthValue, startValue, endValue }) {
  if (periodMode === 'day' && dayValue) return `pointages_${dayValue}.xlsx`
  if (periodMode === 'month' && monthValue) return `pointages_${monthValue}.xlsx`
  if (periodMode === 'custom' && startValue && endValue) {
    return `pointages_${startValue}_${endValue}.xlsx`
  }
  if (periodMode === 'custom' && (startValue || endValue)) {
    return `pointages_${startValue || endValue}.xlsx`
  }
  return 'pointages_tous.xlsx'
}

function PointageList() {
  const [pointages, setPointages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [employee, setEmployee] = useState('Tous')
  const [periodMode, setPeriodMode] = useState('all')
  const [dayValue, setDayValue] = useState('')
  const [monthValue, setMonthValue] = useState('')
  const [startValue, setStartValue] = useState('')
  const [endValue, setEndValue] = useState('')

  const [exportProgress, setExportProgress] = useState(null)

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

  const names = useMemo(
    () => Array.from(new Set(pointages.map((p) => p.name))).sort((a, b) => a.localeCompare(b, 'fr')),
    [pointages]
  )

  const filtered = useMemo(() => {
    return pointages.filter((p) => {
      if (employee !== 'Tous' && p.name !== employee) return false

      const d = new Date(p.time)
      if (periodMode === 'day') {
        if (dayValue && dateKey(d) !== dayValue) return false
      } else if (periodMode === 'month') {
        if (monthValue && monthKey(d) !== monthValue) return false
      } else if (periodMode === 'custom') {
        const key = dateKey(d)
        if (startValue && key < startValue) return false
        if (endValue && key > endValue) return false
      }
      return true
    })
  }, [pointages, employee, periodMode, dayValue, monthValue, startValue, endValue])

  async function handleExport() {
    const filename = buildFilename({ periodMode, dayValue, monthValue, startValue, endValue })
    setExportProgress({ done: 0, total: filtered.length })
    try {
      await downloadPointagesExcel(filtered, filename, {
        onProgress: (done, total) => setExportProgress({ done, total }),
      })
    } finally {
      setExportProgress(null)
    }
  }

  if (loading) return <p className="text-ink-muted">Chargement...</p>
  if (error) return <p className="text-terracotta">{error}</p>

  return (
    <div>
      <Filters
        names={names}
        employee={employee}
        onEmployeeChange={setEmployee}
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayChange={setDayValue}
        monthValue={monthValue}
        onMonthChange={setMonthValue}
        startValue={startValue}
        onStartChange={setStartValue}
        endValue={endValue}
        onEndChange={setEndValue}
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {exportProgress
            ? `Export en cours… ${exportProgress.done}/${exportProgress.total} photo${exportProgress.total > 1 ? 's' : ''}`
            : `${filtered.length} pointage${filtered.length > 1 ? 's' : ''}`}
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={filtered.length === 0 || !!exportProgress}
          className="min-h-11 rounded-lg border border-ocre px-4 py-2 font-display text-sm text-ocre disabled:opacity-40"
        >
          {exportProgress ? 'Export…' : 'Exporter (.xlsx)'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-muted">Aucun pointage pour ces filtres</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((p) => (
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
                <p className="text-sm text-ink-muted">{formatDateTimeStr(new Date(p.time))}</p>
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
      )}
    </div>
  )
}

export default function ManagerView() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === '1')

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />
  return <PointageList />
}
