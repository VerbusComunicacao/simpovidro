import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import Image from "next/image"

export default function Schedule() {
  const days = [
    {
      day: "Dia 1",
      theme: "Abertura & Networking",
      time: "31 Out",
      desc: "Welcome Cocktail e cerimônia de abertura oficial.",
    },
    {
      day: "Dia 2",
      theme: "Inovação Técnica",
      time: "01 Nov",
      desc: "Palestras técnicas e rodadas de negócios para líderes.",
    },
    {
      day: "Dia 3",
      theme: "Futuro do Setor",
      time: "02 Nov",
      desc: "Encerramento técnico e jantar de gala comemorativo.",
    },
  ]

  return (
    <section
      id="programacao"
      className="py-24 bg-white relative overflow-hidden"
    >
      {/* Background Icon */}
      <div className="absolute top-1/2 right-0 translate-x-[40%] -translate-y-1/2 w-[900px] h-[900px] opacity-[0.7] pointer-events-none z-0">
        <Image
          src="/images/icone-simpovidro.svg"
          alt="Simpovidro Icon BG"
          layout="fill"
          objectFit="contain"
        />
      </div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4">
              Programação
            </h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
              Um roteiro pensado para o seu sucesso.
            </h3>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {days.map((d, i) => (
            <Card
              key={i}
              className="border-none shadow-lg hover:shadow-xl transition-shadow bg-slate-50"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                  >
                    {d.day}
                  </Badge>
                  <span className="text-slate-400 font-bold">{d.time}</span>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  {d.theme}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">{d.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4">
          <Button variant="ghost" className="text-blue-600 font-bold">
            Ver Cronograma Completo <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
