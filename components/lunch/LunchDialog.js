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
import { Checkbox } from "@/components/ui/checkbox"
import ErrorDialog from "@/components/ui/ErrorDialog"

export function LunchDialog({
  children,
  onLunchSuccess,
  lunchToEdit = null,
  hotelId = null,
}) {
  const isEditMode = !!lunchToEdit
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    speakers: "",
    active: true,
  })

  useEffect(() => {
    if (lunchToEdit) {
      setFormData({
        title: lunchToEdit.title || "",
        speakers: lunchToEdit.speakers || "",
        active: lunchToEdit.active !== false,
      })
    } else {
      setFormData({
        title: "",
        speakers: "",
        active: true,
      })
    }
  }, [lunchToEdit, open])

  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleActiveChange = (checked) => {
    setFormData((prev) => ({ ...prev, active: Boolean(checked) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setAction("")
    setLoading(true)

    const url = isEditMode
      ? `/api/v1/lunches/${lunchToEdit.id}`
      : "/api/v1/lunches"

    const method = isEditMode ? "PATCH" : "POST"

    const payload = {
      title: formData.title.trim(),
      speakers: formData.speakers.trim(),
      active: formData.active,
    }

    if (!isEditMode && hotelId) {
      payload.hotel_id = hotelId
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      setLoading(false)

      if (response.ok) {
        if (onLunchSuccess) onLunchSuccess()
        setOpen(false)
      } else {
        const data = await response.json()
        setError(
          data.message ||
            `Ocorreu um erro ao ${isEditMode ? "editar" : "adicionar"} a mesa de almoço.`,
        )
        if (data.action) {
          setAction(data.action)
        }
        setIsErrorDialogOpen(true)
      }
    } catch (err) {
      setLoading(false)
      setError("Erro de comunicação com o servidor.")
      setIsErrorDialogOpen(true)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? "Editar Mesa de Almoço"
                : "Adicionar Nova Mesa de Almoço"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Atualize os detalhes do tema e convidados desta mesa temática."
                : "Cadastre uma nova mesa temática para os almoços com os painelistas."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lunch-title">
                  Título da Mesa / Tema <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lunch-title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Energia, Inteligência Artificial..."
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lunch-speakers">
                  Convidados / Painelistas{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lunch-speakers"
                  name="speakers"
                  value={formData.speakers}
                  onChange={handleChange}
                  placeholder="Ex: Nome do Painelista, Outro Painelista"
                  required
                />
                <p className="text-xs text-slate-500">
                  Separe os nomes dos convidados por vírgula.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="lunch-active"
                  checked={formData.active}
                  onCheckedChange={handleActiveChange}
                />
                <Label
                  htmlFor="lunch-active"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Mesa disponível para escolha dos participantes (Ativa)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading
                  ? "Salvando..."
                  : isEditMode
                    ? "Salvar Alterações"
                    : "Adicionar Mesa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title={`Erro ao ${isEditMode ? "Editar" : "Adicionar"} Mesa`}
        message={error}
        actionMessage={action}
      />
    </>
  )
}
