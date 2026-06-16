import Image from "next/image"

export default function Sponsors({ variant = "full" }) {
  const sponsors = [
    {
      name: "AGC",
      logo: "/images/agc-logo.png",
      link: "https://agcbrasil.com/",
    },
    {
      name: "Cebrace",
      logo: "/images/cebrace-logo.webp",
      link: "https://www.cebrace.com.br/",
    },
    {
      name: "Guardian Glass",
      logo: "/images/glass-guardian-logo.png",
      link: "https://www.guardianglass.com/la/pt",
    },
    {
      name: "Vivix",
      logo: "/images/vivix.png",
      link: "https://vivix.com.br/",
    },
  ]

  const supporters = [
    {
      name: "Diamanfer",
      logo: "/images/apoiadores/diamanfer.jpeg",
      link: "https://diamanfer.com.br/",
    },
    {
      name: "Glass Control",
      logo: "/images/apoiadores/glass-control.png",
      link: "https://sfti.com.br/",
    },
    {
      name: "Keraglass",
      logo: "/images/apoiadores/KERAGLASS.png",
      link: "https://www.keraglass.com/pt/home",
    },
    {
      name: "Vetro Maquinas",
      logo: "/images/apoiadores/vetro-maquinas.png",
      link: "https://vetromaquinas.com.br",
    },
  ]

  const support = [
    {
      name: "Abividro",
      logo: "/images/apoio-institucional/abividro.png",
      link: "https://abividro.org.br/",
    },
    {
      name: "Abravid",
      logo: "/images/apoio-institucional/ABRAVID.png",
      link: "",
      isVertical: true,
    },
    {
      name: "Adivipar",
      logo: "/images/apoio-institucional/Adivipar.png",
      link: "https://adivipar.com.br",
    },
    {
      name: "Ascevi",
      logo: "/images/apoio-institucional/ASCEVI.png",
      link: "",
      isVertical: true,
    },
    {
      name: "Avigo",
      logo: "/images/apoio-institucional/AVIGO.png",
      link: "",
    },
    {
      name: "Avims",
      logo: "/images/apoio-institucional/AVIMS.png",
      link: "",
    },
    {
      name: "Sim Vidro",
      logo: "/images/apoio-institucional/SimVidro.png",
      link: "https://www.simvidro.com.br",
    },
    {
      name: "Sinbevidros",
      logo: "/images/apoio-institucional/Sinbevidros.png",
      link: "https://www.sinbevidros.com.br",
      isVertical: true,
    },
    { name: "Sincavesp", logo: "/images/apoio-institucional/SINCAVESP.png" },
    { name: "Sincavidro", logo: "/images/apoio-institucional/SINCAVIDRO.png" },
    {
      name: "Sincomavi",
      logo: "/images/apoio-institucional/SINCOMAVI-2.png",
      link: "https://sincomavi.org.br",
    },

    {
      name: "Sindividros BA",
      logo: "/images/apoio-institucional/SINDIVIDROS BA.png",
    },
    {
      name: "Sindividros ES",
      logo: "/images/apoio-institucional/SINDIVIDROS-ES-NOVO.jpeg",
      link: "https://sindividros-es.com.br",
    },
    {
      name: "Sindi Vidros RS",
      logo: "/images/apoio-institucional/Sindividros RS.png",
      link: "https://sindividrosrs.com.br",
    },
  ]

  if (variant === "compact") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-12">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 md:gap-12">
          <span className="font-title text-[9px] sm:text-sm font-black text-blue-900/40 uppercase tracking-[0.2em]">
            Realização
          </span>
          <a
            href="https://abravidro.org.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-24 h-6 sm:w-18 sm:h-8 md:w-32 md:h-10 opacity-85 hover:opacity-100 transition-opacity block"
          >
            <Image
              src="/images/logo_ABRAVIDRO.png"
              alt="ABRAVIDRO Logo"
              fill
              className="object-contain"
            />
          </a>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 md:gap-12">
          <span className="font-title text-[9px] sm:text-sm font-black text-blue-900/40 uppercase tracking-[0.2em]">
            Patrocínio
          </span>
          <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-12">
            {sponsors.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.link}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-12 h-6 sm:w-16 sm:h-8 md:w-24 md:h-10 opacity-85 hover:opacity-100 transition-opacity block"
              >
                <Image
                  src={sponsor.logo}
                  alt={`${sponsor.name} Logo`}
                  fill
                  className="object-contain"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === "compact-hero") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-12">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 md:gap-12">
          <span className="font-title text-[9px] sm:text-sm font-black text-blue-900/40 uppercase tracking-[0.2em]">
            Realização
          </span>
          <a
            href="https://abravidro.org.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-28 h-8 sm:w-24 sm:h-10 md:w-40 md:h-18 opacity-85 hover:opacity-100 transition-opacity block"
          >
            <Image
              src="/images/logo_ABRAVIDRO.png"
              alt="ABRAVIDRO Logo"
              fill
              className="object-contain"
            />
          </a>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 md:gap-12">
          <span className="font-title text-[9px] sm:text-sm font-black text-blue-900/40 uppercase tracking-[0.2em]">
            Patrocínio
          </span>
          <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-12">
            {sponsors.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.link}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-16 h-8 sm:w-18 sm:h-10 md:w-28 md:h-18 opacity-85 hover:opacity-100 transition-opacity block"
              >
                <Image
                  src={sponsor.logo}
                  alt={`${sponsor.name} Logo`}
                  fill
                  className="object-contain"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === "mini") {
    return (
      <div className="max-w-2xl mx-auto mt-8 px-6 py-2 flex items-center justify-center gap-6 md:gap-12">
        <div className="flex items-center gap-4 md:gap-4">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.name}
              href={sponsor.link}
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-18 h-8 opacity-80 hover:opacity-100 transition-opacity block"
            >
              <Image
                src={sponsor.logo}
                alt={`${sponsor.name} Logo`}
                fill
                className="object-contain"
              />
            </a>
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
            Realização
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 mb-12">
            <a
              href="https://abravidro.org.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-500 hover:scale-110 block"
            >
              <Image
                src="/images/logo_ABRAVIDRO.png"
                alt="ABRAVIDRO Logo"
                width={300}
                height={150}
                style={{ width: "auto" }}
                className="h-16 md:h-16 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
          <h2 className="text-3xl font-title text-slate-900 uppercase mb-12">
            Patrocínio
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
            {sponsors.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group transition-all duration-500 hover:scale-110 block"
              >
                <Image
                  src={sponsor.logo}
                  alt={`${sponsor.name} Logo`}
                  width={300}
                  height={150}
                  style={{ width: "auto" }}
                  className="h-16 md:h-16 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl text-slate-400 uppercase mb-10 font-title">
            Apoio
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 mb-10">
            {supporters.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group transition-all duration-500 hover:scale-110 block"
              >
                <Image
                  src={sponsor.logo}
                  alt={`${sponsor.name} Logo`}
                  width={300}
                  height={150}
                  style={{ width: "auto" }}
                  className="h-16 md:h-16 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl text-slate-400 uppercase mb-10 font-title">
            Apoio Institucional
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 transition-all duration-700">
            {support.map((partner) => {
              const content = (
                <Image
                  src={partner.logo}
                  alt={`${partner.name} Logo`}
                  width={200}
                  height={100}
                  style={{ width: "auto" }}
                  className={`${partner.isVertical ? "h-14 md:h-14" : "h-10 md:h-10"} object-contain opacity-80 group-hover:opacity-100 transition-opacity`}
                />
              )

              return partner.link ? (
                <a
                  key={partner.name}
                  href={partner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group transition-all duration-500 hover:scale-110 block"
                >
                  {content}
                </a>
              ) : (
                <div
                  key={partner.name}
                  className="group transition-all duration-500 hover:scale-110"
                >
                  {content}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
