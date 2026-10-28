import { useState, useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  Utensils,
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Sliders,
  Check,
  ChevronDown,
} from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { LunchDialog } from "@/components/lunch/LunchDialog"

const fetcher = async (url) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Ocorreu um erro ao buscar os dados.")
    error.info = await res.json()
    error.status = res.status
    throw error
  }
  return res.json()
}

export default function AlmocosAdminPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [deleteAction, setDeleteAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [expandedIds, setExpandedIds] = useState({})

  const {
    data: lunches,
    error: lunchesError,
    mutate,
    isLoading,
  } = useSWR("/api/v1/lunches?include_inactive=true", fetcher)

  const { data: registrations } = useSWR("/api/v1/lunch-registrations", fetcher)

  const registrationsByLunch = useMemo(() => {
    const grouped = {}
    for (const reg of registrations || []) {
      if (!grouped[reg.lunch_id]) grouped[reg.lunch_id] = []
      grouped[reg.lunch_id].push(reg)
    }
    return grouped
  }, [registrations])

  const { data: settings, mutate: mutateSettings } = useSWR(
    "/api/v1/lunches/settings",
    fetcher,
  )

  const handleRuleChange = async (value) => {
    setIsSavingSettings(true)
    let payload = {}

    if (value === "single") {
      payload = { allow_multiple_lunches: false, max_lunches_per_guest: 1 }
    } else if (value === "unlimited") {
      payload = { allow_multiple_lunches: true, max_lunches_per_guest: null }
    } else if (value.startsWith("max_")) {
      const num = parseInt(value.replace("max_", ""), 10)
      payload = { allow_multiple_lunches: true, max_lunches_per_guest: num }
    }

    try {
      const res = await fetch("/api/v1/lunches/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        mutateSettings()
      } else {
        const errorData = await res.json()
        setDeleteError(errorData.message || "Erro ao salvar configuração.")
        setIsErrorDialogOpen(true)
      }
    } catch (err) {
      setDeleteError("Erro de comunicação ao salvar configuração.")
      setIsErrorDialogOpen(true)
    } finally {
      setIsSavingSettings(false)
    }
  }

  const filteredLunches = useMemo(() => {
    if (!Array.isArray(lunches)) return []
    if (!searchTerm.trim()) return lunches

    const term = searchTerm.toLowerCase().trim()
    return lunches.filter(
      (item) =>
        item.title?.toLowerCase().includes(term) ||
        item.speakers?.toLowerCase().includes(term),
    )
  }, [lunches, searchTerm])

  const stats = useMemo(() => {
    if (!Array.isArray(lunches))
      return { total: 0, totalRegistered: 0, active: 0 }
    const total = lunches.length
    const totalRegistered = lunches.reduce(
      (acc, item) => acc + (Number(item.registered_count) || 0),
      0,
    )
    const active = lunches.filter((item) => item.active !== false).length
    return { total, totalRegistered, active }
  }, [lunches])

  const handleDelete = async (lunchId) => {
    setDeletingId(lunchId)
    try {
      const response = await fetch(`/api/v1/lunches/${lunchId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        mutate()
      } else {
        const data = await response.json()
        setDeleteError(
          data.message || "Ocorreu um erro ao excluir a mesa de almoço.",
        )
        setDeleteAction(data.action || "")
        setIsErrorDialogOpen(true)
      }
    } catch (err) {
      setDeleteError("Erro de comunicação ao tentar excluir a mesa.")
      setIsErrorDialogOpen(true)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <TableLayout>
      <div className="space-y-6">
        {/* Header e Ações Principais */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Mesas Temáticas & Almoços
                </h1>
                <p className="text-sm text-gray-500">
                  Gerencie as mesas de almoço com os painelistas e acompanhe a
                  ordem de inscritos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/almoco" target="_blank" passHref>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-gray-600"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ver Formulário
                Público
              </Button>
            </Link>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Total de Mesas
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {stats.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-slate-500">
                {stats.active} ativas no formulário público
              </span>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Inscrições Realizadas
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-700">
                {stats.totalRegistered}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-slate-500">
                Total acumulado nas filas de interesse
              </span>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Regra Atual de Inscrição
              </CardDescription>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {settings?.allow_multiple_lunches
                  ? settings.max_lunches_per_guest
                    ? `Até ${settings.max_lunches_per_guest} Mesas`
                    : "Múltiplas (Livre)"
                  : "Apenas 1 Mesa"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-slate-500">
                {settings?.allow_multiple_lunches
                  ? "Participante pode escolher mais de uma mesa"
                  : "Participante escolhe apenas uma única mesa"}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Configuração Flexível da Regra de Inscrição */}
        <Card className="border-slate-200 shadow-xs bg-slate-50/70">
          <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Regra de Inscrição por Participante
                  </h3>
                  <Badge
                    variant="outline"
                    className={
                      settings?.allow_multiple_lunches
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold text-[11px]"
                        : "bg-amber-50 text-amber-800 border-amber-200 font-bold text-[11px]"
                    }
                  >
                    {settings?.allow_multiple_lunches
                      ? settings.max_lunches_per_guest
                        ? `Múltiplas (Até ${settings.max_lunches_per_guest} mesas)`
                        : "Múltiplas Mesas (Livre)"
                      : "Apenas 1 Mesa por Participante"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {settings?.allow_multiple_lunches
                    ? "Congressistas podem selecionar mais de uma mesa no formulário público."
                    : "Congressistas podem escolher somente uma única mesa (a nova escolha substitui a anterior)."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <label className="text-xs font-semibold text-slate-600">
                Modo no Formulário:
              </label>
              <select
                value={
                  !settings?.allow_multiple_lunches
                    ? "single"
                    : settings?.max_lunches_per_guest
                      ? `max_${settings.max_lunches_per_guest}`
                      : "unlimited"
                }
                disabled={isSavingSettings || !settings}
                onChange={(e) => handleRuleChange(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
              >
                <option value="single">Apenas 1 mesa por participante</option>
                <option value="unlimited">Múltiplas mesas (Sem limite)</option>
                <option value="max_2">Múltiplas mesas (Máximo 2 mesas)</option>
                <option value="max_3">Múltiplas mesas (Máximo 3 mesas)</option>
                <option value="max_4">Múltiplas mesas (Máximo 4 mesas)</option>
                <option value="max_5">Múltiplas mesas (Até 5 mesas)</option>
              </select>
              {isSavingSettings && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Barra de Filtro / Busca com Botão Nova Mesa */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <LunchDialog onLunchSuccess={() => mutate()}>
              <Button className="bg-blue-600 hover:bg-blue-700 shrink-0">
                <Plus className="mr-2 h-4 w-4" /> Nova Mesa
              </Button>
            </LunchDialog>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por mesa ou painelista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2 shrink-0">
            <span>
              Exibindo <strong>{filteredLunches.length}</strong> de{" "}
              <strong>{stats.total}</strong> mesas
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-500">
              Carregando mesas temáticas...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredLunches.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-center">
            <Utensils className="h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-base font-bold text-gray-800">
              {searchTerm
                ? "Nenhuma mesa encontrada com esses termos"
                : "Nenhuma mesa cadastrada ainda"}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              {searchTerm
                ? "Tente buscar por outro termo ou limpe a busca para visualizar todas."
                : "Comece cadastrando a primeira mesa temática para o almoço com os painelistas."}
            </p>
            {!searchTerm && (
              <div className="mt-4">
                <LunchDialog onLunchSuccess={() => mutate()}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Cadastrar Mesa
                  </Button>
                </LunchDialog>
              </div>
            )}
          </div>
        )}

        {/* Grid de Mesas */}
        {!isLoading && filteredLunches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLunches.map((item) => {
              const speakersList = (item.speakers || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)

              return (
                <Card
                  key={item.id}
                  className={`overflow-hidden transition-all duration-200 hover:shadow-md border ${
                    item.active
                      ? "border-slate-200 bg-white"
                      : "border-slate-200 bg-slate-50/70 opacity-80"
                  }`}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-slate-900 leading-tight">
                          {item.title}
                        </CardTitle>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {item.active ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-600 border-slate-300 text-[11px] font-semibold gap-1"
                          >
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Inativa
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    {item.lunch_date && (
                      <p className="text-xs font-semibold text-slate-600">
                        {item.lunch_date.split("-").reverse().join("/")}
                        {item.lunch_time &&
                          ` • ${item.lunch_time.replace(":00", "")}hs`}
                      </p>
                    )}

                    {/* Lista de Palestrantes */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Convidados / Painelistas
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {speakersList.map((speaker, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/80 font-medium"
                          >
                            {speaker}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interessados cadastrados */}
                    {expandedIds[item.id] && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Interessados
                        </span>
                        {(registrationsByLunch[item.id] || []).length === 0 ? (
                          <p className="text-xs text-slate-500 mt-1.5">
                            Nenhum interessado cadastrado.
                          </p>
                        ) : (
                          <ul className="mt-1.5 space-y-1.5 max-h-60 overflow-y-auto">
                            {registrationsByLunch[item.id].map((reg) => (
                              <li
                                key={reg.id}
                                className="text-xs bg-slate-50 border border-slate-200/80 rounded-md px-2.5 py-1.5"
                              >
                                <p className="font-semibold text-slate-800">
                                  {reg.participant_name}
                                </p>
                                <p className="text-slate-500">
                                  {[
                                    reg.company_name,
                                    reg.participant_email,
                                    reg.participant_phone,
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Rodapé com Inscritos e Ações */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIds((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold hover:text-blue-600 cursor-pointer"
                        aria-expanded={!!expandedIds[item.id]}
                      >
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>
                          {item.registered_count ?? 0}{" "}
                          {item.registered_count === 1
                            ? "interessado"
                            : "interessados"}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            expandedIds[item.id] ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <div className="flex items-center gap-1">
                        <LunchDialog
                          lunchToEdit={item}
                          onLunchSuccess={() => mutate()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title="Editar Mesa"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </LunchDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Excluir Mesa"
                              disabled={deletingId === item.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Excluir mesa &quot;{item.title}&quot;?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta mesa
                                temática?
                                {Number(item.registered_count) > 0 && (
                                  <strong className="block mt-2 text-amber-700">
                                    Atenção: existem {item.registered_count}{" "}
                                    participante(s) registrado(s) nesta mesa.
                                  </strong>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Excluir Mesa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <ErrorDialog
          isOpen={isErrorDialogOpen}
          onClose={() => setIsErrorDialogOpen(false)}
          title="Erro na Operação"
          message={deleteError || lunchesError?.info?.message}
          actionMessage={deleteAction || lunchesError?.info?.action}
          onRetry={() => mutate()}
        />
      </div>
    </TableLayout>
  )
}
