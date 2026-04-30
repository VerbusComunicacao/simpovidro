import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FormattedText } from "@/components/ui/FormattedText"
import {
  Users,
  User,
  CheckCircle,
  BedDouble,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import RegistrationLayout from "@/components/registration/RegistrationLayout"
import Image from "next/image"
import webserver from "infra/webserver"
import { calculateSummaryPrice } from "@/lib/registration-helpers"

export default function RoomDetailsPage({ room }) {
  const router = useRouter()
  const { query, isReady } = router
  const [activePhoto, setActivePhoto] = useState(room?.photos?.[0] || null)
  const thumbnailsRef = useRef(null)

  const [searchData, setSearchData] = useState({ adults: 1 })
  const [priceDetails, setPriceDetails] = useState(null)
  const [beddingPreference, setBeddingPreference] = useState(null) // Change to null to force choice

  useEffect(() => {
    if (isReady && query) {
      const counts = { adults: parseInt(query.adults) || 1 }
      Object.keys(query).forEach((key) => {
        if (key !== "id" && key !== "adults") {
          counts[key] = parseInt(query[key]) || 0
        }
      })
      setSearchData(counts)

      if (room) {
        const summary = calculateSummaryPrice(room, counts, null, [])
        setPriceDetails(summary)
      }
    }
  }, [isReady, query, room])

  const handleNextPhoto = () => {
    if (!room.photos || room.photos.length <= 1) return
    const currentIndex = room.photos.indexOf(activePhoto)
    const nextIndex = (currentIndex + 1) % room.photos.length
    setActivePhoto(room.photos[nextIndex])
    scrollToThumb(nextIndex)
  }

  const handlePrevPhoto = () => {
    if (!room.photos || room.photos.length <= 1) return
    const currentIndex = room.photos.indexOf(activePhoto)
    const prevIndex =
      (currentIndex - 1 + room.photos.length) % room.photos.length
    setActivePhoto(room.photos[prevIndex])
    scrollToThumb(prevIndex)
  }

  const scrollToThumb = (index) => {
    const thumbElement = document.getElementById(`thumb-${index}`)
    if (thumbElement && thumbnailsRef.current) {
      thumbElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      })
    }
  }

  const scrollThumbnails = (direction) => {
    if (thumbnailsRef.current) {
      const scrollAmount = 300
      thumbnailsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  if (!room) {
    return (
      <RegistrationLayout
        title="Quarto não encontrado - Simpovidro 2026"
        showBackButton
      >
        <div className="flex items-center justify-center p-20">
          <p className="text-xl text-gray-600">Quarto não encontrado.</p>
        </div>
      </RegistrationLayout>
    )
  }

  return (
    <RegistrationLayout
      title={`${room.name || room.room_type} - Simpovidro 2026`}
      showBackButton
    >
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Photo Gallery */}
          <section className="space-y-4">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-200 border relative group">
              {activePhoto ? (
                <>
                  <Image
                    src={activePhoto}
                    alt={room.name || room.room_type}
                    className="w-full h-full object-cover"
                    fill
                  />
                  {room.photos && room.photos.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevPhoto}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <BedDouble className="h-16 w-16" />
                </div>
              )}
            </div>

            {room.photos && room.photos.length > 1 && (
              <div className="relative group/thumbs">
                <div
                  ref={thumbnailsRef}
                  className="flex gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {room.photos.map((photo, idx) => (
                    <button
                      key={idx}
                      id={`thumb-${idx}`}
                      onClick={() => {
                        setActivePhoto(photo)
                        scrollToThumb(idx)
                      }}
                      className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                        activePhoto === photo
                          ? "border-blue-600 scale-105"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={photo}
                          className="w-full h-full object-cover"
                          alt=""
                          fill
                        />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Thumbnail Navigation Arrows */}
                <button
                  onClick={() => scrollThumbnails("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-md rounded-full p-1 border hover:bg-gray-50 opacity-0 group-hover/thumbs:opacity-100 transition-opacity hidden md:block z-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollThumbnails("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-md rounded-full p-1 border hover:bg-gray-50 opacity-0 group-hover/thumbs:opacity-100 transition-opacity hidden md:block z-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>

          {/* Room Info */}
          <section className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {room.room_type_description ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none cursor-help"
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
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"
                  >
                    {room.room_type}
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {room.name || room.room_type}
              </h1>
              <div className="flex items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Acomoda {room.max_adults} adultos</span>
                </div>
                {room.max_children > 0 && (
                  <div className="flex items-center gap-2">
                    <span>+ {room.max_children} crianças</span>
                  </div>
                )}
              </div>
            </div>

            <div className="prose prose-blue max-w-none">
              <h3 className="text-lg font-semibold text-gray-900">Descrição</h3>
              <div className="text-gray-600 leading-relaxed">
                <FormattedText
                  text={
                    room.description ||
                    "Nenhuma descrição disponível para este quarto."
                  }
                />
              </div>
            </div>

            {searchData.adults === 2 && (
              <Card className="mb-6 bg-white border shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-blue-600" />
                    Escolha o Tipo de acomodação
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setBeddingPreference("Duplo Casal")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        beddingPreference === "Duplo Casal"
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                          : "border-gray-100 bg-gray-50 text-gray-500 hover:border-blue-200"
                      }`}
                    >
                      <BedDouble className="h-8 w-8 mb-2" />
                      <span className="font-bold">Duplo Casal</span>
                    </button>
                    <button
                      onClick={() => setBeddingPreference("Duplo Solteiro")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        beddingPreference === "Duplo Solteiro"
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                          : "border-gray-100 bg-gray-50 text-gray-500 hover:border-blue-200"
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        <User className="h-6 w-6" />
                        <User className="h-6 w-6" />
                      </div>
                      <span className="font-bold">Duplo Solteiro</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white border-2 border-blue-50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="text-sm text-gray-500 uppercase font-semibold">
                      {priceDetails
                        ? "Valor Total da Inscrição"
                        : "Valor por pessoa"}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(
                            priceDetails
                              ? priceDetails.finalTotal
                              : room.price_per_night,
                          )}
                        </span>
                      </div>
                      {room.member_price_per_night &&
                        room.member_price_per_night !==
                          room.price_per_night && (
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-sm font-semibold text-green-600">
                              Só{" "}
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(
                                priceDetails
                                  ? priceDetails.memberTotal
                                  : room.member_price_per_night,
                              )}{" "}
                              para associados
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                  <Button
                    size="lg"
                    disabled={searchData.adults === 2 && !beddingPreference}
                    className="bg-blue-600 hover:bg-blue-700 px-8 text-lg font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50"
                    onClick={() => {
                      const params = new URLSearchParams()
                      Object.keys(searchData).forEach((key) => {
                        params.append(key, searchData[key])
                      })
                      if (searchData.adults === 2) {
                        params.append("bed_preference", beddingPreference)
                      }
                      router.push(
                        `/inscricao/checkout/${room.id}?${params.toString()}`,
                      )
                    }}
                  >
                    Fazer Minha Inscrição
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Confirmação Imediata
                  </p>
                  <p className="text-sm text-gray-500">
                    Sua vaga é garantida após o pagamento.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Desconto associado
                  </p>
                  <p className="text-sm text-gray-500">
                    Desconto de 20% para empresas associadas da Abravidro
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </RegistrationLayout>
  )
}

export async function getServerSideProps(context) {
  const { id } = context.params
  try {
    const response = await fetch(
      `${webserver.origin}/api/v1/rooms/${id}/public`,
    )
    if (!response.ok) throw new Error()
    const room = await response.json()

    return {
      props: { room },
    }
  } catch (error) {
    return {
      props: { room: null },
    }
  }
}
