export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar")
    return
  }

  // Get all unique keys from the data
  const keys = Array.from(
    new Set(data.flatMap((item) => Object.keys(item))),
  ).filter((key) => typeof data[0][key] !== "object" || data[0][key] === null)

  // Create CSV header
  const header = keys.join(",")

  // Create CSV rows
  const rows = data.map((item) => {
    return keys
      .map((key) => {
        const value = item[key]
        if (value === null || value === undefined) return ""
        // Escape quotes and wrap in quotes if contains comma or newline
        const stringValue = String(value).replace(/"/g, '""')
        if (stringValue.includes(",") || stringValue.includes("\n")) {
          return `"${stringValue}"`
        }
        return stringValue
      })
      .join(",")
  })

  // Combine header and rows
  const csv = [header, ...rows].join("\n")

  // Create blob and download
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToExcel(data, filename) {
  // For now, use the same CSV export with .xlsx extension
  // In production, you'd want to use a library like xlsx
  if (!data || data.length === 0) {
    alert("Não há dados para exportar")
    return
  }

  // Simple Excel-compatible CSV export
  exportToCSV(data, filename)
}

export function flattenDataForExport(data) {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((item) => {
    const flattened = {}

    Object.entries(item).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        flattened[key] = ""
      } else if (Array.isArray(value)) {
        flattened[key] = value.length
      } else if (typeof value === "object") {
        // Skip complex objects for CSV export
        flattened[key] = JSON.stringify(value)
      } else if (value === true) {
        flattened[key] = "Sim"
      } else if (value === false) {
        flattened[key] = "Não"
      } else {
        flattened[key] = value
      }
    })

    return flattened
  })
}
