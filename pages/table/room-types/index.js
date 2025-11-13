import useSWR from "swr";
import { Plus, Pencil, Trash2 } from "lucide-react";
import TableLayout from "@/components/layout/TableLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AddRoomTypeDialog,
  EditRoomTypeDialog,
} from "@/components/hotel/RoomTypeDialogs";

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export default function RoomTypesPage() {
  const {
    data: roomTypes,
    error,
    mutate,
  } = useSWR("/api/v1/room-types", fetcher);

  const pageActions = (
    <AddRoomTypeDialog onRoomTypeAdded={mutate}>
      <Button>
        <Plus className="mr-2 h-4 w-4" /> Adicionar Tipo de Quarto
      </Button>
    </AddRoomTypeDialog>
  );

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
          {roomTypes && (
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
                      onRoomTypeUpdated={mutate}
                    >
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </EditRoomTypeDialog>
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
  );
}