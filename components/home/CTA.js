import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"

export default function CTA({ router: propRouter, HERO_IMAGE }) {
  const localRouter = useRouter()
  const router = propRouter || localRouter
  const isEn = router?.locale === "en"
  const t = (pt, en) => (isEn ? en : pt)

  return (
    <>
      {/* CTA Bottom */}
      <section className="py-20 bg-logo-navy relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl text-white mb-6">
            {t(
              "Pronto para embarcar em um evento fundamental para a sua empresa?",
              "Ready to embark on an event essential for your company?",
            )}
          </h2>
          <p className="text-lg text-blue-100 mb-10 opacity-80">
            {t(
              "Junte-se aos grandes líderes do setor vidreiro e transforme seu futuro. Vagas limitadas!",
              "Join the great leaders of the flat glass industry and shape your future. Limited spots available!",
            )}
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-700 hover:bg-slate-100 rounded-full h-14 px-12 text-lg shadow-2xl transition-transform hover:scale-110 cursor-pointer"
            onClick={() => router.push("/inscricao")}
          >
            {t("Garanta sua vaga", "Secure your spot")}
          </Button>
        </div>
      </section>

      {/* Condições Gerais / Segurança CTA */}
      <section className="py-12 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            <p className="text-sm font-bold text-slate-700">
              {t(
                "A sua segurança e privacidade são prioridades.",
                "Your security and privacy are our top priorities.",
              )}{" "}
              <Link
                href="/condicoes-gerais"
                className="underline text-blue-600 ml-1"
              >
                {t("Leia as Condições Gerais.", "Read the General Conditions.")}
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">
              {t("ORGANIZAÇÃO:", "ORGANIZATION:")}
            </p>
            <Image
              src={"/images/logo_ABRAVIDRO.png"}
              alt={`ABRAVIDRO`}
              width={140}
              height={140}
            />
          </div>
        </div>
      </section>

      {/* Final CTA Full Screen */}
      <section className="py-32 bg-slate-950 relative overflow-hidden text-center text-white">
        <div className="absolute top-0 left-0 w-full h-full">
          <Image
            src={HERO_IMAGE}
            alt="Glass BG"
            fill
            className="opacity-20 saturate-0 scale-125 blur-sm object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-color"></div>
          <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-none uppercase font-title">
            {t(
              "Presença Única. Futuro Sólido.",
              "Unique Presence. Solid Future.",
            )}
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 opacity-80 font-light leading-relaxed">
            {t(
              "Não fique de fora do ambiente de negócios do setor vidreiro mais qualificado na América Latina.",
              "Don't miss out on the most qualified flat glass business environment in Latin America.",
            )}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 items-center">
            <Button
              size="lg"
              className="bg-logo-navy hover:bg-blue-700 text-white rounded-full h-16 px-14 text-xl font-bold shadow-2xl transition-all hover:scale-110 shadow-blue-500/50 cursor-pointer"
              onClick={() => router.push("/inscricao")}
            >
              {t("INSCREVA-SE", "REGISTER NOW")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-white text-white rounded-full h-16 px-14 text-xl font-bold"
            >
              {t(
                "Dúvidas? Fale conosco: 11- 3873-9908",
                "Questions? Contact us: +55 (11) 3873-9908",
              )}
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
