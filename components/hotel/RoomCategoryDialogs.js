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
import ErrorDialog from "@/components/ui/ErrorDialog"

export function AddRoomCategoryDialog({ children, onRoomCategoryAdded }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [maxAdults, setMaxAdults] = useState(1)
  const [maxChildren, setMaxChildren] = useState(0)
  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setAction("")
    setLoading(true)

    const response = await fetch("/api/v1/room-categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        max_adults: maxAdults,
        max_children: maxChildren,
      }),
    })

    setLoading(false)

    if (response.ok) {
      onRoomCategoryAdded()
      setOpen(false)
      setName("")
      setMaxAdults(1)
      setMaxChildren(0)
    } else {
      const data = await response.json()
      setError(
        data.message || "Ocorreu um erro ao adicionar a categoria de quarto.",
      )
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Categoria de Quarto</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova categoria de quarto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max-adults" className="text-right">
                  Max. Adultos
                </Label>
                <Input
                  id="max-adults"
                  type="number"
                  value={maxAdults}
                  onChange={(e) => setMaxAdults(parseInt(e.target.value))}
                  className="col-span-3"
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max-children" className="text-right">
                  Max. Crianças
                </Label>
                <Input
                  id="max-children"
                  type="number"
                  value={maxChildren}
                  onChange={(e) => setMaxChildren(parseInt(e.target.value))}
                  className="col-span-3"
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Adicionar Categoria de Quarto"
        message={error}
        actionMessage={action}
      />
    </>
  )
}

export function EditRoomCategoryDialog({
  children,
  roomCategory,
  onRoomCategoryUpdated,
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(roomCategory.name)
  const [maxAdults, setMaxAdults] = useState(roomCategory.max_adults)
  const [maxChildren, setMaxChildren] = useState(roomCategory.max_children)
  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setName(roomCategory.name)
    setMaxAdults(roomCategory.max_adults)
    setMaxChildren(roomCategory.max_children)
  }, [roomCategory])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setAction("")
    setLoading(true)

    const response = await fetch(`/api/v1/room-categories/${roomCategory.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        max_adults: maxAdults,
        max_children: maxChildren,
      }),
    })

    setLoading(false)

    if (response.ok) {
      onRoomCategoryUpdated()
      setOpen(false)
    } else {
      const data = await response.json()
      setError(
        data.message || "Ocorreu um erro ao editar a categoria de quarto.",
      )
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Categoria de Quarto</DialogTitle>
            <DialogDescription>
              Atualize os dados da categoria de quarto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name-edit" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name-edit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max-adults-edit" className="text-right">
                  Max. Adultos
                </Label>
                <Input
                  id="max-adults-edit"
                  type="number"
                  value={maxAdults}
                  onChange={(e) => setMaxAdults(parseInt(e.target.value))}
                  className="col-span-3"
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max-children-edit" className="text-right">
                  Max. Crianças
                </Label>
                <Input
                  id="max-children-edit"
                  type="number"
                  value={maxChildren}
                  onChange={(e) => setMaxChildren(parseInt(e.target.value))}
                  className="col-span-3"
                  min="0"
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
        title="Erro ao Editar Categoria de Quarto"
        message={error}
        actionMessage={action}
      />
    </>
  )
}
