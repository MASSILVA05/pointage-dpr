import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { formatDateStr, formatTimeStr } from './dateFormat'

const COLUMNS = ['Nom', 'Date', 'Heure', 'Latitude', 'Longitude', 'Lien Google Maps']

export function downloadPointagesExcel(pointages, filename) {
  const rows = pointages.map((p) => {
    const d = new Date(p.time)
    return [
      p.name,
      formatDateStr(d),
      formatTimeStr(d),
      p.lat,
      p.lon,
      `https://www.google.com/maps?q=${p.lat},${p.lon}`,
    ]
  })

  const sheet = XLSX.utils.aoa_to_sheet([COLUMNS, ...rows])
  sheet['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 45 }]

  rows.forEach((row, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: 5 })
    if (sheet[cellRef]) {
      sheet[cellRef].l = { Target: row[5], Tooltip: 'Ouvrir dans Google Maps' }
    }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Pointages')

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, filename)
}
