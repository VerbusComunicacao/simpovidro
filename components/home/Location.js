import { useState } from "react"
import {
  MapPin,
  Star,
  Waves,
  Trees,
  Utensils,
  GlassWater,
  Smile,
  Award,
  Compass,
  Car,
} from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useRouter } from "next/router"

export default function Location() {
  const router = useRouter()
  const isEn = router?.locale === "en"
  const t = (pt, en) => (isEn ? en : pt)

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [prevActiveImageIndex, setPrevActiveImageIndex] = useState(null)

  const resortImages = [
    "/images/gerais/1.jpg",
    "/images/gerais/2.jpg",
    "/images/gerais/14.webp",
    "/images/gerais/15.webp",
    "/images/gerais/3.jpg",
    "/images/gerais/4.jpg",
    "/images/gerais/5.jpg",
    "/images/gerais/6.jpg",
    "/images/gerais/7.jpg",
    "/images/gerais/8.jpg",
    "/images/gerais/9.jpg",
    "/images/gerais/10.jpg",
    "/images/gerais/11.jpg",
    "/images/gerais/12.jpg",
    "/images/gerais/13.jpg",
  ]

  const handleImageClick = () => {
    setPrevActiveImageIndex(activeImageIndex)
    setActiveImageIndex((prev) => (prev + 1) % resortImages.length)
  }

  return (
    <section id="local" className="py-24 bg-slate-50 relative overflow-hidden ">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>

      {/* Background Icons Pattern - Vertical Repeat Only */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/images/icon-17-simpovidro.png')",
          backgroundSize: "60px",
          backgroundRepeat: "repeat-y",
          backgroundPosition: "-20px 0",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 ml-12 lg:ml-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="order-2 lg:order-1 relative lg:sticky lg:top-24 self-start space-y-12">
            {/* Main Sticky Card at the top */}
            <div>
              <div className="absolute -inset-4 bg-blue-600/10 rounded-[3rem] blur-2xl"></div>
              <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white group">
                <Image
                  src="/images/costao-imagem.webp"
                  alt="Costão do Santinho Resort"
                  fill
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 font-bold"
                />
                <div className="absolute top-6 left-6 flex gap-2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                    All Inclusive
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent">
                  <div className="flex items-center gap-2 text-white mb-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="ml-2 text-sm font-bold">
                      {t("5 Estrelas", "5 Stars")}
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-white">
                    Costão do Santinho Resort
                  </h4>
                  <p className="text-white/80 font-medium">
                    Florianópolis, Santa Catarina
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive gallery card stack below, next to 'Atrativos do Resort' */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black text-logo-blue tracking-wider uppercase font-eastman">
                  {t("Galeria do Resort", "Resort Gallery")}
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                  {t(
                    "Clique na foto para passar",
                    "Click on the photo to cycle",
                  )}
                </span>
              </div>

              <div
                onClick={handleImageClick}
                className="relative aspect-[4/3] w-full group cursor-pointer select-none"
              >
                {resortImages.map((img, i) => {
                  const rel =
                    (i - activeImageIndex + resortImages.length) %
                    resortImages.length
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
                      opacity: [1, 0.7, rel === 1 ? 0.85 : 0.4],
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
                      key={img}
                      animate={animateTarget}
                      transition={customTransition}
                      className="absolute inset-0 aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-xl group origin-bottom"
                    >
                      <Image
                        src={img}
                        alt="Resort Santinho"
                        fill
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Dark Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                    </motion.div>
                  )
                })}

                {/* Photo Count / Interactive Hint Overlay */}
                <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md border border-white/10 group-hover:bg-logo-blue transition-colors duration-300 pointer-events-none">
                  <span>
                    {activeImageIndex + 1} / {resortImages.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-8 ">
            <div className="space-y-6">
              <div className="font-eastman flex items-center gap-2 text-logo-blue uppercase">
                <MapPin className="h-4 w-4 text-logo-red animate-pulse" />
                {t("Local", "Location")}
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight font-title">
                Costão do <span className="text-logo-red">Santinho</span>
              </h3>

              <div className="space-y-4 text-slate-600 leading-relaxed text-base">
                <p>
                  {t(
                    <>
                      Este ano, o Simpovidro, em sua <strong>17ª edição</strong>
                      , desembarca em um dos destinos mais desejados do Brasil,
                      o{" "}
                      <strong>
                        Costão do Santinho <em>Resort</em>
                      </strong>
                      , local que combina a exuberância da natureza catarinense
                      com uma infraestrutura de ponta para eventos.
                    </>,
                    <>
                      This year, Simpovidro, in its{" "}
                      <strong>17th edition</strong>, lands in one of the most
                      desired destinations in Brazil, the{" "}
                      <strong>
                        Costão do Santinho <em>Resort</em>
                      </strong>
                      , a venue that combines the exuberance of Santa
                      Catarina&apos;s nature with a state-of-the-art
                      infrastructure for events.
                    </>,
                  )}
                </p>
                <p>
                  {t(
                    <>
                      Eleito o melhor <em>resort</em> de praia do Brasil no{" "}
                      <strong>Prêmio Caio 2025</strong>, a mais importante
                      premiação da indústria de eventos e turismo do Brasil, o
                      Costão está cheio de novidades: ao longo dos últimos anos,{" "}
                      <strong>
                        passou por um extenso <em>retrofit</em> para atualizar
                        instalações e acomodações
                      </strong>
                      . Portanto, os participantes do Simpovidro encontrarão um
                      espaço renovado, oferecendo ainda mais conforto aos
                      hóspedes.
                    </>,
                    <>
                      Voted the best beach <em>resort</em> in Brazil at the{" "}
                      <strong>Prêmio Caio 2025</strong>, the most important
                      awards for the events and tourism industry in Brazil,
                      Costão is full of updates: over the last few years,{" "}
                      <strong>
                        it underwent an extensive <em>retrofit</em> to upgrade
                        facilities and accommodations
                      </strong>
                      . Therefore, Simpovidro participants will find a renovated
                      space, offering even more comfort to guests.
                    </>,
                  )}
                </p>
              </div>
            </div>

            {/* Award Banner */}
            <div className="relative group overflow-hidden flex gap-4 items-start bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border border-amber-500/20 p-5 rounded-3xl shadow-xs hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-500 text-white rounded-2xl shrink-0 shadow-lg shadow-amber-500/20">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">
                  {t(
                    "Melhor Resort de Praia do Brasil",
                    "Best Beach Resort in Brazil",
                  )}
                </h4>
                <div className="text-sm text-slate-600 leading-relaxed mt-1">
                  {t(
                    <>
                      Reconhecimento máximo da indústria de eventos e turismo
                      nacional no{" "}
                      <a
                        className="underline cursor-pointer hover:text-logo-blue"
                        href="https://www.premiocaio.com.br/noticias/premio-caio-2025-dobra-de-tamanho,-consagra--240-empresas-e-marca-edicao-historica"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Prêmio Caio 2025.
                      </a>
                    </>,
                    <>
                      Maximum recognition from the national events and tourism
                      industry at the{" "}
                      <a
                        className="underline cursor-pointer hover:text-logo-blue"
                        href="https://www.premiocaio.com.br/noticias/premio-caio-2025-dobra-de-tamanho,-consagra--240-empresas-e-marca-edicao-historica"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Prêmio Caio 2025.
                      </a>
                    </>,
                  )}
                </div>
              </div>
            </div>

            {/* Atrativos Section */}
            <div className="space-y-4 mt-[20px]">
              <h4 className="text-base uppercase text-logo-blue flex items-center gap-2 font-eastman">
                <Compass className="h-5 w-5 text-logo-blue" />
                {t("Atrativos do Resort", "Resort Attractions")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    text: t(
                      "8 piscinas, sendo 6 climatizadas",
                      "8 swimming pools, with 6 heated",
                    ),
                    isNew: true,
                    icon: Waves,
                  },
                  {
                    text: t("Parque Aqua Kids", "Aqua Kids Park"),
                    isNew: true,
                    icon: Smile,
                  },
                  {
                    text: t("Vila Kids", "Kids Village"),
                    isNew: true,
                    icon: Smile,
                  },
                  {
                    text: t("Restaurante Sambaqui", "Sambaqui Restaurant"),
                    isNew: true,
                    icon: Utensils,
                  },
                  {
                    text: t("Sport Bar", "Sports Bar"),
                    isNew: true,
                    icon: GlassWater,
                  },
                  {
                    text: t("Parque ecológico", "Ecological park"),
                    isNew: false,
                    icon: Trees,
                  },
                ].map((atrativo, index) => {
                  const Icon = atrativo.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                          {atrativo.text}
                          {atrativo.isNew && (
                            <span className="bg-red-500/10 text-red-600 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase border border-red-500/20">
                              {t("Novo", "New")}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Localização Section */}
            <div className="p-6 bg-logo-navy text-white rounded-3xl relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-logo-blue/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-logo-orange text-xs tracking-widest uppercase font-eastman">
                    <MapPin className="h-4 w-4 text-logo-orange" />{" "}
                    {t("Localização", "Location")}
                  </div>
                  <h4 className="text-xl font-medium text-white font-eastman">
                    Florianópolis - SC
                  </h4>
                  <p className="text-xs text-slate-300 max-w-md font-medium leading-relaxed">
                    {t(
                      <>
                        O <em>resort</em> está a pouco mais de{" "}
                        <strong>40 km</strong> do Aeroporto Internacional de
                        Florianópolis – Hercílio Luz.
                      </>,
                      <>
                        The <em>resort</em> is just over <strong>40 km</strong>{" "}
                        from Florianópolis International Airport – Hercílio Luz.
                      </>,
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 shrink-0">
                  <Car className="h-6 w-6 text-logo-blue" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-eastman">
                      {t("De carro", "By car")}
                    </div>
                    <div className="text-xs font-black text-white">
                      {t("~1 hora de trajeto", "~1 hour drive")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
