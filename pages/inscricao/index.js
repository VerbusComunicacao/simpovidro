import { useState, useMemo } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BedDouble, Users, AlertCircle, Search } from "lucide-react"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import RegistrationLayout from "@/components/registration/RegistrationLayout"
import {
  calculateSummaryPrice,
  calculateAdultDiscount,
  getChildrenCount,
} from "@/lib/registration-helpers"
import Link from "next/link"
import Image from "next/image"
import webserver from "infra/webserver"

export default function RegistrationPage({ hotels, discounts }) {
  const router = useRouter()
  const activeHotel = hotels?.[0]
  const [isSearchPerformed, setIsSearchPerformed] = useState(false)
  const [searchData, setSearchData] = useState(() => {
    const initial = { adults: 1 }
    if (activeHotel?.price_policies) {
      activeHotel.price_policies.forEach((policy) => {
        if (policy.max_age < 12) {
          initial[policy.id] = 0
        }
      })
    }
    return initial
  })
  const [selectedType, setSelectedType] = useState("all")

  const childrenCount = getChildrenCount(searchData)

  const { roomTypes, filteredRooms } = useMemo(() => {
    if (!activeHotel)
      return { roomTypes: [], roomCategories: [], filteredRooms: [] }

    const types = new Set()
    const categories = new Set()

    activeHotel.rooms.forEach((room) => {
      types.add(room.room_type)
      categories.add(room.room_category)
    })

    const filtered = activeHotel.rooms.filter((room) => {
      const maxAdults = room.max_adults ?? Infinity
      const maxChildren = room.max_children ?? Infinity
      const minGuests = room.min_guests ?? 0
      const hasAvailability = (room.available_rooms ?? 0) > 0

      const adultCapacityMatch = maxAdults >= searchData.adults
      const childCapacityMatch = maxChildren >= childrenCount
      const minAdultsMatch = minGuests <= searchData.adults

      const typeMatch =
        selectedType === "all" || room.room_type === selectedType

      return (
        hasAvailability &&
        adultCapacityMatch &&
        childCapacityMatch &&
        minAdultsMatch &&
        typeMatch
      )
    })

    const roomsWithPrices = filtered.map((room) => {
      const priceDetails = calculateSummaryPrice(
        room,
        searchData,
        null, // No company at this stage
        discounts,
      )
      return { ...room, ...priceDetails }
    })

    // Sort by finalTotal ascending
    roomsWithPrices.sort((a, b) => a.finalTotal - b.finalTotal)

    return {
      roomTypes: Array.from(types),
      filteredRooms: roomsWithPrices,
    }
  }, [activeHotel, selectedType, searchData, discounts, childrenCount])

  if (!activeHotel) {
    return (
      <RegistrationLayout title="Simpovidro 2026 - Inscrições Indisponíveis">
        <div className="flex items-center justify-center p-4 py-20">
          <Card className="max-w-md w-full text-center p-8">
            <AlertCircle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Inscrições não disponíveis
            </h1>
            <p className="text-gray-600 mb-6">Volte mais tarde.</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Voltar para o início</Link>
            </Button>
          </Card>
        </div>
      </RegistrationLayout>
    )
  }

  return (
    <RegistrationLayout>
      <main className="container mx-auto px-4 py-8">
        {!isSearchPerformed ? (
          <div>
            {/* BACKGROUND */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/simpovidro.webp"
                width={1920}
                height={1080}
                alt="background"
                className="w-full h-full object-cover"
              />
              {/* overlay escuro */}
              <div className="absolute inset-0 bg-black/80"></div>
            </div>
            <div className="relative max-w-2xl mx-auto px-4 py-8 overflow-hidden">
              {/* CONTEÚDO */}
              <div className="relative z-10">
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 drop-shadow-lg">
                    Inicie sua <span className="text-blue-400">Inscrição</span>
                  </h1>
                  <p className="text-slate-200 font-medium max-w-lg mx-auto">
                    Selecione a quantidade de hóspedes para ver as opções
                    disponíveis no{" "}
                    <span className="text-blue-400 font-bold">
                      {activeHotel.name}
                    </span>
                  </p>
                </div>

                <Card className="border shadow-xl overflow-hidden rounded-xl backdrop-blur">
                  <div className="bg-gray-50 border-b p-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-bold">
                        Selecione a quantidade de pessoas
                      </h2>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {/* Adultos */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                          Adultos
                        </h3>
                        <div className="flex items-center justify-between border rounded-lg p-2 bg-white">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setSearchData((prev) => ({
                                ...prev,
                                adults: Math.max(1, prev.adults - 1),
                              }))
                            }
                          >
                            -
                          </Button>

                          <span className="text-xl font-bold text-gray-900">
                            {searchData.adults}
                          </span>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setSearchData((prev) => ({
                                ...prev,
                                adults: prev.adults + 1,
                              }))
                            }
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Crianças Dinâmicas */}
                      {activeHotel.price_policies
                        ?.filter((p) => p.max_age < 12)
                        .map((policy) => (
                          <div key={policy.id} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                {policy.description}
                              </h3>
                            </div>

                            <div className="flex items-center justify-between border rounded-lg p-2 bg-white">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  setSearchData((prev) => ({
                                    ...prev,
                                    [policy.id]: Math.max(
                                      0,
                                      (prev[policy.id] || 0) - 1,
                                    ),
                                  }))
                                }
                              >
                                -
                              </Button>

                              <span className="text-xl font-bold text-gray-900">
                                {searchData[policy.id] || 0}
                              </span>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  setSearchData((prev) => ({
                                    ...prev,
                                    [policy.id]: (prev[policy.id] || 0) + 1,
                                  }))
                                }
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>

                    <Button
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
                      onClick={() => {
                        setIsSearchPerformed(true)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Procurar quartos disponíveis
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border p-6 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Resultados para sua busca
                  </h2>
                  <div className="flex items-center gap-3 text-gray-600 mt-1">
                    <span className="flex items-center gap-1 font-medium italic">
                      {searchData.adults} adultos
                    </span>
                    {Object.keys(searchData)
                      .filter((k) => k !== "adults" && searchData[k] > 0)
                      .map((k) => {
                        const policy = activeHotel.price_policies.find(
                          (p) => p.id === k,
                        )
                        return (
                          <span
                            key={k}
                            className="flex items-center gap-1 font-medium italic"
                          >
                            <span className="text-gray-300">•</span>
                            {searchData[k]} {policy?.description}
                          </span>
                        )
                      })}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="rounded-xl font-bold border-gray-200 px-6 h-12"
                onClick={() => setIsSearchPerformed(false)}
              >
                Alterar Busca
              </Button>
            </div>

            <section>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase">
                    Escolha seu <span className="text-blue-600">Quarto</span>
                  </h2>
                  <p className="text-slate-500 font-medium">
                    Selecione as opções abaixo para filtrar os quartos
                    disponíveis
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="w-full md:w-48">
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de quarto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {roomTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {filteredRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRooms.map((room) => (
                    <Card
                      key={room.id}
                      className="overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="h-48 w-full relative bg-gray-100 border-b overflow-hidden">
                        {room.photos && room.photos.length > 0 ? (
                          <Image
                            src={room.photos[0]}
                            alt={room.name || room.room_type}
                            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                            fill
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-brand-start to-brand-end flex items-center justify-center">
                            <BedDouble className="h-12 w-12 text-white/50" />
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          {room.room_type_description ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="border-blue-200 text-blue-700 bg-blue-50 cursor-help"
                                >
                                  {room.room_type}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="w-64">
                                <p className="leading-relaxed font-medium">
                                  {room.room_type_description}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-blue-200 text-blue-700 bg-blue-50"
                            >
                              {room.room_type}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">
                          {room.name || room.room_type}
                        </CardTitle>
                        <CardDescription>
                          {room.description || "Nenhuma descrição disponível"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span> {searchData.adults} adulto(s)</span>
                            </div>
                            {childrenCount > 0 && (
                              <div className="flex items-center gap-1">
                                <span>+ {childrenCount} criança(s)</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                  Valor da Inscrição
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(room.finalTotal)}
                                </p>
                              </div>
                              <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                  const params = new URLSearchParams()
                                  Object.keys(searchData).forEach((key) => {
                                    params.append(key, searchData[key])
                                  })
                                  router.push(
                                    `/inscricao/quarto/${room.id}?${params.toString()}`,
                                  )
                                }}
                              >
                                Selecionar
                              </Button>
                            </div>

                            <div className="w-full text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2.5">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                                Descontos especiais:
                              </p>
                              {discounts.map((discount, index) => {
                                const isMemberDiscount =
                                  discount.name
                                    .toLowerCase()
                                    .includes("associada") ||
                                  discount.name
                                    .toLowerCase()
                                    .includes("associado")

                                const displayPrice =
                                  isMemberDiscount && room.memberTotal
                                    ? room.memberTotal
                                    : room.originalTotal -
                                      calculateAdultDiscount(
                                        room.adultOriginalTotal ??
                                          room.originalTotal,
                                        Number(discount.value || 0),
                                      )

                                const discountValue = isMemberDiscount
                                  ? Math.round(
                                      (1 -
                                        room.memberTotal / room.originalTotal) *
                                        100,
                                    )
                                  : Number(discount.value || 0)

                                const savedAmount =
                                  room.originalTotal - displayPrice

                                return (
                                  <div
                                    key={discount.id}
                                    className={`flex items-center justify-between py-2.5 ${
                                      index !== discounts.length - 1
                                        ? "border-b border-slate-100"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex flex-col gap-1">
                                      <span className="font-bold text-slate-800 text-sm md:text-base">
                                        {discount.name.includes("Associada")
                                          ? "Associado Abravidro"
                                          : discount.name}
                                      </span>
                                      {discountValue > 0 && (
                                        <span className="text-[10px] md:text-[11px] font-black text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">
                                          {discountValue}% OFF
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-col items-end">
                                      <span className="text-xs text-slate-400 line-through">
                                        {new Intl.NumberFormat("pt-BR", {
                                          style: "currency",
                                          currency: "BRL",
                                        }).format(room.originalTotal)}
                                      </span>
                                      <span className="font-black text-blue-600 text-base md:text-lg lg:text-xl animate-pulse-subtle">
                                        {new Intl.NumberFormat("pt-BR", {
                                          style: "currency",
                                          currency: "BRL",
                                        }).format(displayPrice)}
                                      </span>
                                      {savedAmount > 0 && (
                                        <span className="text-xs text-emerald-600 font-extrabold">
                                          Economize{" "}
                                          {new Intl.NumberFormat("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                          }).format(savedAmount)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border p-12 flex flex-col items-center justify-center">
                  <Empty className="border-none shadow-none bg-transparent p-0 md:p-0">
                    <EmptyHeader>
                      <EmptyTitle>
                        Sem quartos disponíveis para sua busca
                      </EmptyTitle>
                      <EmptyDescription>
                        Não encontramos quartos que acomodem essa quantidade de
                        hóspedes ou que correspondam aos filtros selecionados.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                  <Button
                    variant="link"
                    className="mt-4 text-blue-600 font-bold"
                    onClick={() => setIsSearchPerformed(false)}
                  >
                    Alterar busca
                  </Button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </RegistrationLayout>
  )
}

export async function getServerSideProps() {
  try {
    const response = await fetch(`${webserver.origin}/api/v1/hotels/active`)
    const { hotels, discounts } = await response.json()

    return {
      props: {
        hotels: hotels || [],
        discounts: discounts || [],
      },
    }
  } catch (error) {
    console.error("Error fetching active hotels:", error)
    return {
      props: {
        hotels: [],
        discounts: [],
      },
    }
  }
}
