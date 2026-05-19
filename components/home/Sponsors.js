import Image from "next/image"

export default function Sponsors({ variant = "full" }) {
  const sponsors = [
    { name: "AGC", logo: "/images/agc-logo.png" },
    { name: "Cebrace", logo: "/images/cebrace-logo.png" },
    { name: "Guardian Glass", logo: "/images/glass-guardian-logo.png" },
    { name: "Vivix", logo: "/images/logo_vivix.png" },
  ]

  const supporters = [
    { name: "Diamanfer", logo: "/images/apoiadores/diamanfer.jpeg" },
    { name: "Vetro Maquinas", logo: "/images/apoiadores/vetro-maquinas.png" },
  ]

  const support = [
    { name: "Abravid", logo: "/images/apoio-institucional/abravid.jpg" },
    { name: "Adivipar", logo: "/images/apoio-institucional/adivipar.jpg" },
    { name: "Ascevi", logo: "/images/apoio-institucional/ascevi.jpg" },
    { name: "Avigo", logo: "/images/apoio-institucional/avigo.jpg" },
    { name: "Avims", logo: "/images/apoio-institucional/avims.jpg" },
    { name: "Sim Vidro", logo: "/images/apoio-institucional/sim vidro.jpg" },
    {
      name: "Sinbevidros",
      logo: "/images/apoio-institucional/sinbevidros.jpg",
    },
    { name: "Sincavesp", logo: "/images/apoio-institucional/sincavesp.jpg" },
    { name: "Sincavidro", logo: "/images/apoio-institucional/sincavidro.jpg" },
    { name: "Sincomavi", logo: "/images/apoio-institucional/sincomavi.jpg" },
    {
      name: "Sindi Vidros RS",
      logo: "/images/apoio-institucional/sindi vidros rs.jpg",
    },
    {
      name: "Sindividros BA",
      logo: "/images/apoio-institucional/sindividros ba.jpg",
    },
    {
      name: "Sindividros ES",
      logo: "/images/apoio-institucional/sindividros es.jpg",
    },
  ]

  if (variant === "compact") {
    return (
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-center gap-6 md:gap-12">
        <span className="font-title text-sm font-black text-blue-900/40 uppercase tracking-[0.2em] hidden sm:block">
          Patrocinadores
        </span>
        <div className="flex items-center gap-8 md:gap-12">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.name}
              className="relative w-20 h-8 md:w-24 md:h-10 opacity-80 hover:opacity-100 transition-opacity"
            >
              <Image
                src={sponsor.logo}
                alt={`${sponsor.name} Logo`}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section id="patrocinadores" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="mb-16">
          <h2 className="text-3xl font-title text-slate-900 uppercase mb-12">
            Patrocinadores
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.name}
                className="group flex flex-col items-center gap-4 transition-all duration-500 hover:scale-110"
              >
                <div className="relative w-40 h-24 flex items-center justify-center p-4">
                  <Image
                    src={sponsor.logo}
                    alt={`${sponsor.name} Logo`}
                    width={160}
                    height={80}
                    className="object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl text-slate-400 uppercase mb-10 font-title">
            Apoiadores
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 mb-10">
            {supporters.map((sponsor) => (
              <div
                key={sponsor.name}
                className="group flex flex-col items-center gap-4 transition-all duration-500 hover:scale-110"
              >
                <div className="relative h-40 flex items-center justify-center p-4">
                  <Image
                    src={sponsor.logo}
                    alt={`${sponsor.name} Logo`}
                    width={50}
                    height={100}
                    className="object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl text-slate-400 uppercase mb-10 font-title">
            Apoio Institucional
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 transition-all duration-700">
            {support.map((partner) => (
              <div
                key={partner.name}
                className="group flex flex-col items-center transition-all duration-500 hover:scale-110"
              >
                <div className="relative w-28 flex items-center justify-center p-2">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} Logo`}
                    width={180}
                    height={180}
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
