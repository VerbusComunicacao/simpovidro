import { useRouter } from "next/router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Loader2, Calendar, User } from "lucide-react"
import RegistrationLayout from "@/components/registration/RegistrationLayout"

import * as cookie from "cookie"
import session from "models/session"
import guest from "models/guest"
import room from "models/room"
import userModel from "models/user"
import { maskCPF, maskPhone, maskRG, maskCNPJ, maskCEP } from "@/lib/masks"

export default function CheckoutPage({ room, user, guestProfile }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentStep, setCurrentStep] = useState(1) // 1: CNPJ, 2: Company Form, 3: Guest Form
  const [cnpj, setCnpj] = useState("")
  const [foundCompany, setFoundCompany] = useState(null)
  const [newCompanyData, setNewCompanyData] = useState({
    corporate_name: "",
    cnpj: "",
    badge: "",
    address: "",
    address_number: "",
    address_complement: "",
    neighborhood: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    responsible_person: "",
    zip_code: "",
    permission: "A",
    discount_status: "N",
  })

  const initialGuest = {
    // Personal
    name: guestProfile?.name || user.full_name || "",
    email: user.email || "",
    phone: guestProfile?.phone || "",
    gender: guestProfile?.gender || "",
    rg_number: guestProfile?.rg_number || "",
    cpf_number: guestProfile?.cpf_number || "",
    birth_date: guestProfile?.birth_date
      ? new Date(guestProfile.birth_date).toISOString().split("T")[0]
      : "",
    nationality: guestProfile?.nationality || "Brasileira",

    // Address
    address: guestProfile?.address || "",
    address_number: guestProfile?.address_number || "",
    address_complement: guestProfile?.address_complement || "",
    neighborhood: guestProfile?.neighborhood || "",
    city: guestProfile?.city || "",
    state: guestProfile?.state || "",
    country: guestProfile?.country || "Brasil",

    // Health / Emergency
    emergency_contact_name: guestProfile?.emergency_contact_name || "",
    emergency_contact_phone: guestProfile?.emergency_contact_phone || "",
    blood_type: guestProfile?.blood_type || "",
    blood_rh_factor: guestProfile?.blood_rh_factor || "",
    passport_number: guestProfile?.passport_number || "",
    medication_details: guestProfile?.medication_details || "",
    special_needs_details: guestProfile?.special_needs_details || "",
    health_observations: guestProfile?.health_observations || "",
    has_heart_condition: guestProfile?.has_heart_condition || false,
    has_diabetes: guestProfile?.has_diabetes || false,
    has_high_blood_pressure: guestProfile?.has_high_blood_pressure || false,
    has_low_blood_pressure: guestProfile?.has_low_blood_pressure || false,
  }

  const emptyGuest = {
    name: "",
    email: "",
    phone: "",
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
    emergency_contact_name: "",
    emergency_contact_phone: "",
    blood_type: "",
    blood_rh_factor: "",
    passport_number: "",
    medication_details: "",
    special_needs_details: "",
    health_observations: "",
    has_heart_condition: false,
    has_diabetes: false,
    has_high_blood_pressure: false,
    has_low_blood_pressure: false,
  }

  // Initialize guests array with fixed capacity
  const maxAdults = room.max_adults || 0
  const maxChildren = room.max_children || 0
  const totalCapacity = maxAdults + maxChildren

  const [guests, setGuests] = useState(() => {
    const initialGuests = []
    for (let i = 0; i < totalCapacity; i++) {
      if (i === 0) {
        initialGuests.push({ ...initialGuest })
      } else {
        initialGuests.push({ ...emptyGuest })
      }
    }
    return initialGuests
  })

  // Handlers for form changes
  const handleChange = (index, e) => {
    let { name, value } = e.target

    if (name === "cpf_number") {
      value = maskCPF(value)
    } else if (name === "rg_number") {
      value = maskRG(value)
    } else if (name === "phone" || name === "emergency_contact_phone") {
      value = maskPhone(value)
    }

    const newGuests = [...guests]
    newGuests[index] = {
      ...newGuests[index],
      [name]: e.target.type === "checkbox" ? e.target.checked : value,
    }
    setGuests(newGuests)
  }

  const handleSelectChange = (index, name, value) => {
    const newGuests = [...guests]
    newGuests[index] = { ...newGuests[index], [name]: value }
    setGuests(newGuests)
  }

  const calculateTotalPrice = () => {
    let total = 0
    let adultCount = 0
    let childCount = 0
    const policies = room.price_policies || []
    const pricePerNight = Number(room.price_per_night)
    const referenceDate = new Date(room.hotel_check_in_date || new Date())

    guests.forEach((guest) => {
      let percentage = 100 // Default to 100%
      let isAdult = true
      let age = null // Initialize age

      if (guest.birth_date) {
        const birth = new Date(guest.birth_date)
        age = referenceDate.getUTCFullYear() - birth.getUTCFullYear()
        const m = referenceDate.getUTCMonth() - birth.getUTCMonth()
        if (
          m < 0 ||
          (m === 0 && referenceDate.getUTCDate() < birth.getUTCDate())
        ) {
          age--
        }
        isAdult = age >= 18
        if (policies.length > 0) {
          for (const policy of policies) {
            if (age <= policy.max_age) {
              percentage = Number(policy.percentage)
              break
            }
          }
        }
      }

      if (isAdult) adultCount++
      else childCount++

      total += pricePerNight * (percentage / 100)
    })

    let discountPercentage = 0
    if (
      foundCompany &&
      (foundCompany.discount_status === "S" ||
        foundCompany.discount_status === "true")
    ) {
      discountPercentage =
        Number(room.hotel_associated_discount_percentage) || 0
    }

    const discountAmount = total * (discountPercentage / 100)
    const finalTotal = total - discountAmount

    return {
      originalTotal: total,
      discountPercentage,
      discountAmount,
      finalTotal,
      adultCount,
      childCount,
    }
  }

  const {
    originalTotal,
    discountPercentage,
    discountAmount,
    finalTotal,
    adultCount,
    childCount,
  } = calculateTotalPrice()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // 1. Client-side capacity validation
    if (adultCount > maxAdults) {
      setError(
        `O número de adultos (${adultCount}) excede a capacidade máxima do quarto (${maxAdults}).`,
      )
      setIsLoading(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (childCount > maxChildren) {
      setError(
        `O número de crianças (${childCount}) excede a capacidade máxima do quarto (${maxChildren}).`,
      )
      setIsLoading(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    try {
      const response = await fetch("/api/v1/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: room.id,
          guests_data: guests,
          company_cnpj: foundCompany?.cnpj || newCompanyData.cnpj || cnpj,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao realizar inscrição.")
      }

      router.push("/inscricao/sucesso")
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleGuestsNext = () => {
    // Basic validation of guests could happen here
    setCurrentStep(4)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCnpjStep = async () => {
    if (!cnpj || cnpj.length < 14) {
      setError("CNPJ inválido.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(
        `/api/v1/companies?cnpj=${cnpj.replace(/\D/g, "")}`,
      )
      if (response.ok) {
        const companyData = await response.json()
        setFoundCompany(companyData)
        setCurrentStep(3) // Jump to Guest Form
      } else if (response.status === 404) {
        setNewCompanyData((prev) => ({ ...prev, cnpj }))
        setCurrentStep(2) // Go to Company Form
      } else {
        throw new Error("Erro ao verificar CNPJ.")
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanySubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/v1/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCompanyData),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Erro ao cadastrar empresa.")
      }

      const createdCompany = await response.json()
      setFoundCompany(createdCompany)
      setCurrentStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getGuestTitle = (index) => {
    if (index === 0) return "Responsável (Adulto 1)"

    return index < maxAdults
      ? `Adulto ${index + 1}`
      : `Criança ${index - maxAdults + 1}`
  }

  const getGuestDescription = (index) => {
    if (index === 0) return "Seus dados principais (obrigatório)."

    return index < maxAdults
      ? "Dados do acompanhante adulto (obrigatório)."
      : "Dados da criança (obrigatório)."
  }

  return (
    <RegistrationLayout
      title="Finalizar Inscrição - Simpovidro 2026"
      showBackButton
    >
      <div className="py-8 px-4">
        <div className="container max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Quarto Selecionado</p>
                  <p className="font-semibold">{room.name || room.room_type}</p>
                  <p className="text-sm text-gray-600">{room.room_category}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {room.hotel_check_in_date
                      ? new Date(room.hotel_check_in_date).toLocaleDateString(
                          "pt-BR",
                        )
                      : "--"}{" "}
                    -{" "}
                    {room.hotel_check_out_date
                      ? new Date(room.hotel_check_out_date).toLocaleDateString(
                          "pt-BR",
                        )
                      : "--"}
                  </span>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500">Capacidade do Quarto</p>
                  <p className="font-semibold text-blue-600">
                    {maxAdults} Adultos + {maxChildren} Crianças
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500">Valor Total</p>
                  <div className="flex flex-col">
                    {discountPercentage > 0 && (
                      <span className="text-sm text-gray-500 line-through">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(originalTotal)}
                      </span>
                    )}
                    <p className="text-3xl font-bold text-blue-600">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(finalTotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Guest Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-center gap-2 text-sm border border-red-200">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Step 1: CNPJ Verification */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Identificação da Empresa</CardTitle>
                    <CardDescription>
                      Informe o CNPJ da sua empresa para verificar descontos
                      exclusivos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj-input">CNPJ</Label>
                      <Input
                        id="cnpj-input"
                        placeholder="00.000.000/0000-00"
                        value={cnpj}
                        onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleCnpjStep}
                      className="w-full bg-blue-600"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        "Avançar"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Company Registration */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cadastrar Empresa</CardTitle>
                    <CardDescription>
                      Não encontramos sua empresa. Por favor, preencha os dados
                      abaixo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>CNPJ</Label>
                        <Input value={cnpj} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="corporate_name">Razão Social *</Label>
                        <Input
                          id="corporate_name"
                          value={newCompanyData.corporate_name}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              corporate_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="badge">Nome fantasia (Crachá) *</Label>
                        <Input
                          id="badge"
                          value={newCompanyData.badge}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              badge: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail da Empresa *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newCompanyData.email}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          value={newCompanyData.phone}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              phone: maskPhone(e.target.value),
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="responsible_person">
                          Pessoa Responsável *
                        </Label>
                        <Input
                          id="responsible_person"
                          value={newCompanyData.responsible_person}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              responsible_person: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zip_code">CEP *</Label>
                        <Input
                          id="zip_code"
                          value={newCompanyData.zip_code}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              zip_code: maskCEP(e.target.value),
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço *</Label>
                        <Input
                          id="address"
                          value={newCompanyData.address}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              address: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address_number">Número *</Label>
                        <Input
                          id="address_number"
                          value={newCompanyData.address_number}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              address_number: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address_complement">Complemento</Label>
                        <Input
                          id="address_complement"
                          value={newCompanyData.address_complement}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              address_complement: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro *</Label>
                        <Input
                          id="neighborhood"
                          value={newCompanyData.neighborhood}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              neighborhood: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade *</Label>
                        <Input
                          id="city"
                          value={newCompanyData.city}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              city: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado *</Label>
                        <Input
                          id="state"
                          value={newCompanyData.state}
                          onChange={(e) =>
                            setNewCompanyData({
                              ...newCompanyData,
                              state: e.target.value,
                            })
                          }
                          placeholder="UF"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleCompanySubmit}
                      className="w-full bg-blue-600"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        "Continuar"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Guest Form */}
              {currentStep === 3 && (
                <>
                  {guests.map((guestData, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 border-b flex flex-row items-center justify-between pb-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {getGuestTitle(index)}
                            </CardTitle>
                            <CardDescription>
                              {getGuestDescription(index)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-6">
                        {/* Personal Data */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900 border-b pb-2">
                            Dados Pessoais
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`name-${index}`}>
                                Nome Completo *
                              </Label>
                              <Input
                                id={`name-${index}`}
                                name="name"
                                value={guestData.name}
                                onChange={(e) => handleChange(index, e)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`birth_date-${index}`}>
                                Data de Nascimento *
                              </Label>
                              <Input
                                id={`birth_date-${index}`}
                                name="birth_date"
                                type="date"
                                value={guestData.birth_date}
                                onChange={(e) => handleChange(index, e)}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`cpf_number-${index}`}>
                                CPF *
                              </Label>
                              <Input
                                id={`cpf_number-${index}`}
                                name="cpf_number"
                                value={guestData.cpf_number}
                                onChange={(e) => handleChange(index, e)}
                                placeholder="000.000.000-00"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`rg_number-${index}`}>RG *</Label>
                              <Input
                                id={`rg_number-${index}`}
                                name="rg_number"
                                value={guestData.rg_number}
                                onChange={(e) => handleChange(index, e)}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`gender-${index}`}>
                                Gênero *
                              </Label>
                              <Select
                                value={guestData.gender}
                                onValueChange={(val) =>
                                  handleSelectChange(index, "gender", val)
                                }
                                required
                              >
                                <SelectTrigger id={`gender-${index}`}>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Masculino">
                                    Masculino
                                  </SelectItem>
                                  <SelectItem value="Feminino">
                                    Feminino
                                  </SelectItem>
                                  <SelectItem value="Outro">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`phone-${index}`}>
                                Telefone / WhatsApp *
                              </Label>
                              <Input
                                id={`phone-${index}`}
                                name="phone"
                                value={guestData.phone}
                                onChange={(e) => handleChange(index, e)}
                                placeholder="(00) 00000-0000"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`email-${index}`}>E-mail *</Label>
                              <Input
                                id={`email-${index}`}
                                name="email"
                                type="email"
                                value={guestData.email}
                                onChange={(e) => handleChange(index, e)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`passport_number-${index}`}>
                                Número do Passaporte (opcional)
                              </Label>
                              <Input
                                id={`passport_number-${index}`}
                                name="passport_number"
                                value={guestData.passport_number}
                                onChange={(e) => handleChange(index, e)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900 border-b pb-2">
                            Endereço
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`address-${index}`}>
                                Rua / Logradouro
                              </Label>
                              <Input
                                id={`address-${index}`}
                                name="address"
                                value={guestData.address}
                                onChange={(e) => handleChange(index, e)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`address_number-${index}`}>
                                Número
                              </Label>
                              <Input
                                id={`address_number-${index}`}
                                name="address_number"
                                value={guestData.address_number}
                                onChange={(e) => handleChange(index, e)}
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label htmlFor={`address_complement-${index}`}>
                                Complemento
                              </Label>
                              <Input
                                id={`address_complement-${index}`}
                                name="address_complement"
                                value={guestData.address_complement}
                                onChange={(e) => handleChange(index, e)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`city-${index}`}>Cidade</Label>
                              <Input
                                id={`city-${index}`}
                                name="city"
                                value={guestData.city}
                                onChange={(e) => handleChange(index, e)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`state-${index}`}>Estado</Label>
                              <Input
                                id={`state-${index}`}
                                name="state"
                                value={guestData.state}
                                onChange={(e) => handleChange(index, e)}
                                maxLength={2}
                                placeholder="UF"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`country-${index}`}>País</Label>
                              <Input
                                id={`country-${index}`}
                                name="country"
                                value={guestData.country}
                                onChange={(e) => handleChange(index, e)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Health & Emergency */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900 border-b pb-2">
                            Saúde e Emergência
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor={`emergency_contact_name-${index}`}
                              >
                                Nome Contato Emergência
                              </Label>
                              <Input
                                id={`emergency_contact_name-${index}`}
                                name="emergency_contact_name"
                                value={guestData.emergency_contact_name}
                                onChange={(e) => handleChange(index, e)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`emergency_contact_phone-${index}`}
                              >
                                Telefone Emergência
                              </Label>
                              <Input
                                id={`emergency_contact_phone-${index}`}
                                name="emergency_contact_phone"
                                value={guestData.emergency_contact_phone}
                                onChange={(e) => handleChange(index, e)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`blood_type-${index}`}>
                                Tipo Sanguíneo
                              </Label>
                              <Select
                                value={guestData.blood_type}
                                onValueChange={(val) =>
                                  handleSelectChange(index, "blood_type", val)
                                }
                              >
                                <SelectTrigger id={`blood_type-${index}`}>
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
                              <Label htmlFor={`blood_rh_factor-${index}`}>
                                Fator RH
                              </Label>
                              <Select
                                value={guestData.blood_rh_factor}
                                onValueChange={(val) =>
                                  handleSelectChange(
                                    index,
                                    "blood_rh_factor",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger id={`blood_rh_factor-${index}`}>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="+">
                                    Positivo (+)
                                  </SelectItem>
                                  <SelectItem value="-">
                                    Negativo (-)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`medication_details-${index}`}>
                              Medicamentos em uso
                            </Label>
                            <Input
                              id={`medication_details-${index}`}
                              name="medication_details"
                              value={guestData.medication_details}
                              onChange={(e) => handleChange(index, e)}
                              placeholder="Liste os medicamentos que utiliza"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`health_observations-${index}`}>
                              Observações de Saúde / Alergias
                            </Label>
                            <Input
                              id={`health_observations-${index}`}
                              name="health_observations"
                              value={guestData.health_observations}
                              onChange={(e) => handleChange(index, e)}
                              placeholder="Ex: Alérgico a camarão, etc."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`special_needs_details-${index}`}>
                              Necessidades Especiais
                            </Label>
                            <Input
                              id={`special_needs_details-${index}`}
                              name="special_needs_details"
                              value={guestData.special_needs_details}
                              onChange={(e) => handleChange(index, e)}
                              placeholder="Cadeirante, dieta especial, etc."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 pt-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`has_heart_condition-${index}`}
                                checked={guestData.has_heart_condition}
                                onCheckedChange={(checked) =>
                                  handleSelectChange(
                                    index,
                                    "has_heart_condition",
                                    checked,
                                  )
                                }
                              />
                              <Label htmlFor={`has_heart_condition-${index}`}>
                                Problemas cardíacos
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`has_diabetes-${index}`}
                                checked={guestData.has_diabetes}
                                onCheckedChange={(checked) =>
                                  handleSelectChange(
                                    index,
                                    "has_diabetes",
                                    checked,
                                  )
                                }
                              />
                              <Label htmlFor={`has_diabetes-${index}`}>
                                Diabetes
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`has_high_blood_pressure-${index}`}
                                checked={guestData.has_high_blood_pressure}
                                onCheckedChange={(checked) =>
                                  handleSelectChange(
                                    index,
                                    "has_high_blood_pressure",
                                    checked,
                                  )
                                }
                              />
                              <Label
                                htmlFor={`has_high_blood_pressure-${index}`}
                              >
                                Pressão Alta
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`has_low_blood_pressure-${index}`}
                                checked={guestData.has_low_blood_pressure}
                                onCheckedChange={(checked) =>
                                  handleSelectChange(
                                    index,
                                    "has_low_blood_pressure",
                                    checked,
                                  )
                                }
                              />
                              <Label
                                htmlFor={`has_low_blood_pressure-${index}`}
                              >
                                Pressão Baixa
                              </Label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="pt-4 sticky bottom-4 z-10">
                    <div className="bg-white p-4 rounded-xl shadow-xl border">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-gray-700">
                          Total ({guests.length} hóspedes):
                        </span>
                        <div className="flex flex-col items-end">
                          {discountPercentage > 0 && (
                            <span className="text-xs text-gray-500 line-through">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(originalTotal)}
                            </span>
                          )}
                          <span className="text-xl font-bold text-blue-600">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(finalTotal)}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleGuestsNext}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                        disabled={isLoading}
                      >
                        Avançar para o Resumo
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Checkout Summary */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo da Inscrição</CardTitle>
                      <CardDescription>
                        Confira os dados antes de finalizar sua inscrição.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 border-b pb-1">
                          Empresa
                        </h3>
                        <p className="text-sm">
                          {foundCompany?.corporate_name ||
                            newCompanyData.corporate_name}
                          <br />
                          <span className="text-gray-500 font-mono">
                            CNPJ: {foundCompany?.cnpj || newCompanyData.cnpj}
                          </span>
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-1">
                          Hóspedes
                        </h3>
                        {guests.map((g, idx) => (
                          <div
                            key={idx}
                            className="text-sm border-l-4 border-blue-500 pl-4 py-1 bg-blue-50/30"
                          >
                            <p className="font-bold">{g.name}</p>
                            <p className="text-gray-600">
                              {g.cpf_number} | {g.email}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(originalTotal)}
                          </span>
                        </div>
                        {discountPercentage > 0 && (
                          <div className="flex justify-between text-sm text-green-600 font-medium">
                            <span>
                              Desconto Empresa Associada ({discountPercentage}%)
                            </span>
                            <span>
                              -
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(discountAmount)}
                            </span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-lg font-bold">
                            Total a Pagar
                          </span>
                          <div className="text-right">
                            {discountPercentage > 0 && (
                              <p className="text-sm text-gray-500 line-through">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(originalTotal)}
                              </p>
                            )}
                            <p className="text-3xl font-bold text-blue-600">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(finalTotal)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 py-6"
                          onClick={() => setCurrentStep(3)}
                        >
                          Voltar e Editar
                        </Button>
                        <Button
                          type="submit"
                          className="flex-[2] bg-blue-600 hover:bg-blue-700 text-lg py-6"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                              Processando...
                            </>
                          ) : (
                            "Finalizar Inscrição"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </RegistrationLayout>
  )
}

export async function getServerSideProps(context) {
  const { id } = context.params

  // 1. Validate Session
  const cookies = cookie.parse(context.req.headers.cookie || "")
  const sessionToken = cookies.session_id

  if (!sessionToken) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    }
  }

  try {
    const sessionObject = await session.findOneValidByToken(sessionToken)
    const user = await userModel.findOneById(sessionObject.user_id)

    // 2. Fetch Room
    const targetRoom = await room.findOneById(id)
    if (!targetRoom) {
      return { notFound: true } // Or redirect to 404
    }

    // 3. Fetch Guest Profile
    const guestProfile = await guest.findOneByUserId(user.id)

    return {
      props: {
        room: JSON.parse(JSON.stringify(targetRoom)),
        // Serialization: Dates might need JSON stringify if not handled automatically
        user: JSON.parse(JSON.stringify(user)),
        guestProfile: guestProfile
          ? JSON.parse(JSON.stringify(guestProfile))
          : null,
      },
    }
  } catch (error) {
    // Session invalid or other error
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    }
  }
}
