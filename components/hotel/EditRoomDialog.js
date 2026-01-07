import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErrorDialog from "@/components/ui/ErrorDialog";

export function EditRoomDialog({
  children,
  room,
  roomTypes,
  roomCategories,
  onRoomUpdated,
}) {
  const [open, setOpen] = useState(false);
  const [roomTypeId, setRoomTypeId] = useState(room.room_type_id);
  const [roomCategoryId, setRoomCategoryId] = useState(room.room_category_id);
  const [pricePerNight, setPricePerNight] = useState(room.price_per_night);
  const [totalRooms, setTotalRooms] = useState(room.total_rooms);
  const [availableRooms, setAvailableRooms] = useState(room.available_rooms);
  const [blockedRooms, setBlockedRooms] = useState(room.blocked_rooms);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRoomTypeId(room.room_type_id);
    setRoomCategoryId(room.room_category_id);
    setPricePerNight(room.price_per_night);
    setTotalRooms(room.total_rooms);
    setAvailableRooms(room.available_rooms);
    setBlockedRooms(room.blocked_rooms);
  }, [room]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAction("");
    
    if (parseInt(blockedRooms) > parseInt(totalRooms)) {
      setError("O número de quartos bloqueados não pode ser maior que o total de quartos.");
      setIsErrorDialogOpen(true);
      return;
    }

    setLoading(true);

    const response = await fetch(`/api/v1/rooms/${room.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_type_id: roomTypeId,
        room_category_id: roomCategoryId,
        price_per_night: pricePerNight,
        total_rooms: parseInt(totalRooms),
        blocked_rooms: parseInt(blockedRooms),
        available_rooms: parseInt(totalRooms) - parseInt(blockedRooms),
      }),
    });

    setLoading(false);

    if (response.ok) {
      onRoomUpdated();
      setOpen(false);
    } else {
      const data = await response.json();
      setError(data.message || "Ocorreu um erro ao editar o quarto.");
      if (data.action) {
        setAction(data.action);
      }
      setIsErrorDialogOpen(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Quarto</DialogTitle>
            <DialogDescription>
              Atualize os dados do quarto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-type-edit" className="text-right">
                  Tipo
                </Label>
                <Select
                  onValueChange={setRoomTypeId}
                  value={roomTypeId}
                  name="room-type-edit"
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-category-edit" className="text-right">
                  Categoria
                </Label>
                <Select
                  onValueChange={setRoomCategoryId}
                  value={roomCategoryId}
                  name="room-category-edit"
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomCategories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price-edit" className="text-right">
                  Preço
                </Label>
                <Input
                  id="price-edit"
                  type="number"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="total-rooms-edit" className="text-right">
                  Total
                </Label>
                <Input
                  id="total-rooms-edit"
                  type="number"
                  value={totalRooms}
                  onChange={(e) => setTotalRooms(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blocked-rooms-edit" className="text-right">
                  Bloqueados
                </Label>
                <Input
                  id="blocked-rooms-edit"
                  type="number"
                  value={blockedRooms}
                  onChange={(e) => setBlockedRooms(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Editar Quarto"
        message={error}
        actionMessage={action}
      />
    </>
  );
}
