import { Info } from "lucide-react";

export default function Tips() {
  const tips = [
    {
      title: "Vestimenta",
      desc: "Esporte fino para as reuniões técnicas e casual chic para os eventos sociais.",
    },
    {
      title: "Check-in",
      desc: "Início oficial às 15h do dia 31 de Outubro. Chegue cedo para o networking.",
    },
    {
      title: "Transporte",
      desc: "Shuttles oficiais disponíveis entre o aeroporto e o resort em horários marcados.",
    },
    {
      title: "Exclusividade",
      desc: "Lembre-se de portar seu crachá em todas as áreas do evento e refeições.",
    },
  ];

  return (
    <section id="dicas" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4">
            Preparação
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 italic tracking-tighter">
            Dicas & Lembretes
          </h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-colors group"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 transition-colors">
                <Info className="h-6 w-6 text-blue-600 group-hover:text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3">{tip.title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {tip.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
