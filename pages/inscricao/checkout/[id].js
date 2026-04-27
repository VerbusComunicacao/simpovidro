import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
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
import { AlertCircle, Loader2, Calendar, User, Lock } from "lucide-react"
import RegistrationLayout from "@/components/registration/RegistrationLayout"

import * as cookie from "cookie"
import session from "models/session"
import guest from "models/guest"
import room from "models/room"
import userModel from "models/user"
import discountModel from "models/discount"
import { maskCPF, maskPhone, maskRG, maskCNPJ, maskCEP } from "@/lib/masks"
import { validateCPF, validateCNPJ, validatePhone } from "@/lib/validators"
import { LocationSelector } from "@/components/ui/LocationSelector"
import { getInitialLocationState } from "@/lib/location-utils"
import {
  isTestEnvironment,
  generateRandomCompany,
  generateRandomGuest,
} from "@/lib/test-data-generator"
import {
  calculateTotalPrice as calculatePrice,
  calculateMaxInstallments as calculateInstallments,
  validateRoomCapacity,
  generateInstallmentDates,
} from "@/lib/registration-helpers"

function calculateIsAdult(birthDate) {
  if (!birthDate) return false
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age >= 12
}

function calculateIsHolder(birthDate) {
  if (!birthDate) return false
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age >= 18
}

