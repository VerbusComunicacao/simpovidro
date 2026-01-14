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
  AddRoomCategoryDialog,
  EditRoomCategoryDialog,
} from "@/components/hotel/RoomCategoryDialogs"

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

export default function RoomCategoriesPage() {
  const {
    data: roomCategories,
    error,
    mutate,
  } = useSWR("/api/v1/room-categories", fetcher)

  const pageActions = (
    <AddRoomCategoryDialog onRoomCategoryAdded={mutate}>
      <Button>
        <Plus className="mr-2 h-4 w-4" /> Adicionar Categoria de Quarto
      </Button>
    </AddRoomCategoryDialog>
  )

  return (
    <TableLayout pageActions={pageActions}>
      <Card>
        <CardHeader>
          <CardTitle>Categorias de Quarto</CardTitle>
          <CardDescription>
            Gerencie as categorias de quarto do seu hotel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div>Falha ao carregar os dados.</div>}
          {!roomCategories && !error && <div>Carregando...</div>}
          {roomCategories && (
            <div className="border rounded-md">
              <div className="grid grid-cols-4 gap-4 font-medium border-b p-4 bg-gray-50">
                <div>Nome</div>
                <div>Max. Adultos</div>
                <div>Max. Crianças</div>
                <div>Ações</div>
              </div>
              {roomCategories.length === 0 && (
                <div className="p-4 text-center">
                  Nenhuma categoria de quarto cadastrada.
                </div>
              )}
              {roomCategories.map((category) => (
                <div
                  key={category.id}
                  className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0 items-center"
                >
                  <div>{category.name}</div>
                  <div>{category.max_adults}</div>
                  <div>{category.max_children}</div>
                  <div className="flex gap-2">
                    <EditRoomCategoryDialog
                      roomCategory={category}
                      onRoomCategoryUpdated={mutate}
                    >
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </EditRoomCategoryDialog>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TableLayout>
  )
}
