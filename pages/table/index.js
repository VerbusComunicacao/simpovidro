import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { Plus, Hotel } from "lucide-react"
import Link from "next/link"
import TableLayout from "@/components/layout/TableLayout"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { useEffect, useState } from "react"

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

export default function Table() {
  const {
    data: hotels,
    error: hotelsError,
    mutate,
  } = useSWR("/api/v1/hotels", fetcher)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)

  useEffect(() => {
    if (hotelsError) {
      setIsErrorDialogOpen(true)
    }
  }, [hotelsError])

  const pageActions = (
    <Link href="/table/adicionar-hotel">
      <Button>
        <Plus className="mr-2 h-4 w-4" /> Adicionar Hotel
      </Button>
    </Link>
  )

  return (
    <TableLayout pageActions={pageActions}>
      {!hotels && !hotelsError && (
        <div className="text-center text-gray-500">Carregando hotéis...</div>
      )}

      {hotels && hotels.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
          <Hotel className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Nenhum hotel cadastrado
          </h2>
          <p className="text-gray-500 mb-4">
            Comece adicionando um novo hotel para gerenciá-lo.
          </p>
          <Link href="/table/adicionar-hotel">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Hotel
            </Button>
          </Link>
        </div>
      )}

      {Array.isArray(hotels) && hotels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <Link href={`/table/hoteis/${hotel.id}`} key={hotel.id} passHref>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{hotel.name}</CardTitle>
                    {hotel.active && <Badge variant="success">Ativo</Badge>}
                  </div>
                  <CardDescription>
                    {hotel.city}, {hotel.state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{hotel.address}</p>
                  <p className="text-sm text-gray-600">{hotel.phone}</p>
                  <p className="text-sm text-gray-600">{hotel.email}</p>
                  <div className="flex gap-4 pt-3 border-t border-gray-100 mt-3 text-sm text-gray-500">
                    <span>
                      <strong>Inscritos:</strong> {hotel.guests_count ?? 0}
                    </span>
                    <span>
                      <strong>Empresas:</strong> {hotel.companies_count ?? 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Carregar Hotéis"
        message={
          hotelsError?.info?.message || "Ocorreu um erro ao buscar os dados."
        }
        actionMessage={hotelsError?.info?.action}
        onRetry={() => mutate()}
      />
    </TableLayout>
  )
}
