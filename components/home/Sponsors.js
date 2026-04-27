import Image from "next/image"

export default function Sponsors({ variant = "full" }) {
  const sponsors = [
    { name: "AGC", logo: "/images/agc-logo.png" },
    { name: "Cebrace", logo: "/images/cebrace-logo.png" },
    { name: "Guardian Glass", logo: "/images/glass-guardian-logo.png" },
    { name: "Vivix", logo: "/images/logo_vivix.png" },
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
      <section
        id="patrocinadores-top"
        className="py-12 bg-white relative overflow-hidden border-b border-slate-100"
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="text-center md:text-left">
              <h2 className="text-blue-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-1">
                Patrocinadores
              </h2>
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                Principais <span className="text-blue-600">Parceiros</span>
              </h3>
            </div>

            <div className="h-px w-12 bg-slate-200 hidden md:block"></div>

            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.name}
                  className="group flex flex-col items-center transition-all duration-500 hover:scale-105"
                >
                  <div className="relative w-32 h-16 flex items-center justify-center p-2">
                    <Image
                      src={sponsor.logo}
                      alt={`${sponsor.name} Logo`}
                      layout="intrinsic"
                      width={120}
                      height={60}
                      objectFit="contain"
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

  return (
    <section id="patrocinadores" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="mb-16">
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-12">
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
                    layout="intrinsic"
                    width={160}
                    height={80}
                    objectFit="contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-400 uppercase italic tracking-widest mb-10">
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
                    layout="intrinsic"
                    width={180}
                    height={180}
                    objectFit="cover"
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
