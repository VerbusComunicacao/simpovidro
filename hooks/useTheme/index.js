import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"
import defaultColors from "@/lib/colors"

const ThemeContext = createContext({
  colors: defaultColors,
  isLoading: true,
  saveTheme: async () => {},
  resetTheme: async () => {},
})

export function ThemeProvider({ children }) {
  const [colors, setColors] = useState(defaultColors)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTheme = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/theme")
      if (response.ok) {
        const data = await response.json()
        if (data.colors) {
          setColors(data.colors)
        }
      }
    } catch (error) {
      console.error("Failed to fetch theme:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTheme()
  }, [fetchTheme])

  const saveTheme = async (newColors) => {
    try {
      const response = await fetch("/api/v1/theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ colors: newColors }),
      })
      if (response.ok) {
        const data = await response.json()
        setColors(data.colors)
        return true
      }
    } catch (error) {
      console.error("Failed to save theme:", error)
    }
    return false
  }

  const resetTheme = async () => {
    try {
      const response = await fetch("/api/v1/theme", {
        method: "DELETE",
      })
      if (response.status === 204) {
        setColors(defaultColors)
        return true
      }
    } catch (error) {
      console.error("Failed to reset theme:", error)
    }
    return false
  }

  return (
    <ThemeContext.Provider value={{ colors, isLoading, saveTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default function useTheme() {
  return useContext(ThemeContext)
}
