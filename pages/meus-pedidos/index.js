import { Temporal } from "@js-temporal/polyfill"
import useSWR from "swr"
import RegistrationLayout from "@/components/registration/RegistrationLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Hotel,
  Calendar,
  BedDouble,
  AlertCircle,
  Loader2,
  Users,
  MapPin,
  Phone,
} from "lucide-react"
import Link from "next/link"
import { Empty } from "@/components/ui/empty"
import { useRouter } from "next/router"
import { translateText } from "@/lib/registration-helpers"

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

export default function MyOrdersPage() {
  const router = useRouter()
  const isInternational = router.locale === "en" || router.query.lang === "en"

  const {
    data: orders,
    error,
    isLoading,
  } = useSWR("/api/v1/my-orders", fetcher)

  const formatDate = (dateString) => {
    if (!dateString) return ""
    // Ensure we only take the date part to avoid any timezone/time shifts
    const cleanDate = dateString.split("T")[0]
    return Temporal.PlainDate.from(cleanDate).toLocaleString(isInternational ? "en-US" : "pt-BR")
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(isInternational ? "en-US" : "pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
            {isInternational ? "Confirmed" : "Confirmado"}
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">{isInternational ? "Cancelled" : "Cancelado"}</Badge>
      case "pending":
      default:
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-200 bg-yellow-50"
          >
            {isInternational ? "Pending" : "Pendente"}
          </Badge>
        )
    }
  }

  return (
    <RegistrationLayout title={isInternational ? "My Orders - Simpovidro 2026" : "Meus Pedidos - Simpovidro 2026"} showBackButton>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isInternational ? "My Orders" : "Meus Pedidos"}
        </h1>

        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 p-6 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>
                {isInternational
                  ? "Error loading your orders. Please try again later."
                  : "Erro ao carregar seus pedidos. Tente novamente mais tarde."}
              </p>
            </CardContent>
          </Card>
        )}

        {orders && orders.length === 0 && (
          <div className="bg-white rounded-xl border p-12">
            <Empty
              title={isInternational ? "No registration found" : "Nenhuma inscrição encontrada"}
              description={
                isInternational
                  ? "You have not registered for the event yet."
                  : "Você ainda não realizou nenhuma inscrição no evento."
              }
            />
            <div className="mt-6 text-center">
              <Button asChild>
                <Link href={isInternational ? "/en/inscricao" : "/inscricao"}>
                  {isInternational ? "Register now" : "Fazer inscrição agora"}
                </Link>
              </Button>
            </div>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span>
                          {isInternational ? "Order #" : "Pedido #"}
                          {order.sale_number?.split("-")[0] ||
                            order.id.slice(0, 8)}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(order.created_at).toLocaleDateString(
                            isInternational ? "en-US" : "pt-BR",
                          )}
                        </span>
                      </div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Hotel className="h-4 w-4 text-gray-400" />
                        {translateText(order.hotel_name, isInternational)}
                      </CardTitle>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Hotel & Location */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                        <MapPin className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {isInternational ? "Hotel Address" : "Endereço do Hotel"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {translateText(order.hotel_address, isInternational)}, {translateText(order.hotel_city, isInternational)} -{" "}
                          {translateText(order.hotel_state, isInternational)}
                        </p>
                        {order.hotel_phone && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{order.hotel_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Room Details */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                            <BedDouble className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 mt-1">
                              {translateText(order.room_name || order.room_type, isInternational)}
                            </p>
                            {order.room_description && (
                              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                {translateText(order.room_description, isInternational)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {isInternational ? "Period" : "Período"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.check_in_date)} -{" "}
                              {formatDate(order.check_out_date)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Guest List */}
                      {order.guests && order.guests.length > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="w-full">
                            <p className="font-medium text-gray-900 mb-2">
                              {isInternational ? "Guests" : "Hóspedes"} ({order.guests.length})
                            </p>
                            <div className="bg-gray-50 rounded-lg border divide-y overflow-hidden">
                              {order.guests.map((guest, index) => (
                                <div
                                  key={guest.id || index}
                                  className="px-4 py-3"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-gray-800">
                                      {index + 1}. {guest.name}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                                    {guest.cpf_number && (
                                      <div>
                                        <span className="font-medium text-gray-500">
                                          CPF:
                                        </span>{" "}
                                        {guest.cpf_number}
                                      </div>
                                    )}
                                    {guest.rg_number && (
                                      <div>
                                        <span className="font-medium text-gray-500">
                                          RG:
                                        </span>{" "}
                                        {guest.rg_number}
                                      </div>
                                    )}
                                    {guest.passport_number && (
                                      <div>
                                        <span className="font-medium text-gray-500">
                                          {isInternational ? "Passport:" : "Passaporte:"}
                                        </span>{" "}
                                        {guest.passport_number}
                                      </div>
                                    )}
                                    {guest.birth_date && (
                                      <div>
                                        <span className="font-medium text-gray-500">
                                          {isInternational ? "Birth Date:" : "Nascimento:"}
                                        </span>{" "}
                                        {formatDate(guest.birth_date)}
                                      </div>
                                    )}
                                    {guest.email && (
                                      <div>
                                        <span className="font-medium text-gray-500">
                                          Email:
                                        </span>{" "}
                                        {guest.email}
                                      </div>
                                    )}
                                    {guest.phone && (
                                      <div>
                                        <span className="font-medium text-gray-500">
                                          {isInternational ? "Mobile Phone:" : "Celular:"}
                                        </span>{" "}
                                        {guest.phone}
                                      </div>
                                    )}
                                    {guest.address && (
                                      <div className="md:col-span-2">
                                        <span className="font-medium text-gray-500">
                                          {isInternational ? "Address:" : "Endereço:"}
                                        </span>{" "}
                                        {translateText(guest.address, isInternational)}, {guest.address_number}{" "}
                                        {guest.address_complement
                                          ? `(${translateText(guest.address_complement, isInternational)})`
                                          : ""}{" "}
                                        - {translateText(guest.city, isInternational)}/{translateText(guest.state, isInternational)}
                                      </div>
                                    )}

                                    {/* Saúde / Detalhes Médicos */}
                                    {(guest.blood_type ||
                                      guest.has_heart_condition ||
                                      guest.has_diabetes ||
                                      guest.has_high_blood_pressure ||
                                      guest.has_low_blood_pressure ||
                                      guest.medication_details ||
                                      guest.health_observations ||
                                      guest.special_needs_details) && (
                                      <div className="md:col-span-2 mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-red-50/30 rounded-lg border border-red-100/50">
                                        <p className="md:col-span-2 text-xs font-bold uppercase tracking-wider text-red-800 mb-1">
                                          {isInternational ? "Health Information" : "Informações de Saúde"}
                                        </p>
                                        {(guest.blood_type ||
                                          guest.blood_rh_factor) && (
                                          <div>
                                            <span className="font-medium text-gray-500">
                                              {isInternational ? "Blood Type:" : "Tipo Sanguíneo:"}
                                            </span>{" "}
                                            {guest.blood_type}{" "}
                                            {guest.blood_rh_factor}
                                          </div>
                                        )}
                                        {guest.has_heart_condition && (
                                          <div>
                                            <span className="font-medium text-red-700">
                                              {isInternational ? "Heart Condition" : "Problema Cardíaco"}
                                            </span>
                                          </div>
                                        )}
                                        {guest.has_diabetes && (
                                          <div>
                                            <span className="font-medium text-red-700">
                                              {isInternational ? "Diabetes" : "Diabetes"}
                                            </span>
                                          </div>
                                        )}
                                        {guest.has_high_blood_pressure && (
                                          <div>
                                            <span className="font-medium text-red-700">
                                              {isInternational ? "High Blood Pressure" : "Pressão Alta"}
                                            </span>
                                          </div>
                                        )}
                                        {guest.has_low_blood_pressure && (
                                          <div>
                                            <span className="font-medium text-red-700">
                                              {isInternational ? "Low Blood Pressure" : "Pressão Baixa"}
                                            </span>
                                          </div>
                                        )}
                                        {guest.medication_details && (
                                          <div className="md:col-span-2">
                                            <span className="font-medium text-gray-500">
                                              {isInternational ? "Medications:" : "Medicamentos:"}
                                            </span>{" "}
                                            {guest.medication_details}
                                          </div>
                                        )}
                                        {guest.health_observations && (
                                          <div className="md:col-span-2">
                                            <span className="font-medium text-gray-500">
                                              {isInternational ? "Health Notes:" : "Obs. Saúde:"}
                                            </span>{" "}
                                            {guest.health_observations}
                                          </div>
                                        )}
                                        {guest.special_needs_details && (
                                          <div className="md:col-span-2">
                                            <span className="font-medium text-gray-500">
                                              {isInternational ? "Special Needs:" : "Necessidades Especiais:"}
                                            </span>{" "}
                                            {guest.special_needs_details}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">
                          {isInternational ? "Total Amount" : "Valor Total"}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(order.final_amount)}
                        </p>
                      </div>
                    </div>

                    {/* Installments Table */}
                    {order.payment_method === "installments" &&
                      order.installments &&
                      order.installments.length > 0 && (
                        <div className="mt-6 border-t pt-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {isInternational ? "Installment Plan" : "Parcelamento"}
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                  <th className="px-4 py-3 rounded-l-lg">
                                    {isInternational ? "Installment" : "Parcela"}
                                  </th>
                                  <th className="px-4 py-3">{isInternational ? "Due Date" : "Vencimento"}</th>
                                  <th className="px-4 py-3">{isInternational ? "Value" : "Valor"}</th>
                                  <th className="px-4 py-3 rounded-r-lg text-right">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {order.installments.map((installment) => (
                                  <tr key={installment.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                      {installment.installment_number} /{" "}
                                      {order.installments_count}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                      {formatDate(installment.due_date)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                      {formatCurrency(installment.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {(() => {
                                        switch (installment.status) {
                                          case "paid":
                                            return (
                                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                                {isInternational ? "Paid" : "Pago"}
                                              </Badge>
                                            )
                                          case "overdue":
                                            return (
                                              <Badge variant="destructive">
                                                {isInternational ? "Overdue" : "Atrasado"}
                                              </Badge>
                                            )
                                          case "cancelled":
                                            return (
                                              <Badge variant="destructive">
                                                {isInternational ? "Cancelled" : "Cancelado"}
                                              </Badge>
                                            )
                                          case "pending":
                                          default:
                                            return (
                                              <Badge
                                                variant="outline"
                                                className="text-yellow-600 border-yellow-200 bg-yellow-50"
                                              >
                                                {isInternational ? "Pending" : "Pendente"}
                                              </Badge>
                                            )
                                        }
                                      })()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RegistrationLayout>
  )
}
