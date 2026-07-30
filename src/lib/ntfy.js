const NTFY_TOPIC = import.meta.env.VITE_NTFY_TOPIC

export async function notifyNewPointage(pointage) {
  if (!NTFY_TOPIC) {
    console.warn('VITE_NTFY_TOPIC non défini')
    return
  }
  const time = new Date(pointage.time).toLocaleString('fr-FR')
  const lines = [
    `Employé : ${pointage.name}`,
    `Heure : ${time}`,
    `Position : https://www.google.com/maps?q=${pointage.lat},${pointage.lon}`,
  ]
  try {
    const resp = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      body: lines.join('\n'),
      headers: {
        'Title': 'Nouveau pointage',
        'Tags': 'clock3',
        'Priority': '3',
      },
    })
    if (!resp.ok) console.error('ntfy erreur:', resp.status, await resp.text())
  } catch (err) {
    console.error('ntfy erreur:', err)
  }
}
