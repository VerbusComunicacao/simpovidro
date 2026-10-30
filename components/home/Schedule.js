import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { AnimatePresence, motion } from "framer-motion"
import { MapPin, User, Luggage, ChevronRight } from "lucide-react"

const PLENARY = ["Plenária Simpovidro", "Simpovidro Plenary"]
const RESTAURANTS = ["Restaurantes do resort", "Resort restaurants"]
const COURTS = ["Quadras esportivas", "Sports courts"]
const BREAKFAST = {
  time: ["7h às 10h", "7:00 – 10:00 AM"],
  title: ["Café da manhã", "Breakfast"],
  place: RESTAURANTS,
}
const FAIR_TIME = ["10h45 às 11h25", "10:45 – 11:25 AM"]
const SIGN_UP = { href: "/torneios", label: ["Agendar", "Sign up"] }
const BOOK_TABLE = {
  href: "/mesas-tematicas",
  label: ["Reservar mesa", "Book a table"],
}

const DAYS = [
  {
    id: "quinta",
    number: "05",
    weekday: ["Quinta-feira", "Thursday"],
    short: ["Quinta", "Thu"],
    color: "#91ad2c",
    items: [
      {
        time: ["Todo o dia", "All day"],
        title: ["Chegada dos participantes", "Participants arrive"],
        place: ["Costão do Santinho Resort", "Costão do Santinho Resort"],
      },
      {
        time: ["15h", "3:00 PM"],
        title: ["Check-in", "Check-in"],
        place: ["Recepção privativa", "Private reception"],
      },
      {
        time: ["19h30", "7:30 PM"],
        title: ["Cerimônia Oficial de Abertura", "Official Opening Ceremony"],
        place: PLENARY,
        highlight: true,
        description: [
          "Talk especial reunindo lideranças da Abravidro e executivos das usinas de base (AGC, Cebrace, Guardian e Vivix).",
          "Special talk with Abravidro leaders and executives from the base glass manufacturers (AGC, Cebrace, Guardian and Vivix).",
        ],
      },
      {
        time: ["20h45", "8:45 PM"],
        title: ["Coquetel de Abertura", "Opening Cocktail"],
        place: PLENARY,
      },
    ],
  },
  {
    id: "sexta",
    number: "06",
    weekday: ["Sexta-feira", "Friday"],
    short: ["Sexta", "Fri"],
    color: "#f4960d",
    items: [
      BREAKFAST,
      {
        time: ["8h45 às 9h45", "8:45 – 9:45 AM"],
        tag: ["Talk · Energia", "Talk · Energy"],
        title: ["Energia: muito além do preço", "Energy: beyond price"],
        place: PLENARY,
        highlight: true,
        description: [
          "Riscos, oportunidades e decisões estratégicas para as empresas",
          "Risks, opportunities and strategic decisions for companies",
        ],
        speakers: [
          "Jean Vinicius Tremura e Carlos Alberto Schoeps",
          "Jean Vinicius Tremura and Carlos Alberto Schoeps",
        ],
      },
      {
        time: ["9h45 às 10h45", "9:45 – 10:45 AM"],
        tag: ["Talk · Mercado", "Talk · Market"],
        title: [
          "Para onde vai o mercado do vidro?",
          "Where is the glass market heading?",
        ],
        place: PLENARY,
        highlight: true,
        description: [
          "Uma visão global sobre os movimentos que podem redefinir o setor",
          "A global view of the movements that may redefine the sector",
        ],
        speakers: [
          "Davide Cappellino e Leopoldo Castiella",
          "Davide Cappellino and Leopoldo Castiella",
        ],
      },
      {
        time: FAIR_TIME,
        title: ["Feira de Oportunidades", "Opportunities Fair"],
        place: PLENARY,
        description: [
          "Espaço de relacionamento comercial com estandes da Abravidro e das 15 empresas apoiadoras do evento.",
          "Business networking space with booths from Abravidro and the 15 companies supporting the event.",
        ],
      },
      {
        time: ["11h30 às 12h30", "11:30 AM – 12:30 PM"],
        tag: ["Palestra · Gestão", "Lecture · Management"],
        title: [
          "O paradoxo da Geração Z e a alta performance no trabalho",
          "The Gen Z paradox and high performance at work",
        ],
        place: PLENARY,
        highlight: true,
        speakers: ["Dado Schneider", "Dado Schneider"],
      },
      {
        time: ["12h às 15h", "12:00 – 3:00 PM"],
        title: ["Almoço", "Lunch"],
        place: RESTAURANTS,
        description: [
          "Mesas-redondas e mentoria: Clínica de gestão e mudança, além do vidro, e mesas-redondas temáticas reservadas com os painelistas dos talks do dia.",
          "Round tables and mentoring: Management and change clinic, beyond glass, and reserved themed round tables with the day's talk panelists.",
        ],
        link: BOOK_TABLE,
      },
      {
        time: ["Tarde", "Afternoon"],
        title: ["Tarde livre", "Free afternoon"],
        description: [
          "Aproveite a estrutura all inclusive e as 11 piscinas do resort.",
          "Enjoy the all-inclusive facilities and the resort's 11 pools.",
        ],
      },
      {
        time: ["15h às 16h", "3:00 – 4:00 PM"],
        title: ["Torneio de Futebol", "Football Tournament"],
        place: COURTS,
        link: SIGN_UP,
      },
      {
        time: ["16h às 17h", "4:00 – 5:00 PM"],
        title: ["Torneio de Vôlei", "Volleyball Tournament"],
        place: COURTS,
        link: SIGN_UP,
      },
      {
        time: ["17h às 20h", "5:00 – 8:00 PM"],
        title: ["Sunset Simpovidro", "Simpovidro Sunset"],
        place: [
          "Em frente à Ala Internacional",
          "In front of the International Wing",
        ],
        description: [
          "Momento especial de confraternização e descompressão à beira-mar ao pôr do sol.",
          "A special moment of fellowship and unwinding by the sea at sunset.",
        ],
      },
      {
        time: ["Noite", "Evening"],
        title: ["Jantar", "Dinner"],
        place: [
          "Restaurantes temáticos do resort",
          "Resort themed restaurants",
        ],
      },
    ],
  },
  {
    id: "sabado",
    number: "07",
    weekday: ["Sábado", "Saturday"],
    short: ["Sábado", "Sat"],
    color: "#0c84c7",
    items: [
      BREAKFAST,
      {
        time: ["8h45 às 9h45", "8:45 – 9:45 AM"],
        tag: [
          "Talk · Inteligência Artificial",
          "Talk · Artificial Intelligence",
        ],
        title: [
          "IA na indústria vidreira: menos promessa, mais resultado",
          "AI in the glass industry: less promise, more results",
        ],
        place: PLENARY,
        highlight: true,
        description: [
          "Casos reais de aplicação na cadeia do vidro",
          "Real application cases across the glass chain",
        ],
        speakers: [
          "Tiago Amor, Aristóteles Terceiro Neto e Líuam Cardoso",
          "Tiago Amor, Aristóteles Terceiro Neto and Líuam Cardoso",
        ],
      },
      {
        time: ["9h45 às 10h45", "9:45 – 10:45 AM"],
        tag: ["Talk · Reforma Tributária", "Talk · Tax Reform"],
        title: [
          "Reforma Tributária: não é só imposto",
          "Tax Reform: it's not just tax",
        ],
        place: PLENARY,
        highlight: true,
        description: [
          "Como a Reforma Tributária mexe com preços, créditos, contratos e negócios",
          "How the Tax Reform affects prices, credits, contracts and business",
        ],
        speakers: [
          "Lucilene Prado e Halim José Abud Neto",
          "Lucilene Prado and Halim José Abud Neto",
        ],
      },
      {
        time: FAIR_TIME,
        title: ["Feira de Oportunidades", "Opportunities Fair"],
        place: PLENARY,
        description: [
          "Conheça lançamentos e garanta sua presença nos estandes para concorrer ao sorteio exclusivo de um iPhone no jantar.",
          "Discover new launches and visit the booths to enter the exclusive iPhone draw at dinner.",
        ],
      },
      {
        time: ["11h30 às 12h30", "11:30 AM – 12:30 PM"],
        tag: ["Palestra de encerramento", "Closing lecture"],
        title: [
          "E agora, Brasil? O cenário econômico depois das eleições",
          "And now, Brazil? The economic outlook after the elections",
        ],
        place: PLENARY,
        highlight: true,
        speakers: ["Alexandre Schwartsman", "Alexandre Schwartsman"],
      },
      {
        time: ["12h às 15h", "12:00 – 3:00 PM"],
        title: ["Almoço", "Lunch"],
        place: RESTAURANTS,
        description: [
          "Mesas-redondas e mentoria reservada com os painelistas do dia.",
          "Reserved round tables and mentoring with the day's panelists.",
        ],
        link: BOOK_TABLE,
      },
      {
        time: ["15h às 17h", "3:00 – 5:00 PM"],
        title: ["Torneio de Tênis", "Tennis Tournament"],
        place: ["Quadras do resort", "Resort courts"],
        link: SIGN_UP,
      },
      {
        time: ["19h30", "7:30 PM"],
        title: [
          "Festa de encerramento com tema samba",
          "Closing Party: Samba at the Plenary",
        ],
        place: PLENARY,
        description: [
          "Jantar de gala, celebração, integração do setor e o sorteio do iPhone da Feira de Oportunidades.",
          "Gala dinner, celebration, industry networking and the iPhone draw from the Opportunities Fair.",
        ],
      },
    ],
  },
  {
    id: "domingo",
    number: "08",
    weekday: ["Domingo", "Sunday"],
    short: ["Domingo", "Sun"],
    color: "#e0393b",
    items: [
      BREAKFAST,
      {
        time: ["Até 11h", "Until 11:00 AM"],
        title: ["Check-out", "Check-out"],
        place: ["Recepção do hotel", "Hotel reception"],
      },
      {
        time: ["12h às 15h", "12:00 – 3:00 PM"],
        title: ["Almoço de domingo", "Sunday lunch"],
        place: RESTAURANTS,
        description: [
          "Incluso na inscrição: refeição garantida para participantes e famílias aproveitarem Florianópolis com tranquilidade antes do retorno.",
          "Included in the registration: a guaranteed meal so participants and families can enjoy Florianópolis before heading home.",
        ],
      },
      {
        time: ["Todo o dia", "All day"],
        title: ["Traslado hotel – aeroporto", "Hotel – airport transfer"],
        description: [
          "Cadastre os dados do seu voo para organizarmos o transporte.",
          "Register your flight details so we can organize your transport.",
        ],
        link: {
          href: "/transfer",
          label: ["Cadastrar voo", "Register flight"],
        },
      },
    ],
  },
]

