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
import { cpf } from "cpf-cnpj-validator"
import { validateCPF, validateCNPJ, validatePhone } from "@/lib/validators"
import { LocationSelector } from "@/components/ui/LocationSelector"
import { getInitialLocationState } from "@/lib/location-utils"
import {
  calculateMaxInstallments as calculateInstallments,
  validateRoomCapacity,
  generateInstallmentDates,
  calculateSummaryPrice,
  getChildrenCount,
} from "@/lib/registration-helpers"

function calculateAge(birthDate, referenceDate = new Date()) {
  if (!birthDate) return 0
  const birth = new Date(birthDate)
  const ref = new Date(referenceDate)
  let age = ref.getFullYear() - birth.getFullYear()
  const m = ref.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function calculateIsAdult(birthDate, referenceDate) {
  return calculateAge(birthDate, referenceDate) >= 12
}

function calculateIsHolder(birthDate) {
  return calculateAge(birthDate) >= 18
}

const ACTIVITY_SECTORS = [
  "ACESSÓRIOS",
  "ATACADISTA",
  "CONSULTORIA",
  "DISTRIBUIDOR",
  "ENTIDADE DE CLASSE",
  "ESQUADRIAS",
  "FERRAGENS",
  "INSTALAÇÃO",
  "INSUMOS",
  "INTERLAY",
  "MAQUINÁRIO",
  "PROCESSADOR",
  "RECICLAGEM",
  "REPRESENTAÇÃO",
  "SERVIÇOS",
  "SINDICATOS",
  "SOFTWARE",
  "USINA DE BASE",
  "VIDRAÇARIA",
  "OUTRO",
]

export default function CheckoutPage({
  room,
  user,
  guestProfile,
  initialDiscounts,
  initialQuery,
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
    activity_sector: "",
  })
  const [selectedSector, setSelectedSector] = useState("")
  const [customSector, setCustomSector] = useState("")

  useEffect(() => {
    if (newCompanyData.activity_sector) {
      const sector = newCompanyData.activity_sector
      if (ACTIVITY_SECTORS.slice(0, 19).includes(sector)) {
        setSelectedSector(sector)
        setCustomSector("")
      } else {
        setSelectedSector("OUTRO")
        setCustomSector(sector)
      }
    } else {
      setSelectedSector("")
      setCustomSector("")
    }
  }, [newCompanyData.cnpj, newCompanyData.activity_sector])
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [installmentsCount, setInstallmentsCount] = useState(1)
  const [globalDiscounts] = useState(initialDiscounts || [])
  const [guestErrors, setGuestErrors] = useState({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [occupancyCounts, setOccupancyCounts] = useState(() => {
    const counts = { adults: parseInt(initialQuery?.adults) || 1 }
    if (initialQuery) {
      Object.keys(initialQuery).forEach((key) => {
        if (key !== "id" && key !== "adults") {
          counts[key] = parseInt(initialQuery[key]) || 0
        }
      })
    }
    return counts
  })

  // No longer needed: countries, getStates, getCities helpers here

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

  // Determine initial codes for Guest Profile
  const locationState = getInitialLocationState(guestProfile)

  const isAdmin = user.features?.includes("update:user:others")

  const initialGuest = isAdmin
    ? { ...emptyGuest }
    : {
        ...emptyGuest,
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
        ...locationState,
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

  const minRequired = room.min_guests || 1

  const [guests, setGuests] = useState(() => {
    const query = initialQuery || {}
    const adultsCount = parseInt(query.adults) || 1
    const initialArr = []

    // 1. Fill Adults
    for (let i = 0; i < adultsCount; i++) {
      if (i === 0) {
        initialArr.push({ ...initialGuest, _type: "adult" })
      } else {
        initialArr.push({ ...emptyGuest, _type: "adult" })
      }
    }

    // 2. Fill Children by Policy
    Object.keys(query).forEach((key) => {
      if (key !== "id" && key !== "adults") {
        const count = parseInt(query[key]) || 0
        const policy = room.price_policies?.find((p) => p.id === key)
        if (policy) {
          for (let i = 0; i < count; i++) {
            initialArr.push({
              ...emptyGuest,
              _type: "child",
              _policy_id: policy.id,
              _policy_label: policy.description,
              _max_age: policy.max_age,
            })
          }
        }
      }
    })

    // Fallback if no query params (should not happen in normal flow now)
    if (initialArr.length === 0) {
      initialArr.push({ ...initialGuest, _type: "adult" })
      for (let i = 1; i < minRequired; i++) {
        initialArr.push({ ...emptyGuest, _type: "adult" })
      }
    }

    return initialArr
  })

  // Initial query is handled by useState, but we keep this to handle
  // dynamic updates if the URL changes without a full page reload
  useEffect(() => {
    if (router.isReady && router.query) {
      const counts = { adults: parseInt(router.query.adults) || 1 }
      Object.keys(router.query).forEach((key) => {
        if (key !== "id" && key !== "adults") {
          counts[key] = parseInt(router.query[key]) || 0
        }
      })
      setOccupancyCounts(counts)
    }
  }, [router.isReady, router.query])

  // Handlers for form changes
  const lookupGuestByCpf = async (index, cpf) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/v1/guests?search=${encodeURIComponent(cpf)}`,
      )
      if (!response.ok) return

      const result = await response.json()
      const cleanCpf = cpf.replace(/\D/g, "")
      const foundGuest = result.data.find(
        (g) => g.cpf_number?.replace(/\D/g, "") === cleanCpf,
      )

      if (foundGuest) {
        updateGuestFields(index, foundGuest)
      }
    } catch (err) {
      console.error("Error looking up guest:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateGuestFields = (index, data) => {
    setGuests((prevGuests) => {
      const updatedGuests = [...prevGuests]
      const birthDate = data.birth_date
        ? new Date(data.birth_date).toISOString().split("T")[0]
        : ""

      updatedGuests[index] = {
        ...updatedGuests[index],
        ...data,
        birth_date: birthDate,
      }
      return updatedGuests
    })
    setError("")
  }

  const handleChange = (index, e) => {
    let { name, value } = e.target

    // 1. Apply masks
    const maskedValue = applyFieldMask(name, value)

    // 2. Update state
    setGuests((prev) => {
      const updated = [...prev]
      const isBadgeField = name === "badge_name"
      const valueToStore = isBadgeField
        ? maskedValue.toUpperCase()
        : maskedValue

      updated[index] = {
        ...updated[index],
        [name]: e.target.type === "checkbox" ? e.target.checked : valueToStore,
      }

      // If the guest had pending info and they manually edit CPF or RG, clear the flag
      if (prev[index]?.is_pending_info) {
        if (name === "cpf_number" && valueToStore !== prev[index].cpf_number) {
          updated[index].is_pending_info = false
        } else if (
          name === "rg_number" &&
          valueToStore !== prev[index].rg_number
        ) {
          updated[index].is_pending_info = false
        }
      }

      return updated
    })

    // 3. Clear errors
    if (guestErrors[index]?.[name]) {
      setGuestErrors((prev) => {
        const next = { ...prev }
        delete next[index][name]
        if (Object.keys(next[index]).length === 0) delete next[index]
        return next
      })
    }
    setError("")

    // 4. CPF Lookup
    if (name === "cpf_number") {
      const cleanCpf = maskedValue.replace(/\D/g, "")
      if (cleanCpf === "11111111111") {
        const randomCpf = cpf.generate()
        const randomRgNum = Math.floor(
          Math.random() * 9000000000 + 1000000000,
        ).toString()
        const maskedCpf = maskCPF(randomCpf)
        const maskedRg = maskRG(randomRgNum)

        setGuests((prev) => {
          const updated = [...prev]
          const birthDateVal = updated[index].birth_date || "2000-01-01"
          const age = calculateAge(birthDateVal, room.hotel_check_in_date)
          const isAdult = age >= 18
          const pendingEmail =
            updated[index].email ||
            (isAdult ? `pendente_${Date.now()}@adefinir.com` : "")

          updated[index] = {
            ...updated[index],
            name: "A Definir",
            badge_name: "A DEFINIR",
            phone: "(11) 11111-1111",
            rg_number: maskedRg,
            cpf_number: maskedCpf,
            is_pending_info: true,
            gender: updated[index].gender || "M",
            birth_date: birthDateVal,
            email: pendingEmail,
          }
          return updated
        })
      } else if (cleanCpf.length === 11) {
        lookupGuestByCpf(index, maskedValue)
      }
    }
  }

  const applyFieldMask = (name, value) => {
    switch (name) {
      case "cpf_number":
        return maskCPF(value)
      case "rg_number":
        return maskRG(value)
      case "phone":
      case "emergency_contact_phone":
        return maskPhone(value)
      default:
        return value
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
    isAssociate,
  } = calculateSummaryPrice(
    room,
    occupancyCounts,
    foundCompany,
    globalDiscounts,
  )

  const adultCount = occupancyCounts.adults || 0
  const childCount = getChildrenCount(occupancyCounts)

  const basePrice = isAssociate
    ? Number(room?.member_price_per_night || room?.price_per_night || 0)
    : Number(room?.price_per_night || 0)

  const publicBasePrice = Number(room?.price_per_night || 0)

  const checkoutItems = []

  // Adults list
  for (let i = 0; i < adultCount; i++) {
    checkoutItems.push({
      label: `Adulto ${i + 1}`,
      price: basePrice,
    })
  }

  // Children list
  if (occupancyCounts) {
    let childIndex = 1
    Object.keys(occupancyCounts).forEach((key) => {
      if (key === "adults") return
      const count = Number(occupancyCounts[key]) || 0
      if (count <= 0) return

      const policy = room.price_policies?.find((p) => p.id === key)
      for (let i = 0; i < count; i++) {
        let childPrice = publicBasePrice
        if (policy) {
          if (policy.use_percentage === false) {
            childPrice =
              policy.price != null ? Number(policy.price) : publicBasePrice
          } else {
            const percentage = Number(policy.percentage ?? 100)
            childPrice = publicBasePrice * (percentage / 100)
          }
        }
        checkoutItems.push({
          label: `Criança ${childIndex++}`,
          price: childPrice,
        })
      }
    })
  }

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
          bed_preference: router.query.bed_preference,
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

      // Validate age matches category
      const ageAtCheckIn = calculateAge(
        guest.birth_date,
        room.hotel_check_in_date,
      )
      if (guest._type === "adult") {
        if (guest.birth_date && ageAtCheckIn < 12) {
          hasError = true
          if (!newErrors[index]) newErrors[index] = {}
          newErrors[index].birth_date =
            "Este hóspede deve ser adulto (12+ anos)."
        }
      } else if (guest._type === "child" && guest._policy_id) {
        const policy = room.price_policies?.find(
          (p) => p.id === guest._policy_id,
        )
        if (policy && guest.birth_date && ageAtCheckIn > policy.max_age) {
          hasError = true
          if (!newErrors[index]) newErrors[index] = {}
          newErrors[index].birth_date =
            `Idade excede o limite desta categoria (${policy.max_age} anos).`
        }
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
    // Autofill on all ones (CNPJ) with placeholder data
    if (cnpj.replace(/\D/g, "") === "1".repeat(14)) {
      setNewCompanyData({
        cnpj: cnpj,
        corporate_name: "A DEFINIR",
        badge: "A DEFINIR",
        email: "adefinir@email.com",
        phone: "(11) 11111-1111",
        responsible_person: "A DEFINIR",
        zip_code: "01001-000",
        address: "A DEFINIR",
        address_number: "111",
        address_complement: "A DEFINIR",
        neighborhood: "A DEFINIR",
        city: "São Paulo",
        state: "SP",
        stateCode: "SP",
        countryCode: "BR",
        activity_sector: "OUTRO",
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
          activity_sector: companyData.activity_sector || "",
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
          activity_sector: "",
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

    // Validate Activity Sector (Ramo de Atividade)
    if (
      !newCompanyData.activity_sector ||
      !newCompanyData.activity_sector.trim()
    ) {
      setError(
        "Por favor, selecione ou informe o ramo de atividade da empresa.",
      )
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
    const guest = guests[index]

    if (index === 0) {
      return (
        <div className="flex items-center gap-2">
          <span>Adulto 1</span>
          <Badge className="bg-blue-600 text-white border-none flex items-center gap-1">
            <Lock className="h-3 w-3" /> Titular
          </Badge>
        </div>
      )
    }

    if (guest?._type === "child") {
      // Count how many children come before this one
      const childNum = guests
        .slice(0, index + 1)
        .filter((g) => g._type === "child").length
      return `Criança ${childNum}`
    }

    return `Adulto ${index + 1}`
  }

  const getGuestDescription = (index) => {
    const guest = guests[index]
    if (index === 0)
      return "Dados do titular da conta (deve ser maior de 18 anos)."

    if (guest?._type === "child") {
      const sortedPolicies = [...(room.price_policies || [])].sort(
        (a, b) => a.max_age - b.max_age,
      )
      const policyIndex = sortedPolicies.findIndex(
        (p) => p.id === guest._policy_id,
      )
      const minAge =
        policyIndex === 0 || policyIndex === -1
          ? 0
          : sortedPolicies[policyIndex - 1].max_age + 1

      return `Dados da criança de ${minAge} até ${guest._max_age} anos`
    }

    return "Dados do acompanhante adulto (a partir de 12 anos)."
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
                <CardTitle className="text-lg">Resumo da Inscrição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Quarto Selecionado</p>
                  <p className="font-semibold text-blue-600">{room.name}</p>
                  <p className="font-semibold">{room.room_type}</p>
                  {router.query.bed_preference && (
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mt-1">
                      {router.query.bed_preference}
                    </p>
                  )}
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
                <div className="space-y-2">
                  <p className=" text-blue-600 font-medium">Hóspedes:</p>
                  <div className="space-y-1.5 text-sm">
                    {checkoutItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-gray-600"
                      >
                        <span>{item.label}</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.price)}
                        </span>
                      </div>
                    ))}
                    {discountPercentage > 0 && (
                      <div className="flex justify-between items-center text-green-600 font-medium border-t pt-1.5 mt-1.5">
                        <span>Desconto ({discountPercentage}%)</span>
                        <span>
                          -
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(discountAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Valor Total
                  </p>
                  <div className="flex flex-col mt-1">
                    {(discountPercentage > 0 || isAssociate) &&
                      originalTotal > finalTotal && (
                        <p className="text-xl text-gray-400 line-through">
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
                              badge: e.target.value.toUpperCase(),
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="activity_sector">
                          Ramo de Atividade *
                        </Label>
                        <Select
                          value={selectedSector}
                          onValueChange={(val) => {
                            setSelectedSector(val)
                            if (val === "OUTRO") {
                              setNewCompanyData({
                                ...newCompanyData,
                                activity_sector: customSector,
                              })
                            } else {
                              setNewCompanyData({
                                ...newCompanyData,
                                activity_sector: val,
                              })
                              setCustomSector("")
                            }
                            setError("")
                          }}
                          required
                        >
                          <SelectTrigger id="activity_sector">
                            <SelectValue placeholder="Selecione o ramo de atividade" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_SECTORS.map((sector) => (
                              <SelectItem key={sector} value={sector}>
                                {sector}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedSector === "OUTRO" && (
                        <div className="space-y-2">
                          <Label htmlFor="custom_activity_sector">
                            Informar Ramo de Atividade *
                          </Label>
                          <Input
                            id="custom_activity_sector"
                            value={customSector}
                            onChange={(e) => {
                              setCustomSector(e.target.value)
                              setNewCompanyData({
                                ...newCompanyData,
                                activity_sector: e.target.value,
                              })
                              setError("")
                            }}
                            placeholder="Digite o ramo de atividade"
                            required
                          />
                        </div>
                      )}
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
                        {/* Remove button hidden */}
                      </CardHeader>
                      <CardContent className="pt-6 space-y-6">
                        {/* Personal Data */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2 flex-wrap">
                            <span>Dados Pessoais</span>
                          </h3>

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
                              <Label htmlFor={`name-${index}`}>
                                Nome Completo *
                              </Label>
                              <Input
                                id={`name-${index}`}
                                name="name"
                                value={guestData.name}
                                onChange={(e) => handleChange(index, e)}
                                className={
                                  guestErrors[index]?.name
                                    ? "border-red-500"
                                    : ""
                                }
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
                                className={`
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

                  {/* Add guest button hidden */}

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
                        Avançar para o Resumo da Inscrição
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                          <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">
                            Quarto Selecionado
                          </h4>
                          <p className="font-semibold text-blue-900">
                            {room.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {room.room_type}
                          </p>
                          {router.query.bed_preference && (
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-1 px-2 py-0.5 bg-blue-50 rounded-full w-fit">
                              Tipo de acomodação: {router.query.bed_preference}
                            </p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">
                            Período da Reserva
                          </h4>
                          <p className="font-semibold text-gray-900">
                            {new Date(
                              (room.hotel_check_in_date || "").includes("T")
                                ? room.hotel_check_in_date
                                : (room.hotel_check_in_date || "") +
                                  "T12:00:00",
                            ).toLocaleDateString("pt-BR")}{" "}
                            até{" "}
                            {new Date(
                              (room.hotel_check_out_date || "").includes("T")
                                ? room.hotel_check_out_date
                                : (room.hotel_check_out_date || "") +
                                  "T12:00:00",
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 border-b pb-1">
                          Empresa
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <p>
                            <span className="text-gray-500">Razão Social:</span>{" "}
                            {newCompanyData.corporate_name ||
                              foundCompany?.corporate_name}
                          </p>
                          <p>
                            <span className="text-gray-500">Fantasia:</span>{" "}
                            {newCompanyData.fantasy_name ||
                              foundCompany?.fantasy_name ||
                              "-"}
                          </p>
                          <p>
                            <span className="text-gray-500">CNPJ:</span>{" "}
                            {newCompanyData.cnpj || foundCompany?.cnpj}
                          </p>
                          <p>
                            <span className="text-gray-500">Insc. Est.:</span>{" "}
                            {newCompanyData.state_registration ||
                              foundCompany?.state_registration ||
                              "Isento"}
                          </p>
                          <p className="md:col-span-2">
                            <span className="text-gray-500">Endereço:</span>{" "}
                            {newCompanyData.address || foundCompany?.address},{" "}
                            {newCompanyData.address_number ||
                              foundCompany?.address_number}{" "}
                            - {newCompanyData.city || foundCompany?.city}/
                            {newCompanyData.state || foundCompany?.state} (
                            {newCompanyData.zip_code || foundCompany?.zip_code})
                          </p>
                          <p>
                            <span className="text-gray-500">Telefone:</span>{" "}
                            {newCompanyData.phone || foundCompany?.phone}
                          </p>
                          <p>
                            <span className="text-gray-500">E-mail:</span>{" "}
                            {newCompanyData.email || foundCompany?.email}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-1">
                          Hóspedes
                        </h3>
                        {guests.map((g, idx) => (
                          <div
                            key={idx}
                            className="text-sm border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/30 rounded-r-md"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-blue-800">
                                  {idx + 1}. {g.name}
                                </p>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                  {g._type === "adult"
                                    ? "Adulto"
                                    : `${g._policy_label}`}
                                </p>
                              </div>
                              {idx === 0 && (
                                <Badge className="bg-blue-600 text-white border-none text-[10px] h-5">
                                  TITULAR
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-gray-700">
                              <p>
                                <span className="text-gray-500">Crachá:</span>{" "}
                                {g.badge_name || g.name}
                              </p>
                              <p>
                                <span className="text-gray-500">CPF:</span>{" "}
                                {g.cpf_number}
                              </p>
                              <p>
                                <span className="text-gray-500">E-mail:</span>{" "}
                                {g.email}
                              </p>
                              <p>
                                <span className="text-gray-500">Telefone:</span>{" "}
                                {g.phone}
                              </p>
                              <p>
                                <span className="text-gray-500">
                                  Nascimento:
                                </span>{" "}
                                {g.birth_date
                                  ? new Date(
                                      g.birth_date.includes("T")
                                        ? g.birth_date
                                        : g.birth_date + "T12:00:00",
                                    ).toLocaleDateString("pt-BR")
                                  : "-"}
                              </p>
                              {g.rg_number && (
                                <p>
                                  <span className="text-gray-500">RG:</span>{" "}
                                  {g.rg_number}
                                </p>
                              )}
                            </div>

                            <div className="mt-3 pt-2 border-t border-blue-100">
                              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                                Saúde e Emergência
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-gray-700">
                                <p>
                                  <span className="text-gray-500">
                                    Contato:
                                  </span>{" "}
                                  {g.emergency_contact_name} (
                                  {g.emergency_contact_phone})
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    Tipo Sanguíneo:
                                  </span>{" "}
                                  {g.blood_type || "-"} (RH:{" "}
                                  {g.blood_rh_factor || "-"})
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    Prob. Cardíacos:
                                  </span>{" "}
                                  {g.has_heart_condition ? "Sim" : "Não"}
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    Diabetes:
                                  </span>{" "}
                                  {g.has_diabetes ? "Sim" : "Não"}
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    Pressão Alta:
                                  </span>{" "}
                                  {g.has_high_blood_pressure ? "Sim" : "Não"}
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    Pressão Baixa:
                                  </span>{" "}
                                  {g.has_low_blood_pressure ? "Sim" : "Não"}
                                </p>
                                {g.medication_details && (
                                  <p className="sm:col-span-2">
                                    <span className="text-gray-500">
                                      Medicamentos:
                                    </span>{" "}
                                    {g.medication_details}
                                  </p>
                                )}
                                {g.health_observations && (
                                  <p className="sm:col-span-2">
                                    <span className="text-gray-500">
                                      Obs/Alergias:
                                    </span>{" "}
                                    {g.health_observations}
                                  </p>
                                )}
                              </div>
                            </div>
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
                            <span>Preço Associado Abravidro</span>
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
                        {paymentMethod === "cash" && (
                          <div className="space-y-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100 mt-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-blue-900 font-bold">
                                Pagamento Único
                              </Label>
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"
                              >
                                Total à Vista
                              </Badge>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-blue-600">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(finalTotal)}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-blue-100 flex flex-col gap-2">
                              <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                                Pagamento por boleto:
                              </p>
                              <div>
                                <p className="text-[11px] text-blue-600 font-black flex justify-between items-center">
                                  <span>VENCIMENTO</span>
                                  <span>
                                    {new Date(
                                      generateInstallmentDates(
                                        1,
                                        room.hotel_check_in_date,
                                      )[0],
                                    ).toLocaleDateString("pt-BR", {
                                      timeZone: "UTC",
                                    })}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

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
                                {maxInstallments}x Parcelas
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

                      {/* Aceite de Condições Gerais */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3 my-6">
                        <Checkbox
                          id="terms-checkbox"
                          checked={acceptedTerms}
                          onCheckedChange={(checked) =>
                            setAcceptedTerms(checked)
                          }
                          className="mt-0.5 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div className="space-y-1">
                          <Label
                            htmlFor="terms-checkbox"
                            className="text-sm font-semibold text-slate-700 leading-snug cursor-pointer select-none"
                          >
                            Li e aceito as{" "}
                            <a
                              href="/condicoes-gerais.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 underline font-bold hover:no-underline transition-all"
                            >
                              Condições Gerais
                            </a>
                            . *
                          </Label>
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
                          disabled={isLoading || !acceptedTerms}
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
        initialQuery: context.query,
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
