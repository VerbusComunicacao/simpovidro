import { useState, useEffect } from "react"
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
  Plane,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  UserPlus,
  Building2,
  User,
  Users,
  Copy,
  Phone,
  Mail,
  Calendar,
  Clock,
  Send,
  Hotel,
  Info,
  X,
} from "lucide-react"

const fetcher = async (url) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Erro ao carregar dados.")
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

function formatCPF(value) {
  if (!value) return ""
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  if (numbers.length <= 9)
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
}

function formatTime(value) {
  if (!value) return ""
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 2) return numbers
  return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`
}

function formatDateMask(value) {
  if (!value) return ""
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
}

const createEmptyParticipant = (initialData = {}) => ({
  id:
    initialData.id ||
    `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  guest_id: initialData.guest_id || "",
  sale_id: initialData.sale_id || "",
  participant_name:
    initialData.participant_name ||
    initialData.guest_name ||
    initialData.name ||
    "",
  company_name: initialData.company_name || "",
  participant_cpf:
    initialData.participant_cpf ||
    initialData.guest_cpf ||
    initialData.cpf_number ||
    initialData.passport_number ||
    "",
  participant_phone: formatPhone(
    initialData.participant_phone ||
      initialData.guest_phone ||
      initialData.phone ||
      "",
  ),
  participant_email:
    initialData.participant_email ||
    initialData.guest_email ||
    initialData.email ||
    "",
  // Voo Ida (IN)
  in_date: initialData.in_date || "",
  in_airline: initialData.in_airline || "",
  in_locator: initialData.in_locator || "",
  in_flight_number: initialData.in_flight_number || "",
  in_origin_airport: initialData.in_origin_airport || "",
  in_arrival_time: initialData.in_arrival_time || "",
  in_destination_airport:
    initialData.in_destination_airport || "FLN - Aeroporto de Florianópolis",
  // Voo Volta (OUT)
  out_date: initialData.out_date || "",
  out_airline: initialData.out_airline || "",
  out_locator: initialData.out_locator || "",
  out_flight_number: initialData.out_flight_number || "",
  out_departure_airport:
    initialData.out_departure_airport || "FLN - Aeroporto de Florianópolis",
  out_departure_time: initialData.out_departure_time || "",
  out_destination_airport: initialData.out_destination_airport || "",
  notes: initialData.notes || "",
})

