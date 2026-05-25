import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, Calendar, MapPin, Info } from "lucide-react"
import Sponsors from "@/components/home/Sponsors"
import { motion } from "framer-motion"

export default function Hero({ scrollToSection, router }) {
  const stats = [
    { icon: Calendar, label: "5 a 8 de Novembro", sub: "2026" },
    {
      icon: MapPin,
      label: "Costão do Santinho",
      sub: "Florianópolis, SC",
    },
  ]

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

  const videoVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 1, ease: "easeOut", delay: 0.6 },
    },
  }

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden pt-24 pb-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 md:gap-20 items-center mb-10 md:mb-14 mt-4"
      >
        {/* Coluna da Esquerda: Marca e CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center text-center lg:text-left order-1"
        >
          <div className="mb-8 md:mb-12">
            <Image
              src="/images/logo-17-simpovidro.webp"
              alt="17º SIMPOVIDRO"
              width={600}
              height={600}
              className="w-full max-w-[320px] md:max-w-[500px] h-auto"
              priority
            />
          </div>

          <div className="flex justify-center sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              size="lg"
              className="bg-logo-blue hover:bg-logo-navy text-white rounded-full h-14 px-10 text-lg shadow-xl shadow-blue-500/25 transition-transform hover:scale-105"
              onClick={() => router.push("/inscricao")}
            >
              Quero me inscrever <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-logo-orange/20 backdrop-blur-sm border-orange-200 text-orange-600 hover:bg-logo-orange/10 hover:text-orange-700 rounded-full h-14 px-10 text-lg transition-all"
              onClick={(e) => scrollToSection(e, "sobre")}
            >
              Saber mais <Info />
            </Button>
          </div>
        </motion.div>

        {/* Coluna da Direita: Vídeo e Cards Flutuantes */}
        <div className="relative order-2 flex flex-col items-center">
          {/* Vídeo - Agora Maior */}
          <motion.div
            variants={videoVariants}
            className="w-full aspect-video bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl relative group border-[6px] md:border-[10px] border-white"
          >
            <Image
              src="/images/costao-imagem.webp"
              alt="17º SIMPOVIDRO"
              fill
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 font-bold"
            />
          </motion.div>

          {/* Cards Flutuantes - Posicionados para sobrepor o vídeo */}
          <div className="flex flex-row items-center justify-center md:justify-start gap-2.5 md:gap-4 w-full max-w-[95%] md:w-auto mt-[-15px] md:mt-0 md:absolute md:-bottom-16 md:-right-6 z-20">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + i * 0.2, duration: 0.5 }}
                className="shrink-0 w-fit bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-slate-50 flex items-center gap-2 md:gap-3 transform hover:-translate-y-2 transition-all cursor-default"
              >
                <div className="bg-blue-50 p-1.5 md:p-2 rounded-lg md:rounded-xl shrink-0">
                  <stat.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-slate-900 text-[10px] md:text-sm lg:text-base leading-tight font-title whitespace-nowrap">
                    {stat.label}
                  </span>
                  <span className="text-[8px] md:text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 whitespace-nowrap">
                    {stat.sub}
                  </span>
                </div>
              </motion.div>
            ))}
            <motion.div
              key={4}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + 4 * 0.2, duration: 0.5 }}
              className="shrink-0 w-20 md:w-32 flex items-center justify-center transform hover:-translate-y-2 transition-all cursor-default"
            >
              <Image
                src="/images/premio.png"
                alt="Premio Melhor Resort do Brasil"
                width={200}
                height={200}
                className="w-full h-auto object-contain"
                priority
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="w-full mt-auto"
      >
        <Sponsors variant="compact-hero" />
      </motion.div>
    </section>
  )
}
