import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import useSWR from "swr"
import Link from "next/link"
import RegistrationLayout from "@/components/registration/RegistrationLayout"
import useUser from "@/hooks/useUser"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Trophy,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  UserPlus,
  Building2,
  User,
  Phone,
  Sparkles,
  Calendar,
  ShieldCheck,
  ChevronRight,
} from "lucide-react"

const fetcher = async (url) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Erro ao buscar dados.")
    error.info = await res.json()
    error.status = res.status
    throw error
  }
  return res.json()
}

function formatPhone(value) {
  if (!value) return ""
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 2) return numbers.length > 0 ? `(${numbers}` : ""
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

const TOURNAMENTS_INFO = [
  {
    id: "futebol",
    name: "Futebol",
    icon: "⚽",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-200/60",
    accentText: "text-emerald-700",
    description:
      "Torneio Society oficial do Simpovidro. Participe e traga sua equipe!",
  },
  {
    id: "volei",
    name: "Vôlei",
    icon: "🏐",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    gradient: "from-amber-500/10 to-orange-500/10 border-amber-200/60",
    accentText: "text-amber-700",
    description:
      "Disputa de vôlei na quadra de areia. Desafio e integração garantidos!",
  },
  {
    id: "tenis",
    name: "Tênis",
    icon: "🎾",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    gradient: "from-blue-500/10 to-indigo-500/10 border-blue-200/60",
    accentText: "text-blue-700",
    description:
      "Torneio de tênis Simpovidro. Chaveamento por categorias e muita emoção.",
  },
]

