import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, MapPin, Info, Hotel, Plane } from "lucide-react"
import Link from "next/link"

export default function Pricing() {
  return (
    <section
      id="beneficios"
      className="py-24 bg-slate-50 border-y border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-4xl font-black text-slate-900 uppercase trac">
              Benefícios & Inscrição
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              O Simpovidro é um evento exclusivo. Garanta condições especiais
              através do associativismo e participe do maior encontro do setor.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-16 h-16 text-blue-600" />
                </div>
                <h4 className="text-blue-900 font-black text-xl mb-2 italic">
                  SÓCIO ABRAVIDRO
                </h4>
                <div className="text-5xl font-black text-blue-600 mb-4 tracking-tighter">
                  50%{" "}
                  <span className="text-lg font-bold text-blue-400">OFF</span>
                </div>
                <p className="text-blue-700/70 text-sm font-bold leading-relaxed">
                  Desconto exclusivo para empresas associadas à Abravidro em
                  todas as categorias de inscrição.
                </p>
              </div>

              <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl hover:shadow-blue-500/10 transition-shadow group relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MapPin className="w-16 h-16 text-blue-400" />
                </div>
                <h4 className="text-blue-400 font-black text-xl mb-2 italic uppercase">
                  Entidades Regionais
                </h4>
                <div className="text-5xl font-black text-white mb-4 tracking-tighter">
                  15%{" "}
                  <span className="text-lg font-bold text-slate-500">OFF</span>
                </div>
                <p className="text-slate-400 text-sm font-bold leading-relaxed">
                  Condição especial para associados de entidades regionais
                  parceiras do Simpovidro.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl border-l-4 border-l-blue-600">
              <Info className="h-6 w-6 text-blue-600 shrink-0" />
              <p className="text-sm text-slate-600 font-bold italic">
                As inscrições contemplam acesso total às palestras, feira de
                negócios, coquetel de abertura e jantar de encerramento.
              </p>
            </div>
          </div>

          <div id="logistica" className="space-y-6">
            <Card className="bg-blue-600 text-white border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" /> Acomodações
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Exclusividade Costão do Santinho
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm opacity-90">
                  Centralizamos as reservas para garantir que você esteja no
                  coração do evento com tarifas especiais Simpovidro.
                </p>
                <Link href="/inscricao#acomodacoes">
                  <Button className="w-full bg-white text-blue-600 hover:bg-slate-100">
                    Consultar Quartos
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Plane className="h-5 w-5 text-blue-600" /> Passagens Aéreas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Nossa agência parceira oferece suporte logístico completo para
                  o seu voo até Maceió.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Solicitar Cotação
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
