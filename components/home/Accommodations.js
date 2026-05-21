import { useState } from "react"
import {
  MapPin,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Layers,
  Sparkles,
} from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

function ItalicizeNonPortuguese({ text }) {
  if (!text) return null

  const nonPtWords = [
    "Wi-fi",
    "wi-fi",
    "Wi-Fi",
    "wi-fi",
    "Concierge",
    "concierge",
    "living room",
    "Living room",
    "all inclusive",
    "All inclusive",
    "all-inclusive",
    "All-inclusive",
    "resort",
    "Resort",
    "SPA",
    "Spa",
    "king",
    "King",
    "queen",
    "Queen",
    "retrofit",
    "Retrofit",
    "premium",
    "Premium",
    "Voucher",
    "voucher",
  ]

  const sortedWords = [...nonPtWords].sort((a, b) => b.length - a.length)
  const pattern = new RegExp(
    `(${sortedWords.map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")})`,
    "gi",
  )

  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = nonPtWords.some(
          (w) => w.toLowerCase() === part.toLowerCase(),
        )
        return isMatch ? (
          <em key={index} className="italic font-medium">
            {part}
          </em>
        ) : (
          part
        )
      })}
    </>
  )
}

export default function Accommodations() {
  const [activeRoom, setActiveRoom] = useState("vila-luxo-1")
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [prevActiveImageIndex, setPrevActiveImageIndex] = useState(null)

  const changeActiveRoom = (roomId) => {
    setActiveRoom(roomId)
    setActiveImageIndex(0)
    setPrevActiveImageIndex(null)
  }

  const handlePrevRoom = () => {
    const currentIndex = acomodacoes.findIndex((r) => r.id === activeRoom)
    const prevIndex =
      (currentIndex - 1 + acomodacoes.length) % acomodacoes.length
    changeActiveRoom(acomodacoes[prevIndex].id)
  }

  const handleNextRoom = () => {
    const currentIndex = acomodacoes.findIndex((r) => r.id === activeRoom)
    const nextIndex = (currentIndex + 1) % acomodacoes.length
    changeActiveRoom(acomodacoes[nextIndex].id)
  }

  const handleImageClick = (imagesLength) => {
    if (imagesLength > 1) {
      setPrevActiveImageIndex(activeImageIndex)
      setActiveImageIndex((prev) => (prev + 1) % imagesLength)
    }
  }

  const acomodacoes = [
    {
      id: "vila-luxo-1",
      name: "Luxo (1 dormitório)",
      category: "Vilas Portuguesas",
      comporta:
        "2 adultos + 2 crianças de 0 a 11 anos (em cama extra ou berço)",
      contaCom: "dormitório, sala de estar, sala de jantar e cozinha",
      tamanho: null,
      localizacao: null,
      images: [
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Fc2bbdb2d-94f1-4327-ac4a-8d9ef2300172&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F7f9b1a60-cd5b-41ca-a7f2-680dda9d5b9d&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Fcfeca612-519b-4b31-ae6f-bb710ed87a91&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F94ea82cd-0701-461e-a49d-c21531aa2027&w=3840&q=75",
      ],
      perks: [],
      inclui: [
        "Sabonetes, xampu e condicionador",
        "Ar-condicionado",
        "Tomada 220 V",
        "Cama casal queen",
        "Cofre",
        "Telefone",
        "Secador de cabelo",
        "Frigobar",
        "Toalhas",
        "Kit berço",
        "Camas extras",
        "Wi-fi",
        "Concierge",
      ],
    },
    {
      id: "vila-luxo-2",
      name: "Luxo Família (2 dormitórios)",
      category: "Vilas Portuguesas",
      comporta:
        "4 adultos + 2 crianças de 0 a 11 anos (em cama extra ou berço)",
      contaCom: "dois dormitórios, sala de estar, sala de jantar e cozinha",
      tamanho: null,
      localizacao: null,
      images: [
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F85f868b9-acd5-4396-8e81-0ebd72a25013&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Fde1688c0-5bae-4e93-9e4d-6d631164656e&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F7d550ac6-846b-4c43-98ab-7b05c55194b4&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Fbd9f865a-b8f5-43d8-af21-c9fe95505879&w=3840&q=75",
      ],
      perks: [],
      inclui: [
        "Sabonetes, xampu e condicionador",
        "Ar-condicionado",
        "Tomada 220 V",
        "Cama casal queen",
        "Cofre",
        "Telefone",
        "Secador de cabelo",
        "Frigobar",
        "Toalhas",
        "Kit berço",
        "Camas extras",
        "Wi-fi",
        "Concierge",
      ],
    },
    {
      id: "vila-luxo-3",
      name: "Luxo Família (3 dormitórios)",
      category: "Vilas Portuguesas",
      comporta:
        "6 adultos + 2 crianças de 0 a 11 anos (em cama extra ou berço)",
      contaCom: "três dormitórios, living room e cozinha completa",
      tamanho: null,
      localizacao: null,
      images: [
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Fac7b6210-b062-44e6-a85d-b967ef55393b&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Fdb1cebc8-93bd-4f47-8151-eec575b509f7&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Fc4ac41ae-d1cb-45a5-a3a9-cc660967cba0&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F89eb587e-9679-4dde-a4cd-d716c6293bf4&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F4fab42d7-109b-48d4-845c-572a33704866&w=3840&q=75",
      ],
      perks: [],
      inclui: [
        "Sabonetes, xampu e condicionador",
        "Ar-condicionado",
        "Tomada 220 V",
        "Cama casal queen",
        "Cofre",
        "Telefone",
        "Secador de cabelo",
        "Frigobar",
        "Toalhas",
        "Kit berço",
        "Camas extras",
        "Wi-fi",
        "Concierge",
      ],
    },
    {
      id: "superior",
      name: "Superior",
      category: "Vilas Portuguesas",
      comporta: "2 adultos + 1 criança (4 a 11 anos) ou 1 bebê (até 3 anos)",
      contaCom: "um dormitório e um banheiro",
      tamanho: null,
      localizacao: null,
      images: [
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Fceab79d1-33e0-4129-a51d-67f4865c3c5b&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Ff6856aef-8b3e-40a8-a25d-96cd049f7cf0&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F11b1acca-b7dc-44f7-a753-e6050aa17a61&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Fa61540f9-2e89-4eb1-84cf-a3d28c1888a7&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Fdc2654f5-db34-456a-ab01-95c924d2f994&w=3840&q=75",
      ],
      perks: [],
      inclui: [
        "Sabonetes, xampu e condicionador",
        "Ar-condicionado",
        "Tomada 220 V",
        "Cama casal queen",
        "Cofre",
        "Telefone",
        "Secador de cabelo",
        "Frigobar",
        "Toalhas",
        "Kit berço",
        "Camas extras",
        "Wi-fi",
        "Concierge",
      ],
    },
    {
      id: "suite-master",
      name: "Suíte Master",
      category: "Hotel Internacional",
      comporta: "2 adultos + 1 criança de 0 a 11 anos (em cama extra ou berço)",
      contaCom: "dormitório, sacada, banheiro e banheira de hidromassagem",
      tamanho: "40 m²",
      localizacao: "em frente à praia",
      images: [
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F1663e122-2870-4cd6-b5c5-ac4585346723&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F9bb5c18c-f056-4781-974d-d8de6f65bb14&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Faf951a3b-bebc-47d6-b827-39dee11d0cb8&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F99634396-c96a-4623-a769-2abf99a126a9&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F05b44efc-2ea9-48fa-9abc-e4bc157a12c4&w=3840&q=75",
      ],
      perks: [],
      inclui: [
        "Acesso exclusivo ao restaurante Rancho do Pescador (com crédito de R$ 100 disponível por pessoa por diária) – serviço não faz parte do sistema all inclusive do resort",
        "Voucher Costão SPA Circuito das Águas",
        "Ar-condicionado",
        "Cama casal king",
        "Tomada 220 V",
        "Camas extras",
        "Sabonetes, xampu e condicionador",
        "Kit berço",
        "Toalhas",
        "Secador de cabelo",
        "Frigobar",
        "Telefone",
        "Cofre",
        "Wi-fi",
        "Concierge",
      ],
    },
    {
      id: "suite-prime-jr",
      name: "Suíte Prime Júnior",
      category: "Hotel Internacional",
      comporta: "2 adultos + 1 criança (4 a 11 anos) + 1 bebê (até 3 anos)",
      contaCom: "sacada, banheiro e hidromassagem",
      tamanho: "30 m² (é uma versão compacta da Suíte Master)",
      localizacao: null,
      images: [
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F1663e122-2870-4cd6-b5c5-ac4585346723&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F9bb5c18c-f056-4781-974d-d8de6f65bb14&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2Faf951a3b-bebc-47d6-b827-39dee11d0cb8&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F99634396-c96a-4623-a769-2abf99a126a9&w=3840&q=75",
        "https://www.costao.com.br/_next/image?url=https%3A%2F%2Fcms.costao.com.br%2Fassets%2F05b44efc-2ea9-48fa-9abc-e4bc157a12c4&w=3840&q=75",
      ],
      perks: [],
      inclui: [
        "Acesso exclusivo ao restaurante Rancho do Pescador (com crédito de R$ 100 disponível por pessoa por diária) – serviço não faz parte do sistema all inclusive do resort",
        "Voucher Costão SPA Circuito das Águas",
        "Ar-condicionado",
        "Cama casal king",
        "Tomada 220 V",
        "Sabonetes, xampu e condicionador",
        "Kit berço",
        "Toalhas",
        "Secador de cabelo",
        "Frigobar",
        "Telefone",
        "Cofre",
        "Wi-fi",
        "Concierge",
      ],
    },
  ]

  return (
    <section
      id="acomodacoes"
      className="py-24 bg-white relative overflow-hidden border-t border-slate-100"
    >
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>

      {/* Background logo icon on the left */}
      <div
        className="absolute left-[-150px] top-[350px] -translate-y-1/2 w-[600px] h-[600px] pointer-events-none z-0 opacity-[0.5] bg-contain bg-no-repeat bg-left"
        style={{
          backgroundImage: "url('/images/icone-simpovidro.svg')",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h3 className="text-3xl md:text-4xl font-black text-slate-900 font-title">
            Acomodações Disponíveis
          </h3>
          <p className="text-slate-600 mt-4 font-medium text-base leading-relaxed">
            Um dos focos da reforma pela qual o hotel passou é oferecer um
            serviço ainda mais <em>premium</em> aos hóspedes. Confira abaixo as
            acomodações disponíveis aos participantes do Simpovidro, todas elas
            renovadas.
          </p>
        </div>

        {/* Tab Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {acomodacoes.map((room) => (
            <button
              key={room.id}
              onClick={() => changeActiveRoom(room.id)}
              className={`px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer shadow-xs flex flex-col items-center justify-center text-center border ${
                activeRoom === room.id
                  ? "bg-logo-blue text-white border-logo-blue shadow-md shadow-logo-blue/20 transform -translate-y-0.5"
                  : "bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-slate-200"
              }`}
            >
              <span className="text-sm leading-tight font-semibold">
                {room.name
                  .replace(`${room.category} - `, "")
                  .replace("Hotel Internacional - ", "")}
              </span>
            </button>
          ))}
        </div>

        {/* Room Detail Display */}
        <div className="relative group/card">
          {/* Desktop Navigation Arrows */}
          <button
            onClick={handlePrevRoom}
            className="absolute -left-6 lg:-left-10 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white hover:bg-slate-50 text-slate-700 hover:text-logo-blue rounded-full flex items-center justify-center border border-slate-200 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none hidden md:flex cursor-pointer"
            aria-label="Acomodação anterior"
          >
            <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
          </button>

          <button
            onClick={handleNextRoom}
            className="absolute -right-6 lg:-right-10 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white hover:bg-slate-50 text-slate-700 hover:text-logo-blue rounded-full flex items-center justify-center border border-slate-200 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none hidden md:flex cursor-pointer"
            aria-label="Próxima acomodação"
          >
            <ChevronRight className="h-6 w-6 stroke-[2.5]" />
          </button>

          {(() => {
            const room =
              acomodacoes.find((r) => r.id === activeRoom) || acomodacoes[0]
            return (
              <div
                key={room.id}
                className="grid lg:grid-cols-12 gap-12 items-center bg-slate-50 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden relative"
              >
                {/* Left Column: Photo Space (Real Photo with Stack Effect) - Spans 5 columns */}
                <div
                  onClick={() => handleImageClick(room.images.length)}
                  className={`lg:col-span-5 relative w-full aspect-[4/3] flex items-center justify-center ${room.images.length > 1 ? "cursor-pointer select-none" : ""}`}
                >
                  {room.images.map((img, i) => {
                    const rel =
                      (i - activeImageIndex + room.images.length) %
                      room.images.length
                    const wasFront = prevActiveImageIndex === i
                    const goingToBack = wasFront && rel > 0

                    let animateTarget = {}
                    let customTransition = { duration: 0.45, ease: "easeInOut" }

                    if (rel === 0) {
                      animateTarget = {
                        x: 0,
                        y: 0,
                        scale: 1,
                        rotate: 0,
                        opacity: 1,
                        zIndex: 20,
                      }
                    } else if (goingToBack) {
                      animateTarget = {
                        x: [0, 260, 0],
                        rotate: [0, 18, rel === 1 ? 5 : 12],
                        scale: [1, 0.92, rel === 1 ? 0.95 : 0.9],
                        y: [0, 4, rel === 1 ? 6 : 12],
                        opacity: [1],
                        zIndex: [20, -10, rel === 1 ? 10 : 5],
                      }
                      customTransition = {
                        duration: 0.55,
                        ease: "easeInOut",
                        times: [0, 0.4, 1],
                      }
                    } else if (rel === 1) {
                      animateTarget = {
                        x: 0,
                        y: 6,
                        scale: 0.95,
                        rotate: 5,
                        opacity: 0.85,
                        zIndex: 10,
                      }
                    } else if (rel === 2) {
                      animateTarget = {
                        x: 0,
                        y: 12,
                        scale: 0.9,
                        rotate: 12,
                        opacity: 0.4,
                        zIndex: 5,
                      }
                    } else {
                      animateTarget = {
                        x: 0,
                        y: 18,
                        scale: 0.85,
                        rotate: 15,
                        opacity: 0,
                        zIndex: -10,
                      }
                    }

                    return (
                      <motion.div
                        key={i}
                        animate={animateTarget}
                        transition={customTransition}
                        className="absolute inset-0 aspect-4/3 rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-xl group origin-bottom"
                      >
                        <Image
                          src={img}
                          alt={room.name}
                          fill
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Dark Overlay on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                      </motion.div>
                    )
                  })}

                  {/* Photo Count / Interactive Hint Overlay */}
                  {room.images.length > 1 && (
                    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md border border-white/10 group-hover:bg-logo-blue transition-colors duration-300 pointer-events-none">
                      <span>
                        {activeImageIndex + 1} / {room.images.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Column: Room Details - Spans 7 columns */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {room.category === "Hotel Internacional" ? (
                        <span className="inline-flex bg-gradient-to-r from-amber-500/10 to-yellow-600/10 text-amber-700 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase border border-amber-500/20 shadow-xs">
                          Hotel Internacional
                        </span>
                      ) : (
                        <span className="inline-flex bg-logo-blue/10 text-logo-blue text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase border border-logo-blue/20">
                          {room.category}
                        </span>
                      )}
                      <span className="inline-flex bg-logo-green/10 text-logo-green text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase border border-logo-green/20">
                        100% Renovado
                      </span>
                    </div>

                    <h4 className="text-2xl md:text-3xl text-slate-900 font-title">
                      {room.name.replace("Hotel Internacional - ", "")}
                    </h4>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 shrink-0">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            Acomoda:
                          </div>
                          <div className="text-xs font-semibold text-slate-700 leading-tight mt-0.5">
                            <ItalicizeNonPortuguese text={room.comporta} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 shrink-0">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            Conta com:
                          </div>
                          <div className="text-xs font-semibold text-slate-700 leading-tight mt-0.5">
                            <ItalicizeNonPortuguese text={room.contaCom} />
                          </div>
                        </div>
                      </div>

                      {room.tamanho && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 shrink-0">
                            <Maximize2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              Tamanho:
                            </div>
                            <div className="text-xs font-semibold text-slate-700 leading-tight mt-0.5">
                              <ItalicizeNonPortuguese text={room.tamanho} />
                            </div>
                          </div>
                        </div>
                      )}

                      {room.localizacao && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 shrink-0">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              Localização:
                            </div>
                            <div className="text-xs font-semibold text-slate-700 leading-tight mt-0.5">
                              <ItalicizeNonPortuguese text={room.localizacao} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Perks Banner (if any) */}
                  {room.perks.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-amber-500/5 to-yellow-600/5 border border-amber-500/10 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-700 text-[10px] font-black tracking-widest uppercase">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />{" "}
                        Benefícios Exclusivos
                      </div>
                      <ul className="space-y-1.5">
                        {room.perks.map((perk, index) => (
                          <li
                            key={index}
                            className="text-xs text-slate-700 leading-relaxed font-semibold flex items-start gap-2"
                          >
                            <span className="text-amber-500 mt-0.5 shrink-0">
                              •
                            </span>
                            <span>
                              <ItalicizeNonPortuguese text={perk} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Inclusions Grid */}
                  <div className="space-y-3">
                    <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase">
                      Itens Inclusos na Acomodação
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-100/50">
                      {room.inclui.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-logo-green shrink-0 stroke-[3]" />
                          <span className="text-[11px] font-semibold text-slate-600 leading-tight">
                            <ItalicizeNonPortuguese text={item} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Mobile Navigation Arrows */}
          <div className="flex md:hidden justify-center items-center gap-4 mt-6">
            <button
              onClick={handlePrevRoom}
              className="w-12 h-12 bg-white active:bg-slate-50 text-slate-700 rounded-full flex items-center justify-center border border-slate-200 shadow-md active:scale-95 cursor-pointer"
              aria-label="Acomodação anterior"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
            <span className="text-xs font-bold text-slate-500 font-eastman">
              {acomodacoes.findIndex((r) => r.id === activeRoom) + 1} de{" "}
              {acomodacoes.length}
            </span>
            <button
              onClick={handleNextRoom}
              className="w-12 h-12 bg-white active:bg-slate-50 text-slate-700 rounded-full flex items-center justify-center border border-slate-200 shadow-md active:scale-95 cursor-pointer"
              aria-label="Próxima acomodação"
            >
              <ChevronRight className="h-6 w-6 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
