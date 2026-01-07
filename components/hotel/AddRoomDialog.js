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
import { Plus, Trash2 } from "lucide-react";
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([""]);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddPhoto = () => {
    setPhotos([...photos, ""]);
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos.length > 0 ? newPhotos : [""]);
  };

  const handlePhotoChange = (index, value) => {
    const newPhotos = [...photos];
    newPhotos[index] = value;
    setPhotos(newPhotos);
  };

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
        name,
        description,
        photos: photos.filter(p => p.trim() !== ""),
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
      setName("");
      setDescription("");
      setPhotos([""]);
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Quarto</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo quarto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="max-h-[70vh] overflow-y-auto px-1">
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
                  Total de quartos
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
                <Label htmlFor="name" className="text-right">
                  Nome (opcional)
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  placeholder="Ex: Suíte Presidencial"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3 min-h-[100px] border rounded-md p-2 text-sm"
                  placeholder="Descreva as comodidades do quarto..."
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Fotos (URLs)
                </Label>
                <div className="col-span-3 space-y-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={photo}
                        onChange={(e) => handlePhotoChange(index, e.target.value)}
                        placeholder="https://exemplo.com/foto.jpg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemovePhoto(index)}
                        disabled={photos.length === 1 && photos[0] === ""}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleAddPhoto}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar outra foto
                  </Button>
                </div>
              </div>
            </div>
            </div>
            <DialogFooter className="mt-4 pt-2 border-t">
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
