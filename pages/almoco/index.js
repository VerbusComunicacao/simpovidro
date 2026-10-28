import { useState } from "react"
import Head from "next/head"
import Image from "next/image"
import { useRouter } from "next/router"
import RegistrationLayout from "@/components/registration/RegistrationLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Utensils,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  RotateCcw,
  Check,
} from "lucide-react"

function formatCPF(value) {
  if (!value) return ""
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  if (numbers.length <= 9)
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
}

const SPEAKER_IMAGES = {
  "Rodrigo Fontana": "",
  "Jean Vinicius Tremura": "/images/palestrantes/jean-tremura.jpg",
  "Carlos Alberto Schoeps": "/images/palestrantes/carlos-schoeps.jpg",
  "Davide Cappellino": "/images/palestrantes/davide-cappellino.jpg",
  "Leopoldo Castiella": "/images/palestrantes/leopoldo-castiella.jpg",
  "Tiago Amor": "/images/palestrantes/tiago-amor.jpg",
  "Aristóteles Terceiro Neto": "/images/palestrantes/aristoteles-neto.jpg",
  "Betânia Danelon": "/images/palestrantes/betania.jpg",
  "Lucilene Prado": "/images/palestrantes/lucilene-prado.png",
  "Halim José Abud Neto": "/images/palestrantes/halim-abud-neto.jpeg",
}

