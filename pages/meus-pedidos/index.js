import useSWR from "swr"
import RegistrationLayout from "@/components/registration/RegistrationLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Hotel, Calendar, BedDouble, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Empty } from "@/components/ui/empty"

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
  const { data: orders, error, isLoading } = useSWR("/api/v1/my-orders", fetcher)

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Confirmado</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>
      case 'pending':
      default:
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pendente</Badge>
    }
  }

  return (
    <RegistrationLayout title="Meus Pedidos - Simpovidro 2025" showBackButton>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Pedidos</h1>

        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 p-6 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>Erro ao carregar seus pedidos. Tente novamente mais tarde.</p>
            </CardContent>
          </Card>
        )}

        {orders && orders.length === 0 && (
          <div className="bg-white rounded-xl border p-12">
            <Empty 
              title="Nenhuma inscrição encontrada" 
              description="Você ainda não realizou nenhuma inscrição no evento."
            />
            <div className="mt-6 text-center">
              <Button asChild>
                <Link href="/inscricao">Fazer inscrição agora</Link>
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
                         <span>Pedido #{order.sale_number?.split('-')[0] || order.id.slice(0, 8)}</span>
                         <span>•</span>
                         <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                       </div>
                       <CardTitle className="text-lg flex items-center gap-2">
                         <Hotel className="h-4 w-4 text-gray-400" />
                         {order.hotel_name}
                       </CardTitle>
                     </div>
                     {getStatusBadge(order.status)}
                   </div>
                 </CardHeader>
                 <CardContent className="p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <div className="flex items-start gap-3">
                         <div className="p-2 bg-blue-50 rounded-lg">
                           <BedDouble className="h-5 w-5 text-blue-600" />
                         </div>
                         <div>
                           <p className="font-medium text-gray-900">{order.room_name || order.room_type}</p>
                           <p className="text-sm text-gray-500">{order.room_category}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-start gap-3">
                         <div className="p-2 bg-blue-50 rounded-lg">
                           <Calendar className="h-5 w-5 text-blue-600" />
                         </div>
                         <div>
                           <p className="font-medium text-gray-900">Período</p>
                           <p className="text-sm text-gray-500">
                             {formatDate(order.check_in_date)} - {formatDate(order.check_out_date)}
                           </p>
                         </div>
                       </div>
                     </div>

                     <div className="flex flex-col justify-end items-end border-t md:border-t-0 pt-4 md:pt-0">
                       <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                       <p className="text-2xl font-bold text-gray-900">{formatCurrency(order.final_amount)}</p>
                     </div>
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
