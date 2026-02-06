import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import useUser from "../../../hooks/useUser"
import TableLayout from "../../../components/layout/TableLayout"
import { Spinner } from "../../../components/ui/spinner"
import { Button } from "../../../components/ui/button"
import { Label } from "../../../components/ui/label"
import { Input } from "../../../components/ui/input" // Import Input component

const featureTranslations = {
  "create:user": "Criar usuários",
  "read:user": "Visualizar usuários",
  "read:user:self": "Visualizar próprio perfil",
  "read:user:others": "Visualizar outros usuários",
  "update:user": "Atualizar usuários",
  "update:user:others": "Atualizar outros usuários",
  "read:migration": "Visualizar migrações",
  "create:migration": "Criar migrações",
  "read:activation_token": "Visualizar tokens de ativação",
  "read:recovery_token": "Visualizar tokens de recuperação",
  "read:email_confirmation_token": "Visualizar tokens de confirmação de e-mail",
  "create:session": "Criar sessões (Login)",
  "read:session": "Visualizar sessões",
  "read:content": "Acessar conteúdo administrativo",
  "update:content": "Atualizar conteúdo",
  "create:content": "Criar conteúdo",
  "delete:content": "Remover conteúdo",
  "read:public-content": "Visualizar conteúdo público",
  "read:company": "Visualizar empresas",
  "read:company:others": "Visualizar outras empresas",
  "update:company": "Atualizar empresas",
  "update:company:others": "Atualizar outras empresas",
  "create:company": "Criar empresas",
  "delete:company": "Remover empresas",
  "read:guest": "Visualizar hóspedes",
  "read:guest:others": "Visualizar outros hóspedes",
  "update:guest": "Atualizar hóspedes",
  "update:guest:others": "Atualizar outros hóspedes",
  "create:guest": "Criar hóspedes",
  "delete:guest": "Remover hóspedes",
  "read:sale": "Visualizar inscrições",
  "read:sale:others": "Visualizar outras inscrições",
  nuked: "BANIDO (Sem acesso)",
  "read:ad:list": "Visualizar lista de anúncios",
}

const featureGroups = [
  {
    name: "Usuários",
    features: [
      "create:user",
      "read:user",
      "read:user:self",
      "read:user:others",
      "update:user",
      "update:user:others",
    ],
  },
  {
    name: "Sessão e Segurança",
    features: [
      "create:session",
      "read:session",
      "read:activation_token",
      "read:recovery_token",
      "read:email_confirmation_token",
    ],
  },
  {
    name: "Conteúdo Administrativo",
    features: [
      "read:content",
      "update:content",
      "create:content",
      "delete:content",
      "read:public-content",
    ],
  },
  {
    name: "Empresas",
    features: [
      "read:company",
      "read:company:others",
      "update:company",
      "update:company:others",
      "create:company",
      "delete:company",
    ],
  },
  {
    name: "Hóspedes",
    features: [
      "read:guest",
      "read:guest:others",
      "update:guest",
      "update:guest:others",
      "create:guest",
      "delete:guest",
    ],
  },
  {
    name: "Vendas e Inscrições",
    features: ["read:sale", "read:sale:others"],
  },
  {
    name: "Sistema e Outros",
    features: ["read:migration", "create:migration", "read:ad:list", "nuked"],
  },
]

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
      fetch(`/api/v1/users/${selectedUser.id}`)
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

  if (!user.features.includes("update:user:others")) {
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
      setError("Por favor, digite um e-mail de usuário para buscar.")
      return
    }

    try {
      const response = await fetch(
        `/api/v1/users?email=${encodeURIComponent(searchUsername)}`,
      )
      if (response.ok) {
        const userData = await response.json()
        setSelectedUser(userData)
      } else if (response.status === 404) {
        setError(`Usuário com o e-mail "${searchUsername}" não encontrado.`)
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

    const response = await fetch(`/api/v1/users/${selectedUser.id}/features`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ features }),
    })

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
            <Label htmlFor="email-search" className="mb-2 block">
              Buscar usuário por e-mail
            </Label>
            <Input
              id="email-search"
              type="email"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Digite o e-mail"
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
            <h2 className="text-2xl font-bold mb-6">
              Funcionalidades para {selectedUser.full_name}
            </h2>

            <div className="space-y-8">
              {featureGroups.map((group) => (
                <div key={group.name} className="border-b pb-6 last:border-0">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    {group.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="checkbox"
                          id={feature}
                          checked={features.includes(feature)}
                          onChange={() => handleFeatureChange(feature)}
                          className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 transition duration-150 ease-in-out cursor-pointer"
                        />
                        <Label
                          htmlFor={feature}
                          className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition duration-150 ease-in-out"
                        >
                          {featureTranslations[feature] || feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="mt-8 px-8"
            >
              {saving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        )}
      </div>
    </TableLayout>
  )
}
