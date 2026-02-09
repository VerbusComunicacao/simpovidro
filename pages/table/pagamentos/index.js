import { Temporal } from "@js-temporal/polyfill"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import {
  Search,
  Loader2,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronRight,
  Info,
  Hotel,
} from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

export default function PaymentsTable() {
  const {
    data: sales,
    error: salesError,
    mutate,
  } = useSWR("/api/v1/sales", fetcher)
  const { data: hotels } = useSWR("/api/v1/hotels", fetcher)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHotelId, setSelectedHotelId] = useState("all")
  const [selectedSale, setSelectedSale] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Pre-select the latest hotel
  useEffect(() => {
    if (hotels && hotels.length > 0 && selectedHotelId === "all") {
      setSelectedHotelId(hotels[0].id)
    }
  }, [hotels, selectedHotelId])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    // Ensure we only take the date part to avoid any timezone/time shifts
    const cleanDate = dateString.split("T")[0]
    return Temporal.PlainDate.from(cleanDate).toLocaleString("pt-BR")
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
            Pago
          </Badge>
        )
      case "pending":
      default:
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-200 bg-yellow-50"
          >
            Pendente
          </Badge>
        )
    }
  }

  const handleUpdateInstallmentStatus = async (installmentId, newStatus) => {
    setIsUpdating(true)
    try {
      const response = await fetch(
        `/api/v1/sale-installments/${installmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      )

      if (!response.ok) throw new Error("Falha ao atualizar status")

      // Refresh sales data
      await mutate()

      // Update selected sale if open
      if (selectedSale) {
        const updatedSale = (await fetcher("/api/v1/sales")).find(
          (s) => s.id === selectedSale.id,
        )
        setSelectedSale(updatedSale)
      }

      alert("Status atualizado com sucesso!")
    } catch (error) {
      console.error(error)
      alert("Erro ao atualizar status da parcela.")
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredSales = Array.isArray(sales)
    ? sales.filter((sale) => {
        const matchesHotel =
          selectedHotelId === "all" || sale.hotel_id === selectedHotelId
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          sale.sale_number?.toLowerCase().includes(searchLower) ||
          sale.hotel_name?.toLowerCase().includes(searchLower) ||
          sale.guests?.some((g) => g.name.toLowerCase().includes(searchLower))

        return matchesHotel && matchesSearch
      })
    : []

  return (
    <TableLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Gerenciamento de Pagamentos
          </h2>
          <p className="text-sm text-gray-500">
            Acompanhe o status e gerencie as parcelas de cada inscrição.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {hotels && (
            <div className="w-full md:w-64">
              <Select
                value={selectedHotelId}
                onValueChange={setSelectedHotelId}
              >
                <SelectTrigger className="w-full bg-white">
                  <div className="flex items-center gap-2">
                    <Hotel className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Filtrar por Hotel" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Hotéis</SelectItem>
                  {hotels.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar pedido ou hóspede..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!sales && !salesError && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {filteredSales.length === 0 && sales && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          Nenhum registro encontrado.
        </div>
      )}

      <div className="grid gap-4">
        {filteredSales.map((sale) => {
          const paidInstallments =
            sale.installments?.filter((i) => i.status === "paid").length || 0
          const totalInstallments = sale.installments?.length || 1
          const isFullyPaid = paidInstallments === totalInstallments

          return (
            <Card
              key={sale.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedSale(sale)
                setIsDetailsOpen(true)
              }}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                  <div className="p-6 md:w-1/4 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-center">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                      Pedido #{sale.sale_number}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(sale.created_at)}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-center gap-2">
                    <h3 className="font-bold text-gray-900">
                      {sale.hotel_name}
                    </h3>
                    <p className="text-sm text-gray-600 italic">
                      {sale.guests?.[0]?.name}
                      {sale.guests?.length > 1 &&
                        ` + ${sale.guests.length - 1} hóspedes`}
                    </p>
                  </div>

                  <div className="p-6 md:w-1/4 bg-gray-50/50 flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-gray-100 gap-2">
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-900 leading-tight">
                        {formatCurrency(sale.final_amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sale.payment_method === "cash"
                          ? "À Vista"
                          : "Parcelado"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-gray-600">
                          {paidInstallments}/{totalInstallments} parcelas
                        </span>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full ${isFullyPaid ? "bg-green-500" : "bg-blue-600"}`}
                            style={{
                              width: `${(paidInstallments / totalInstallments) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSale && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Detalhes do Pedido #{selectedSale.sale_number}
                </DialogTitle>
                <DialogDescription>
                  Gerencie as parcelas e acompanhe o fluxo de pagamento.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">
                      Hóspede Responsável
                    </p>
                    <p className="text-sm font-semibold">
                      {selectedSale.guests?.[0]?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">
                      Total Geral
                    </p>
                    <p className="text-sm font-semibold text-blue-600">
                      {formatCurrency(selectedSale.final_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">
                      Hotel
                    </p>
                    <p className="text-sm font-semibold">
                      {selectedSale.hotel_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">
                      Pagamento
                    </p>
                    <p className="text-sm font-semibold">
                      {selectedSale.payment_method === "cash"
                        ? "À Vista"
                        : "Parcelado"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Fluxo de Parcelas
                  </h4>

                  <div className="border rounded-lg overflow-hidden divide-y">
                    {selectedSale.installments?.map((installment) => (
                      <div
                        key={installment.id}
                        className={`p-4 flex items-center justify-between transition-colors ${
                          installment.status === "paid"
                            ? "bg-green-50/20"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              installment.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {installment.installment_number}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(installment.amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Vencimento: {formatDate(installment.due_date)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(installment.status)}
                          {installment.status === "pending" ? (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 h-8 gap-1"
                              onClick={() =>
                                handleUpdateInstallmentStatus(
                                  installment.id,
                                  "paid",
                                )
                              }
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              Marcar como Pago
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                              onClick={() =>
                                handleUpdateInstallmentStatus(
                                  installment.id,
                                  "pending",
                                )
                              }
                              disabled={isUpdating}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Reverter
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedSale.payment_method === "cash" &&
                    (!selectedSale.installments ||
                      selectedSale.installments.length === 0) && (
                      <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
                        <Info className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">
                          Pagamento à vista sem parcelas geradas no sistema.
                          <br />
                          Este pedido é considerado quitado após a confirmação.
                        </p>
                      </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ErrorDialog
        isOpen={!!salesError}
        onClose={() => mutate()} // Simple way to retry
        title="Erro ao Carregar Dados"
        message={
          salesError?.info?.message || "Ocorreu um erro ao buscar os dados."
        }
      />
    </TableLayout>
  )
}
