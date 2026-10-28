import { useState } from "react"
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
  Plane,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Send,
  Search,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trash2,
  Check,
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

const initialFormData = {
  user_id: "",
  guest_id: "",
  sale_id: "",
  sale_number: "",
  hotel_id: "",
  hotel_name: "",
  participant_name: "",
  company_name: "",
  participant_cpf: "",
  passport_number: "",
  participant_phone: "",
  participant_email: "",
  // Voo Ida (IN)
  in_date: "",
  in_airline: "",
  in_locator: "",
  in_flight_number: "",
  in_origin_airport: "",
  in_arrival_time: "",
  in_destination_airport: "FLN - Aeroporto de Florianópolis",
  // Voo Volta (OUT)
  out_date: "",
  out_airline: "",
  out_locator: "",
  out_flight_number: "",
  out_departure_airport: "FLN - Aeroporto de Florianópolis",
  out_departure_time: "",
  out_destination_airport: "",
  notes: "",
}

export default function TransferPage() {
  const { user } = useUser()

  // SWR for user's flight transfers if logged in
  const {
    data: myTransfers,
    isLoading: transfersLoading,
    mutate: mutateTransfers,
  } = useSWR(user?.id ? "/api/v1/flight-transfers" : null, fetcher)

  // Steps: 1 = Document lookup, 2 = Individual flight form, 3 = Confirmation success
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Document Lookup State
  const [docValue, setDocValue] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [lookupError, setLookupError] = useState("")

  // Step 2: Individual Form State
  const [formData, setFormData] = useState(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [deletingId, setDeletingId] = useState(null)

  // Handlers for Step 1: Lookup
  const handleDocChange = (e) => {
    const val = e.target.value
    if (/[a-zA-Z]/.test(val)) {
      setDocValue(val.toUpperCase())
    } else {
      const clean = val.replace(/\D/g, "")
      if (clean.length === 11) {
        setDocValue(formatCPF(clean))
      } else {
        setDocValue(clean)
      }
    }
    setLookupError("")
  }

  const handleLookupSubmit = async (e) => {
    e.preventDefault()
    setLookupError("")

    const raw = docValue.trim()
    if (!raw) {
      setLookupError("Informe seu CPF ou Passaporte para continuar.")
      return
    }

    setIsSearching(true)

    try {
      const res = await fetch("/api/v1/flight-transfers/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: raw }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Erro ao consultar documento. Verifique os dados digitados.",
        )
      }

      if (!data.found || !data.participant) {
        setLookupError(
          data.message ||
            "Nenhuma inscrição ativa encontrada para este documento no 17º Simpovidro. Verifique o CPF/Passaporte digitado ou contate a organização em logistica@abravidro.org.br.",
        )
        return
      }

      const p = data.participant
      const ex = data.existing_transfer || {}

      setFormData({
        user_id: p.user_id || "",
        guest_id: p.guest_id || "",
        sale_id: p.sale_id || "",
        sale_number: p.sale_number || "",
        hotel_id: data.hotel?.id || "",
        hotel_name: data.hotel?.name || "",
        participant_name: p.participant_name || "",
        company_name: p.company_name || "",
        participant_cpf:
          p.participant_cpf || (data.document_type === "cpf" ? raw : ""),
        passport_number:
          p.passport_number || (data.document_type === "passport" ? raw : ""),
        participant_phone: formatPhone(p.participant_phone || ""),
        participant_email: p.participant_email || "",
        // Pre-fill existing flights if already submitted
        in_date: ex.in_date || "",
        in_airline: ex.in_airline || "",
        in_locator: ex.in_locator || "",
        in_flight_number: ex.in_flight_number || "",
        in_origin_airport: ex.in_origin_airport || "",
        in_arrival_time: ex.in_arrival_time || "",
        in_destination_airport:
          ex.in_destination_airport || "FLN - Aeroporto de Florianópolis",
        out_date: ex.out_date || "",
        out_airline: ex.out_airline || "",
        out_locator: ex.out_locator || "",
        out_flight_number: ex.out_flight_number || "",
        out_departure_airport:
          ex.out_departure_airport || "FLN - Aeroporto de Florianópolis",
        out_departure_time: ex.out_departure_time || "",
        out_destination_airport: ex.out_destination_airport || "",
        notes: ex.notes || "",
      })

      setCurrentStep(2)
      setSubmitError("")
    } catch (err) {
      setLookupError(err.message || "Erro ao consultar inscrição.")
    } finally {
      setIsSearching(false)
    }
  }

  // Handlers for Step 2: Form Change & Submit
  const handleFieldChange = (field, value) => {
    let formatted = value
    if (field === "participant_phone") formatted = formatPhone(value)
    else if (field === "participant_cpf") formatted = formatCPF(value)
    else if (field === "in_arrival_time" || field === "out_departure_time")
      formatted = formatTime(value)
    else if (field === "in_date" || field === "out_date")
      formatted = formatDateMask(value)
    else if (
      field === "in_locator" ||
      field === "out_locator" ||
      field === "passport_number"
    )
      formatted = value.toUpperCase()

    setFormData((prev) => ({
      ...prev,
      [field]: formatted,
    }))
    setSubmitError("")
  }

  const handleBackToStep1 = () => {
    setCurrentStep(1)
    setSubmitError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError("")

    const requiredFields = [
      { key: "participant_name", label: "Nome do Participante" },
      { key: "company_name", label: "Empresa" },
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

    // Document validation (CPF or Passport must be present)
    const hasDoc = formData.participant_cpf || formData.passport_number
    if (!hasDoc) {
      setSubmitError(
        "Informe o CPF ou Passaporte do participante para continuar.",
      )
      return
    }

    // Validate mandatory fields
    for (const field of requiredFields) {
      const val = formData[field.key]
      if (!val || !val.toString().trim()) {
        setSubmitError(
          `Por favor, preencha o campo "${field.label}". Apenas o campo Observações é opcional.`,
        )
        return
      }
    }

    setIsSubmitting(true)

    try {
      const payload = {
        hotel_id: formData.hotel_id || undefined,
        user_id: formData.user_id || undefined,
        guest_id: formData.guest_id || undefined,
        sale_id: formData.sale_id || undefined,
        participant_name: formData.participant_name.trim(),
        participant_cpf: formData.participant_cpf
          ? formData.participant_cpf.trim()
          : formData.passport_number?.trim() || null,
        participant_email: formData.participant_email.trim(),
        participant_phone: formData.participant_phone.trim(),
        company_name: formData.company_name.trim(),
        in_date: formData.in_date.trim(),
        in_airline: formData.in_airline.trim(),
        in_locator: formData.in_locator.trim().toUpperCase(),
        in_flight_number: formData.in_flight_number.trim(),
        in_origin_airport: formData.in_origin_airport.trim(),
        in_arrival_time: formData.in_arrival_time.trim(),
        in_destination_airport: formData.in_destination_airport.trim(),
        out_date: formData.out_date.trim(),
        out_airline: formData.out_airline.trim(),
        out_locator: formData.out_locator.trim().toUpperCase(),
        out_flight_number: formData.out_flight_number.trim(),
        out_departure_airport: formData.out_departure_airport.trim(),
        out_departure_time: formData.out_departure_time.trim(),
        out_destination_airport: formData.out_destination_airport.trim(),
        notes: formData.notes ? formData.notes.trim() : null,
      }

      const response = await fetch("/api/v1/flight-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || "Erro ao salvar informações de voo e transfer.",
        )
      }

      setCurrentStep(3)

      if (mutateTransfers) {
        mutateTransfers()
      }
    } catch (err) {
      setSubmitError(
        err.message || "Erro ao salvar informações de voo e transfer.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartNewSubmission = () => {
    setDocValue("")
    setFormData(initialFormData)
    setSubmitError("")
    setLookupError("")
    setCurrentStep(1)
  }

  const handleDeleteTransfer = async (id) => {
    if (
      !confirm("Deseja realmente remover este registro de voo para o transfer?")
    ) {
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

  return (
    <RegistrationLayout
      title="Informações de Voo e Transfer - 17º Simpovidro"
      showBackButton
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            Preencha os dados dos seus voos para que a equipe de logística
            organize os horários de transfer oficial do 17º Simpovidro. Se
            preferir, envie seu bilhete eletrônico diretamente para{" "}
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

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  currentStep >= 1
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <span
                className={`text-xs font-bold ${
                  currentStep === 1 ? "text-blue-600" : "text-slate-600"
                }`}
              >
                Identificação
              </span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-3 ${
                currentStep >= 2 ? "bg-blue-600" : "bg-slate-200"
              }`}
            />

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  currentStep >= 2
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
              </div>
              <span
                className={`text-xs font-bold ${
                  currentStep === 2 ? "text-blue-600" : "text-slate-600"
                }`}
              >
                Dados de Voo
              </span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-3 ${
                currentStep >= 3 ? "bg-emerald-600" : "bg-slate-200"
              }`}
            />

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  currentStep >= 3
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                3
              </div>
              <span
                className={`text-xs font-bold ${
                  currentStep === 3 ? "text-emerald-600" : "text-slate-500"
                }`}
              >
                Concluído
              </span>
            </div>
          </div>
        </div>

        {/* TELA 1: IDENTIFICAÇÃO POR CPF OU PASSAPORTE */}
        {currentStep === 1 && (
          <div className="max-w-xl mx-auto my-6">
            <Card className="border border-slate-200/90 shadow-md rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleLookupSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Search className="h-5 w-5 text-blue-600" />
                      Localizar Inscrição
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Informe seu CPF ou Passaporte para carregar os dados.
                    </p>
                  </div>

                  {lookupError && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <span>{lookupError}</span>
                    </div>
                  )}

                  <div className="pt-1">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <Input
                        id="document-input"
                        type="text"
                        value={docValue}
                        onChange={handleDocChange}
                        placeholder="Digite seu CPF ou Passaporte"
                        className="h-11 px-4 text-sm rounded-xl border-slate-300 focus:border-blue-600 focus:ring-blue-600 flex-1 shadow-sm"
                        required
                        autoFocus
                      />
                      <Button
                        type="submit"
                        disabled={isSearching || !docValue.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 px-6 rounded-xl shadow-sm gap-2 cursor-pointer text-sm shrink-0 transition-all"
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Buscando...
                          </>
                        ) : (
                          <>
                            Avançar
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TELA 2: PREENCHIMENTO INDIVIDUAL DOS VOOS */}
        {currentStep === 2 && (
          <Card className="border-slate-200 shadow-xl rounded-3xl overflow-hidden bg-white mb-12">
            <CardHeader className="bg-gradient-to-r from-blue-50/60 to-slate-50 border-b border-slate-200/80 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {formData.participant_name || "Participante"}
                      </CardTitle>
                      {formData.sale_number && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 font-mono text-xs font-bold"
                        >
                          Inscrição #{formData.sale_number}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-slate-600 text-xs sm:text-sm mt-1">
                      {formData.participant_cpf
                        ? `CPF: ${formData.participant_cpf}`
                        : `Passaporte: ${formData.passport_number}`}{" "}
                      {formData.company_name
                        ? `• ${formData.company_name}`
                        : ""}
                    </CardDescription>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBackToStep1}
                  className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold gap-1.5 h-9 px-3.5 rounded-xl text-xs cursor-pointer self-start sm:self-auto"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Trocar CPF / Passaporte
                </Button>
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

                {/* 1. Dados Pessoais do Participante */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    1. Dados Pessoais do Participante
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-slate-700">
                        Nome Completo *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          value={formData.participant_name}
                          onChange={(e) =>
                            handleFieldChange(
                              "participant_name",
                              e.target.value,
                            )
                          }
                          placeholder="Nome completo do participante"
                          className="bg-white pl-9 border-slate-200 h-10 rounded-xl text-sm font-medium"
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
                          value={formData.company_name}
                          onChange={(e) =>
                            handleFieldChange("company_name", e.target.value)
                          }
                          placeholder="Nome da empresa"
                          className="bg-white pl-9 border-slate-200 h-10 rounded-xl text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">
                        {formData.passport_number
                          ? "Passaporte *"
                          : "CPF / Documento *"}
                      </Label>
                      <Input
                        type="text"
                        value={
                          formData.participant_cpf || formData.passport_number
                        }
                        onChange={(e) =>
                          handleFieldChange(
                            formData.passport_number
                              ? "passport_number"
                              : "participant_cpf",
                            e.target.value,
                          )
                        }
                        placeholder={
                          formData.passport_number
                            ? "Passaporte"
                            : "000.000.000-00"
                        }
                        className="bg-white border-slate-200 h-10 rounded-xl text-sm font-mono"
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
                          value={formData.participant_phone}
                          onChange={(e) =>
                            handleFieldChange(
                              "participant_phone",
                              e.target.value,
                            )
                          }
                          placeholder="(00) 00000-0000"
                          className="bg-white pl-9 border-slate-200 h-10 rounded-xl text-sm font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">
                        E-mail *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          value={formData.participant_email}
                          onChange={(e) =>
                            handleFieldChange(
                              "participant_email",
                              e.target.value,
                            )
                          }
                          placeholder="email@empresa.com.br"
                          className="bg-white pl-9 border-slate-200 h-10 rounded-xl text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Voo de Ida (IN / Chegada) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-blue-200">
                    <span className="p-1 rounded-md bg-blue-100 text-blue-700 font-bold text-xs">
                      🛫 IN
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      2. Voo de Ida (Chegada no Evento)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-blue-50/40 p-5 rounded-2xl border border-blue-100">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">
                        Data in Chegada *
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          type="text"
                          value={formData.in_date}
                          onChange={(e) =>
                            handleFieldChange("in_date", e.target.value)
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
                        value={formData.in_airline}
                        onChange={(e) =>
                          handleFieldChange("in_airline", e.target.value)
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
                        value={formData.in_locator}
                        onChange={(e) =>
                          handleFieldChange("in_locator", e.target.value)
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
                        value={formData.in_flight_number}
                        onChange={(e) =>
                          handleFieldChange("in_flight_number", e.target.value)
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
                        value={formData.in_origin_airport}
                        onChange={(e) =>
                          handleFieldChange("in_origin_airport", e.target.value)
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
                          value={formData.in_arrival_time}
                          onChange={(e) =>
                            handleFieldChange("in_arrival_time", e.target.value)
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
                        value={formData.in_destination_airport}
                        onChange={(e) =>
                          handleFieldChange(
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

                {/* 3. Voo de Volta (OUT / Saída) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-amber-200">
                    <span className="p-1 rounded-md bg-amber-100 text-amber-700 font-bold text-xs">
                      🛬 OUT
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      3. Voo de Retorno (Saída do Evento)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-amber-50/40 p-5 rounded-2xl border border-amber-100">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">
                        Data OUT Saída *
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          type="text"
                          value={formData.out_date}
                          onChange={(e) =>
                            handleFieldChange("out_date", e.target.value)
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
                        value={formData.out_airline}
                        onChange={(e) =>
                          handleFieldChange("out_airline", e.target.value)
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
                        value={formData.out_locator}
                        onChange={(e) =>
                          handleFieldChange("out_locator", e.target.value)
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
                        value={formData.out_flight_number}
                        onChange={(e) =>
                          handleFieldChange("out_flight_number", e.target.value)
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
                        value={formData.out_departure_airport}
                        onChange={(e) =>
                          handleFieldChange(
                            "out_departure_airport",
                            e.target.value,
                          )
                        }
                        placeholder="Ex: FLN - Aeroporto de Florianópolis"
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
                          value={formData.out_departure_time}
                          onChange={(e) =>
                            handleFieldChange(
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
                        value={formData.out_destination_airport}
                        onChange={(e) =>
                          handleFieldChange(
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Observações Adicionais para a Logística (opcional)
                  </Label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                    placeholder="Assistência especial, excesso de bagagem, prancha ou particularidades sobre seu transfer..."
                    className="w-full min-h-[75px] p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                {/* Botão de Envio */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToStep1}
                    className="text-slate-500 hover:text-slate-700 gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para identificação
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-12 rounded-xl shadow-md shadow-blue-200 gap-2 cursor-pointer text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando e enviando para logística...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Salvar Informações de Voo
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* TELA 3: CONFIRMAÇÃO DE SUCESSO */}
        {currentStep === 3 && (
          <Card className="border-emerald-200 shadow-xl rounded-3xl overflow-hidden bg-white mb-12">
            <div className="p-8 sm:p-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-sm">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Informações de Voo Salvas com Sucesso!
                </h2>
                <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mt-2 leading-relaxed">
                  Os dados de voo de{" "}
                  <strong>{formData.participant_name}</strong> foram registrados
                  e uma cópia foi enviada à equipe de logística da Abravidro.
                </p>
              </div>

              {/* Resumo do voo */}
              <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-1">
                  <div className="font-bold text-blue-900 pb-1 border-b border-blue-200 mb-1.5 flex items-center gap-1">
                    <span>🛫 Voo Ida (IN)</span>
                  </div>
                  <p>
                    <strong>Data:</strong> {formData.in_date}
                  </p>
                  <p>
                    <strong>Companhia:</strong> {formData.in_airline}
                  </p>
                  <p>
                    <strong>Localizador:</strong>{" "}
                    <span className="font-mono font-bold">
                      {formData.in_locator}
                    </span>
                  </p>
                  <p>
                    <strong>Horário Chegada:</strong> {formData.in_arrival_time}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs space-y-1">
                  <div className="font-bold text-amber-900 pb-1 border-b border-amber-200 mb-1.5 flex items-center gap-1">
                    <span>🛬 Voo Volta (OUT)</span>
                  </div>
                  <p>
                    <strong>Data:</strong> {formData.out_date}
                  </p>
                  <p>
                    <strong>Companhia:</strong> {formData.out_airline}
                  </p>
                  <p>
                    <strong>Localizador:</strong>{" "}
                    <span className="font-mono font-bold">
                      {formData.out_locator}
                    </span>
                  </p>
                  <p>
                    <strong>Horário Saída:</strong>{" "}
                    {formData.out_departure_time}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  type="button"
                  onClick={handleStartNewSubmission}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-11 rounded-xl shadow-md shadow-blue-200 gap-2 cursor-pointer text-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  Cadastrar voo de outro participante
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-6 h-11 rounded-xl text-sm"
                >
                  <Link href="/">Voltar à Página Inicial</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de Voos Cadastrados (se usuário logado) */}
        {user?.id && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plane className="h-5 w-5 text-blue-600" />
                Seus Voos e Transfers Registrados
              </h2>
              {myTransfers && myTransfers.length > 0 && (
                <Badge variant="secondary" className="font-bold text-xs">
                  {myTransfers.length}{" "}
                  {myTransfers.length === 1 ? "registro" : "registros"}
                </Badge>
              )}
            </div>

            {transfersLoading ? (
              <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                <span className="text-xs text-slate-500">
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
                            <strong>Companhia:</strong>{" "}
                            {item.out_airline || "-"}
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
            ) : null}
          </div>
        )}
      </div>
    </RegistrationLayout>
  )
}
