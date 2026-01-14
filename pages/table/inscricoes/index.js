import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { Hotel, Calendar, Users, Loader2, Search } from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"

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

export default function RegistrationsTable() {
  const {
    data: sales,
    error: salesError,
    mutate,
  } = useSWR("/api/v1/sales", fetcher)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (salesError) {
      setIsErrorDialogOpen(true)
    }
  }, [salesError])

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
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
            Confirmado
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
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

  const filteredSales = sales?.filter((sale) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      sale.sale_number?.toLowerCase().includes(searchLower) ||
      sale.hotel_name?.toLowerCase().includes(searchLower) ||
      sale.guests?.some(
        (g) =>
          g.name.toLowerCase().includes(searchLower) ||
          g.cpf_number?.includes(searchTerm),
      )
    )
  })

  return (
    <TableLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inscrições</h2>
          <p className="text-sm text-gray-500">
            Gerencie todas as inscrições realizadas no evento.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por pedido, hotel ou hóspede..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {!sales && !salesError && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {filteredSales && filteredSales.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          Nenhuma inscrição encontrada para a busca &quot;{searchTerm}&quot;.
        </div>
      )}

      {filteredSales && filteredSales.length > 0 && (
        <div className="space-y-4">
          {filteredSales.map((sale) => (
            <Card key={sale.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b py-3 px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-blue-600">
                      #{sale.sale_number}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(sale.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {getStatusBadge(sale.status)}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Hospedagem
                    </p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Hotel className="h-4 w-4 text-gray-400" />
                      {sale.hotel_name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {sale.room_name || sale.room_type} ({sale.room_category})
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(sale.check_in_date)} —{" "}
                      {formatDate(sale.check_out_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Hóspedes ({sale.guests?.length || 0})
                    </p>
                    <div className="space-y-1">
                      {sale.guests?.slice(0, 3).map((g, i) => (
                        <p
                          key={i}
                          className="text-sm text-gray-700 flex items-center gap-2"
                        >
                          <Users className="h-3 w-3 text-gray-400" />
                          {g.name}
                        </p>
                      ))}
                      {sale.guests?.length > 3 && (
                        <p className="text-xs text-gray-400 italic font-medium ml-5">
                          + {sale.guests.length - 3} outros
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-center">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Valor Total
                    </p>
                    <p className="text-2xl font-black text-gray-900">
                      {formatCurrency(sale.final_amount)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {sale.payment_status === "paid"
                        ? "Pago"
                        : "Aguardando pagamento"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Carregar Inscrições"
        message={
          salesError?.info?.message || "Ocorreu um erro ao buscar os dados."
        }
        actionMessage={salesError?.info?.action}
        onRetry={mutate}
      />
    </TableLayout>
  )
}