export default function CheckoutPage({
  room,
  user,
  guestProfile,
  initialDiscounts,
}) {
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
    stateCode: "",
    country: "Brazil",
    countryCode: "BR",
  })
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [installmentsCount, setInstallmentsCount] = useState(1)
  const [globalDiscounts] = useState(initialDiscounts || [])
  const [guestErrors, setGuestErrors] = useState({})

  // No longer needed: countries, getStates, getCities helpers here

  // Determine initial codes for Guest Profile
  const locationState = getInitialLocationState(guestProfile)

  const initialGuest = {
    // Personal
    name: guestProfile?.name || user.full_name || "",
    badge_name: guestProfile?.badge_name || "",
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
    ...locationState,

    // Health / Emergency
    emergency_contact_name: guestProfile?.emergency_contact_name || "",
    emergency_contact_phone: guestProfile?.emergency_contact_phone || "",
    blood_type: guestProfile?.blood_type || "",
    blood_rh_factor: guestProfile?.blood_rh_factor || "",
    passport_number: guestProfile?.passport_number || "",
    medication_details: guestProfile?.medication_details || "",
    special_needs_details: guestProfile?.special_needs_details || "",
    health_observations: guestProfile?.health_observations || "",
    has_heart_condition: guestProfile?.has_heart_condition ?? false,
    has_diabetes: guestProfile?.has_diabetes ?? false,
    has_high_blood_pressure: guestProfile?.has_high_blood_pressure ?? false,
    has_low_blood_pressure: guestProfile?.has_low_blood_pressure ?? false,
  }

  const emptyGuest = {
    name: "",
    badge_name: "",
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
    stateCode: "",
    country: "Brazil",
    countryCode: "BR",
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

  const maxAdults = room.max_adults || 0
  const maxChildren = room.max_children || 0
  const totalCapacity = maxAdults + maxChildren
  const minRequired = room.min_guests || 1

  const [guests, setGuests] = useState(() => {
    // Start with the logged-in user as Guest 1, then add (minRequired - 1) empty guests
    const initialArr = [{ ...initialGuest }]
    for (let i = 1; i < minRequired; i++) {
      initialArr.push({ ...emptyGuest })
    }
    return initialArr
  })

  const handleAddGuest = () => {
    if (guests.length < totalCapacity) {
      setGuests([...guests, { ...emptyGuest }])
    }
  }

  const handleRemoveGuest = (indexToRemove) => {
    if (guests.length <= minRequired) return

    const newGuests = guests.filter((_, index) => index !== indexToRemove)
    setGuests(newGuests)

    if (guestErrors[indexToRemove] || Object.keys(guestErrors).length > 0) {
      // Clear errors on removal to force re-validation
      setGuestErrors({})
    }
  }

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
    setError("")

    // Clear error when user types
    if (guestErrors[index]?.[name]) {
      const newErrors = { ...guestErrors }
      delete newErrors[index][name]
      if (Object.keys(newErrors[index]).length === 0) delete newErrors[index]
      setGuestErrors(newErrors)
    }

    // Dev Helper: Autofill on all ones (CPF)
    if (
      name === "cpf_number" &&
      isTestEnvironment() &&
      value.replace(/\D/g, "") === "1".repeat(11)
    ) {
      const randomGuest = generateRandomGuest()
      const updatedGuests = [...guests]
      updatedGuests[index] = {
        ...updatedGuests[index],
        ...randomGuest,
      }
      setGuests(updatedGuests)
    }
  }

  const handleCompanyLocationChange = (location) => {
    setNewCompanyData((prev) => ({ ...prev, ...location }))
  }

  const handleSelectChange = (index, name, value) => {
    const newGuests = [...guests]
    newGuests[index] = { ...newGuests[index], [name]: value }
    setGuests(newGuests)
    setError("")
  }

  const {
    originalTotal,
    discountPercentage,
    discountAmount,
    finalTotal,
    adultCount,
    childCount,
    isAssociate,
  } = calculatePrice(room, guests, foundCompany, globalDiscounts)

  const maxInstallments = calculateInstallments(room.hotel_check_in_date)

  useEffect(() => {
    if (paymentMethod === "installments") {
      setInstallmentsCount(maxInstallments)
    }
  }, [paymentMethod, maxInstallments])

  // Renamed from handleSubmit to handleFinalSubmit
  const handleFinalSubmit = async () => {
    setIsLoading(true)
    setError("")

    // 1. Client-side capacity validation
    const capacityValidation = validateRoomCapacity(
      room,
      adultCount,
      childCount,
    )
    if (!capacityValidation.isValid) {
      setError(capacityValidation.message)
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
          company_data: newCompanyData.corporate_name ? newCompanyData : null,
          company_cnpj: foundCompany?.cnpj || newCompanyData.cnpj || cnpj,
          payment_method: paymentMethod,
          installments_count: installmentsCount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const err = new Error(
          errorData.message || "Erro ao realizar inscrição.",
        )
        err.action = errorData.action
        throw err
      }

      router.push("/inscricao/sucesso")
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleGuestsNext = () => {
    const newErrors = {}
    let hasError = false

    guests.forEach((guest, index) => {
      // 0. Validate Holder Age (Specifically for the first guest)
      if (index === 0 && !calculateIsHolder(guest.birth_date)) {
        hasError = true
        if (!newErrors[index]) newErrors[index] = {}
        setError("O titular da inscrição deve ser maior de 18 anos.")
        // Highlight the birth date field for the holder
        newErrors[index].birth_date = "Titular deve ser maior de 18 anos."
      }

      // Validate CPF
      if (guest.cpf_number && !validateCPF(guest.cpf_number)) {
        if (!newErrors[index]) newErrors[index] = {}
        newErrors[index].cpf_number = "CPF inválido."
        hasError = true
      }

      // Validate Phone/WhatsApp
      if (guest.phone && !validatePhone(guest.phone)) {
        if (!newErrors[index]) newErrors[index] = {}
        newErrors[index].phone = "Telefone inválido."
        hasError = true
      }

      // Validate Emergency Phone
      if (
        guest.emergency_contact_phone &&
        !validatePhone(guest.emergency_contact_phone)
      ) {
        if (!newErrors[index]) newErrors[index] = {}
        newErrors[index].emergency_contact_phone = "Telefone inválido."
        hasError = true
      }

      // Basic Required Fields
      if (!guest.name) {
        if (!newErrors[index]) newErrors[index] = {}
        newErrors[index].name = "Nome é obrigatório."
        hasError = true
      }

      if (!guest.badge_name) {
        if (!newErrors[index]) newErrors[index] = {}
        newErrors[index].badge_name = "Nome no crachá é obrigatório."
        hasError = true
      }

      if (!guest.gender) {
        if (!newErrors[index]) newErrors[index] = {}
        newErrors[index].gender = "Sexo é obrigatório."
        hasError = true
      }

      if (calculateIsAdult(guest.birth_date) && !guest.email) {
        if (!newErrors[index]) newErrors[index] = {}
        newErrors[index].email = "Email é obrigatório para adultos."
        hasError = true
      }
    })

    if (hasError) {
      setGuestErrors(newErrors)
      const firstErrorIndex = Object.keys(newErrors)[0]
      const element = document.getElementById(`guest-card-${firstErrorIndex}`)
      if (element) element.scrollIntoView({ behavior: "smooth" })

      // Pega a exata mensagem do primeiro erro encontrado
      const firstErrorGuest = newErrors[firstErrorIndex]
      const firstErrorMessage = Object.values(firstErrorGuest)[0]
      setError(`Erro: ${firstErrorMessage}`)
      return
    }

    setCurrentStep(4)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCnpjStep = async () => {
    // Dev Helper: Autofill on all ones (CNPJ)
    if (isTestEnvironment() && cnpj.replace(/\D/g, "") === "1".repeat(14)) {
      const randomCompany = generateRandomCompany()
      setNewCompanyData({
        ...newCompanyData,
        ...randomCompany,
      })
      setCurrentStep(2)
      return
    }

    if (!cnpj || !validateCNPJ(cnpj)) {
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
        setNewCompanyData({
          corporate_name: companyData.corporate_name || "",
          badge: companyData.badge || "",
          email: companyData.email || "",
          phone: companyData.phone || "",
          responsible_person: companyData.responsible_person || "",
          zip_code: companyData.zip_code || "",
          address: companyData.address || "",
          address_number: companyData.address_number || "",
          address_complement: companyData.address_complement || "",
          neighborhood: companyData.neighborhood || "",
          city: companyData.city || "",
          state: companyData.state || "",
          stateCode: companyData.state || "",
          countryCode: companyData.country_code || "BR",
          cnpj: companyData.cnpj || cnpj,
        })
        setCurrentStep(2)
      } else if (response.status === 404) {
        setFoundCompany(null)
        setNewCompanyData({
          cnpj: cnpj,
          corporate_name: "",
          badge: "",
          email: "",
          phone: "",
          responsible_person: "",
          zip_code: "",
          address: "",
          address_number: "",
          address_complement: "",
          neighborhood: "",
          city: "",
          state: "",
        })
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
    e.preventDefault() // Prevent default form submission

    // Validate Phone in Company Form
    if (newCompanyData.phone && !validatePhone(newCompanyData.phone)) {
      setError("Telefone da empresa inválido.")
      return
    }

    // Validate CEP (Basic length check)
    if (
      newCompanyData.zip_code &&
      newCompanyData.zip_code.replace(/\D/g, "").length !== 8
    ) {
      setError("CEP inválido.")
      return
    }
    setIsLoading(true)
    setError("")

    // We no longer save the company here because it will be handled by the
    // registration.create (upsert) logic at the end of the process.
    setTimeout(() => {
      setIsLoading(false)
      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 400)
  }

  const handleMasterSubmit = async (e) => {
    e.preventDefault()

    switch (currentStep) {
      case 1:
        await handleCnpjStep()
        break
      case 2:
        await handleCompanySubmit(e)
        break
      case 3:
        handleGuestsNext()
        break
      case 4:
        await handleFinalSubmit()
        break
      default:
        break
    }
  }

  const getGuestTitle = (index) => {
    if (index === 0) {
      return (
        <div className="flex items-center gap-2">
          <span>Responsável (Adulto 1)</span>
          <Badge className="bg-blue-600 text-white border-none flex items-center gap-1">
            <Lock className="h-3 w-3" /> Titular
          </Badge>
        </div>
      )
    }

    return index < maxAdults
      ? `Adulto ${index + 1}`
      : `Criança ${index - maxAdults + 1}`
  }

  const getGuestDescription = (index) => {
    if (index === 0)
      return "Dados do titular da conta (deve ser maior de 18 anos)."

    return index < maxAdults
      ? "Dados do acompanhante adulto (a partir de 12 anos)."
      : "Dados da criança (até 11 anos)."
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
                      <p className="text-sm text-gray-500 line-through">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(originalTotal)}
                      </p>
                    )}
                    {isAssociate && (
                      <Badge className="bg-green-100 text-green-700 w-fit mb-1 hover:bg-green-100 border-none">
                        Preço Associado Aplicado
                      </Badge>
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
            <form onSubmit={handleMasterSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start gap-2 text-sm border border-red-200">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{error}</span>
                  </div>
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
                        onChange={(e) => {
                          setCnpj(maskCNPJ(e.target.value))
                          setError("")
                        }}
                        required
                        minLength={14}
                      />
                    </div>
                    <Button
                      type="submit"
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
                    <CardTitle>
                      {foundCompany ? "Confirmar Empresa" : "Cadastrar Empresa"}
                    </CardTitle>
                    <CardDescription>
                      {foundCompany
                        ? "Verifique e atualize os dados da empresa se necessário."
                        : "Não encontramos sua empresa. Por favor, preencha os dados abaixo."}
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
                          onChange={(e) => {
                            setNewCompanyData({
                              ...newCompanyData,
                              corporate_name: e.target.value,
                            })
                            setError("")
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="badge">
                          Nome da empresa no crachá *
                        </Label>
                        <Input
                          id="badge"
                          value={newCompanyData.badge}
                          onChange={(e) => {
                            setNewCompanyData({
                              ...newCompanyData,
                              badge: e.target.value,
                            })
                            setError("")
                          }}
                          maxLength={20}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail da Empresa *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newCompanyData.email}
                          onChange={(e) => {
                            setNewCompanyData({
                              ...newCompanyData,
                              email: e.target.value,
                            })
                            setError("")
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone Comercial *</Label>
                        <Input
                          id="phone"
                          value={newCompanyData.phone}
                          onChange={(e) => {
                            setNewCompanyData({
                              ...newCompanyData,
                              phone: maskPhone(e.target.value),
                            })
                            setError("")
                          }}
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
                          onChange={(e) => {
                            setNewCompanyData({
                              ...newCompanyData,
                              responsible_person: e.target.value,
                            })
                            setError("")
                          }}
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
                          onChange={(e) => {
                            setNewCompanyData({
                              ...newCompanyData,
                              zip_code: maskCEP(e.target.value),
                            })
                            setError("")
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço *</Label>
                        <Input
                          id="address"
                          value={newCompanyData.address}
                          onChange={(e) => {
                            setNewCompanyData({
                              ...newCompanyData,
                              address: e.target.value,
                            })
                            setError("")
                          }}
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
                          onChange={(e) => {
                            setNewCompanyData({
                              ...newCompanyData,
                              address_number: e.target.value,
                            })
                            setError("")
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address_complement">Complemento</Label>
                        <Input
                          id="address_complement"
                          value={newCompanyData.address_complement}
                          onChange={(e) => {
                            setNewCompanyData({
                              ...newCompanyData,
                              address_complement: e.target.value,
                            })
                            setError("")
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={newCompanyData.neighborhood}
                        onChange={(e) => {
                          setNewCompanyData({
                            ...newCompanyData,
                            neighborhood: e.target.value,
                          })
                          setError("")
                        }}
                        required
                      />
                    </div>

                    <div className="mt-4">
                      <LocationSelector
                        key={`company-${newCompanyData.stateCode}-${newCompanyData.city}`}
                        countryCode={newCompanyData.countryCode}
                        stateCode={newCompanyData.stateCode}
                        cityName={newCompanyData.city}
                        onLocationChange={handleCompanyLocationChange}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
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
                    <Card
                      key={index}
                      id={`guest-card-${index}`}
                      className={`overflow-hidden ${guestErrors[index] ? "border-red-500" : ""}`}
                    >
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
                        {index > 0 && !(guests.length <= minRequired) && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveGuest(index)}
                            disabled={guests.length <= minRequired}
                          >
                            Remover acompanhante
                          </Button>
                        )}
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
                                disabled={index === 0}
                                className={`
                                  ${index === 0 ? "bg-gray-50 opacity-80" : ""}
                                  ${guestErrors[index]?.name ? "border-red-500" : ""}
                                `}
                                required
                              />
                              {guestErrors[index]?.name && (
                                <p className="text-red-500 text-xs mt-1">
                                  {guestErrors[index].name}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`badge_name-${index}`}>
                                Nome no Crachá *
                              </Label>
                              <Input
                                id={`badge_name-${index}`}
                                name="badge_name"
                                value={guestData.badge_name}
                                onChange={(e) => handleChange(index, e)}
                                placeholder="Como aparecerá no crachá"
                                maxLength={20}
                                className={
                                  guestErrors[index]?.badge_name
                                    ? "border-red-500"
                                    : ""
                                }
                                required
                              />
                              {guestErrors[index]?.badge_name && (
                                <p className="text-red-500 text-xs mt-1">
                                  {guestErrors[index].badge_name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className={
                                  guestErrors[index]?.birth_date
                                    ? "border-red-500"
                                    : ""
                                }
                                required
                              />
                              {guestErrors[index]?.birth_date && (
                                <p className="text-red-500 text-xs mt-1">
                                  {guestErrors[index].birth_date}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`gender-${index}`}>Sexo *</Label>
                              <Select
                                value={guestData.gender}
                                onValueChange={(val) =>
                                  handleSelectChange(index, "gender", val)
                                }
                                required
                              >
                                <SelectTrigger
                                  id={`gender-${index}`}
                                  className={
                                    guestErrors[index]?.gender
                                      ? "border-red-500"
                                      : ""
                                  }
                                >
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">Masculino</SelectItem>
                                  <SelectItem value="F">Feminino</SelectItem>
                                </SelectContent>
                              </Select>
                              {guestErrors[index]?.gender && (
                                <p className="text-red-500 text-xs mt-1">
                                  {guestErrors[index].gender}
                                </p>
                              )}
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
                                disabled={false}
                                className={
                                  guestErrors[index]?.cpf_number
                                    ? "border-red-500"
                                    : ""
                                }
                                required
                              />
                              {guestErrors[index]?.cpf_number && (
                                <p className="text-red-500 text-xs mt-1">
                                  {guestErrors[index].cpf_number}
                                </p>
                              )}
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
                              <Label htmlFor={`phone-${index}`}>
                                Celular *
                              </Label>
                              <Input
                                id={`phone-${index}`}
                                name="phone"
                                value={guestData.phone}
                                onChange={(e) => handleChange(index, e)}
                                placeholder="(00) 90000-0000"
                                required
                                className={
                                  guestErrors[index]?.phone
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                              {guestErrors[index]?.phone && (
                                <p className="text-red-500 text-xs mt-1">
                                  {guestErrors[index].phone}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`email-${index}`}>
                                E-mail{" "}
                                {calculateIsAdult(guestData.birth_date) && "*"}
                              </Label>
                              <Input
                                id={`email-${index}`}
                                name="email"
                                type="email"
                                value={guestData.email}
                                onChange={(e) => handleChange(index, e)}
                                disabled={index === 0}
                                className={`
                                  ${index === 0 ? "bg-gray-50 opacity-80" : ""}
                                  ${guestErrors[index]?.email ? "border-red-500" : ""}
                                `}
                                required={calculateIsAdult(
                                  guestData.birth_date,
                                )}
                              />
                              {guestErrors[index]?.email && (
                                <p className="text-red-500 text-xs mt-1">
                                  {guestErrors[index].email}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        {/* Address removed */}

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
                                Nome Contato Emergência *
                              </Label>
                              <Input
                                id={`emergency_contact_name-${index}`}
                                name="emergency_contact_name"
                                value={guestData.emergency_contact_name}
                                onChange={(e) => handleChange(index, e)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`emergency_contact_phone-${index}`}
                              >
                                Telefone Emergência *
                              </Label>
                              <Input
                                id={`emergency_contact_phone-${index}`}
                                name="emergency_contact_phone"
                                value={guestData.emergency_contact_phone}
                                onChange={(e) => handleChange(index, e)}
                                required
                                className={
                                  guestErrors[index]?.emergency_contact_phone
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                              {guestErrors[index]?.emergency_contact_phone && (
                                <p className="text-red-500 text-xs mt-1">
                                  {guestErrors[index].emergency_contact_phone}
                                </p>
                              )}
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

                  {guests.length < totalCapacity && (
                    <div className="flex justify-center py-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddGuest}
                        className="w-full md:w-auto border-dashed border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-6"
                      >
                        <User className="h-5 w-5 mr-2" />
                        Adicionar Hóspede (Máximo de: {totalCapacity})
                      </Button>
                    </div>
                  )}

                  {minRequired > 1 && (
                    <div className="bg-orange-50 text-orange-700 p-4 rounded-md border border-orange-200 text-sm flex items-start gap-2 mb-4">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">
                          Ocupação mínima obrigatória
                        </p>
                        <p>
                          Este quarto exige no mínimo {minRequired} hóspedes
                          adultos para a reserva.
                        </p>
                      </div>
                    </div>
                  )}

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
                        type="submit"
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
                              {foundCompany?.custom_discount_percentage !== null
                                ? "Desconto Exclusivo"
                                : globalDiscounts.find(
                                    (d) => d.id === foundCompany?.discount_id,
                                  )?.name || "Desconto"}{" "}
                              ({discountPercentage}%)
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

                        {isAssociate && (
                          <div className="flex justify-between text-sm text-green-600 font-medium">
                            <span>Preço Especial Associado</span>
                            <span>Já aplicado</span>
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

                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-gray-900">
                          Forma de Pagamento
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            type="button"
                            variant={
                              paymentMethod === "cash" ? "default" : "outline"
                            }
                            className={
                              paymentMethod === "cash" ? "bg-blue-600" : ""
                            }
                            onClick={() => {
                              setPaymentMethod("cash")
                              setInstallmentsCount(1)
                            }}
                          >
                            À Vista
                          </Button>
                          <Button
                            type="button"
                            variant={
                              paymentMethod === "installments"
                                ? "default"
                                : "outline"
                            }
                            className={
                              paymentMethod === "installments"
                                ? "bg-blue-600"
                                : ""
                            }
                            onClick={() => {
                              setPaymentMethod("installments")
                              setInstallmentsCount(maxInstallments)
                            }}
                          >
                            Parcelado
                          </Button>
                        </div>

                        {paymentMethod === "installments" && (
                          <div className="space-y-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between">
                              <Label className="text-blue-900 font-bold">
                                Plano de Parcelamento
                              </Label>
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"
                              >
                                {maxInstallments}x Fixas
                              </Badge>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-blue-600">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(finalTotal / maxInstallments)}
                              </span>
                              <span className="text-sm text-blue-400 font-medium">
                                por parcela
                              </span>
                            </div>
                            <div className="pt-2 border-t border-blue-100 flex flex-col gap-2">
                              <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                                Cronograma de Vencimentos:
                              </p>
                              <div className="space-y-1">
                                {generateInstallmentDates(
                                  installmentsCount,
                                  room.hotel_check_in_date,
                                ).map((date, idx) => (
                                  <p
                                    key={idx}
                                    className="text-[11px] text-blue-600 leading-tight flex justify-between"
                                  >
                                    <span>Parcela {idx + 1}</span>
                                    <span className="font-medium">
                                      Vencimento:{" "}
                                      {new Date(date).toLocaleDateString(
                                        "pt-BR",
                                        { timeZone: "UTC" },
                                      )}
                                    </span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
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

    // 4. Fetch Global Discounts for real-time calculation
    const allDiscounts = await discountModel.getAllActiveDiscounts()

    return {
      props: {
        room: JSON.parse(JSON.stringify(targetRoom)),
        user: JSON.parse(JSON.stringify(user)),
        guestProfile: guestProfile
          ? JSON.parse(JSON.stringify(guestProfile))
          : null,
        initialDiscounts: JSON.parse(JSON.stringify(allDiscounts)),
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
