import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Bold, Italic, Superscript } from "lucide-react"
import ErrorDialog from "@/components/ui/ErrorDialog"

export function EditRoomDialog({
  children,
  room,
  roomTypes,
  roomCategories,
  rooms = [],
  onRoomUpdated,
}) {
  const [open, setOpen] = useState(false)
  const [roomTypeId, setRoomTypeId] = useState(room.room_type_id)
  const [roomCategoryId, setRoomCategoryId] = useState(room.room_category_id)
  const [pricePerNight, setPricePerNight] = useState(room.price_per_night)
  const [memberPricePerNight, setMemberPricePerNight] = useState(
    room.member_price_per_night,
  )
  const [totalRooms, setTotalRooms] = useState(room.total_rooms)
  const [blockedRooms, setBlockedRooms] = useState(room.blocked_rooms)
  const [name, setName] = useState(room.name || "")
  const [description, setDescription] = useState(room.description || "")
  const [photos, setPhotos] = useState(
    room.photos && room.photos.length > 0 ? room.photos : [""],
  )
  const [minGuests, setMinGuests] = useState(room.min_guests || 1)
  const [parentRoomId, setParentRoomId] = useState(room.parent_room_id || "")
  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [roomPricePolicies, setRoomPricePolicies] = useState(
    room.price_policies
      ?.filter((p) => p.price !== null)
      .map((p) => ({ id: p.id, price: p.price })) || [],
  )

  const handleAddPhoto = () => {
    setPhotos([...photos, ""])
  }

  const handleRemovePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    setPhotos(newPhotos.length > 0 ? newPhotos : [""])
  }

  const handlePhotoChange = (index, value) => {
    const newPhotos = [...photos]
    newPhotos[index] = value
    setPhotos(newPhotos)
  }

  const handleInsertTag = (tag) => {
    const textarea = document.getElementById("description-edit")
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = description
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    const selection = text.substring(start, end)

    let symbol = ""
    if (tag === "b") symbol = "**"
    else if (tag === "i") symbol = "_"
    else if (tag === "sup") symbol = "^"

    const newText = before + symbol + selection + symbol + after
    setDescription(newText)

    // Auto focus back to textarea
    setTimeout(() => {
      textarea.focus()
      const cursorOffset = symbol.length
      textarea.setSelectionRange(start + cursorOffset, end + cursorOffset)
    }, 0)
  }

  useEffect(() => {
    setRoomTypeId(room.room_type_id)
    setRoomCategoryId(room.room_category_id)
    setPricePerNight(room.price_per_night)
    setMemberPricePerNight(room.member_price_per_night)
    setTotalRooms(room.total_rooms)
    setBlockedRooms(room.blocked_rooms)
    setName(room.name || "")
    setDescription(room.description || "")
    setPhotos(room.photos && room.photos.length > 0 ? room.photos : [""])
    setMinGuests(room.min_guests || 1)
    setParentRoomId(room.parent_room_id || "")
    setRoomPricePolicies(
      room.price_policies
        ?.filter((p) => p.price !== null)
        .map((p) => ({ id: p.id, price: p.price })) || [],
    )
  }, [room])

  const potentialParents =
    rooms?.filter((r) => !r.parent_room_id && r.id !== room.id) || []

  const handleParentSelect = (val) => {
    if (val === "none" || !val) {
      setParentRoomId("")
      return
    }
    setParentRoomId(val)
    const selectedParent = rooms.find((r) => r.id === val)
    if (selectedParent) {
      setName(selectedParent.name || "")
      setRoomTypeId(selectedParent.room_type_id || "")
      setTotalRooms(selectedParent.total_rooms || "")
      setBlockedRooms(selectedParent.blocked_rooms || 0)
      setDescription(selectedParent.description || "")
      setPhotos(
        selectedParent.photos && selectedParent.photos.length > 0
          ? selectedParent.photos
          : [""],
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setAction("")

    if (!parentRoomId && parseInt(blockedRooms) > parseInt(totalRooms)) {
      setError(
        "O número de quartos bloqueados não pode ser maior que o total de quartos.",
      )
      setIsErrorDialogOpen(true)
      return
    }

    setLoading(true)

    const response = await fetch(`/api/v1/rooms/${room.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_type_id: roomTypeId,
        room_category_id: roomCategoryId,
        price_per_night: pricePerNight,
        member_price_per_night: memberPricePerNight,
        total_rooms: parentRoomId ? undefined : parseInt(totalRooms),
        blocked_rooms: parentRoomId ? undefined : parseInt(blockedRooms),
        name,
        description,
        photos: photos.filter((p) => p.trim() !== ""),
        min_guests: parseInt(minGuests) || 1,
        price_policies: roomPricePolicies,
        parent_room_id: parentRoomId || null,
      }),
    })

    setLoading(false)

    if (response.ok) {
      onRoomUpdated()
      setOpen(false)
    } else {
      const data = await response.json()
      setError(data.message || "Ocorreu um erro ao editar o quarto.")
      if (data.action) {
        setAction(data.action)
      }
      setIsErrorDialogOpen(true)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Quarto</DialogTitle>
            <DialogDescription>Atualize os dados do quarto.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="max-h-[70vh] overflow-y-auto px-1">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="parent-room-edit" className="text-right">
                    Quarto Pai (Inventário)
                  </Label>
                  <Select
                    onValueChange={handleParentSelect}
                    value={parentRoomId || "none"}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Nenhum (Quarto Independente)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Nenhum (Quarto Independente)
                      </SelectItem>
                      {potentialParents.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name || r.room_type} ({r.room_category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name-edit" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name-edit"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    placeholder="Ex: Suíte Presidencial"
                    required
                    disabled={!!parentRoomId}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="room-type-edit" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    onValueChange={setRoomTypeId}
                    value={roomTypeId}
                    name="room-type-edit"
                    disabled={!!parentRoomId}
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
                    Preço por Pessoa
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
                  <Label htmlFor="member-price-edit" className="text-right">
                    Preço Associado
                  </Label>
                  <Input
                    id="member-price-edit"
                    type="number"
                    value={memberPricePerNight}
                    onChange={(e) => setMemberPricePerNight(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="total-rooms-edit" className="text-right">
                    Total de quartos
                  </Label>
                  <Input
                    id="total-rooms-edit"
                    type="number"
                    value={parentRoomId ? "" : totalRooms}
                    onChange={(e) => setTotalRooms(e.target.value)}
                    className="col-span-3"
                    disabled={!!parentRoomId}
                    placeholder={parentRoomId ? "Herdado do pai" : ""}
                    required={!parentRoomId}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="blocked-rooms-edit" className="text-right">
                    Bloqueados
                  </Label>
                  <Input
                    id="blocked-rooms-edit"
                    type="number"
                    value={parentRoomId ? "" : blockedRooms}
                    onChange={(e) => setBlockedRooms(e.target.value)}
                    className="col-span-3"
                    disabled={!!parentRoomId}
                    placeholder={parentRoomId ? "Herdado do pai" : ""}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="min-guests-edit" className="text-right">
                    Mínimo de hóspedes
                  </Label>
                  <Input
                    id="min-guests-edit"
                    type="number"
                    min="1"
                    value={minGuests}
                    onChange={(e) => setMinGuests(e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description-edit" className="text-right">
                    Descrição
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex gap-1 border-b pb-1 mb-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleInsertTag("b")}
                        title="Negrito"
                        disabled={!!parentRoomId}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleInsertTag("i")}
                        title="Itálico"
                        disabled={!!parentRoomId}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleInsertTag("sup")}
                        title="Sobrescrito (Ex: m²)"
                        disabled={!!parentRoomId}
                      >
                        <Superscript className="h-4 w-4" />
                      </Button>
                    </div>
                    <textarea
                      id="description-edit"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full min-h-[100px] border rounded-md p-2 text-sm"
                      placeholder="Descreva as comodidades do quarto... Use os botões acima para formatar."
                      disabled={!!parentRoomId}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Fotos (URLs)</Label>
                  <div className="col-span-3 space-y-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={photo}
                          onChange={(e) =>
                            handlePhotoChange(index, e.target.value)
                          }
                          placeholder="https://exemplo.com/foto.jpg"
                          disabled={!!parentRoomId}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemovePhoto(index)}
                          disabled={
                            !!parentRoomId ||
                            (photos.length === 1 && photos[0] === "")
                          }
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
                      disabled={!!parentRoomId}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Adicionar outra foto
                    </Button>
                  </div>
                </div>

                {room.price_policies?.filter((p) => p.use_percentage === false)
                  .length > 0 && (
                  <div className="my-4 border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">
                      Preços Específicos por Idade
                    </h4>
                    <div className="space-y-3">
                      {room.price_policies
                        .filter((p) => p.use_percentage === false)
                        .map((policy) => (
                          <div
                            key={policy.id}
                            className="grid grid-cols-4 items-center gap-4"
                          >
                            <Label className="text-right text-xs">
                              {policy.description}
                            </Label>
                            <Input
                              type="number"
                              placeholder="Preço fixo"
                              className="col-span-3"
                              value={
                                roomPricePolicies.find(
                                  (rpp) => rpp.id === policy.id,
                                )?.price || ""
                              }
                              onChange={(e) => {
                                const newPolicies = [...roomPricePolicies]
                                const index = newPolicies.findIndex(
                                  (rpp) => rpp.id === policy.id,
                                )
                                if (index >= 0) {
                                  newPolicies[index].price = e.target.value
                                } else {
                                  newPolicies.push({
                                    id: policy.id,
                                    price: e.target.value,
                                  })
                                }
                                setRoomPricePolicies(newPolicies)
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="mt-4 pt-2 border-t">
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
  )
}
