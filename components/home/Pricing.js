import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, MapPin, Info, Hotel, Plane } from "lucide-react"
import SectionTitle from "../ui/SectionTitle"

export default function Pricing({ router }) {
  const isEn = router?.locale === "en"
  const t = (pt, en) => (isEn ? en : pt)

  return (
    <section
      id="condicoes-especiais"
      className="py-24 bg-logo-green border-y border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <SectionTitle className="text-white">
              {t("Condições especiais", "Special conditions")}
            </SectionTitle>
            <p className="text-lg text-white leading-relaxed">
              {t(
                "Associados Abravidro contam com condições especiais para participar do simpósio.",
                "Abravidro members have special conditions to participate in the symposium.",
              )}
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-16 h-16 text-blue-600" />
                </div>
                <h4 className="text-blue-900 text-xl mb-2 uppercase">
                  {t("Associado ABRAVIDRO", "ABRAVIDRO Member")}
                </h4>
                <div className="text-5xl font-black text-blue-600 mb-4 tracking-tighter">
                  20%{" "}
                  <span className="text-lg font-bold text-blue-400">OFF</span>
                </div>
                <p className="text-blue-700/70 text-sm font-bold leading-relaxed">
                  {t(
                    "Desconto exclusivo para empresas associadas à Abravidro em todas as categorias de inscrição.",
                    "Exclusive discount for companies associated with Abravidro in all registration categories.",
                  )}
                </p>
              </div>

              <div className="p-8 bg-logo-navy rounded-[2rem] shadow-xl hover:shadow-blue-500/10 transition-shadow group relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MapPin className="w-16 h-16 text-blue-400" />
                </div>
                <h4 className="text-blue-400 text-xl mb-2 uppercase">
                  {t("Entidades Regionais", "Regional Entities")}
                </h4>
                <div className="text-5xl font-black text-white mb-4 tracking-tighter">
                  15%{" "}
                  <span className="text-lg font-bold text-slate-300">OFF</span>
                </div>
                <p className="text-slate-200 text-sm font-bold leading-relaxed">
                  {t(
                    "Condição especial para associados de entidades regionais afiliadas da Abravidro.",
                    "Special condition for members of regional entities affiliated with Abravidro.",
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl border-l-4 border-l-blue-600">
              <Info className="h-6 w-6 text-blue-600 shrink-0" />
              <p className="text-sm text-slate-600 font-bold italic">
                {t(
                  "As inscrições contemplam, além da hospedagem no sistema all-inclusive durante todo o período do evento, transfer aeroporto-hotel-aeroporto, acesso às palestras, feira de negócios, coquetel de abertura e jantar de encerramento.",
                  "Registrations include, in addition to accommodation in the all-inclusive system during the entire event, airport-hotel-airport transfer, access to lectures, trade fair, opening cocktail and closing dinner.",
                )}
              </p>
            </div>
          </div>

          <div id="logistica" className="space-y-6">
            <Card className="bg-logo-navy text-white border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-title">
                  <Hotel className="h-5 w-5" />{" "}
                  {t("Acomodações", "Accommodations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm opacity-90">
                  {t(
                    "Centralizamos as reservas para garantir que você esteja no coração do evento com tarifas especiais Simpovidro.",
                    "We centralize reservations to ensure you are in the heart of the event with special Simpovidro rates.",
                  )}
                </p>
                <Button
                  onClick={() => router.push("/inscricao")}
                  className="w-full bg-white text-blue-600 hover:bg-slate-100"
                >
                  {t("Reserve agora", "Book now")}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 text-2xl font-title">
                  <Plane className="h-5 w-5 text-blue-600" />{" "}
                  {t("TRANSFER", "TRANSFER")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  {t(
                    "Para garantir seu lugar no transfer aeroporto-hotel e hotel-aeroporto oferecido pela Abravidro aos participantes do Simpovidro, precisamos saber as informações de seu voo de ida e volta.",
                    "To guarantee your place in the airport-hotel and hotel-airport transfer offered by Abravidro to Simpovidro participants, we need to know your round-trip flight information.",
                  )}
                </p>
                <Button
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {t("Em breve", "Coming soon")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