const DRESS_CODE = [
  {
    color: "#91ad2c",
    when: ["Quinta-feira · 5/11 · 19h30", "Thursday · Nov 5 · 7:30 PM"],
    event: ["Cerimônia de Abertura", "Opening Ceremony"],
    style: ["Esporte fino", "Smart casual"],
    text: [
      "Para eles, blazer e calça social. Para elas, vestido ou look de alfaiataria.",
      "For men, blazer and dress pants. For women, a dress or tailored look.",
    ],
  },
  {
    color: "#ffffff",
    when: [
      "Sexta e sábado · 6 e 7/11 · manhãs",
      "Friday and Saturday · Nov 6 and 7 · mornings",
    ],
    event: ["Palestras e Talks", "Lectures and Talks"],
    style: ["Casual", "Casual"],
    text: [
      "Fique à vontade! Vale jeans, calça, bermuda, saia, camiseta ou camisa polo. Como a plenária tem ar-condicionado, leve um casaco ou suéter leve.",
      "Feel free to be comfortable! Jeans, pants, shorts, skirts, t-shirts or polo shirts are fine. The plenary is air-conditioned, so bring a light jacket or sweater.",
    ],
  },
  {
    color: "#f4960d",
    when: ["Sexta-feira · 6/11 · 17h", "Friday · Nov 6 · 5:00 PM"],
    event: ["Sunset Simpovidro", "Simpovidro Sunset"],
    style: ["Casual de verão", "Summer casual"],
    text: [
      "Roupas leves, tecidos naturais e tons claros. Como o espaço tem gramado e piso de concreto vazado, recomendamos às mulheres calçados de salto baixo, anabela ou bloco largo.",
      "Light clothes, natural fabrics and light tones. The space has grass and perforated concrete flooring, so women should prefer low heels, wedges or block heels.",
    ],
  },
  {
    color: "#0c84c7",
    when: ["Sábado · 7/11 · 19h30", "Saturday · Nov 7 · 7:30 PM"],
    event: ["Festa de Encerramento", "Closing Party"],
    style: ["Clima de samba", "Samba vibes"],
    text: [
      "Estampas, cores vibrantes ou o clássico branco. Chapéu panamá e flor no cabelo são bem-vindos, mas não é necessário usar fantasia. Escolha um calçado confortável e prepare-se para dançar!",
      "Prints, vibrant colors or classic white. Panama hats and flowers in the hair are welcome, but no costume is needed. Choose comfortable shoes and get ready to dance!",
    ],
  },
]

