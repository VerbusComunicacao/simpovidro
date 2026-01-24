import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import useSWR from "swr"
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { useState, useEffect } from "react"
import { DiscountDialog } from "@/components/discount/DiscountDialog"

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

export default function DiscountsTable() {
  const {
    data: discounts,
    error: discountsError,
    mutate,
  } = useSWR("/api/v1/discounts", fetcher)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)

  useEffect(() => {
    if (discountsError) {
      setIsErrorDialogOpen(true)
    }
  }, [discountsError])

  const handleDelete = async (id) => {
    if (
      confirm(
        "Deseja realmente excluir este desconto? Empresas associadas ficarão sem desconto global.",
      )
    ) {
      await fetch(`/api/v1/discounts/${id}`, { method: "DELETE" })
      mutate()
    }
  }

  return (
    <TableLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Gerenciar Descontos
          </h2>
          <p className="text-sm text-gray-500">
            Configure os tipos de descontos globais aplicáveis a empresas
            associadas.
          </p>
        </div>
        <DiscountDialog onDiscountSuccess={() => mutate()}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Desconto
          </Button>
        </DiscountDialog>
      </div>

      {!discounts && !discountsError && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {discounts && discounts.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500 shadow-sm">
          Nenhum desconto cadastrado.
        </div>
      )}

      {discounts && discounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.map((discount) => (
            <Card
              key={discount.id}
              className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <CardHeader className="bg-orange-500 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {discount.name}
                      </CardTitle>
                      <CardDescription className="text-orange-100 text-xs opacity-90">
                        Valor Padrão
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-black text-gray-900">
                    {Number(discount.value)}%
                  </div>
                  <div className="flex gap-2">
                    <DiscountDialog
                      discountToEdit={discount}
                      onDiscountSuccess={() => mutate()}
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border-gray-200"
                      >
                        <Pencil className="h-4 w-4 text-gray-600" />
                      </Button>
                    </DiscountDialog>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-red-100 hover:bg-red-50 hover:border-red-200"
                      onClick={() => handleDelete(discount.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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
        title="Erro ao Carregar Descontos"
        message={
          discountsError?.info?.message || "Ocorreu um erro ao buscar os dados."
        }
        actionMessage={discountsError?.info?.action}
        onRetry={() => mutate()}
      />
    </TableLayout>
  )
}
