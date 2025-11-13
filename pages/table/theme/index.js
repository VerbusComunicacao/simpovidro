import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import useUser from "../../hooks/useUser"
import useTheme from "../../hooks/useTheme"
import defaultColors from "../../lib/colors"

export default function ThemeSettings() {
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()
  const { colors, isLoading: themeLoading, saveTheme, resetTheme } = useTheme()
  const [localColors, setLocalColors] = useState(colors)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("primary")

  useEffect(() => {
    setLocalColors(colors)
  }, [colors])

  if (userLoading || themeLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleColorChange = (path, value) => {
    const newColors = { ...localColors }
    const keys = path.split(".")
    let current = newColors

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setLocalColors(newColors)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage("")
    const success = await saveTheme(localColors)
    if (success) {
      setMessage("Cores salvas com sucesso!")
      setTimeout(() => setMessage(""), 3000)
    } else {
      setMessage("Erro ao salvar cores. Tente novamente.")
    }
    setSaving(false)
  }

  const handleReset = async () => {
    if (confirm("Tem certeza que deseja restaurar as cores padrão?")) {
      const success = await resetTheme()
      if (success) {
        setLocalColors(defaultColors)
        setMessage("Cores restauradas para o padrão!")
        setTimeout(() => setMessage(""), 3000)
      }
    }
  }

  const renderColorPicker = (label, path, value) => {
    return (
      <div
        key={path}
        style={{
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <label
          style={{
            minWidth: "150px",
            fontSize: "0.9rem",
            fontWeight: "500",
          }}
        >
          {label}:
        </label>
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => handleColorChange(path, e.target.value)}
          style={{
            width: "60px",
            height: "40px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => handleColorChange(path, e.target.value)}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontFamily: "monospace",
          }}
          placeholder="#000000"
        />
      </div>
    )
  }

  const renderColorGroup = (groupName, colorGroup) => {
    if (!colorGroup || typeof colorGroup !== "object") return null

    return Object.keys(colorGroup).map((key) => {
      const value = colorGroup[key]
      const path = `${groupName}.${key}`

      if (typeof value === "object" && !Array.isArray(value)) {
        return (
          <div key={key} style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: colors.text?.primary || "#111827",
              }}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </h3>
            {renderColorGroup(path, value)}
          </div>
        )
      }

      if (typeof value === "string" && value.match(/^#[0-9A-Fa-f]{6}$/)) {
        return renderColorPicker(
          `${groupName.split(".").pop()}.${key}`,
          path,
          value,
        )
      }

      return null
    })
  }

  const tabs = [
    { id: "primary", label: "Primárias" },
    { id: "secondary", label: "Secundárias" },
    { id: "success", label: "Sucesso" },
    { id: "error", label: "Erro" },
    { id: "warning", label: "Aviso" },
    { id: "info", label: "Info" },
    { id: "gray", label: "Cinzas" },
    { id: "text", label: "Texto" },
    { id: "background", label: "Fundo" },
    { id: "border", label: "Bordas" },
  ]

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
        backgroundColor: colors.background?.primary || "#ffffff",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => router.push("/table")}
          style={{
            padding: "0.5rem 1rem",
            marginBottom: "1rem",
            border: `1px solid ${colors.border?.default || "#d1d5db"}`,
            backgroundColor: colors.background?.primary || "#ffffff",
            color: colors.text?.primary || "#111827",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          ← Voltar
        </button>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            marginBottom: "0.5rem",
            color: colors.text?.primary || "#111827",
          }}
        >
          Personalização de Cores
        </h1>
        <p
          style={{
            color: colors.text?.secondary || "#6b7280",
            fontSize: "0.95rem",
          }}
        >
          Personalize as cores do sistema conforme sua preferência
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            borderRadius: "8px",
            backgroundColor: message.includes("sucesso")
              ? colors.success?.[50] || "#f0fdf4"
              : colors.error?.[50] || "#fef2f2",
            color: message.includes("sucesso")
              ? colors.success?.[700] || "#15803d"
              : colors.error?.[700] || "#b91c1c",
            border: `1px solid ${
              message.includes("sucesso")
                ? colors.success?.[200] || "#dcfce7"
                : colors.error?.[200] || "#fee2e2"
            }`,
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          borderBottom: `2px solid ${colors.border?.default || "#d1d5db"}`,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              backgroundColor: "transparent",
              color:
                activeTab === tab.id
                  ? colors.primary?.[500] || "#0070f3"
                  : colors.text?.secondary || "#6b7280",
              borderBottom:
                activeTab === tab.id
                  ? `3px solid ${colors.primary?.[500] || "#0070f3"}`
                  : "3px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === tab.id ? "600" : "400",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          backgroundColor: colors.background?.primary || "#ffffff",
          padding: "2rem",
          borderRadius: "8px",
          border: `1px solid ${colors.border?.default || "#d1d5db"}`,
          marginBottom: "2rem",
        }}
      >
        {localColors[activeTab] &&
          renderColorGroup(activeTab, localColors[activeTab])}
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={handleReset}
          disabled={saving}
          style={{
            padding: "0.75rem 1.5rem",
            border: `1px solid ${colors.border?.default || "#d1d5db"}`,
            backgroundColor: colors.background?.primary || "#ffffff",
            color: colors.text?.primary || "#111827",
            borderRadius: "6px",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: "500",
            opacity: saving ? 0.5 : 1,
          }}
        >
          Restaurar Padrão
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "0.75rem 2rem",
            border: "none",
            backgroundColor: colors.primary?.[500] || "#0070f3",
            color: colors.text?.inverse || "#ffffff",
            borderRadius: "6px",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: "600",
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? "Salvando..." : "Salvar Cores"}
        </button>
      </div>
    </div>
  )
}

