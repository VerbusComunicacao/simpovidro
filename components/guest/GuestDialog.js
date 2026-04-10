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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { maskPhone, maskCPF, maskRG } from "@/lib/masks"
import { validateCPF, validatePhone } from "@/lib/validators"
import { LocationSelector } from "@/components/ui/LocationSelector"
import { getInitialLocationState } from "@/lib/location-utils"
import {
  isTestEnvironment,
  generateRandomGuest,
} from "@/lib/test-data-generator"

export function GuestDialog({ children, onGuestSuccess, guestToEdit = null }) {
  const isEditMode = !!guestToEdit
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    badge_name: "",
    gender: "",
    rg_number: "",
    cpf_number: "",
    birth_date: "",
    nationality: "Brasileira",
    address: "",
    address_number: "",
    address_complement: "",
    neighborhood: "",
    city: "",
    state: "",
    country: "Brasil",
    countryCode: "BR",
    stateCode: "",
    medication_details: "",
    blood_type: "",
    blood_rh_factor: "",
    health_observations: "",
    special_needs_details: "",
    has_heart_condition: false,
    has_diabetes: false,
    has_high_blood_pressure: false,
    has_low_blood_pressure: false,
  })

  useEffect(() => {
    if (guestToEdit) {
      const locationState = getInitialLocationState(guestToEdit)
      setFormData({
        name: guestToEdit.name || "",
        email: guestToEdit.email || "",
        phone: guestToEdit.phone || "",
        badge_name: guestToEdit.badge_name || "",
        gender: guestToEdit.gender || "",
        rg_number: guestToEdit.rg_number || "",
        cpf_number: guestToEdit.cpf_number || "",
        birth_date: guestToEdit.birth_date
          ? new Date(guestToEdit.birth_date).toISOString().split("T")[0]
          : "",
        nationality: guestToEdit.nationality || "Brasileira",
        address: guestToEdit.address || "",
        address_number: guestToEdit.address_number || "",
        address_complement: guestToEdit.address_complement || "",
        neighborhood: guestToEdit.neighborhood || "",
        ...locationState,
        medication_details: guestToEdit.medication_details || "",
        blood_type: guestToEdit.blood_type || "",
        blood_rh_factor: guestToEdit.blood_rh_factor || "",
        health_observations: guestToEdit.health_observations || "",
        special_needs_details: guestToEdit.special_needs_details || "",
        has_heart_condition: !!guestToEdit.has_heart_condition,
        has_diabetes: !!guestToEdit.has_diabetes,
        has_high_blood_pressure: !!guestToEdit.has_high_blood_pressure,
        has_low_blood_pressure: !!guestToEdit.has_low_blood_pressure,
      })
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        badge_name: "",
        gender: "",
        rg_number: "",
        cpf_number: "",
        birth_date: "",
        nationality: "Brasileira",
        address: "",
        address_number: "",
        address_complement: "",
        neighborhood: "",
        city: "",
        state: "",
        country: "Brasil",
        countryCode: "BR",
        stateCode: "",
        medication_details: "",
        blood_type: "",
        blood_rh_factor: "",
        health_observations: "",
        special_needs_details: "",
        has_heart_condition: false,
        has_diabetes: false,
        has_high_blood_pressure: false,
        has_low_blood_pressure: false,
      })
    }
  }, [guestToEdit, open])

  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    let maskedValue = type === "checkbox" ? checked : value
    if (name === "phone") maskedValue = maskPhone(value)
    if (name === "cpf_number") maskedValue = maskCPF(value)
    if (name === "rg_number") maskedValue = maskRG(value)

    setFormData((prev) => ({ ...prev, [name]: maskedValue }))

    // Dev Helper: Autofill on all ones (CPF)
    if (
      name === "cpf_number" &&
      isTestEnvironment() &&
      value.replace(/\D/g, "") === "1".repeat(11)
    ) {
      const randomGuest = generateRandomGuest()
      setFormData((prev) => ({
        ...prev,
        ...randomGuest,
      }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: !!checked }))
  }

  const handleLocationChange = (location) => {
    setFormData((prev) => ({ ...prev, ...location }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setAction("")
    setAction("")

    // Validation
    if (formData.cpf_number && !validateCPF(formData.cpf_number)) {
      setError("CPF inválido.")
      return
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      setError("Telefone inválido.")
      return
    }

    setLoading(true)

    const url = isEditMode
      ? `/api/v1/guests/${guestToEdit.id}`
      : "/api/v1/guests"

    const method = isEditMode ? "PATCH" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    setLoading(false)

    if (response.ok) {
      const data = await response.json()
      if (onGuestSuccess) onGuestSuccess(data)
      setOpen(false)
    } else {
      const data = await response.json()
      setError(
        data.message ||
          `Ocorreu um erro ao ${isEditMode ? "editar" : "adicionar"} o hóspede.`,
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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Hóspede" : "Adicionar Novo Hóspede"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Atualize os dados do hóspede."
                : "Preencha os dados do novo hóspede."}{" "}
              Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="max-h-[70vh] overflow-y-auto px-1">
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nome completo do hóspede"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="badge_name">Nome no Crachá</Label>
                    <Input
                      id="badge_name"
                      name="badge_name"
                      value={formData.badge_name}
                      onChange={handleChange}
                      placeholder="Como aparecerá no crachá"
                      maxLength={23}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="hospede@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf_number">CPF *</Label>
                    <Input
                      id="cpf_number"
                      name="cpf_number"
                      value={formData.cpf_number}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg_number">RG *</Label>
                    <Input
                      id="rg_number"
                      name="rg_number"
                      value={formData.rg_number}
                      onChange={handleChange}
                      placeholder="00.000.000-0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento *</Label>
                    <Input
                      id="birth_date"
                      name="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero *</Label>
                    <Select
                      onValueChange={(val) => handleSelectChange("gender", val)}
                      value={formData.gender}
                      required
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="O">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3 text-gray-500">
                    Informações Médicas
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="blood_type">Tipo Sanguíneo</Label>
                      <Select
                        onValueChange={(val) =>
                          handleSelectChange("blood_type", val)
                        }
                        value={formData.blood_type}
                      >
                        <SelectTrigger id="blood_type">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="AB">AB</SelectItem>
                          <SelectItem value="O">O</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="blood_rh_factor">Fator RH</Label>
                      <Select
                        onValueChange={(val) =>
                          handleSelectChange("blood_rh_factor", val)
                        }
                        value={formData.blood_rh_factor}
                      >
                        <SelectTrigger id="blood_rh_factor">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+">Positivo (+)</SelectItem>
                          <SelectItem value="-">Negativo (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_heart_condition"
                        checked={formData.has_heart_condition}
                        onCheckedChange={(val) =>
                          handleCheckboxChange("has_heart_condition", val)
                        }
                      />
                      <Label
                        htmlFor="has_heart_condition"
                        className="text-sm font-normal"
                      >
                        Problema cardíaco
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_diabetes"
                        checked={formData.has_diabetes}
                        onCheckedChange={(val) =>
                          handleCheckboxChange("has_diabetes", val)
                        }
                      />
                      <Label
                        htmlFor="has_diabetes"
                        className="text-sm font-normal"
                      >
                        Diabetes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_high_blood_pressure"
                        checked={formData.has_high_blood_pressure}
                        onCheckedChange={(val) =>
                          handleCheckboxChange("has_high_blood_pressure", val)
                        }
                      />
                      <Label
                        htmlFor="has_high_blood_pressure"
                        className="text-sm font-normal"
                      >
                        Pressão alta
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_low_blood_pressure"
                        checked={formData.has_low_blood_pressure}
                        onCheckedChange={(val) =>
                          handleCheckboxChange("has_low_blood_pressure", val)
                        }
                      />
                      <Label
                        htmlFor="has_low_blood_pressure"
                        className="text-sm font-normal"
                      >
                        Pressão baixa
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="medication_details">
                      Medicamentos em uso
                    </Label>
                    <Textarea
                      id="medication_details"
                      name="medication_details"
                      value={formData.medication_details}
                      onChange={handleChange}
                      placeholder="Liste os medicamentos e dosagens"
                    />
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="special_needs_details">
                      Necessidades especiais / Alergias
                    </Label>
                    <Textarea
                      id="special_needs_details"
                      name="special_needs_details"
                      value={formData.special_needs_details}
                      onChange={handleChange}
                      placeholder="Descreva necessidades especiais ou alergias alimentares/medicamentosas"
                    />
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="health_observations">
                      Observações de saúde
                    </Label>
                    <Textarea
                      id="health_observations"
                      name="health_observations"
                      value={formData.health_observations}
                      onChange={handleChange}
                      placeholder="Outras observações relevantes de saúde"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3 text-gray-500">
                    Endereço
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="address">Logradouro</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_number">Número</Label>
                      <Input
                        id="address_number"
                        name="address_number"
                        value={formData.address_number}
                        onChange={handleChange}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <LocationSelector
                      key={`guest-admin-${formData.stateCode}-${formData.city}`}
                      countryCode={formData.countryCode}
                      stateCode={formData.stateCode}
                      cityName={formData.city}
                      onLocationChange={handleLocationChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading
                  ? "Salvando..."
                  : isEditMode
                    ? "Salvar Alterações"
                    : "Adicionar Hóspede"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title={`Erro ao ${isEditMode ? "Editar" : "Adicionar"} Hóspede`}
        message={error}
        actionMessage={action}
      />
    </>
  )
}
