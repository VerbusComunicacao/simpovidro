import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Calendar, MapPin, Users, Star } from "lucide-react"

export default function Hero({ scrollToSection, router, HERO_IMAGE }) {
  const stats = [
    { icon: Calendar, label: "31 Out - 03 Nov", sub: "2026" },
    {
      icon: MapPin,
      label: "Costão do Santinho",
      sub: "Florianópolis, SC",
    },
    {
      icon: Users,
      label: "Público decisor",
      sub: "Empresários, gestores e líderes",
    },
    {
      icon: Star,
      label: "Conteúdo qualificado",
      sub: "Grandes personalidades e profissionais do setor",
    },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-32 md:py-32">
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMAGE}
          alt="Futuristic Glass Architecture"
          layout="fill"
          objectFit="cover"
          priority
          className="brightness-[0.45] saturate-[0.85] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-blue-950/20 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
        <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md px-4 py-1 text-sm rounded-full">
          Inovação & Networking
        </Badge>
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] italic">
          17º SIMPOVIDRO
        </h1>
        <p className="text-xl md:text-2xl text-blue-50 max-w-3xl mx-auto mb-10 font-bold leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          Onde o mercado vidreiro se encontra para redefinir o amanhã!
          <br />
          <span className="font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            Venha antecipar tendências e gerar conexões de valor com quem lidera
            o setor de vidros na América Latina! Garanta seu lugar e transforme
            o rumo da sua empresa!
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-14 px-10 text-lg shadow-xl shadow-blue-500/25 transition-transform hover:scale-105"
            onClick={() => router.push("/inscricao")}
          >
            Quero Me Inscrever <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-white/10 backdrop-blur-lg border-white/20 text-white hover:bg-white/20 rounded-full h-14 px-10 text-lg transition-all"
            onClick={(e) => scrollToSection(e, "programacao")}
          >
            Ver Programação
          </Button>
        </div>

        <div className="mt-12 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <stat.icon className="h-6 w-6 text-blue-400 mb-2" />
              <span className="font-bold text-lg">{stat.label}</span>
              <span className="text-xs text-white/60 uppercase tracking-widest">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
