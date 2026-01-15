import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import useUser from "../../../hooks/useUser"
import TableLayout from "../../../components/layout/TableLayout"
import availableFeatures from "../../../models/user-features"
import { Spinner } from "../../../components/ui/spinner"
import { Button } from "../../../components/ui/button"
import { Label } from "../../../components/ui/label"
import { Input } from "../../../components/ui/input" // Import Input component

export default function FeaturesSettings() {
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()
  const [searchUsername, setSearchUsername] = useState("")
  const [selectedUser, setSelectedUser] = useState(null) // Store the full user object
  const [features, setFeatures] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (selectedUser) {
      // When a user is selected (after search), fetch their features
      fetch(`/api/v1/users/${selectedUser.username}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.features) {
            setFeatures(data.features)
          } else {
            setFeatures([])
          }
        })
        .catch((err) => {
          console.error("Error fetching user features:", err)
          setError("Erro ao carregar funcionalidades do usuário.")
          setFeatures([])
        })
    } else {
      setFeatures([])
    }
  }, [selectedUser])

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="large" />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  if (!user.features.includes("update:user")) {
    return (
      <TableLayout>
        <div className="container mx-auto px-4 py-8">
          <p>Você não tem permissão para ver esta página.</p>
        </div>
      </TableLayout>
    )
  }

  const handleSearch = async () => {
    setError("")
    setMessage("")
    setSelectedUser(null)
    setFeatures([])

    if (!searchUsername) {
      setError("Por favor, digite um nome de usuário para buscar.")
      return
    }

    try {
      const response = await fetch(`/api/v1/users/${searchUsername}`)
      if (response.ok) {
        const userData = await response.json()
        setSelectedUser(userData)
      } else if (response.status === 404) {
        setError(`Usuário "${searchUsername}" não encontrado.`)
      } else {
        const errorData = await response.json()
        setError(errorData.error?.message || "Erro ao buscar usuário.")
      }
    } catch (err) {
      console.error("Error during user search:", err)
      setError("Erro de conexão ao buscar usuário.")
    }
  }

  const handleFeatureChange = (feature) => {
    setFeatures((prevFeatures) =>
      prevFeatures.includes(feature)
        ? prevFeatures.filter((f) => f !== feature)
        : [...prevFeatures, feature],
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage("")
    setError("")

    if (!selectedUser) {
      setError("Nenhum usuário selecionado para salvar.")
      setSaving(false)
      return
    }

    const response = await fetch(
      `/api/v1/users/${selectedUser.username}/features`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features }),
      },
    )

    if (response.ok) {
      setMessage("Funcionalidades salvas com sucesso!")
      // Re-fetch user data to ensure features are updated in the UI
      handleSearch()
      setTimeout(() => setMessage(""), 3000)
    } else {
      const errorData = await response.json()
      setError(errorData.error?.message || "Erro ao salvar funcionalidades.")
    }

    setSaving(false)
  }

  return (
    <TableLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">
          Gerenciar Funcionalidades de Usuário
        </h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {message && <p className="text-green-500 mb-4">{message}</p>}

        <div className="mb-6 max-w-sm flex gap-2">
          <div className="flex-grow">
            <Label htmlFor="username-search" className="mb-2 block">
              Buscar usuário por username
            </Label>
            <Input
              id="username-search"
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Digite o username"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
            />
          </div>
          <Button onClick={handleSearch} className="self-end">
            Buscar
          </Button>
        </div>

        {selectedUser && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Funcionalidades para {selectedUser.username}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...availableFeatures].sort().map((feature) => (
                <div key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    id={feature}
                    checked={features.includes(feature)}
                    onChange={() => handleFeatureChange(feature)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <Label htmlFor={feature} className="ml-2">
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
            <Button onClick={handleSave} disabled={saving} className="mt-6">
              {saving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        )}
      </div>
    </TableLayout>
  )
}
