import { useState } from 'react'
import CameraCapture from './CameraCapture'
import { getCurrentPosition } from '../lib/geolocation'
import { uploadPointagePhoto } from '../lib/storage'
import { supabase } from '../lib/supabase'
import { notifyNewPointage } from '../lib/ntfy'

const NAME_KEY = 'pointage-employee-name'

export default function EmployeeView() {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [position, setPosition] = useState(null)

  async function handlePointer() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Merci de saisir votre nom')
      return
    }
    setError('')
    localStorage.setItem(NAME_KEY, trimmed)

    setStatus('locating')
    try {
      const pos = await getCurrentPosition()
      setPosition(pos)
      setStatus('camera')
      setShowCamera(true)
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  async function handleCapture(blob) {
    setShowCamera(false)
    setStatus('uploading')
    try {
      const trimmed = name.trim()
      const time = new Date().toISOString()
      const photoUrl = await uploadPointagePhoto(blob, trimmed)

      const { error: insertError } = await supabase.from('pointages').insert({
        name: trimmed,
        time,
        lat: position.lat,
        lon: position.lon,
        photo_url: photoUrl,
      })
      if (insertError) throw insertError

      notifyNewPointage({ name: trimmed, time, lat: position.lat, lon: position.lon })

      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi du pointage')
      setStatus('idle')
    }
  }

  function handleCancelCamera() {
    setShowCamera(false)
    setStatus('idle')
  }

  const busy = status === 'locating' || status === 'uploading'

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="name" className="mb-2 block font-display text-sm text-ink-muted">
          Votre nom
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom Nom"
          disabled={busy}
          className="min-h-14 w-full rounded-lg border border-border bg-bg-soft px-4 text-lg text-ink placeholder:text-ink-muted focus:border-terracotta focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-terracotta bg-bg-soft p-3 text-sm text-terracotta">
          {error}
        </p>
      )}

      {status === 'success' && (
        <p className="rounded-lg border border-ocre bg-bg-soft p-3 text-sm text-ocre">
          Pointage enregistré ✓
        </p>
      )}

      <button
        type="button"
        onClick={handlePointer}
        disabled={busy}
        className="min-h-16 w-full rounded-xl bg-terracotta font-display text-xl font-semibold text-ink shadow-lg hover:bg-terracotta-hover disabled:opacity-60"
      >
        {status === 'locating' && 'Localisation...'}
        {status === 'uploading' && 'Envoi en cours...'}
        {(status === 'idle' || status === 'success') && 'Pointer'}
      </button>

      {showCamera && <CameraCapture onCapture={handleCapture} onCancel={handleCancelCamera} />}
    </div>
  )
}
