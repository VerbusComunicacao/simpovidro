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
import {
  MapPin,
  Hotel,
  BedDouble,
  Users,
  AlertCircle,
  Calendar,
} from "lucide-react"
import { Empty } from "@/components/ui/empty"
import RegistrationLayout from "@/components/registration/RegistrationLayout"
import Link from "next/link"
import Image from "next/image"
import webserver from "infra/webserver"

export default function RegistrationPage({ hotels, discounts }) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const activeHotel = hotels?.[0]

  const { roomTypes, roomCategories, filteredRooms } = useMemo(() => {
    if (!activeHotel)
      return { roomTypes: [], roomCategories: [], filteredRooms: [] }

    const types = new Set()
    const categories = new Set()

    activeHotel.rooms.forEach((room) => {
      types.add(room.room_type)
      categories.add(room.room_category)
    })

    const filtered = activeHotel.rooms.filter((room) => {
      const typeMatch =
        selectedType === "all" || room.room_type === selectedType
      const categoryMatch =
        selectedCategory === "all" || room.room_category === selectedCategory
      return typeMatch && categoryMatch
    })

    return {
      roomTypes: Array.from(types),
      roomCategories: Array.from(categories),
      filteredRooms: filtered,
    }
  }, [activeHotel, selectedType, selectedCategory])

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
        {/* Hotel Header */}
        <section className="mb-12">
          <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-blue-100 p-4 rounded-lg">
              <Hotel className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {activeHotel.name}
                </h1>
              </div>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {activeHotel.city}, {activeHotel.country}
                  </span>
                </div>
                {activeHotel.check_in_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(activeHotel.check_in_date).toLocaleDateString(
                        "pt-BR",
                      )}{" "}
                      -{" "}
                      {new Date(activeHotel.check_out_date).toLocaleDateString(
                        "pt-BR",
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Room Selection */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Escolha seu Quarto
              </h2>
              <p className="text-gray-600">
                Selecione as opções abaixo para filtrar os quartos disponíveis
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="w-full md:w-48">
                <Select value={selectedType} onValueChange={setSelectedType}>
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
                        {room.room_category}
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
                          {discounts.map((discount) => (
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
                                }).format(
                                  room.price_per_night *
                                    (1 - discount.value / 100),
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-12">
              <Empty
                title="Nenhum quarto encontrado"
                description="Tente ajustar seus filtros para encontrar outras opções."
              />
            </div>
          )}
        </section>
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
