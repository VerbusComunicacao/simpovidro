import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function AboutEvent({ scrollToSection }) {
  const benefits = [
    "O principal encontro do setor na América do Sul",
    "Centenas de profissionais e suas famílias",
    "Programação técnica de alto nível",
    "Networking internacional",
    "Ambiente descontraído e lazer",
  ]

  return (
    <section id="sobre" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-blue-600 font-bold uppercase tracking-[0.2em] text-sm mb-4">
                O Evento
              </h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                A mesma tradição,{" "}
                <span className="text-blue-600">uma nova experiência!</span>
              </h3>
              <div className="space-y-4 text-lg text-slate-600 leading-relaxed font-medium">
                <p>
                  Organizado a cada dois anos pela Abravidro, o Simpovidro é o
                  principal encontro do setor vidreiro na América do Sul. Reúne,
                  em um ambiente descontraído, centenas de profissionais do
                  segmento e suas famílias para uma programação cheia de
                  conteúdo técnico, networking e lazer.
                </p>
                <p>
                  De caráter internacional, o simpósio recebe participantes não
                  só do Brasil, mas de outras partes do mundo. É uma grande
                  oportunidade para se relacionar com atuais ou futuros
                  clientes, trocar informações de mercado e fechar negócios.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {benefits.map((item, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                    <Zap className="w-3.5 h-3.5 text-blue-600 group-hover:text-white" />
                  </div>
                  <span className="font-semibold text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-14 px-10 text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
              onClick={(e) => scrollToSection(e, "programacao")}
            >
              Confira a Programação completa
            </Button>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-blue-600/5 rounded-[2.5rem] blur-2xl"></div>
            <div className="relative aspect-square rounded-[2rem] shadow-2xl border-8 border-white">
              <div className="absolute rounded-[2rem]  inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent z-10 pointer-events-none"></div>
              <Image
                src="/images/simpovidro.webp"
                alt="Simpovidro Event Impression"
                layout="fill"
                objectFit="cover"
                className="w-full h-full object-cover rounded-[2rem]"
              />
              <div className="absolute -bottom-12 left-8 right-8 p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white z-20">
                <p className="font-bold text-xl mb-1 italic">
                  Vanguardismo & Tradição
                </p>
                <p className="text-sm opacity-90 font-medium">
                  Conectando a cadeia vidreira há mais de 16 edições com
                  excelência e inovação.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
