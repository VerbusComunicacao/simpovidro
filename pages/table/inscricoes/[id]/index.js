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
} from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
  } = useSWR(id ? `/api/v1/sales/${id}` : null, fetcher)

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("pt-BR")
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
                  <Badge variant="outline" className="mt-1">
                    {sale.room_category}
                  </Badge>
                  {sale.bed_preference && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-400 uppercase">
                        Preferência de Cama
                      </p>
                      <p className="text-sm font-bold text-blue-600 uppercase mt-0.5">
                        {sale.bed_preference === "casal"
                          ? "Cama de Casal"
                          : "2 Camas de Solteiro"}
                      </p>
                    </div>
                  )}
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
              </div>
            </CardContent>
          </Card>

          {/* Seção Empresa */}
          {sale.company_id && (
            <Card className="bg-blue-50/20 border-blue-100">
              <CardHeader className="pb-3 border-b border-blue-100">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                  <Building2 className="h-5 w-5" />
                  Dados da Empresa
                </CardTitle>
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
                <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    {idx + 1}. {guest.name}
                  </span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-white">
                      {guest.gender}
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      {guest.badge_name || "Sem nome no crachá"}
                    </Badge>
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
                      Contato e Emergência
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
                      <div className="mt-4 pt-4 border-t border-dashed">
                        <p className="text-sm font-bold text-gray-900">
                          {guest.emergency_contact_name || "-"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {guest.emergency_contact_phone || "-"}
                        </p>
                      </div>
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
                          : "À Vista / PIX"}
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
    </TableLayout>
  )
}
