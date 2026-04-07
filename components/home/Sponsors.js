import Image from "next/image"

export default function Sponsors({ variant = "full" }) {
  const sponsors = [
    { name: "AGC", logo: "/images/agc-logo.png" },
    { name: "Cebrace", logo: "/images/cebrace-logo.png" },
    { name: "Guardian Glass", logo: "/images/glass-guardian-logo.png" },
    { name: "Vivix", logo: "/images/logo_vivix.png" },
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
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
            Patrocinadores
          </h2>
        </div>

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
    </section>
  )
}
