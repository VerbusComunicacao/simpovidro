import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, Calendar, MapPin, Info } from "lucide-react"
import Sponsors from "@/components/home/Sponsors"
import { motion } from "framer-motion"
import { useRouter } from "next/router"

export default function Hero({ scrollToSection, router: propRouter }) {
  const localRouter = useRouter()
  const router = propRouter || localRouter
  const isEn = router?.locale === "en"
  const t = (pt, en) => (isEn ? en : pt)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden min-h-[90vh] md:min-h-screen pt-28 pb-0 text-white">
      {/* Imagem de Fundo (Costão) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/costao-imagem.webp"
          alt="17º SIMPOVIDRO"
          fill
          className="object-cover"
          priority
        />
        {/* Overlays modernos para profundidade e legibilidade excelente */}
        <div className="absolute inset-0 bg-slate-950/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-20 items-center mb-10 md:mb-14 mt-4 w-full"
      >
        {/* Coluna da Esquerda: Marca e CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center text-center lg:text-left order-1"
        >
          <div className="mb-8 md:mb-12">
            <Image
              src="/images/logo-17-simpovidro.png"
              alt="17º SIMPOVIDRO"
              width={600}
              height={600}
              className="w-full max-w-[320px] md:max-w-[500px] h-auto drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]"
              priority
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              size="lg"
              className="bg-logo-blue hover:bg-logo-navy text-white rounded-full h-14 px-10 text-lg shadow-xl shadow-blue-500/25 transition-transform hover:scale-105 cursor-pointer"
              onClick={() => router.push("/inscricao")}
            >
              {t("Inscreva-se", "Register")}{" "}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-logo-orange/20 backdrop-blur-sm border-orange-400/30 text-orange-400 hover:bg-logo-orange/35 hover:text-orange-300 rounded-full h-14 px-10 text-lg transition-all"
              onClick={(e) => scrollToSection(e, "sobre")}
            >
              {t("Saber mais", "Learn more")} <Info className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Coluna da Direita: Data, Local e Prêmio sobrepostos */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-6 items-center lg:items-end order-2 w-full"
        >
          {/* Cards de Data e Local */}
          <div className="flex flex-col gap-4 w-full md:max-w-md sm:max-w-md">
            {/* Card 1: Data */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="w-full bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-default text-slate-900"
            >
              <div className="p-3 rounded-xl shrink-0">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 text-base md:text-lg leading-tight font-title whitespace-nowrap">
                  {t("5 a 8 de Novembro", "November 5 to 8")}
                </span>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mt-0.5 whitespace-nowrap">
                  2026
                </span>
              </div>
            </motion.div>

            {/* Card 2: Local */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="w-full bg-white/95 backdrop-blur-md pl-4 pr-3 py-1 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between gap-4 transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-default text-slate-900"
            >
              <div className="flex items-center gap-4">
                <div className=" p-3 rounded-xl shrink-0">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-slate-900 text-base md:text-lg leading-tight font-title whitespace-nowrap">
                    Costão do Santinho
                  </span>
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mt-0.5 whitespace-nowrap">
                    Florianópolis, SC
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Image
                  src="/images/premio.png"
                  alt="Premio Melhor Resort do Brasil"
                  width={120}
                  height={120}
                  className="w-20 h-20 md:w-20 md:h-20 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
                  priority
                />
                <Image
                  src="/images/selo_caio.png"
                  alt="Selo Caio"
                  width={120}
                  height={120}
                  className="w-20 h-20 md:w-20 md:h-20 p-1 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="w-full mt-auto relative z-10 bg-white py-4 md:py-6 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border-t border-slate-100"
      >
        <Sponsors variant="compact-hero" />
      </motion.div>
    </section>
  )
}