export default function TransferPage() {
  const { user, isLoading: userLoading } = useUser()

  // SWR for user's flight transfers
  const {
    data: myTransfers,
    isLoading: transfersLoading,
    mutate: mutateTransfers,
  } = useSWR(user?.id ? "/api/v1/flight-transfers" : null, fetcher)

  // SWR for user defaults (active hotel + registered participants)
  const { data: defaultData } = useSWR(
    user?.id ? "/api/v1/flight-transfers/defaults" : null,
    fetcher,
  )

  const [selectedSaleOption, setSelectedSaleOption] = useState("")
  const [participants, setParticipants] = useState([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")
  const [deletingId, setDeletingId] = useState(null)

  // Initial load: fill participants from first inscription or user defaults
  useEffect(() => {
    if (defaultData && participants.length === 0) {
      if (
        defaultData.sales_with_guests &&
        defaultData.sales_with_guests.length > 0
      ) {
        const firstSale = defaultData.sales_with_guests[0]
        setSelectedSaleOption(firstSale.sale_id)
        const initialList = firstSale.guests.map((g) =>
          createEmptyParticipant({
            ...g,
            sale_id: firstSale.sale_id,
            company_name: firstSale.company_name,
          }),
        )
        setParticipants(initialList)
      } else {
        setSelectedSaleOption("manual")
        setParticipants([
          createEmptyParticipant({
            participant_name: user?.full_name || "",
            participant_email: user?.email || "",
          }),
        ])
      }
    }
  }, [defaultData, user, participants.length])

  const handleSaleSelect = (saleId) => {
    setSelectedSaleOption(saleId)
    setSubmitError("")
    setSubmitSuccess("")

    if (saleId === "manual") {
      setParticipants([
        createEmptyParticipant({
          participant_name: user?.full_name || "",
          participant_email: user?.email || "",
        }),
      ])
      return
    }

    const foundSale = defaultData?.sales_with_guests?.find(
      (s) => s.sale_id === saleId,
    )

    if (foundSale && foundSale.guests && foundSale.guests.length > 0) {
      const list = foundSale.guests.map((g) =>
        createEmptyParticipant({
          ...g,
          sale_id: foundSale.sale_id,
          company_name: foundSale.company_name,
        }),
      )
      setParticipants(list)
    }
  }

  const handleParticipantChange = (index, field, value) => {
    setParticipants((prev) => {
      const updated = [...prev]
      let formatted = value

      if (field === "participant_phone") formatted = formatPhone(value)
      else if (field === "participant_cpf") formatted = formatCPF(value)
      else if (field === "in_arrival_time" || field === "out_departure_time")
        formatted = formatTime(value)
      else if (field === "in_date" || field === "out_date")
        formatted = formatDateMask(value)
      else if (field === "in_locator" || field === "out_locator")
        formatted = value.toUpperCase()

      updated[index] = {
        ...updated[index],
        [field]: formatted,
      }
      return updated
    })
    setSubmitError("")
    setSubmitSuccess("")
  }

  const handleAddParticipant = () => {
    setParticipants((prev) => [
      ...prev,
      createEmptyParticipant({
        company_name: prev[0]?.company_name || "",
      }),
    ])
  }

  const handleRemoveParticipant = (index) => {
    if (participants.length <= 1) {
      alert("É necessário ter pelo menos um participante no formulário.")
      return
    }
    setParticipants((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCopyFirstFlightToSingle = (targetIndex) => {
    const first = participants[0]
    if (!first) return

    setParticipants((prev) => {
      const updated = [...prev]
      updated[targetIndex] = {
        ...updated[targetIndex],
        in_date: first.in_date,
        in_airline: first.in_airline,
        in_locator: first.in_locator,
        in_flight_number: first.in_flight_number,
        in_origin_airport: first.in_origin_airport,
        in_arrival_time: first.in_arrival_time,
        in_destination_airport: first.in_destination_airport,
        out_date: first.out_date,
        out_airline: first.out_airline,
        out_locator: first.out_locator,
        out_flight_number: first.out_flight_number,
        out_departure_airport: first.out_departure_airport,
        out_departure_time: first.out_departure_time,
        out_destination_airport: first.out_destination_airport,
        notes: first.notes,
      }
      return updated
    })
    setSubmitSuccess(
      `Dados de voo do Participante 1 copiados para o Participante ${targetIndex + 1}!`,
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitSuccess("")

    if (participants.length === 0) {
      setSubmitError("Adicione ao menos um participante.")
      return
    }

    const requiredFields = [
      { key: "participant_name", label: "Nome do Participante" },
      { key: "company_name", label: "Empresa" },
      { key: "participant_cpf", label: "CPF / Documento" },
      { key: "participant_phone", label: "Celular / WhatsApp" },
      { key: "participant_email", label: "E-mail do Participante" },
      { key: "in_date", label: "Data in Chegada" },
      { key: "in_airline", label: "Companhia Aérea (Ida)" },
      { key: "in_locator", label: "LOCALIZADOR (Ida)" },
      { key: "in_flight_number", label: "Voo ida (Nº do Voo)" },
      { key: "in_origin_airport", label: "Aeroporto Origem" },
      { key: "in_arrival_time", label: "Horário chegada" },
      { key: "in_destination_airport", label: "Aeroporto Destino (Chegada)" },
      { key: "out_date", label: "Data OUT Saída" },
      { key: "out_airline", label: "Companhia Aérea (Retorno)" },
      { key: "out_locator", label: "LOCALIZADOR (Retorno)" },
      { key: "out_flight_number", label: "Voo Retorno (Nº do Voo)" },
      { key: "out_departure_airport", label: "Aeroporto Saída" },
      { key: "out_departure_time", label: "Horário/Saída" },
      { key: "out_destination_airport", label: "Aeroporto Destino (Retorno)" },
    ]

    // Validate every required field for each participant
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i]
      const participantLabel = `Participante ${i + 1}${
        p.participant_name ? ` (${p.participant_name})` : ""
      }`

      for (const field of requiredFields) {
        const val = p[field.key]
        if (!val || !val.toString().trim()) {
          setSubmitError(
            `Por favor, preencha o campo "${field.label}" no ${participantLabel}. Apenas observações são opcionais.`,
          )
          return
        }
      }
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/v1/flight-transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hotel_id: defaultData?.hotel?.id || undefined,
          participants,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || "Erro ao salvar informações de voo e transfer.",
        )
      }

      const count = participants.length
      setSubmitSuccess(
        `Informações de voo salvas com sucesso para ${count} ${
          count === 1 ? "participante" : "participantes"
        }! A equipe de logística foi notificada por e-mail.`,
      )

      // Reset flight fields for all participants
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          in_date: "",
          in_airline: "",
          in_locator: "",
          in_flight_number: "",
          in_origin_airport: "",
          in_arrival_time: "",
          in_destination_airport: "FLN - Aeroporto de Florianópolis",
          out_date: "",
          out_airline: "",
          out_locator: "",
          out_flight_number: "",
          out_departure_airport: "FLN - Aeroporto de Florianópolis",
          out_departure_time: "",
          out_destination_airport: "",
          notes: "",
        })),
      )

      mutateTransfers()
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTransfer = async (id) => {
    if (!confirm("Tem certeza que deseja remover este registro de voo?")) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/v1/flight-transfers/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao remover registro.")
      }

      mutateTransfers()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // 1. Loading state
  if (userLoading) {
    return (
      <RegistrationLayout
        title="Informações de Voo e Transfer - 17º Simpovidro"
        showBackButton
      >
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-600 font-medium text-sm">
            Carregando formulário de voos e transfer...
          </p>
        </div>
      </RegistrationLayout>
    )
  }

  // 2. Unauthenticated Barrier
  if (!user) {
    return (
      <RegistrationLayout
        title="Informações de Voo e Transfer - 17º Simpovidro"
        showBackButton
      >
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-slate-100 p-8 sm:p-12 text-center">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center justify-center p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6 shadow-sm">
              <Plane className="h-12 w-12 text-blue-600" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Informações de Voo e Transfer
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Para informar os dados de seus voos e organizar os transfers
              oficiais do 17º Simpovidro, acesse com a sua conta.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-8 shadow-lg shadow-blue-200 gap-2 text-base cursor-pointer"
              >
                <Link href="/login?redirect=/transfer">
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
      title="Informações de Voo e Transfer - 17º Simpovidro"
      showBackButton
    >
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header Hero */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Plane className="h-8 w-8 text-blue-600" />
              Informações de{" "}
              <span className="text-blue-600">Voo e Transfer</span>
            </h1>
          </div>

          <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
            Preencha os dados dos voos de cada participante para que a equipe de
            logística organize os horários de transfer. Se preferir, envie o
            bilhete eletrônico diretamente para{" "}
            <strong>
              <a
                href="mailto:logistica@abravidro.org.br"
                className="text-blue-600 hover:underline"
              >
                logistica@abravidro.org.br
              </a>
            </strong>
            .
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200 shadow-md rounded-2xl overflow-hidden mb-12 bg-white">
          <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  Cadastro de Voo e Transfer
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs mt-1">
                  Selecione uma inscrição ou preencha manualmente para cada
                  participante
                </CardDescription>
              </div>

              {/* Inscription Selector */}
              {defaultData?.sales_with_guests &&
                defaultData.sales_with_guests.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="sale-selector"
                      className="text-xs text-slate-600 font-semibold whitespace-nowrap"
                    >
                      Inscrição:
                    </Label>
                    <Select
                      value={selectedSaleOption}
                      onValueChange={handleSaleSelect}
                    >
                      <SelectTrigger
                        id="sale-selector"
                        className="h-9 text-xs bg-white border-slate-300 rounded-lg min-w-[240px] font-medium"
                      >
                        <SelectValue placeholder="Selecione a inscrição" />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultData.sales_with_guests.map((s) => (
                          <SelectItem key={s.sale_id} value={s.sale_id}>
                            Inscrição #{s.sale_number} - {s.room_name} (
                            {s.guests?.length || 0} hóspedes)
                          </SelectItem>
                        ))}
                        <SelectItem value="manual">
                          ✍️ Preenchimento Manual / Outro
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {submitError && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {/* PARTICIPANT BLOCKS */}
              <div className="space-y-8">
                {participants.map((p, index) => (
                  <div key={p.id || index} className="space-y-8">
                    <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs transition-shadow hover:shadow-md">
                      {/* Block Header */}
                      <div className="bg-slate-100/80 px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                            {index + 1}
                          </span>
                          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                            Participante {index + 1}
                            {p.participant_name
                              ? `: ${p.participant_name}`
                              : ""}
                          </h3>
                          {p.participant_cpf && (
                            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                              ({p.participant_cpf})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopyFirstFlightToSingle(index)
                              }
                              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold gap-1.5 h-7.5 px-3 rounded-lg text-xs cursor-pointer shadow-xs"
                            >
                              <Copy className="h-3.5 w-3.5 text-blue-600" />
                              Copiar voos do Participante 1
                            </Button>
                          )}

                          {participants.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveParticipant(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7.5 px-2.5 rounded-lg text-xs font-medium cursor-pointer gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remover
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="p-5 sm:p-6 space-y-6">
                        {/* 1. Dados Pessoais do Participante */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-blue-600" />
                            Dados do Participante
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-slate-700">
                                Nome do Participante *
                              </Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  type="text"
                                  value={p.participant_name}
                                  onChange={(e) =>
                                    handleParticipantChange(
                                      index,
                                      "participant_name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Nome completo"
                                  className="bg-white pl-9 border-slate-200 h-9 rounded-xl text-sm font-medium"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-slate-700">
                                Empresa *
                              </Label>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  type="text"
                                  value={p.company_name}
                                  onChange={(e) =>
                                    handleParticipantChange(
                                      index,
                                      "company_name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Nome da empresa"
                                  className="bg-white pl-9 border-slate-200 h-9 rounded-xl text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-slate-700">
                                CPF / Documento *
                              </Label>
                              <Input
                                type="text"
                                value={p.participant_cpf}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "participant_cpf",
                                    e.target.value,
                                  )
                                }
                                placeholder="000.000.000-00"
                                className="bg-white border-slate-200 h-9 rounded-xl text-sm font-mono"
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-slate-700">
                                Celular / WhatsApp *
                              </Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  type="tel"
                                  value={p.participant_phone}
                                  onChange={(e) =>
                                    handleParticipantChange(
                                      index,
                                      "participant_phone",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="(00) 00000-0000"
                                  className="bg-white pl-9 border-slate-200 h-9 rounded-xl text-sm font-mono"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                              <Label className="text-xs font-bold text-slate-700">
                                E-mail do Participante *
                              </Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  type="email"
                                  value={p.participant_email}
                                  onChange={(e) =>
                                    handleParticipantChange(
                                      index,
                                      "participant_email",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="email@empresa.com.br"
                                  className="bg-white pl-9 border-slate-200 h-9 rounded-xl text-sm"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Voo de Ida (IN) */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2 pb-1.5 border-b border-blue-200">
                            <span className="p-1 rounded-md bg-blue-100 text-blue-700 font-bold text-[11px]">
                              🛫 IN
                            </span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                              Voo de Ida (Chegada no Evento)
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                Data in Chegada *
                              </Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                  type="text"
                                  value={p.in_date}
                                  onChange={(e) =>
                                    handleParticipantChange(
                                      index,
                                      "in_date",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="DD/MM/AAAA"
                                  className="bg-white pl-8.5 border-slate-200 h-9 rounded-lg text-xs font-mono"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                Companhia Aérea *
                              </Label>
                              <Input
                                type="text"
                                value={p.in_airline}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "in_airline",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex: LATAM, GOL, Azul"
                                className="bg-white border-slate-200 h-9 rounded-lg text-xs"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                LOCALIZADOR (Ida) *
                              </Label>
                              <Input
                                type="text"
                                value={p.in_locator}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "in_locator",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex: ABC123"
                                className="bg-white border-slate-200 h-9 rounded-lg text-xs font-mono uppercase font-bold"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                Voo ida (Nº do Voo) *
                              </Label>
                              <Input
                                type="text"
                                value={p.in_flight_number}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "in_flight_number",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex: LA 3421"
                                className="bg-white border-slate-200 h-9 rounded-lg text-xs font-mono"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                Aeroporto Origem *
                              </Label>
                              <Input
                                type="text"
                                value={p.in_origin_airport}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "in_origin_airport",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex: GRU / Congonhas"
                                className="bg-white border-slate-200 h-9 rounded-lg text-xs"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                Horário chegada *
                              </Label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                  type="text"
                                  value={p.in_arrival_time}
                                  onChange={(e) =>
                                    handleParticipantChange(
                                      index,
                                      "in_arrival_time",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="HH:MM (ex: 14:30)"
                                  className="bg-white pl-8.5 border-slate-200 h-9 rounded-lg text-xs font-mono font-bold"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                              <Label className="text-xs font-bold text-slate-700">
                                Aeroporto Destino (Chegada) *
                              </Label>
                              <Input
                                type="text"
                                value={p.in_destination_airport}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "in_destination_airport",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex: FLN - Aeroporto de Florianópolis"
                                className="bg-white border-slate-200 h-9 rounded-lg text-xs"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* 3. Voo de Volta (OUT) */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2 pb-1.5 border-b border-amber-200">
                            <span className="p-1 rounded-md bg-amber-100 text-amber-700 font-bold text-[11px]">
                              🛬 OUT
                            </span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                              Voo de Retorno (Saída do Evento)
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-amber-50/40 p-4 rounded-xl border border-amber-100">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                Data OUT Saída *
                              </Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                  type="text"
                                  value={p.out_date}
                                  onChange={(e) =>
                                    handleParticipantChange(
                                      index,
                                      "out_date",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="DD/MM/AAAA"
                                  className="bg-white pl-8.5 border-slate-200 h-9 rounded-lg text-xs font-mono"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                Companhia Aérea *
                              </Label>
                              <Input
                                type="text"
                                value={p.out_airline}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "out_airline",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex: LATAM, GOL, Azul"
                                className="bg-white border-slate-200 h-9 rounded-lg text-xs"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                LOCALIZADOR (Retorno) *
                              </Label>
                              <Input
                                type="text"
                                value={p.out_locator}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "out_locator",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex: XYZ789"
                                className="bg-white border-slate-200 h-9 rounded-lg text-xs font-mono uppercase font-bold"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                Voo Retorno (Nº do Voo) *
                              </Label>
                              <Input
                                type="text"
                                value={p.out_flight_number}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "out_flight_number",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex: G3 1540"
                                className="bg-white border-slate-200 h-9 rounded-lg text-xs font-mono"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                Aeroporto Saída *
                              </Label>
                              <Input
                                type="text"
                                value={p.out_departure_airport}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "out_departure_airport",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex: MCZ - Aeroporto de Maceió"
                                className="bg-white border-slate-200 h-9 rounded-lg text-xs"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-700">
                                Horário/Saída *
                              </Label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                  type="text"
                                  value={p.out_departure_time}
                                  onChange={(e) =>
                                    handleParticipantChange(
                                      index,
                                      "out_departure_time",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="HH:MM (ex: 18:00)"
                                  className="bg-white pl-8.5 border-slate-200 h-9 rounded-lg text-xs font-mono font-bold"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                              <Label className="text-xs font-bold text-slate-700">
                                Aeroporto Destino (Retorno) *
                              </Label>
                              <Input
                                type="text"
                                value={p.out_destination_airport}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "out_destination_airport",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex: GRU / Congonhas / BSB"
                                className="bg-white border-slate-200 h-9 rounded-lg text-xs"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* 4. Observações */}
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-700">
                            Observações Adicionais para este Participante
                            (opcional)
                          </Label>
                          <textarea
                            value={p.notes}
                            onChange={(e) =>
                              handleParticipantChange(
                                index,
                                "notes",
                                e.target.value,
                              )
                            }
                            placeholder="Assistência especial, bagagem extra ou alguma particularidade no transfer deste passageiro..."
                            className="w-full min-h-[60px] p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão Adicionar Participante */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddParticipant}
                  className="border-dashed border-2 border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 font-bold px-6 py-2 rounded-xl text-xs gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar outro participante
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  disabled={isSubmitting || participants.length === 0}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-11 rounded-xl shadow-md shadow-blue-200 gap-2 cursor-pointer text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando e enviando para logística...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {participants.length > 1
                        ? `Salvar e Enviar Informações para ${participants.length} Participantes`
                        : "Salvar Informações de Voo"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Voos Cadastrados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              Voos e Transfers Cadastrados
            </h2>
            {myTransfers && myTransfers.length > 0 && (
              <Badge variant="secondary" className="font-bold text-xs">
                {myTransfers.length}{" "}
                {myTransfers.length === 1 ? "registro" : "registros"}
              </Badge>
            )}
          </div>

          {transfersLoading ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-slate-500">
                Carregando registros de voos...
              </span>
            </div>
          ) : myTransfers && myTransfers.length > 0 ? (
            <div className="space-y-4">
              {myTransfers.map((item) => {
                const dateStr = item.created_at
                  ? new Date(item.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"

                return (
                  <div
                    key={item.id}
                    className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-blue-200 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-slate-900">
                            {item.participant_name}
                          </span>
                          {item.company_name && (
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              {item.company_name}
                            </span>
                          )}
                          {item.sale_number && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-semibold">
                              Inscr. #{item.sale_number}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Cadastrado em: {dateStr}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === item.id}
                        onClick={() => handleDeleteTransfer(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3 rounded-lg text-xs font-medium cursor-pointer self-start sm:self-auto gap-1"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Excluir
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* IN */}
                      <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100/80 text-xs text-slate-700 space-y-1">
                        <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5 mb-2 pb-1 border-b border-blue-200">
                          <span>🛫 Voo Ida (IN / Chegada)</span>
                        </div>
                        <p>
                          <strong>Data:</strong> {item.in_date || "-"}
                        </p>
                        <p>
                          <strong>Companhia:</strong> {item.in_airline || "-"}
                        </p>
                        <p>
                          <strong>Localizador:</strong>{" "}
                          <span className="font-mono font-bold">
                            {item.in_locator || "-"}
                          </span>
                        </p>
                        <p>
                          <strong>Nº Voo:</strong>{" "}
                          {item.in_flight_number || "-"}
                        </p>
                        <p>
                          <strong>Origem:</strong>{" "}
                          {item.in_origin_airport || "-"}
                        </p>
                        <p>
                          <strong>Horário Chegada:</strong>{" "}
                          <span className="font-bold">
                            {item.in_arrival_time || "-"}
                          </span>
                        </p>
                        <p>
                          <strong>Destino:</strong>{" "}
                          {item.in_destination_airport || "-"}
                        </p>
                      </div>

                      {/* OUT */}
                      <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100/80 text-xs text-slate-700 space-y-1">
                        <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5 mb-2 pb-1 border-b border-amber-200">
                          <span>🛬 Voo Volta (OUT / Saída)</span>
                        </div>
                        <p>
                          <strong>Data:</strong> {item.out_date || "-"}
                        </p>
                        <p>
                          <strong>Companhia:</strong> {item.out_airline || "-"}
                        </p>
                        <p>
                          <strong>Localizador:</strong>{" "}
                          <span className="font-mono font-bold">
                            {item.out_locator || "-"}
                          </span>
                        </p>
                        <p>
                          <strong>Nº Voo:</strong>{" "}
                          {item.out_flight_number || "-"}
                        </p>
                        <p>
                          <strong>Aeroporto Saída:</strong>{" "}
                          {item.out_departure_airport || "-"}
                        </p>
                        <p>
                          <strong>Horário Saída:</strong>{" "}
                          <span className="font-bold">
                            {item.out_departure_time || "-"}
                          </span>
                        </p>
                        {item.out_destination_airport && (
                          <p>
                            <strong>Destino:</strong>{" "}
                            {item.out_destination_airport}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.notes && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                        <strong>Obs:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Plane className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-semibold text-sm">
                Você ainda não cadastrou informações de voo.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Preencha o formulário acima para enviar seus voos para a equipe
                de logística!
              </p>
            </div>
          )}
        </div>
      </div>
    </RegistrationLayout>
  )
}