export default function AlmocoPage() {
  const router = useRouter()
  const isEn = router.locale === "en" || router.query.lang === "en"
  const t = (pt, en) => (isEn ? en : pt)

  // Steps: 1 = Lookup, 2 = Select Table, 3 = Confirmed
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Document Lookup State
  const [docValue, setDocValue] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [lookupError, setLookupError] = useState("")

  // Participant & Lunches Data
  const [participant, setParticipant] = useState(null)
  const [availableLunches, setAvailableLunches] = useState([])
  const [existingRegistrations, setExistingRegistrations] = useState([])

  // Step 2: Selection State (Multiple Tables)
  const [selectedLunchIds, setSelectedLunchIds] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // Step 3: Success Result
  const [submissionResult, setSubmissionResult] = useState(null)

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

  const toggleLunchSelection = (lunchId) => {
    setSelectedLunchIds((prev) => {
      if (prev.includes(lunchId)) {
        return prev.filter((id) => id !== lunchId)
      } else {
        return [...prev, lunchId]
      }
    })
    setSubmitError("")
  }

  const handleLookupSubmit = async (e) => {
    e.preventDefault()
    setLookupError("")

    const raw = docValue.trim()
    if (!raw) {
      setLookupError(
        t(
          "Informe seu CPF ou Passaporte para continuar.",
          "Please enter your CPF or Passport to continue.",
        ),
      )
      return
    }

    setIsSearching(true)

    try {
      const res = await fetch("/api/v1/lunch-registrations/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: raw }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.message ||
            t(
              "Erro ao consultar documento. Verifique os dados digitados.",
              "Error looking up document. Please check the provided information.",
            ),
        )
      }

      if (!data.found || !data.participant) {
        setLookupError(
          data.message ||
            t(
              "Nenhuma inscrição confirmada encontrada para este documento no 17º Simpovidro. Verifique o CPF/Passaporte digitado.",
              "No confirmed registration found for this document in 17th Simpovidro.",
            ),
        )
        return
      }

      setParticipant(data.participant)
      setAvailableLunches(data.available_lunches || [])

      const regs =
        data.existing_registrations ||
        (data.existing_registration ? [data.existing_registration] : [])
      setExistingRegistrations(regs)

      if (regs.length > 0) {
        setSelectedLunchIds(regs.map((r) => r.lunch_id))
      } else {
        setSelectedLunchIds([])
      }

      setCurrentStep(2)
      setSubmitError("")
    } catch (err) {
      setLookupError(
        err.message || t("Erro ao consultar inscrição.", "Lookup error."),
      )
    } finally {
      setIsSearching(false)
    }
  }

  const handleConfirmLunch = async () => {
    if (selectedLunchIds.length === 0) {
      setSubmitError(
        t(
          "Por favor, selecione ao menos uma mesa para continuar.",
          "Please select at least one table to continue.",
        ),
      )
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const res = await fetch("/api/v1/lunch-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: participant.guest_id,
          sale_id: participant.sale_id,
          lunch_ids: selectedLunchIds,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.message ||
            t(
              "Erro ao salvar inscrição nas mesas.",
              "Error saving lunch table registrations.",
            ),
        )
      }

      setSubmissionResult(data)
      setExistingRegistrations(data.registrations || [])
      setCurrentStep(3)
    } catch (err) {
      setSubmitError(
        err.message ||
          t("Erro ao confirmar mesas.", "Error confirming tables."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RegistrationLayout
      title={t(
        "Almoço com Painelistas | Simpovidro",
        "Lunch with Panelists | Simpovidro",
      )}
    >
      <Head>
        <title>
          {t(
            "Almoço com Painelistas e Mesas Temáticas | 17º Simpovidro",
            "Lunch with Panelists & Thematic Tables | 17th Simpovidro",
          )}
        </title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner do Topo */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#01356b] via-[#014991] to-[#012d59] p-6 sm:p-10 text-white shadow-xl mb-8">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
              {t(
                "Mesas Temáticas & Mentoria com os Painelistas",
                "Thematic Tables & Mentorship with Panelists",
              )}
            </h1>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
              {t(
                "Participe de conversas exclusivas e aproxime-se das maiores lideranças e especialistas do setor vidreiro.",
                "Join exclusive conversations and get closer to leading experts in the glass industry.",
              )}
            </p>
          </div>
          <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none hidden sm:block">
            <Utensils className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-lg mx-auto relative">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />

            {/* Step 1 */}
            <div className="flex flex-col items-center gap-1 z-10 bg-slate-50 px-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-all ${
                  currentStep >= 1
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                1
              </div>
              <span
                className={`text-xs font-semibold ${
                  currentStep >= 1 ? "text-blue-900" : "text-slate-500"
                }`}
              >
                {t("Identificação", "Identification")}
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-1 z-10 bg-slate-50 px-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-all ${
                  currentStep >= 2
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                2
              </div>
              <span
                className={`text-xs font-semibold ${
                  currentStep >= 2 ? "text-blue-900" : "text-slate-500"
                }`}
              >
                {t("Escolha da Mesa", "Select Table")}
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-1 z-10 bg-slate-50 px-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-all ${
                  currentStep === 3
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                3
              </div>
              <span
                className={`text-xs font-semibold ${
                  currentStep === 3 ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {t("Confirmação", "Confirmed")}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ETAPA 1: LOCALIZAÇÃO DO CONGRESSISTA POR CPF/PASSAPORTE */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <div className="max-w-xl mx-auto my-4">
            <Card className="border border-slate-200/90 shadow-md rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleLookupSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Search className="h-5 w-5 text-blue-600" />
                      {t("Localizar sua Inscrição", "Find your Registration")}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {t(
                        "Digite seu CPF ou Passaporte cadastrado no Simpovidro para acessar as mesas.",
                        "Enter your CPF or Passport registered in Simpovidro to view tables.",
                      )}
                    </p>
                  </div>

                  {lookupError && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <span>{lookupError}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <Input
                        id="document-input"
                        type="text"
                        value={docValue}
                        onChange={handleDocChange}
                        placeholder={t(
                          "Digite seu CPF ou Passaporte",
                          "Enter your CPF or Passport",
                        )}
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
                            {t("Consultando...", "Searching...")}
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4" />
                            {t("Avançar", "Next")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {t(
                        "Vagas limitadas em cada mesa.",
                        "Limited seats at each table.",
                      )}
                    </span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 2: ESCOLHA DA MESA TEMÁTICA */}
        {/* ============================================================ */}
        {currentStep === 2 && participant && (
          <div className="space-y-6">
            {/* Card com Dados do Participante */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {participant.participant_name}
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-[10px]">
                      {t("Inscrição Confirmada", "Confirmed Registration")}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {participant.company_name
                      ? `${participant.company_name} • `
                      : ""}
                    {participant.participant_cpf
                      ? `CPF: ${formatCPF(participant.participant_cpf)}`
                      : `Passaporte: ${participant.passport_number}`}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentStep(1)
                  setParticipant(null)
                  setExistingRegistrations([])
                  setSelectedLunchIds([])
                }}
                className="text-xs text-slate-600 hover:text-slate-900 border-slate-200 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                {t("Trocar Participante", "Change Participant")}
              </Button>
            </div>

            {existingRegistrations.length > 0 && (
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 space-y-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-blue-950">
                    {t(
                      "Suas inscrições já confirmadas:",
                      "Your confirmed table registrations:",
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {existingRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-200 text-xs text-blue-950 font-medium shadow-2xs"
                    >
                      <span className="font-bold">{reg.lunch_title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submitError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Lista dos Almoços / Mesas Temáticas */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-blue-600" />
                  {t(
                    "Escolha suas mesas temáticas",
                    "Choose your thematic tables",
                  )}
                </h2>
                <div className="text-xs font-semibold text-slate-500">
                  {selectedLunchIds.length === 0
                    ? t("Nenhuma mesa selecionada", "No table selected")
                    : selectedLunchIds.length === 1
                      ? t("1 mesa selecionada", "1 table selected")
                      : `${selectedLunchIds.length} ${t("mesas selecionadas", "tables selected")}`}
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {t(
                    "Você pode se inscrever em mais de uma mesa. As vagas estarão sujeitas à disponibilidade.",
                    "You can sign up for more than one table. Seats are subject to availability.",
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {availableLunches.map((item) => {
                  const isSelected = selectedLunchIds.includes(item.id)
                  const existingReg = existingRegistrations.find(
                    (r) => r.lunch_id === item.id,
                  )
                  const speakersList = (item.speakers || "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleLunchSelection(item.id)}
                      className={`relative rounded-2xl border-2 transition-all p-5 cursor-pointer shadow-sm ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {existingReg && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                {t("Inscrito", "Registered")}
                              </span>
                            )}
                            {isSelected && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
                                {t("Selecionada", "Selected")}
                              </span>
                            )}
                          </div>

                          {/* Título & Tema */}
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                              {item.title}
                            </h3>
                          </div>

                          {/* Painelistas com foto e nome */}
                          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                            <span className="text-xs font-semibold text-slate-500">
                              {t("Com:", "With:")}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {speakersList.map((speaker, sIdx) => {
                                const cleanSpeaker = speaker
                                  .replace(/\s*\(.*?\)/g, "")
                                  .trim()
                                const photoUrl = SPEAKER_IMAGES[cleanSpeaker]

                                return (
                                  <div
                                    key={sIdx}
                                    className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/80 text-xs text-slate-800 font-medium shadow-2xs"
                                  >
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-300 relative shrink-0">
                                      {photoUrl ? (
                                        <Image
                                          src={photoUrl}
                                          alt={speaker}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-800 text-[10px] text-white">
                                          {cleanSpeaker.charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                    <span>{speaker}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Checkbox indicator */}
                        <div className="flex md:flex-col items-center justify-between md:justify-start gap-2.5 shrink-0 pt-2 md:pt-0">
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-4 h-4 stroke-[3]" />
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? "text-blue-600" : "text-slate-400"
                            }`}
                          >
                            {isSelected
                              ? t("Selecionada", "Selected")
                              : t("Selecionar", "Select")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ações */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto h-12 px-6 rounded-xl text-slate-700 cursor-pointer"
              >
                {t("Voltar", "Back")}
              </Button>
              <Button
                onClick={handleConfirmLunch}
                disabled={isSubmitting || selectedLunchIds.length === 0}
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md gap-2 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("Confirmando interesse...", "Confirming...")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {selectedLunchIds.length > 1
                      ? t(
                          `Confirmar Interesse nas ${selectedLunchIds.length} Mesas`,
                          `Confirm Interest in ${selectedLunchIds.length} Tables`,
                        )
                      : existingRegistrations.length > 0
                        ? t(
                            "Atualizar Escolha de Mesas",
                            "Update Tables Selection",
                          )
                        : t(
                            "Confirmar Escolha da Mesa",
                            "Confirm Table Selection",
                          )}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 3: CONFIRMAÇÃO / COMPROVANTE */}
        {/* ============================================================ */}
        {currentStep === 3 && submissionResult && (
          <div className="max-w-2xl mx-auto my-6 space-y-6">
            <Card className="border border-emerald-200 shadow-lg rounded-3xl bg-white overflow-hidden text-center p-6 sm:p-10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {t(
                  "Interesse Registrado com Sucesso!",
                  "Registration Successfully Received!",
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {t(
                  "Suas escolhas de mesas temáticas foram gravadas com sucesso.",
                  "Your thematic table choices have been saved successfully.",
                )}
              </p>

              {/* Box com o comprovante e as mesas */}
              <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">
                      {t("Participante", "Participant")}
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {participant?.participant_name}
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                    {submissionResult.registrations?.length || 1}{" "}
                    {t("mesa(s)", "table(s)")}
                  </span>
                </div>

                <div className="space-y-3">
                  <span className="text-xs text-slate-400 uppercase font-semibold">
                    {t("Mesas Escolhidas", "Selected Tables")}
                  </span>

                  {(
                    submissionResult.registrations || [
                      {
                        lunch: submissionResult.lunch,
                        position: submissionResult.position,
                      },
                    ]
                  ).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">
                          {item.lunch?.title || item.lunch_title}
                        </p>
                      </div>
                      <p className="text-xs text-blue-700 font-medium">
                        {t("Painelistas:", "Panelists:")}{" "}
                        {item.lunch?.speakers || item.lunch_speakers}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {t(
                      "Mesas Temáticas • 17º Simpovidro",
                      "Thematic Tables • 17th Simpovidro",
                    )}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto rounded-xl border-slate-300 text-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t("Alterar Escolhas de Mesas", "Change Tables Selection")}
                </Button>
                <Button
                  onClick={() => router.push("/")}
                  className="w-full sm:w-auto rounded-xl bg-[#01356b] hover:bg-blue-800 text-white font-bold cursor-pointer"
                >
                  {t("Voltar para Página Principal", "Back to Home Page")}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RegistrationLayout>
  )
}
