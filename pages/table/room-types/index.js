import { useState } from "react"
import useSWR from "swr"
import { Plus, Pencil, Trash2 } from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AddRoomTypeDialog,
  EditRoomTypeDialog,
} from "@/components/hotel/RoomTypeDialogs"
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

export default function RoomTypesPage() {
  const {
    data: roomTypes,
    error,
    mutate,
  } = useSWR("/api/v1/room-types", fetcher)

  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [errorAction, setErrorAction] = useState("")

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/v1/room-types/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        mutate()
      } else {
        const data = await response.json()
        setErrorMessage(
          data.message || "Ocorreu um erro ao excluir o tipo de quarto.",
        )
        setErrorAction(data.action || "")
        setIsErrorDialogOpen(true)
      }
    } catch (error) {
      setErrorMessage("Erro de conexão com o servidor.")
      setIsErrorDialogOpen(true)
    }
  }

  const pageActions = (
    <AddRoomTypeDialog onRoomTypeAdded={() => mutate()}>
      <Button>
        <Plus className="mr-2 h-4 w-4" /> Adicionar Tipo de Quarto
      </Button>
    </AddRoomTypeDialog>
  )

  return (
    <TableLayout pageActions={pageActions}>
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Quarto</CardTitle>
          <CardDescription>
            Gerencie os tipos de quarto do seu hotel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div>Falha ao carregar os dados.</div>}
          {!roomTypes && !error && <div>Carregando...</div>}
          {Array.isArray(roomTypes) && (
            <div className="border rounded-md">
              <div className="grid grid-cols-[1fr_2fr_auto] gap-4 font-medium border-b p-4 bg-gray-50">
                <div>Nome</div>
                <div>Descrição</div>
                <div>Ações</div>
              </div>
              {roomTypes.length === 0 && (
                <div className="p-4 text-center">
                  Nenhum tipo de quarto cadastrado.
                </div>
              )}
              {roomTypes.map((type) => (
                <div
                  key={type.id}
                  className="grid grid-cols-[1fr_2fr_auto] gap-4 p-4 border-b last:border-b-0 items-center"
                >
                  <div>{type.name}</div>
                  <div>{type.description}</div>
                  <div className="flex gap-2">
                    <EditRoomTypeDialog
                      roomType={type}
                      onRoomTypeUpdated={() => mutate()}
                    >
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </EditRoomTypeDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação excluirá permanentemente este tipo de
                            quarto. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(type.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Excluir Tipo de Quarto"
        message={errorMessage}
        actionMessage={errorAction}
      />
    </TableLayout>
  )
}
