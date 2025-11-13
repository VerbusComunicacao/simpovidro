import { useState } from "react";
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

export function AddRoomDialog({
  children,
  hotelId,
  roomTypes,
  roomCategories,
  onRoomAdded,
}) {
  const [open, setOpen] = useState(false);
  const [roomTypeId, setRoomTypeId] = useState("");
  const [roomCategoryId, setRoomCategoryId] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [totalRooms, setTotalRooms] = useState("");
  const [availableRooms, setAvailableRooms] = useState("");
  const [blockedRooms, setBlockedRooms] = useState("");
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAction("");
    setLoading(true);

    const response = await fetch("/api/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hotel_id: hotelId,
        room_type_id: roomTypeId,
        room_category_id: roomCategoryId,
        price_per_night: pricePerNight,
        total_rooms: totalRooms,
        available_rooms: availableRooms,
        blocked_rooms: blockedRooms,
      }),
    });

    setLoading(false);

    if (response.ok) {
      onRoomAdded();
      setOpen(false);
      // Reset form
      setRoomTypeId("");
      setRoomCategoryId("");
      setPricePerNight("");
      setTotalRooms("");
      setAvailableRooms("");
      setBlockedRooms("");
    } else {
      const data = await response.json();
      setError(data.message || "Ocorreu um erro ao adicionar o quarto.");
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
            <DialogTitle>Adicionar Novo Quarto</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo quarto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-type" className="text-right">
                  Tipo
                </Label>
                <Select onValueChange={setRoomTypeId} value={roomTypeId}>
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
                <Label htmlFor="room-category" className="text-right">
                  Categoria
                </Label>
                <Select
                  onValueChange={setRoomCategoryId}
                  value={roomCategoryId}
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
                <Label htmlFor="price" className="text-right">
                  Preço
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="total-rooms" className="text-right">
                  Total
                </Label>
                <Input
                  id="total-rooms"
                  type="number"
                  value={totalRooms}
                  onChange={(e) => setTotalRooms(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="available-rooms" className="text-right">
                  Disponíveis
                </Label>
                <Input
                  id="available-rooms"
                  type="number"
                  value={availableRooms}
                  onChange={(e) => setAvailableRooms(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blocked-rooms" className="text-right">
                  Bloqueados
                </Label>
                <Input
                  id="blocked-rooms"
                  type="number"
                  value={blockedRooms}
                  onChange={(e) => setBlockedRooms(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Quarto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Adicionar Quarto"
        message={error}
        actionMessage={action}
      />
    </>
  );
}
