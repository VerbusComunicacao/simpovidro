import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/router"

export default function AboutEvent({ scrollToSection }) {
  const router = useRouter()
  const isEn = router?.locale === "en"
  const t = (pt, en) => (isEn ? en : pt)

  const benefits = [
    t("Networking", "Networking"),
    t(
      "Centenas de profissionais e suas famílias",
      "Hundreds of professionals and their families",
    ),
    t("Programação técnica de alto nível", "High-level technical programming"),
  ]

  return (
    <section
      id="sobre"
      className="py-24 bg-white relative overflow-hidden bg-gradient-to-r from-brand-start to-brand-end"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>

      {/* Ícone branco de fundo (Marca d'água) */}
      <div className="absolute right-0 top-10 w-142 hidden lg:block">
        <svg viewBox="0 0 372.42 183.42" className="w-full h-auto fill-white">
          <path d="M308.89,126.8c-7.68,6.12-17.61,9.85-28.18,9.85-7.27,0-14.39-1.75-21.56-5.31-.73-.36-1.45-.73-2.18-1.13-1.89-1.03-3.79-2.19-5.7-3.48-8.45-5.7-17.21-13.95-27.57-25.97l-4.5-5.22-4.29,5.39c-2.17,2.72-4.35,5.48-6.54,8.26l-.04.05c-5.1,6.46-10.37,13.15-15.74,19.6l-3.16,3.8,3.31,3.68c6.9,7.68,13.38,14.09,19.78,19.56.26.22.51.44.77.65.47.4.94.78,1.41,1.17,20.98,17.29,42.6,25.7,66.04,25.7,9.95,0,19.01-1.68,28.2-4.73l-.03-51.89Z" />
          <path d="M280.71,0C256.74,0,234.68,8.79,213.25,26.87c-17,14.36-31.45,32.67-45.41,50.38-21.64,27.43-40.61,53.49-65.73,58.53v47.07c20.48-1.96,38.37-10.53,57.05-26.3,16.96-14.32,31.39-32.61,45.35-50.3l.04-.05c24.12-30.57,46.89-59.45,76.16-59.45,9.8,0,18.87,3.15,26.26,8.49V3.84C298.82,1.46,289.62,0,280.71,0Z" />
          <path d="M311.91,177.97c12.48-4.52,23.93-11.77,33.61-21.45,16.39-16.39,25.82-37.02,26.8-59.98l-60.41,36.68v44.75Z" />
          <path d="M372.41,92.4c0-.23,0-.46,0-.69,0-40.41-26.27-74.79-62.63-86.98v53.19c9.35,8.24,15.87,20.37,15.87,33.79s-4.89,24.82-13.81,33.03l.06,5.27,60.5-37.61Z" />
          <path d="M179.72,47.08c-4.23-4.71-8.3-8.93-12.29-12.76-2.78-2.67-5.53-5.15-8.26-7.46C140.36,10.98,121.06,2.28,100.42.4c-.02,0-.04,0-.06,0-.69-.06-1.37-.12-2.06-.17-.27-.02-.54-.03-.82-.05-.44-.03-.87-.05-1.31-.07-1.48-.07-2.97-.1-4.46-.1-9.95,0-19.43,1.5-28.62,4.55v52.69c4.89-3.9,11.26-7.49,17.5-9.08h0c2.61-.66,5.31-1.1,8.08-1.29.14,0,.29-.02.43-.03.36-.02.72-.04,1.08-.05.29,0,.58-.01.87-.02.24,0,.49-.01.73-.01.08,0,.15,0,.23,0,7.17.05,14.19,1.79,21.27,5.3l.04-.03c3.43,1.74,7.12,4.03,11.1,7.03,7.08,5.33,15.11,12.89,24.33,23.58l4.5,5.22,4.3-5.39c2.16-2.71,4.33-5.46,6.5-8.22,5.11-6.48,10.39-13.17,15.82-19.7l3.16-3.8-3.3-3.68Z" />
          <path d="M60.5,5.44c-12.48,4.52-23.93,11.77-33.61,21.45C10.5,43.28,1.07,63.88.09,86.85l60.41-36.68V5.44Z" />
          <path d="M98.9,183.15v-46.9c-2.03.29-5.04.41-7.13.41-6.59,0-14.64-2.99-21.59-6.68-13.84-7.36-23.01-21.44-23.41-37.11,0-.38-.01-.77-.01-1.15,0-13.05,4.83-24.82,13.75-33.04l-.06-5.27S0,91.01,0,91.01H0c-.3,40.71,26.06,75.42,62.62,87.67,0,0,0-.02,0-.02,9.16,3.08,18.96,4.75,29.15,4.75,2.39,0,4.77-.09,7.13-.27Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-white uppercase tracking-[0.2em] text-sm mb-4">
                {t("O Evento", "The Event")}
              </h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
                {t(
                  "O maior hub de relacionamento da comunidade vidreira!",
                  "The largest relationship hub in the flat glass community!",
                )}
              </h3>
              <div className="space-y-4 text-lg text-white leading-relaxed mb-6">
                <p>
                  {t(
                    <>
                      A cada dois anos, os principais <em>players</em> vidreiros
                      do Brasil se reúnem no Simpovidro. Em 2026, o encontro
                      ocorrerá de{" "}
                      <strong>
                        5 a 8 de novembro, no Costão do Santinho Resort
                      </strong>
                      , em Florianópolis. Organizado pela Abravidro, o evento
                      tem como foco o <em>networking</em> entre os diversos elos
                      da cadeia em meio a um ambiente descontraído, reunindo{" "}
                      <strong>
                        oportunidades de negócio, conteúdo técnico e lazer
                      </strong>
                      .
                    </>,
                    <>
                      Every two years, the main flat glass <em>players</em> in
                      Brazil gather at Simpovidro. In 2026, the meeting will
                      take place from{" "}
                      <strong>
                        November 5 to 8, at Costão do Santinho Resort
                      </strong>
                      , in Florianópolis. Organized by Abravidro, the event
                      focuses on
                      <em>networking</em> among the various links in the chain
                      in a relaxed atmosphere, bringing together{" "}
                      <strong>
                        business opportunities, technical content, and leisure
                      </strong>
                      .
                    </>,
                  )}
                </p>
                <p>
                  {t(
                    "O simpósio recebe participantes não só do Brasil, mas de outras partes do mundo. É uma grande oportunidade para estreitar laços com clientes e parceiros, trocar informações sobre o mercado e fechar negócios.",
                    "The symposium welcomes participants not only from Brazil, but from other parts of the world. It is a great opportunity to strengthen ties with clients and partners, exchange market information, and close deals.",
                  )}
                </p>
              </div>
              <p className="text-lg font-bold text-white mb-1">
                {t(
                  "Só no Simpovidro você encontra:",
                  "Only at Simpovidro you will find:",
                )}
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 group cursor-default"
                >
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <svg
                      viewBox="0 0 372.42 183.42"
                      className="w-full h-auto transition-all duration-200 brightness-0 invert opacity-40 group-hover:brightness-100 group-hover:invert-0 group-hover:opacity-100"
                    >
                      <path
                        fill="#c11d1f"
                        d="M308.89,126.8c-7.68,6.12-17.61,9.85-28.18,9.85-7.27,0-14.39-1.75-21.56-5.31-.73-.36-1.45-.73-2.18-1.13-1.89-1.03-3.79-2.19-5.7-3.48-8.45-5.7-17.21-13.95-27.57-25.97l-4.5-5.22-4.29,5.39c-2.17,2.72-4.35,5.48-6.54,8.26l-.04.05c-5.1,6.46-10.37,13.15-15.74,19.6l-3.16,3.8,3.31,3.68c6.9,7.68,13.38,14.09,19.78,19.56.26.22.51.44.77.65.47.4.94.78,1.41,1.17,20.98,17.29,42.6,25.7,66.04,25.7,9.95,0,19.01-1.68,28.2-4.73l-.03-51.89Z"
                      />
                      <path
                        fill="#91ad2c"
                        d="M280.71,0C256.74,0,234.68,8.79,213.25,26.87c-17,14.36-31.45,32.67-45.41,50.38-21.64,27.43-40.61,53.49-65.73,58.53v47.07c20.48-1.96,38.37-10.53,57.05-26.3,16.96-14.32,31.39-32.61,45.35-50.3l.04-.05c24.12-30.57,46.89-59.45,76.16-59.45,9.8,0,18.87,3.15,26.26,8.49V3.84C298.82,1.46,289.62,0,280.71,0Z"
                      />
                      <path
                        fill="#ea620f"
                        d="M311.91,177.97c12.48-4.52,23.93-11.77,33.61-21.45,16.39-16.39,25.82-37.02,26.8-59.98l-60.41,36.68v44.75Z"
                      />
                      <path
                        fill="#f4960d"
                        d="M372.41,92.4c0-.23,0-.46,0-.69,0-40.41-26.27-74.79-62.63-86.98v53.19c9.35,8.24,15.87,20.37,15.87,33.79s-4.89,24.82-13.81,33.03l.06,5.27,60.5-37.61Z"
                      />
                      <path
                        fill="#a7438d"
                        d="M179.72,47.08c-4.23-4.71-8.3-8.93-12.29-12.76-2.78-2.67-5.53-5.15-8.26-7.46C140.36,10.98,121.06,2.28,100.42.4c-.02,0-.04,0-.06,0-.69-.06-1.37-.12-2.06-.17-.27-.02-.54-.03-.82-.05-.44-.03-.87-.05-1.31-.07-1.48-.07-2.97-.1-4.46-.1-9.95,0-19.43,1.5-28.62,4.55v52.69c4.89-3.9,11.26-7.49,17.5-9.08h0c2.61-.66,5.31-1.1,8.08-1.29.14,0,.29-.02.43-.03.36-.02.72-.04,1.08-.05.29,0,.58-.01.87-.02.24,0,.49-.01.73-.01.08,0,.15,0,.23,0,7.17.05,14.19,1.79,21.27,5.3l.04-.03c3.43,1.74,7.12,4.03,11.1,7.03,7.08,5.33,15.11,12.89,24.33,23.58l4.5,5.22,4.3-5.39c2.16-2.71,4.33-5.46,6.5-8.22,5.11-6.48,10.39-13.17,15.82-19.7l3.16-3.8-3.3-3.68Z"
                      />
                      <path
                        fill="#014991"
                        d="M60.5,5.44c-12.48,4.52-23.93,11.77-33.61,21.45C10.5,43.28,1.07,63.88.09,86.85l60.41-36.68V5.44Z"
                      />
                      <path
                        fill="#0c84c7"
                        d="M98.9,183.15v-46.9c-2.03.29-5.04.41-7.13.41-6.59,0-14.64-2.99-21.59-6.68-13.84-7.36-23.01-21.44-23.41-37.11,0-.38-.01-.77-.01-1.15,0-13.05,4.83-24.82,13.75-33.04l-.06-5.27S0,91.01,0,91.01H0c-.3,40.71,26.06,75.42,62.62,87.67,0,0,0-.02,0-.02,9.16,3.08,18.96,4.75,29.15,4.75,2.39,0,4.77-.09,7.13-.27Z"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold text-white transition-all group-hover:opacity-100 opacity-90">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              className="bg-[#f4960d] hover:bg-[#e57800] text-white rounded-full h-14 px-10 text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              onClick={(e) => scrollToSection(e, "local")}
            >
              {t("Conheça o local do evento", "Discover the venue")}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-blue-600/5 rounded-[2.5rem] blur-2xl"></div>

            <div className="relative aspect-square rounded-[2rem] shadow-2xl border-8 border-white">
              <div className="absolute rounded-[2rem] inset-0 bg-gradient-to-r from-brand-start/20 to-brand-end/20 z-10 pointer-events-none"></div>
              <Image
                src="/images/simpovidro.webp"
                alt="Simpovidro Event Impression"
                fill
                className="w-full h-full object-cover rounded-[2rem]"
              />
              <div className="absolute -bottom-12 left-8 right-8 p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white z-20">
                <p className="font-eastman text-xl mb-1">
                  {t("Vanguarda & tradição", "Avant-garde & Tradition")}
                </p>
                <p className="text-sm opacity-90">
                  {t(
                    "Conectando a cadeia vidreira há 16 edições com excelência e inovação.",
                    "Connecting the glass supply chain for 16 editions with excellence and innovation.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