export default function TorneiosPage() {
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()
  const isInternational = router.locale === "en" || router.query.lang === "en"

  // SWR for user's tournament inscriptions
  const {
    data: myRegistrations,
    error: regError,
    isLoading: regLoading,
    mutate: mutateRegistrations,
  } = useSWR(user?.id ? "/api/v1/tournaments" : null, fetcher)

  // SWR for user's default company and phone info
  const { data: defaultData } = useSWR(
    user?.id ? "/api/v1/tournaments/defaults" : null,
    fetcher,
  )

  // Form state: list of participants being registered
  const [participants, setParticipants] = useState([
    {
      id: "p-1",
      tournament: "futebol",
      company_name: "",
      participant_name: "",
      phone: "",
    },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")
  const [deletingId, setDeletingId] = useState(null)

  // Auto-fill participant data with user defaults (Name, Company, Phone)
  useEffect(() => {
    if (!defaultData && !user?.full_name) return

    setParticipants((prev) => {
      if (prev.length !== 1) return prev
      const current = prev[0]
      const shouldUpdate =
        !current.company_name || !current.phone || !current.participant_name

      if (shouldUpdate) {
        return [
          {
            ...current,
            participant_name:
              current.participant_name ||
              defaultData?.participant_name ||
              user?.full_name ||
              "",
            company_name:
              current.company_name || defaultData?.company_name || "",
            phone: current.phone || formatPhone(defaultData?.phone) || "",
          },
        ]
      }
      return prev
    })
  }, [defaultData, user])

  const handleAddParticipant = (defaultTournament = "futebol") => {
    const lastCompany =
      participants[participants.length - 1]?.company_name ||
      defaultData?.company_name ||
      ""
    setParticipants((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tournament: defaultTournament,
        company_name: lastCompany,
        participant_name: "",
        phone: "",
      },
    ])
  }

  const handleRemoveParticipant = (index) => {
    if (participants.length === 1) {
      setParticipants([
        {
          id: `p-${Date.now()}`,
          tournament: "futebol",
          company_name: "",
          participant_name: "",
          phone: "",
        },
      ])
      return
    }
    setParticipants((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateParticipant = (index, field, value) => {
    setParticipants((prev) => {
      const updated = [...prev]
      if (field === "phone") {
        updated[index] = { ...updated[index], [field]: formatPhone(value) }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      return updated
    })
    setSubmitError("")
    setSubmitSuccess("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitSuccess("")

    // Basic client validation
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i]
      if (!p.tournament) {
        setSubmitError(`Selecione a modalidade do participante #${i + 1}.`)
        return
      }
      if (!p.company_name || !p.company_name.trim()) {
        setSubmitError(`Informe o nome da empresa do participante #${i + 1}.`)
        return
      }
      if (!p.participant_name || !p.participant_name.trim()) {
        setSubmitError(`Informe o nome do participante #${i + 1}.`)
        return
      }
      if (!p.phone || p.phone.replace(/\D/g, "").length < 8) {
        setSubmitError(
          `Informe um telefone celular válido para o participante #${i + 1}.`,
        )
        return
      }
    }

    setIsSubmitting(true)

    try {
      const payload = participants.map((p) => ({
        tournament: p.tournament,
        company_name: p.company_name.trim(),
        participant_name: p.participant_name.trim(),
        phone: p.phone.trim(),
      }))

      const response = await fetch("/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participants: payload }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || "Erro ao realizar inscrição no torneio.",
        )
      }

      setSubmitSuccess(
        participants.length === 1
          ? "Inscrição realizada com sucesso!"
          : `${participants.length} inscrições realizadas com sucesso!`,
      )

      // Reset form with 1 fresh participant
      setParticipants([
        {
          id: `p-${Date.now()}`,
          tournament: "futebol",
          company_name: payload[0]?.company_name || "",
          participant_name: "",
          phone: "",
        },
      ])

      // Refresh registered list
      mutateRegistrations()
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRegistration = async (id) => {
    if (
      !confirm("Tem certeza que deseja cancelar esta inscrição no torneio?")
    ) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/v1/tournaments/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao cancelar inscrição.")
      }

      mutateRegistrations()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // 1. Loading State
  if (userLoading) {
    return (
      <RegistrationLayout
        title="Torneios Oficiais - 17º Simpovidro"
        showBackButton
      >
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-600 font-medium text-sm">
            Carregando informações dos torneios...
          </p>
        </div>
      </RegistrationLayout>
    )
  }

  // 2. Unauthenticated Barrier
  if (!user) {
    return (
      <RegistrationLayout
        title="Torneios Oficiais - 17º Simpovidro"
        showBackButton
      >
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-slate-100 p-8 sm:p-12 text-center">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center justify-center p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6 shadow-sm">
              <Trophy className="h-12 w-12 text-blue-600" />
            </div>

            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-amber-200">
              Acesso Exclusivo para Congressistas
            </span>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Inscrições em Torneios Oficiais
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Para se inscrever e inscrever outros participantes nos torneios
              oficiais de{" "}
              <strong className="text-slate-900 font-bold">Futebol ⚽</strong>,{" "}
              <strong className="text-slate-900 font-bold">Vôlei 🏐</strong> e{" "}
              <strong className="text-slate-900 font-bold">Tênis 🎾</strong> do
              17º Simpovidro, você precisa estar autenticado com a sua conta.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-8 shadow-lg shadow-blue-200 gap-2 text-base cursor-pointer"
              >
                <Link href="/login?redirect=/torneios">
                  <LogIn className="h-5 w-5" />
                  Entrar na Minha Conta
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-full px-8 text-base cursor-pointer"
              >
                <Link href="/inscricao">
                  <UserPlus className="h-5 w-5" />
                  Criar Conta / Inscrição
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </RegistrationLayout>
    )
  }

  // 3. Authenticated Content
  return (
    <RegistrationLayout
      title="Torneios Oficiais - 17º Simpovidro"
      showBackButton
    >
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Torneios do <span className="text-orange-600">17º Simpovidro</span>
          </h1>
          <p className="text-slate-600 text-base max-w-2xl leading-relaxed">
            Faça sua inscrição nos torneios oficiais do evento.
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200 shadow-md rounded-2xl overflow-hidden mb-12">
          <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Formulário de inscrição
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs mt-1">
                  Preencha os dados do participante abaixo
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddParticipant("futebol")}
                className="self-start sm:self-auto gap-2 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50 bg-white rounded-xl shadow-2xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Adicionar Outro Participante
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium animate-in fade-in">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-in fade-in">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {/* Dynamic Participants List */}
              <div className="space-y-6">
                {participants.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs">
                          {index + 1}
                        </span>
                        <span className="font-bold text-sm text-slate-800">
                          Participante #{index + 1}
                        </span>
                      </div>

                      {participants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveParticipant(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 rounded-lg gap-1 text-xs cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remover
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Modalidade / Torneio */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Torneio / Modalidade *
                        </Label>
                        <Select
                          value={item.tournament}
                          onValueChange={(val) =>
                            handleUpdateParticipant(index, "tournament", val)
                          }
                        >
                          <SelectTrigger className="bg-white border-slate-200 h-10 rounded-xl text-sm font-medium">
                            <SelectValue placeholder="Selecione o torneio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="futebol">
                              <span className="flex items-center gap-2">
                                <span>⚽</span>
                                <span className="font-semibold">Futebol</span>
                              </span>
                            </SelectItem>
                            <SelectItem value="volei">
                              <span className="flex items-center gap-2">
                                <span>🏐</span>
                                <span className="font-semibold">Vôlei</span>
                              </span>
                            </SelectItem>
                            <SelectItem value="tenis">
                              <span className="flex items-center gap-2">
                                <span>🎾</span>
                                <span className="font-semibold">Tênis</span>
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Nome da Empresa */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Nome da Empresa *
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="text"
                            value={item.company_name}
                            onChange={(e) =>
                              handleUpdateParticipant(
                                index,
                                "company_name",
                                e.target.value,
                              )
                            }
                            placeholder="Ex: Vidraçaria Modelo"
                            className="bg-white pl-9 border-slate-200 h-10 rounded-xl text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* Nome do Participante */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Nome do Participante *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="text"
                            value={item.participant_name}
                            onChange={(e) =>
                              handleUpdateParticipant(
                                index,
                                "participant_name",
                                e.target.value,
                              )
                            }
                            placeholder="Nome completo"
                            className="bg-white pl-9 border-slate-200 h-10 rounded-xl text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* Celular */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Informar o Celular *
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="tel"
                            value={item.phone}
                            onChange={(e) =>
                              handleUpdateParticipant(
                                index,
                                "phone",
                                e.target.value,
                              )
                            }
                            placeholder="(00) 00000-0000"
                            className="bg-white pl-9 border-slate-200 h-10 rounded-xl text-sm font-mono"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddParticipant("futebol")}
                  className="w-full sm:w-auto text-xs font-bold rounded-xl gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Mais Participantes
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-11 rounded-xl shadow-md shadow-blue-200 gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando Inscrições...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      {participants.length === 1
                        ? "Confirmar Inscrição"
                        : `Confirmar ${participants.length} Inscrições`}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Minhas Inscrições Realizadas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Inscrições realizadas
            </h2>
            {myRegistrations && myRegistrations.length > 0 && (
              <Badge variant="secondary" className="font-bold text-xs">
                {myRegistrations.length}{" "}
                {myRegistrations.length === 1 ? "inscrito" : "inscritos"}
              </Badge>
            )}
          </div>

          {regLoading ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-slate-500">
                Carregando suas inscrições...
              </span>
            </div>
          ) : myRegistrations && myRegistrations.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 text-left">Modalidade</th>
                    <th className="px-5 py-3.5 text-left">Participante</th>
                    <th className="px-5 py-3.5 text-left">Empresa</th>
                    <th className="px-5 py-3.5 text-left">Celular</th>
                    <th className="px-5 py-3.5 text-left">Data</th>
                    <th className="px-5 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRegistrations.map((reg) => {
                    const t = (reg.tournament || "").toLowerCase()
                    const tourInfo =
                      TOURNAMENTS_INFO.find((item) => item.id === t) ||
                      TOURNAMENTS_INFO[0]

                    const dateStr = reg.created_at
                      ? new Date(reg.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"

                    return (
                      <tr
                        key={reg.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tourInfo.badgeColor}`}
                          >
                            <span>{tourInfo.icon}</span>
                            <span>{tourInfo.name}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {reg.participant_name}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {reg.company_name}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {reg.phone}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 font-mono whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === reg.id}
                            onClick={() => handleDeleteRegistration(reg.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2.5 rounded-lg text-xs font-medium cursor-pointer"
                          >
                            {deletingId === reg.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline ml-1">
                              Cancelar
                            </span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Trophy className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-semibold text-sm">
                Você ainda não realizou inscrições nos torneios.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Utilize o formulário acima para inscrever você ou colegas de
                equipe!
              </p>
            </div>
          )}
        </div>
      </div>
    </RegistrationLayout>
  )
}
