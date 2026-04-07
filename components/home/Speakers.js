import Image from "next/image";
import { Users } from "lucide-react";

export default function Speakers() {
  const speakers = [
    {
      name: "Roberto Justus",
      role: "Negócios & Liderança",
      specialty: "Estratégia Empresarial",
      image: "/images/roberto-justos.webp",
    },
    {
      name: "Ricardo Amorim",
      role: "Economia & Futuro",
      specialty: "Análise de Mercado",
      image: "/images/ricardo-amorim.jpg",
    },
    {
      name: "Menzinho",
      role: "Humor",
      specialty: "Empreendedorismo e Gestão",
      image: "/images/menzinho.jpg",
    },
  ];

  return (
    <section
      id="palestrantes"
      className="py-24 bg-slate-900 text-white overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-4">
            Mentes Brilhantes
          </h2>
          <h3 className="text-4xl md:text-5xl font-black mb-6">Palestrantes</h3>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Oportunidade única para ouvir personalidades que você admira e que
            inspiram o futuro dos seus negócios e carreira
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {speakers.map((p, i) => (
            <div key={i} className="group relative">
              <div className="aspect-[3/4] rounded-3xl bg-slate-800 overflow-hidden mb-6 relative shadow-2xl transition-all duration-500 group-hover:shadow-blue-500/10 group-hover:-translate-y-2">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    layout="fill"
                    objectFit="cover"
                    className="grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                    <Users className="h-24 w-24 opacity-10" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10"></div>
              </div>
              <div className="text-center">
                <h4 className="text-2xl font-black group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                  {p.name}
                </h4>
                <p className="text-blue-400 font-bold text-sm mt-1">{p.role}</p>
                <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-black underline decoration-blue-500/30 underline-offset-4">
                  {p.specialty}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
