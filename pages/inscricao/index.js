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
import Link from "next/link"
import Image from "next/image"
import webserver from "infra/webserver"

export default function RegistrationPage({ hotels, discounts }) {
  const router = useRouter()
  const [isSearchPerformed, setIsSearchPerformed] = useState(false)
  const [searchData, setSearchData] = useState({ adults: 1, children: 0 })
  const [selectedType, setSelectedType] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const activeHotel = hotels?.[0]

  const { roomTypes, roomCategories, filteredRooms } = useMemo(() => {
    if (!activeHotel)
      return { roomTypes: [], roomCategories: [], filteredRooms: [] }

    const types = new Set()
    const categories = new Set()

    activeHotel.rooms.forEach((room) => {
      // Collect all available types and categories for the dropdown filters
      types.add(room.room_type)
      categories.add(room.room_category)
    })

    const filtered = activeHotel.rooms.filter((room) => {
      // 1. Capacity Filtering (Robust handling of null/undefined)
      const maxAdults = room.max_adults ?? Infinity
      const maxChildren = room.max_children ?? Infinity
      const minGuests = room.min_guests ?? 0

      const adultCapacityMatch = maxAdults >= searchData.adults
      const childCapacityMatch = maxChildren >= searchData.children
      const minAdultsMatch = minGuests <= searchData.adults

      // 2. Dropdown Filter Selection
      const typeMatch =
        selectedType === "all" || room.room_type === selectedType
      const categoryMatch =
        selectedCategory === "all" || room.room_category === selectedCategory

      return (
        adultCapacityMatch &&
        childCapacityMatch &&
        minAdultsMatch &&
        typeMatch &&
        categoryMatch
      )
    })

    return {
      roomTypes: Array.from(types),
      roomCategories: Array.from(categories),
      filteredRooms: filtered,
    }
  }, [activeHotel, selectedType, selectedCategory, searchData])

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
                      <h2 className="text-xl font-bold">Quem vai com você?</h2>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

                      {/* Crianças */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Crianças
                          </h3>
                          <span className="text-xs text-gray-400">
                            (Até 11 anos)
                          </span>
                        </div>

                        <div className="flex items-center justify-between border rounded-lg p-2 bg-white">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setSearchData((prev) => ({
                                ...prev,
                                children: Math.max(0, prev.children - 1),
                              }))
                            }
                          >
                            -
                          </Button>

                          <span className="text-xl font-bold text-gray-900">
                            {searchData.children}
                          </span>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setSearchData((prev) => ({
                                ...prev,
                                children: prev.children + 1,
                              }))
                            }
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
                      onClick={() => {
                        setIsSearchPerformed(true)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Procurar Quartos Disponíveis
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
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1 font-medium italic">
                      {searchData.children} crianças
                    </span>
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
                  <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
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
                  <div className="w-full md:w-48">
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {roomCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center">
                            <BedDouble className="h-12 w-12 text-white/50" />
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                            variant="outline"
                            className="border-blue-200 text-blue-700 bg-blue-50"
                          >
                            {room.room_type}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">
                          {room.name || room.room_type}
                        </CardTitle>
                        <CardDescription>
                          {room.room_type_description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span> {room.max_adults} adultos</span>
                            </div>
                            {room.max_children > 0 && (
                              <div className="flex items-center gap-1">
                                <span>+ {room.max_children} crianças</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                  Valor por pessoa
                                </p>
                                <p className="text-lg font-bold">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(room.price_per_night)}
                                </p>
                              </div>
                              <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() =>
                                  router.push(`/inscricao/quarto/${room.id}`)
                                }
                              >
                                Selecionar
                              </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {discounts.map((discount) => {
                                const isMemberDiscount =
                                  discount.name === "Associada"
                                const displayPrice =
                                  isMemberDiscount &&
                                  room.member_price_per_night
                                    ? room.member_price_per_night
                                    : room.price_per_night *
                                      (1 - discount.value / 100)

                                return (
                                  <div
                                    key={discount.id}
                                    className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-2 rounded-full text-xs"
                                  >
                                    <span className="font-medium">
                                      {discount.name}:
                                    </span>
                                    <span className="font-bold">
                                      {new Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      }).format(displayPrice)}
                                    </span>
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
