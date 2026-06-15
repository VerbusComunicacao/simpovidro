import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { useRouter } from "next/router"
import {
  Hotel,
  Users,
  Loader2,
  CreditCard,
  Building2,
  Info,
  ArrowLeft,
  Trash2,
} from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getGuestCountsString } from "@/lib/registration-helpers"
import { GuestDialog } from "@/components/guest/GuestDialog"
import { ReplaceGuestDialog } from "@/components/guest/ReplaceGuestDialog"
import { CompanyDialog } from "@/components/company/CompanyDialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const fetcher = async (url) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    error.info = await res.json()
    error.status = res.status
    throw error
  }

  return res.json()
}

export default function RegistrationDetailsPage() {
  const router = useRouter()
  const { id } = router.query

  const {
    data: sale,
    error,
    isLoading,
    mutate,
  } = useSWR(id ? `/api/v1/sales/${id}` : null, fetcher)

  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelEmailConfirm, setShowCancelEmailConfirm] = useState(false)
  const [isUpdatingBedPreference, setIsUpdatingBedPreference] = useState(false)
  const [showBedPreferenceConfirm, setShowBedPreferenceConfirm] =
    useState(false)
  const [showBedPreferenceEmailConfirm, setShowBedPreferenceEmailConfirm] =
    useState(false)
  const [pendingBedPreference, setPendingBedPreference] = useState("")

  const [showSwapEmailConfirm, setShowSwapEmailConfirm] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [pendingSwap, setPendingSwap] = useState(null)

  const [showEditQuestionDialog, setShowEditQuestionDialog] = useState(false)
  const [pendingQuestionResponse, setPendingQuestionResponse] = useState("")
  const [isUpdatingQuestion, setIsUpdatingQuestion] = useState(false)

  const handleEditQuestionClick = () => {
    setPendingQuestionResponse(sale.checkout_question_response || "")
    setShowEditQuestionDialog(true)
  }

  const executeChangeQuestionResponse = async () => {
    setIsUpdatingQuestion(true)
    try {
      const response = await fetch(`/api/v1/sales/${sale.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkout_question_response: pendingQuestionResponse,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Falha ao alterar a resposta")
      }

      alert("Resposta alterada com sucesso!")
      setShowEditQuestionDialog(false)
      mutate()
    } catch (error) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsUpdatingQuestion(false)
    }
  }

  const handleToggleBedPreferenceClick = () => {
    const nextPreference =
      sale.bed_preference === "Duplo Casal" ? "Duplo Solteiro" : "Duplo Casal"
    setPendingBedPreference(nextPreference)
    setShowBedPreferenceConfirm(true)
  }

  const handleConfirmBedPreferenceChange = () => {
    setShowBedPreferenceConfirm(false)
    setShowBedPreferenceEmailConfirm(true)
  }

  const executeChangeBedPreference = async (sendEmail) => {
    setShowBedPreferenceEmailConfirm(false)
    setIsUpdatingBedPreference(true)
    try {
      const response = await fetch(`/api/v1/sales/${sale.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bed_preference: pendingBedPreference,
          send_email: sendEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Falha ao alterar a acomodação")
      }

      alert("Acomodação alterada com sucesso!")
      mutate()
    } catch (error) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsUpdatingBedPreference(false)
    }
  }

  const handleConfirmSwap = (oldGuest, newGuest) => {
    setPendingSwap({ oldGuest, newGuest })
    setShowSwapEmailConfirm(true)
  }

  const executeSwapGuest = async (sendEmail) => {
    if (!pendingSwap) return
    setShowSwapEmailConfirm(false)
    setIsSwapping(true)
    try {
      const response = await fetch(`/api/v1/sales/${sale.id}/replace-guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_guest_id: pendingSwap.oldGuest.id,
          new_guest_id: pendingSwap.newGuest.id,
          send_email: sendEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Falha ao realizar a troca de hóspede")
      }

      alert("Hóspede substituído com sucesso!")
      mutate()
    } catch (error) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsSwapping(false)
      setPendingSwap(null)
    }
  }

  const handleCancelSaleClick = () => {
    if (
      confirm(
        "Tem certeza que deseja cancelar esta inscrição? Esta ação irá restaurar a disponibilidade do quarto e não pode ser desfeita.",
      )
    ) {
      setShowCancelEmailConfirm(true)
    }
  }

  const executeCancelSale = async (sendEmail) => {
    setShowCancelEmailConfirm(false)
    setIsCancelling(true)
    try {
      const response = await fetch(
        `/api/v1/sales/${sale.id}?send_email=${sendEmail}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Falha ao cancelar a inscrição")
      }

      alert("Inscrição cancelada com sucesso!")
      mutate()
    } catch (error) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsCancelling(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" })
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1">
            Confirmado
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive" className="px-3 py-1">
            Cancelado
          </Badge>
        )
      case "pending":
      default:
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-200 bg-yellow-50 px-3 py-1"
          >
            Pendente
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <TableLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-lg font-medium">
            Carregando informações da inscrição...
          </p>
        </div>
      </TableLayout>
    )
  }

  if (error || (!isLoading && !sale)) {
    return (
      <TableLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inscrição não encontrada
          </h2>
          <p className="text-gray-500 mb-8">
            Não conseguimos localizar os dados para o ID informado.
          </p>
          <Link href="/table/inscricoes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a listagem
            </Button>
          </Link>
        </div>
      </TableLayout>
    )
  }

  const companyObj = sale?.company_id
    ? {
        id: sale.company_id,
        corporate_name: sale.company_corporate_name,
        badge: sale.company_badge,
        cnpj: sale.company_cnpj,
        address: sale.company_address,
        address_number: sale.company_address_number,
        address_complement: sale.company_address_complement,
        neighborhood: sale.company_neighborhood,
        city: sale.company_city,
        state: sale.company_state,
        phone: sale.company_phone,
        email: sale.company_email,
        responsible_person: sale.company_responsible_person,
        zip_code: sale.company_zip_code,
        activity_sector: sale.company_activity_sector,
        country: sale.company_country,
        permission: sale.company_permission || "A",
        discount_id: sale.company_discount_id || "none",
        custom_discount_percentage: sale.company_custom_discount_percentage || "",
      }
    : null

  return (
    <TableLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header da Página */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/table/inscricoes"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar para inscrições
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-gray-900">
                Inscrição{" "}
                <span className="text-blue-600 font-mono">
                  #{sale.sale_number}
                </span>
              </h1>
              {getStatusBadge(sale.status)}
            </div>
            <p className="text-gray-500">
              Registrada em {new Date(sale.created_at).toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.print()}
            >
              Imprimir Detalhes
            </Button>
            {sale.status !== "cancelled" && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleCancelSaleClick}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Cancelar Inscrição
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-3xl space-y-8 pb-12">
          {/* Seção Hospedagem */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hotel className="h-5 w-5 text-blue-600" />
                Hospedagem
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">
                    Hotel
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {sale.hotel_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {sale.hotel_address}, {sale.hotel_city} - {sale.hotel_state}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">
                    Acomodação
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {sale.room_name || sale.room_type}
                  </p>
                  {sale.bed_preference && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-400 uppercase">
                        Tipo de acomodação
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm font-bold text-blue-600 uppercase">
                          {sale.bed_preference}
                        </p>
                        {sale.status !== "cancelled" && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 underline font-semibold cursor-pointer"
                            onClick={handleToggleBedPreferenceClick}
                            disabled={isUpdatingBedPreference}
                          >
                            Alterar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="mt-3">
                    <p className="text-xs font-bold text-gray-400 uppercase">
                      Quantidade de pessoas
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {getGuestCountsString(sale)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">
                    Check-in
                  </p>
                  <p className="text-base font-medium text-gray-700 mt-1">
                    {formatDate(sale.check_in_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">
                    Check-out
                  </p>
                  <p className="text-base font-medium text-gray-700 mt-1">
                    {formatDate(sale.check_out_date)}
                  </p>
                </div>
                {sale.hotel_checkout_question && (
                  <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                    <p className="text-base font-bold text-blue-700 uppercase">
                      {sale.hotel_checkout_question}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-bold italic">
                        Resposta:{" "}
                        {sale.checkout_question_response || "Não respondida"}
                      </p>
                      {sale.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={handleEditQuestionClick}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção Empresa */}
          {sale.company_id && (
            <Card className="bg-blue-50/20 border-blue-100">
              <CardHeader className="pb-3 border-b border-blue-100 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                  <Building2 className="h-5 w-5" />
                  Dados da Empresa
                </CardTitle>
                {sale.status !== "cancelled" && (
                  <CompanyDialog
                    companyToEdit={companyObj}
                    onCompanySuccess={() => mutate()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Editar
                    </Button>
                  </CompanyDialog>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">
                      Razão Social
                    </p>
                    <p className="font-bold text-gray-900">
                      {sale.company_corporate_name}
                    </p>
                  </div>
                  {sale.company_responsible_person && (
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase">
                        Responsável
                      </p>
                      <p className="font-bold text-gray-900">
                        {sale.company_responsible_person}
                      </p>
                    </div>
                  )}
                  {sale.company_badge && (
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase">
                        Crachá da Empresa
                      </p>
                      <p className="font-bold text-gray-900">
                        {sale.company_badge.toUpperCase()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">
                      CNPJ
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {sale.company_cnpj?.replace(
                        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                        "$1.$2.$3/$4-$5",
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">
                      Telefone
                    </p>
                    <p className="text-sm text-gray-700">
                      {sale.company_phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">
                      Endereço
                    </p>
                    <p className="text-sm text-gray-700">
                      {sale.company_address}, {sale.company_address_number}
                      {sale.company_address_complement &&
                        ` - ${sale.company_address_complement}`}
                    </p>
                    <p className="text-sm text-gray-700">
                      {sale.company_neighborhood} — {sale.company_city} /{" "}
                      {sale.company_state}
                    </p>
                    <p className="text-sm text-gray-700">
                      CEP: {sale.company_zip_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção Hóspedes */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Hóspedes ({sale.guests?.length})
            </h2>

            {sale.guests?.map((guest, idx) => (
              <Card
                key={guest.id}
                className="overflow-hidden border-l-4 border-l-blue-500"
              >
                <div className="bg-gray-50 px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-gray-900">
                    {idx + 1}. {guest.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="bg-white">
                      {guest.gender}
                    </Badge>
                    <Badge variant="outline" className="bg-white uppercase">
                      {guest.badge_name
                        ? guest.badge_name.toUpperCase()
                        : "SEM NOME NO CRACHÁ"}
                    </Badge>
                    {sale.status !== "cancelled" && (
                      <>
                        <GuestDialog
                          guestToEdit={guest}
                          onGuestSuccess={() => mutate()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5"
                          >
                            Editar
                          </Button>
                        </GuestDialog>
                        <ReplaceGuestDialog
                          sale={sale}
                          oldGuest={guest}
                          onConfirm={(newGuest) =>
                            handleConfirmSwap(guest, newGuest)
                          }
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            Trocar
                          </Button>
                        </ReplaceGuestDialog>
                      </>
                    )}
                  </div>
                </div>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-3">
                      Documentação
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900">CPF:</span>{" "}
                        {guest.cpf_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900">RG:</span>{" "}
                        {guest.rg_number || "-"}
                      </p>
                      {guest.passport_number && (
                        <p className="text-sm text-gray-600">
                          <span className="font-bold text-gray-900">
                            Passaporte:
                          </span>{" "}
                          {guest.passport_number}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900">
                          Nascimento:
                        </span>{" "}
                        {formatDate(guest.birth_date)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900">
                          Nacionalidade:
                        </span>{" "}
                        {guest.nationality || "Brasileira"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-3">
                      Saúde
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900">Sangue:</span>{" "}
                        {guest.blood_type} {guest.blood_rh_factor}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {guest.has_heart_condition && (
                          <Badge className="text-[10px] bg-red-50 text-red-700">
                            Cardíaco
                          </Badge>
                        )}
                        {guest.has_diabetes && (
                          <Badge className="text-[10px] bg-red-50 text-red-700">
                            Diabetes
                          </Badge>
                        )}
                        {guest.has_high_blood_pressure && (
                          <Badge className="text-[10px] bg-red-50 text-red-700">
                            Pressão Alta
                          </Badge>
                        )}
                        {guest.has_low_blood_pressure && (
                          <Badge className="text-[10px] bg-red-50 text-red-700">
                            Pressão Baixa
                          </Badge>
                        )}
                      </div>
                      {guest.medication_details && (
                        <div className="mt-3">
                          <p className="text-[10px] font-bold text-gray-400">
                            MEDICAMENTOS:
                          </p>
                          <p className="text-xs italic text-gray-700">
                            {guest.medication_details}
                          </p>
                        </div>
                      )}
                      {guest.special_needs_details && (
                        <div className="mt-3">
                          <p className="text-[10px] font-bold text-blue-400">
                            NECESSIDADES:
                          </p>
                          <p className="text-xs italic text-blue-700">
                            {guest.special_needs_details}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-3">
                      Contato
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900">Email:</span>{" "}
                        {guest.email || "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900">Fone:</span>{" "}
                        {guest.phone || "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
                {guest.health_observations && (
                  <div className="px-6 py-3 bg-yellow-50/50 border-t border-yellow-100 italic text-sm text-yellow-800">
                    <strong>OBS:</strong> {guest.health_observations}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Seção Financeira */}
          <Card className="border-t-4 border-t-green-500">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <CreditCard className="h-5 w-5 text-green-600" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                      Método
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700 uppercase text-sm">
                        {sale.payment_method === "installments"
                          ? "Parcelado"
                          : "À Vista no Boleto"}
                      </span>
                      <Badge variant="outline">
                        {sale.installments_count}x
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-gray-500">Valor Bruto</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatCurrency(sale.total_amount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-gray-900">
                        Total Pago
                      </p>
                      <p className="text-xl font-black text-blue-600">
                        {formatCurrency(sale.final_amount)}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg flex gap-2 text-[11px] text-blue-700 leading-tight">
                      <Info className="h-4 w-4 shrink-0" />
                      Inscrição{" "}
                      {sale.payment_status === "paid"
                        ? "totalmente quitada."
                        : "com pagamentos pendentes."}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase">
                    Fluxo de Pagamento
                  </p>
                  <div className="divide-y border rounded-lg overflow-hidden">
                    {sale.installments?.map((inst) => (
                      <div
                        key={inst.id}
                        className="p-3 flex items-center justify-between bg-white text-sm"
                      >
                        <div>
                          <p className="font-bold text-gray-900">
                            {inst.installment_number}ª Parcela
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(inst.due_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-gray-900">
                            {formatCurrency(inst.amount)}
                          </p>
                          <span
                            className={`text-[10px] font-bold uppercase ${inst.status === "paid" ? "text-green-600" : "text-gray-400"}`}
                          >
                            {inst.status === "paid" ? "Pago" : "Aguardando"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={showBedPreferenceConfirm}
        onOpenChange={setShowBedPreferenceConfirm}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Confirmar Alteração de Acomodação
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 pt-2 font-medium">
              Você deseja alterar o tipo de acomodação de{" "}
              <strong className="text-gray-900">{sale?.bed_preference}</strong>{" "}
              para{" "}
              <strong className="text-gray-900">{pendingBedPreference}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowBedPreferenceConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmBedPreferenceChange}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showBedPreferenceEmailConfirm}
        onOpenChange={setShowBedPreferenceEmailConfirm}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Aviso de Alteração por E-mail
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 pt-2">
              Deseja enviar e-mail avisando da alteração para o participante?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowBedPreferenceEmailConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => executeChangeBedPreference(false)}
            >
              Não enviar
            </Button>
            <Button
              type="button"
              onClick={() => executeChangeBedPreference(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sim, enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showSwapEmailConfirm}
        onOpenChange={setShowSwapEmailConfirm}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Aviso de Alteração por E-mail
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 pt-2">
              Deseja enviar e-mail avisando da alteração para o participante?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowSwapEmailConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => executeSwapGuest(false)}
              disabled={isSwapping}
            >
              Não enviar
            </Button>
            <Button
              type="button"
              onClick={() => executeSwapGuest(true)}
              disabled={isSwapping}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sim, enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCancelEmailConfirm}
        onOpenChange={setShowCancelEmailConfirm}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Aviso de Alteração por E-mail
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 pt-2">
              Deseja enviar e-mail avisando da alteração para o participante?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCancelEmailConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => executeCancelSale(false)}
            >
              Não enviar
            </Button>
            <Button
              type="button"
              onClick={() => executeCancelSale(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sim, enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditQuestionDialog}
        onOpenChange={setShowEditQuestionDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Editar Resposta
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 pt-2 font-medium">
              Altere a resposta para a pergunta:
              <span className="block mt-2 font-bold text-blue-700 uppercase">
                {sale?.hotel_checkout_question}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="checkout_question_response">Resposta</Label>
              <Textarea
                id="checkout_question_response"
                name="checkout_question_response"
                value={pendingQuestionResponse}
                onChange={(e) => setPendingQuestionResponse(e.target.value)}
                placeholder="Digite a resposta do hóspede..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowEditQuestionDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={executeChangeQuestionResponse}
              disabled={isUpdatingQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdatingQuestion ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableLayout>
  )
}
