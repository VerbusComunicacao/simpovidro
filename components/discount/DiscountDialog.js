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

export function DiscountDialog({
  children,
  onDiscountSuccess,
  discountToEdit = null,
}) {
  const isEditMode = !!discountToEdit
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    value: "",
  })

  useEffect(() => {
    if (discountToEdit) {
      setFormData({
        name: discountToEdit.name || "",
        value: discountToEdit.value || "",
      })
    } else {
      setFormData({
        name: "",
        value: "",
      })
    }
  }, [discountToEdit, open])

  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setAction("")
    setLoading(true)

    const url = isEditMode
      ? `/api/v1/discounts/${discountToEdit.id}`
      : "/api/v1/discounts"

    const method = isEditMode ? "PATCH" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        value: Number(formData.value),
      }),
    })

    setLoading(false)

    if (response.ok) {
      if (onDiscountSuccess) onDiscountSuccess()
      setOpen(false)
    } else {
      const data = await response.json()
      setError(
        data.message ||
          `Ocorreu um erro ao ${isEditMode ? "editar" : "adicionar"} o desconto.`,
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
            <DialogTitle>
              {isEditMode ? "Editar Desconto" : "Adicionar Novo Desconto"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Atualize os dados do desconto global."
                : "Preencha os dados do novo desconto global."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Desconto (ex: Associada)</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome do desconto"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Porcentagem (%)</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={handleChange}
                  placeholder="Ex: 15.00"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Salvando..."
                  : isEditMode
                    ? "Salvar Alterações"
                    : "Adicionar Desconto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title={`Erro ao ${isEditMode ? "Editar" : "Adicionar"} Desconto`}
        message={error}
        actionMessage={action}
      />
    </>
  )
}
