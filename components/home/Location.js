import { MapPin, Star, Hotel, Zap } from "lucide-react"
import Image from "next/image"

export default function Location() {
  return (
    <section id="local" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>

      {/* Background Icons Pattern - Vertical Repeat Only */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/images/icon-17-simpovidro.png')",
          backgroundSize: "60px",
          backgroundRepeat: "repeat-y",
          backgroundPosition: "-20px 0",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute -inset-4 bg-blue-600/10 rounded-[3rem] blur-2xl"></div>
            <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white group">
              <Image
                src="/images/costao-imagem.webp"
                alt="Costão do Santinho Resort"
                layout="fill"
                objectFit="cover"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 font-bold"
              />
              <div className="absolute top-6 left-6 flex gap-2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                  All Inclusive
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent">
                <div className="flex items-center gap-2 text-white mb-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="ml-2 text-sm font-bold">5 Estrelas</span>
                </div>
                <h4 className="text-2xl font-black text-white italic">
                  Costão do Santinho Resort
                </h4>
                <p className="text-white/80 font-medium">
                  Florianópolis, Santa Catarina
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <div className="font-title flex items-center gap-2 text-blue-600 font-bold uppercase tracking-[0.2em] text-sm mb-4">
                <MapPin className="h-4 w-4" /> O Novo Local
              </div>
              <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6 uppercase italic tracking-tighter">
                Costão do <span className="text-blue-600">Santinho</span>
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                Em 2026, o 17º Simpovidro desembarca em um dos destinos mais
                desejados do Brasil. O Costão do Santinho Resort combina a
                exuberância da natureza catarinense com uma infraestrutura de
                ponta para eventos internacionais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Hotel,
                  title: "Lazer de Classe Mundial",
                  desc: "Piscinas, spa, gastronomia internacional e contato direto com a natureza.",
                },
                {
                  icon: Zap,
                  title: "Networking & Conforto",
                  desc: "Ambientes projetados para facilitar conexões em um clima de relaxamento total.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600 shadow-inner">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
