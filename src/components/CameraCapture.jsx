import { useEffect, useRef, useState } from 'react'

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(null)

  useEffect(() => {
    let active = true

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        if (active) setError("Impossible d'accéder à la caméra : autorisez l'accès pour pointer")
      }
    }

    startCamera()

    return () => {
      active = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function capture() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        setPhoto({ blob, url: URL.createObjectURL(blob) })
      },
      'image/jpeg',
      0.85
    )
  }

  function retake() {
    if (photo) URL.revokeObjectURL(photo.url)
    setPhoto(null)
  }

  function confirm() {
    if (photo) onCapture(photo.blob)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg p-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Photo de pointage</h2>

        {error && (
          <p className="mb-3 rounded-lg border border-terracotta bg-bg-soft p-3 text-sm text-terracotta">
            {error}
          </p>
        )}

        <div className="relative mb-4 flex-1 overflow-hidden rounded-xl border border-border bg-bg-soft">
          {!photo ? (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          ) : (
            <img src={photo.url} alt="Photo capturée" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-14 flex-1 rounded-lg border border-border px-4 py-3 font-display text-ink-muted"
          >
            Annuler
          </button>
          {!photo ? (
            <button
              type="button"
              onClick={capture}
              disabled={!!error}
              className="min-h-14 flex-[2] rounded-lg bg-terracotta px-4 py-3 font-display text-lg font-semibold text-ink hover:bg-terracotta-hover disabled:opacity-50"
            >
              Prendre la photo
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={retake}
                className="min-h-14 flex-1 rounded-lg border border-ocre px-4 py-3 font-display text-ocre"
              >
                Reprendre
              </button>
              <button
                type="button"
                onClick={confirm}
                className="min-h-14 flex-[2] rounded-lg bg-terracotta px-4 py-3 font-display text-lg font-semibold text-ink hover:bg-terracotta-hover"
              >
                Valider
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