export default function Schedule() {
  const router = useRouter()
  const isEn = router?.locale === "en" || router?.query?.lang === "en"
  const t = (pair) => (isEn ? pair[1] : pair[0])
  const [activeId, setActiveId] = useState(DAYS[0].id)
  const day = DAYS.find((d) => d.id === activeId)

  return (
    <section
      id="programacao"
      className="py-24 bg-logo-navy relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="mb-12">
          <h2 className="text-logo-orange uppercase tracking-[0.2em] text-sm mb-4">
            {isEn ? "Schedule" : "Programação"}
          </h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            {isEn
              ? "Four days of content, business and fellowship."
              : "Quatro dias de conteúdo, negócios e integração."}
          </h3>
          <p className="text-lg text-white/80 max-w-2xl">
            {isEn
              ? "Talks and the business fair in the mornings, reserved round tables at lunch, and networking and leisure by the sea in the afternoons and evenings."
              : "Talks e feira de negócios pela manhã, mesas-redondas reservadas nos almoços e networking e lazer à beira-mar nas tardes e noites."}
          </p>
        </div>

        <div role="tablist" className="grid grid-cols-4 gap-2 md:gap-4 mb-10">
          {DAYS.map((d) => {
            const active = d.id === activeId
            return (
              <button
                key={d.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveId(d.id)}
                className={`rounded-2xl border px-2 py-3 md:py-4 text-center transition-all cursor-pointer ${
                  active
                    ? "bg-white border-white shadow-xl scale-[1.03]"
                    : "bg-white/5 border-white/20 hover:bg-white/10"
                }`}
              >
                <span
                  className="block font-title text-3xl md:text-5xl leading-none"
                  style={{ color: d.color }}
                >
                  {d.number}
                </span>
                <span
                  className={`block mt-1 text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                    active ? "text-logo-navy" : "text-white"
                  }`}
                >
                  {t(d.short)}
                </span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={day.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="flex items-end gap-4 pb-4 mb-2 border-b-4"
              style={{ borderColor: day.color }}
            >
              <span
                className="font-title text-6xl md:text-7xl leading-none"
                style={{ color: day.color }}
              >
                {day.number}
              </span>
              <div className="pb-1">
                <span className="block text-xs md:text-sm uppercase tracking-[0.25em] text-white/70 font-bold">
                  {isEn ? "November" : "Novembro"}
                </span>
                <span className="block font-title text-2xl md:text-4xl text-white uppercase">
                  {t(day.weekday)}
                </span>
              </div>
            </div>

            <ul>
              {day.items.map((item, i) => (
                <li
                  key={i}
                  className={
                    item.highlight
                      ? "my-3 rounded-2xl bg-white shadow-lg px-5 py-4"
                      : "border-b border-white/15 px-1 py-4"
                  }
                >
                  <div className="grid md:grid-cols-[11rem_1fr] gap-1 md:gap-6">
                    <span
                      className="font-bold text-base md:text-lg"
                      style={{ color: item.highlight ? "#014991" : day.color }}
                    >
                      {t(item.time)}
                    </span>
                    <div>
                      {item.tag && (
                        <span
                          className="inline-block mb-2 rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
                          style={{ backgroundColor: day.color }}
                        >
                          {t(item.tag)}
                        </span>
                      )}
                      <div
                        className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 ${
                          item.highlight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        <h4 className="font-bold text-lg md:text-xl">
                          {t(item.title)}
                        </h4>
                        {item.place && (
                          <span
                            className={`inline-flex items-center gap-1 text-sm ${
                              item.highlight
                                ? "text-slate-500"
                                : "text-white/70"
                            }`}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            {t(item.place)}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p
                          className={`mt-1 text-sm md:text-base ${
                            item.highlight ? "text-slate-600" : "text-white/80"
                          }`}
                        >
                          {t(item.description)}
                        </p>
                      )}
                      {item.speakers && (
                        <p className="mt-2 flex items-start gap-1.5 text-sm md:text-base font-semibold text-logo-navy">
                          <User className="h-4 w-4 mt-1 shrink-0" />
                          {t(item.speakers)}
                        </p>
                      )}
                      {item.link && (
                        <Link
                          href={item.link.href}
                          className={`mt-2 inline-flex items-center gap-1 text-sm font-bold underline-offset-4 hover:underline ${
                            item.highlight
                              ? "text-logo-navy"
                              : "text-logo-orange"
                          }`}
                        >
                          {t(item.link.label)}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

        <div id="trajes" className="mt-24">
          <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            {isEn ? (
              "Dress code"
            ) : (
              <>
                Trajes do{" "}
                <span className="text-logo-orange">
                  17<span className="font-sans">º</span> Simpovidro
                </span>
              </>
            )}
          </h3>
          <p className="text-white/80 text-lg mb-8 max-w-2xl">
            {isEn
              ? "The schedule brings together moments with different styles, and each one calls for its own outfit. Check the suggestions and pack your bag!"
              : "A programação reúne momentos com estilos diferentes, e cada um pede um traje. Confira as sugestões e prepare sua mala!"}
          </p>

          <div className="space-y-4">
            {DRESS_CODE.map((d, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/20 bg-white/5 overflow-hidden grid md:grid-cols-[14rem_1fr]"
                style={{ borderLeft: `6px solid ${d.color}` }}
              >
                <div className="p-5 md:border-r md:border-white/10">
                  <span className="block text-xs font-bold uppercase tracking-widest text-white/70">
                    {t(d.when)}
                  </span>
                </div>
                <div className="p-5">
                  <span className="block text-xs font-bold uppercase tracking-widest text-white/70">
                    {t(d.event)}
                  </span>
                  <span
                    className="block font-title text-2xl md:text-3xl uppercase my-1"
                    style={{ color: d.color }}
                  >
                    {t(d.style)}
                  </span>
                  <p className="text-white/90">{t(d.text)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-4 rounded-2xl bg-logo-orange p-5 text-logo-navy">
            <Luggage className="h-6 w-6 shrink-0 mt-0.5" />
            <p>
              {isEn ? (
                <>
                  <strong>Packing tip:</strong> in November, Florianópolis
                  usually has pleasant days and breezy nights. Since indoor
                  areas are air-conditioned, a light jacket will come in handy
                  at several moments of the program.
                </>
              ) : (
                <>
                  <strong>Dica para a mala:</strong> em novembro, Florianópolis
                  costuma ter dias agradáveis e noites com brisa. Como os
                  ambientes internos são climatizados, um casaco leve será útil
                  em diversos momentos da programação.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
