import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  Loader2,
  Search,
  Check,
  Plus,
} from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { GuestDialog } from "@/components/guest/GuestDialog"
import { Badge } from "@/components/ui/badge"
import {
  calculateTotalPrice as calculatePrice,
  calculateMaxInstallments as calculateInstallments,
  validateRoomCapacity,
  generateInstallmentDates,
} from "@/lib/registration-helpers"
import { Separator } from "@/components/ui/separator"

export default function AdminAddRegistrationPage() {
  const router = useRouter()
  const [hotels, setHotels] = useState([])
  const [rooms, setRooms] = useState([])
  const [allGuests, setAllGuests] = useState([])

  const [selectedHotelId, setSelectedHotelId] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState("")
  const [selectedGuests, setSelectedGuests] = useState([]) // Array of guest objects

  const [searchTerm, setSearchTerm] = useState("")
  const [companySearchTerm, setCompanySearchTerm] = useState("")
  const [allCompanies, setAllCompanies] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState("")

  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [installmentsCount, setInstallmentsCount] = useState(1)

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchHotels(),
      fetchAllGuests(),
      fetchCompanies(),
      fetchDiscounts(),
    ])
  }, [])

  useEffect(() => {
    if (selectedHotelId) {
      fetchRooms(selectedHotelId)
    } else {
      setRooms([])
      setSelectedRoomId("")
    }
  }, [selectedHotelId])

  const fetchHotels = async () => {
    try {
      const res = await fetch("/api/v1/hotels/active")
      if (res.ok) {
        const data = await res.json()
        const activeHotels = data.hotels || []
        setHotels(activeHotels)
        if (activeHotels.length > 0) {
          setSelectedHotelId(activeHotels[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAllGuests = async () => {
    try {
      const res = await fetch("/api/v1/guests")
      if (res.ok) {
        const data = await res.json()
        setAllGuests(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setInitialLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/v1/companies")
      if (res.ok) {
        const data = await res.json()
        setAllCompanies(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/v1/hotels/active") // This returns both hotels and discounts
      if (res.ok) {
        const data = await res.json()
        setDiscounts(data.discounts || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchRooms = async (hotelId) => {
    setRoomsLoading(true)
    try {
      const res = await fetch(`/api/v1/rooms?hotel_id=${hotelId}`)
      if (res.ok) {
        const data = await res.json()
        setRooms(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setRoomsLoading(false)
    }
  }

  const toggleGuestSelection = (guest) => {
    const isSelected = selectedGuests.some((g) => g.id === guest.id)
    if (isSelected) {
      setSelectedGuests(selectedGuests.filter((g) => g.id !== guest.id))
    } else {
      // Check capacity before adding if room is selected
      if (selectedRoomId) {
        const currentRoom = rooms.find((r) => r.id === selectedRoomId)
        if (currentRoom) {
          const { adultCount, childCount } = calculatePrice(
            currentRoom,
            [...selectedGuests, guest],
            null,
            [],
          )
          const validation = validateRoomCapacity(
            currentRoom,
            adultCount,
            childCount,
          )
          if (!validation.isValid) {
            setError(validation.message)
            setIsErrorDialogOpen(true)
            return
          }
        }
      }
      setSelectedGuests([...selectedGuests, guest])
      setSearchTerm("") // Clear search after selection
    }
  }

  const handleNewGuestCreated = (newGuest) => {
    // Add to allGuests list so it's available for future searches
    setAllGuests((prev) => [newGuest, ...prev])
    // Auto-select the newly created guest
    if (!selectedGuests.some((g) => g.id === newGuest.id)) {
      setSelectedGuests((prev) => [...prev, newGuest])
    }
  }

  // Pricing calculation
  const currentRoom = rooms.find((r) => r.id === selectedRoomId)
  const selectedCompany = allCompanies.find((c) => c.id === selectedCompanyId)
  const pricing = currentRoom
    ? calculatePrice(currentRoom, selectedGuests, selectedCompany, discounts)
    : { finalTotal: 0, originalTotal: 0, adultCount: 0, childCount: 0 }

  const maxInstallments = currentRoom
    ? calculateInstallments(currentRoom.hotel_check_in_date)
    : 1

  useEffect(() => {
    if (paymentMethod === "installments") {
      setInstallmentsCount(maxInstallments)
    }
  }, [paymentMethod, maxInstallments])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (selectedGuests.length === 0) {
      setError("É necessário selecionar pelo menos um hóspede.")
      setIsErrorDialogOpen(true)
      setLoading(false)
      return
    }

    // Final capacity check
    const validation = validateRoomCapacity(
      currentRoom,
      pricing.adultCount,
      pricing.childCount,
    )
    if (!validation.isValid) {
      setError(validation.message)
      setIsErrorDialogOpen(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    setAction("")

    try {
      const response = await fetch("/api/v1/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: selectedRoomId,
          guests_data: selectedGuests.map((g) => ({
            ...g,
            birth_date: g.birth_date
              ? new Date(g.birth_date).toISOString().split("T")[0]
              : null,
          })),
          company_cnpj: selectedCompany?.cnpj || null,
          payment_method: paymentMethod,
          installments_count: installmentsCount,
        }),
      })

      if (response.ok) {
        router.push("/table/inscricoes")
      } else {
        const data = await response.json()
        setError(data.message || "Erro ao realizar inscrição.")
        setAction(data.action || "")
        setIsErrorDialogOpen(true)
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.")
      setIsErrorDialogOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const filteredSearchResults =
    searchTerm.length >= 2
      ? allGuests
          .filter((guest) => {
            const term = searchTerm.toLowerCase()
            return (
              guest.name?.toLowerCase().includes(term) ||
              guest.cpf_number?.includes(searchTerm)
            )
          })
          .slice(0, 5)
      : []

  const filteredCompanies =
    companySearchTerm.length >= 2
      ? allCompanies
          .filter((company) => {
            const term = companySearchTerm.toLowerCase()
            return (
              company.corporate_name?.toLowerCase().includes(term) ||
              company.cnpj?.includes(companySearchTerm)
            )
          })
          .slice(0, 5)
      : []

  const pageActions = (
    <Link href="/table/inscricoes" passHref>
      <Button variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
    </Link>
  )

  // Prevent Submit on Enter for search fields
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
    }
  }

  if (initialLoading) {
    return (
      <TableLayout pageActions={pageActions}>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </TableLayout>
    )
  }

  return (
    <TableLayout pageActions={pageActions}>
      <div className="flex justify-center mb-12">
        <Card className="w-full max-w-4xl border-gray-200">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-gray-600" />
              <div>
                <CardTitle className="text-xl">Nova Inscrição</CardTitle>
                <CardDescription>
                  Registro manual de participantes com todas as regras de
                  negócio aplicadas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Seção 1: Seleção de Local e Quarto */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                  Acomodação
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg border border-gray-100">
                  <div className="space-y-2">
                    <Label className="text-gray-600 text-xs">Hotel</Label>
                    <Select
                      value={selectedHotelId}
                      onValueChange={setSelectedHotelId}
                      required
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Escolha um hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(hotels) &&
                          hotels.map((h) => (
                            <SelectItem key={h.id} value={h.id}>
                              {h.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-600 text-xs">
                      Categoria do Quarto
                    </Label>
                    <Select
                      value={selectedRoomId}
                      onValueChange={setSelectedRoomId}
                      disabled={!selectedHotelId || roomsLoading}
                      required
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue
                          placeholder={
                            selectedHotelId
                              ? "Escolha o quarto"
                              : "Selecione o hotel primeiro"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(rooms) &&
                          rooms.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name} ({r.room_type} - {r.room_category})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {currentRoom && (
                      <p className="text-[10px] text-blue-600">
                        Capacidade: {currentRoom.max_adults} Adultos +{" "}
                        {currentRoom.max_children} Crianças
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 2: Empresa e Convênio */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                  Empresa e Descontos
                </h3>
                <div className="p-4 rounded-lg border border-gray-100 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-600 text-xs">
                      Buscar Empresa (Nome ou CNPJ)
                    </Label>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="Digite o nome ou CNPJ..."
                        className="pl-9 h-9 border-gray-200"
                        value={companySearchTerm}
                        onChange={(e) => setCompanySearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />

                      {/* Resultados da Busca de Empresa */}
                      {filteredCompanies.length > 0 && (
                        <Card className="absolute z-50 w-full mt-1 shadow-lg border-gray-200 overflow-hidden">
                          <div className="p-1">
                            {filteredCompanies.map((company) => (
                              <button
                                key={company.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCompanyId(company.id)
                                  setCompanySearchTerm("")
                                }}
                                className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-md transition-colors group"
                              >
                                <div className="text-left">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {company.corporate_name}
                                  </p>
                                  <p className="text-[10px] text-gray-500 font-mono">
                                    {company.cnpj}
                                  </p>
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 group-hover:text-blue-600 underline">
                                  Selecionar
                                </div>
                              </button>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>

                    {selectedCompanyId && selectedCompanyId !== "none" ? (
                      <div className="mt-4 p-3 bg-blue-50/30 border border-blue-100 rounded-lg flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-bold text-blue-900 text-sm">
                            {selectedCompany?.corporate_name}
                          </p>
                          <div className="flex gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 bg-white font-mono"
                            >
                              CNPJ: {selectedCompany?.cnpj}
                            </Badge>
                            {selectedCompany?.discount_name && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-5 text-green-600 border-green-200 bg-green-50"
                              >
                                {selectedCompany.discount_name} (
                                {selectedCompany.discount_value}%)
                              </Badge>
                            )}
                            {selectedCompany?.custom_discount_percentage !==
                              null &&
                              selectedCompany?.custom_discount_percentage !==
                                undefined && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5 text-blue-600 border-blue-200 bg-blue-50"
                                >
                                  Extra:{" "}
                                  {selectedCompany.custom_discount_percentage}%
                                </Badge>
                              )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCompanyId("none")}
                          className="text-gray-400 hover:text-red-500 h-8"
                        >
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic px-1">
                        Nenhuma empresa selecionada (Inscrição Pessoa Física)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 3: Gerenciamento de Hóspedes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                    Hóspedes
                  </h3>
                  <GuestDialog onGuestSuccess={handleNewGuestCreated}>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Novo Hóspede
                    </Button>
                  </GuestDialog>
                </div>

                <div className="space-y-4">
                  {/* Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por Nome ou CPF..."
                      className="pl-10 h-10 border-gray-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />

                    {/* Resultados da Busca */}
                    {filteredSearchResults.length > 0 && (
                      <Card className="absolute z-50 w-full mt-1 shadow-lg border-gray-200 overflow-hidden">
                        <div className="p-1">
                          {filteredSearchResults.map((guest) => (
                            <button
                              key={guest.id}
                              type="button"
                              onClick={() => toggleGuestSelection(guest)}
                              disabled={selectedGuests.some(
                                (g) => g.id === guest.id,
                              )}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group disabled:opacity-50"
                            >
                              <div className="text-left">
                                <p className="font-medium text-gray-900">
                                  {guest.name}
                                </p>
                                <p className="text-xs text-gray-500 font-mono">
                                  {guest.cpf_number}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedGuests.some(
                                  (g) => g.id === guest.id,
                                ) ? (
                                  <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-none px-2 py-0.5">
                                    <Check className="h-3 w-3 mr-1" />{" "}
                                    Selecionado
                                  </Badge>
                                ) : (
                                  <div className="text-xs font-bold text-gray-400 group-hover:text-blue-600 underline">
                                    Selecionar
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Lista de Selecionados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedGuests.length === 0 ? (
                      <div className="md:col-span-2 border border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50/50">
                        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-xs">
                          Nenhum hóspede selecionado.
                        </p>
                      </div>
                    ) : (
                      selectedGuests.map((guest, idx) => (
                        <div
                          key={guest.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-[10px]">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-xs text-ellipsis overflow-hidden whitespace-nowrap max-w-[150px]">
                                {guest.name}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono">
                                {guest.cpf_number}{" "}
                                {idx === 0 && (
                                  <span className="text-gray-400 font-bold ml-1 uppercase">
                                    Hóspede 1
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleGuestSelection(guest)}
                            className="h-6 w-6 text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 4: Pagamento */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                  Pagamento
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg border border-gray-100 bg-gray-50/30">
                  <div className="space-y-2">
                    <Label className="text-gray-600 text-xs">
                      Forma de Pagamento
                    </Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">À Vista / Boleto</SelectItem>
                        <SelectItem value="installments">Parcelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === "installments" && currentRoom && (
                    <div className="space-y-2 flex flex-col justify-center">
                      <Label className="text-gray-600 text-xs">
                        Número de Parcelas
                      </Label>
                        <div className="pt-2 flex flex-col gap-2 bg-white p-3 rounded-md border border-blue-50">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                              Parcelamento:
                            </p>
                            <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-50 border-none">
                              {maxInstallments}x de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pricing.finalTotal / maxInstallments)}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {generateInstallmentDates(
                              maxInstallments,
                              currentRoom.hotel_check_in_date,
                            ).map((date, idx) => (
                              <p
                                key={idx}
                                className="text-[11px] text-blue-600 leading-tight flex justify-between"
                              >
                                <span>Parcela {idx + 1}</span>
                                <span className="font-medium">
                                  {new Date(date).toLocaleDateString("pt-BR", {
                                    timeZone: "UTC",
                                  })}
                                </span>
                              </p>
                            ))}
                          </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé: Resumo e Ação Final */}
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <div className="flex flex-col gap-2 bg-gray-50/50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Valor Bruto:</span>
                    <span className="text-gray-700 font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(pricing.originalTotal)}
                    </span>
                  </div>
                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto ({pricing.discountPercentage}%):</span>
                      <span>
                        -{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(pricing.discountAmount)}
                      </span>
                    </div>
                  )}
                  {pricing.isAssociate && (
                    <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                      <Check className="h-3 w-3" /> PREÇO DE ASSOCIADO APLICADO
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-gray-900">
                      Total Final:
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(pricing.finalTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 text-[10px] text-gray-500">
                  <p>
                    Inscritos: {pricing.adultCount} Adultos +{" "}
                    {pricing.childCount} Crianças
                  </p>
                  {selectedRoomId && (
                    <p className="text-blue-500 font-medium uppercase">
                      Quarto Pronto
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    loading || !selectedRoomId || selectedGuests.length === 0
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 h-11 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    "Finalizar Inscrição"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro na Inscrição"
        message={error}
        actionMessage={action}
      />
    </TableLayout>
  )
}

function Users(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
