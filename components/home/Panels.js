import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  TrendingUp,
  HardHat,
  Trophy,
  Sparkles,
} from "lucide-react"

export default function Panels({ scrollToSection }) {
  const panelThemes = [
    {
      theme: "Gestão que faz a diferença",
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      theme: "Mão de obra: como solucionar esse gargalo",
      icon: HardHat,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      theme: "Competitividade: bons exemplos da cadeia vidreira",
      icon: Trophy,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      theme: "Gere valor: uma nova relação do vidro com o consumidor",
      icon: Sparkles,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ]

  return (
    <section id="paineis" className="py-24 bg-black relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-blue-400 font-bold uppercase tracking-[0.3em] text-xs mb-4">
            Conteúdo & Debate
          </h2>
          <h3 className="text-5xl md:text-7xl font-black text-white mb-6">
            Painéis
          </h3>
          <p className="text-slate-400 max-w-2xl mx-auto text-xl font-medium">
            Os temas que movimentam o mercado debatidos por líderes que estão{" "}
            <span className="text-blue-400">transformando o segmento</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {panelThemes.map((item, i) => (
            <div
              key={i}
              className="group relative flex items-center gap-8 p-10 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] hover:bg-white/[0.08] hover:border-blue-500/30 transition-all duration-700 hover:-translate-y-2 overflow-hidden shadow-2xl"
            >
              {/* Accent glow on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-start/20 to-brand-end/20 rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>

              <div
                className={`relative w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform duration-500`}
              >
                <item.icon className={`h-8 w-8 ${item.color}`} />
              </div>
              <span className="relative text-2xl font-normal text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors">
                {item.theme}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-blue-500 hover:text-white rounded-full h-16 px-12 text-xl font-black transition-all duration-500 shadow-2xl shadow-blue-500/10"
            onClick={(e) => scrollToSection(e, "palestrantes")}
          >
            Conheça os painelistas <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    </section>
  )
}
