import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/router"
import { AnimatePresence, motion } from "framer-motion"
import { X, Users } from "lucide-react"

export default function Speakers({ router: propRouter }) {
  const localRouter = useRouter()
  const router = propRouter || localRouter
  const isEn = router?.locale === "en" || router?.query?.lang === "en"
  const t = (pt, en) => (isEn ? en : pt)

  const [selectedSpeaker, setSelectedSpeaker] = useState(null)

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedSpeaker(null)
    }
    if (selectedSpeaker) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedSpeaker])

  const sessions = [
    {
      id: "ia",
      title: t(
        "Talk | IA na indústria vidreira – Menos promessa, mais resultado – Casos reais de aplicação na cadeia do vidro",
        "Talk | AI in the glass industry – Less promise, more results – Real-world applications across the glass chain",
      ),
      speakers: [
        {
          id: "tiago-amor",
          name: "Tiago Amor",
          role: t("CEO da Lecom", "CEO at Lecom"),
          image: "/images/palestrantes/tiago-amor.jpg",
          bio: t(
            "Tiago Amor é CEO da Lecom – plataforma pioneira em hiperautomação – e graduado em sistemas da informação pela Universidade Estadual Paulista (Unesp), onde também se especializou em Gestão Empresarial. Além disso, é especialista em gestão de projetos pela Fundação Getulio Vargas (FGV).",
            "Tiago Amor is CEO of Lecom – a pioneering platform in hyperautomation – and holds a degree in Information Systems from Universidade Estadual Paulista (Unesp), where he also specialized in Business Management. Additionally, he is a project management specialist from Fundação Getulio Vargas (FGV).",
          ),
          linkedin: "https://www.linkedin.com/in/tiagoamor/?locale=pt",
        },
        {
          id: "aristoteles-neto",
          name: "Aristóteles Terceiro Neto",
          role: t(
            "Gerente de Transformação Industrial na Vivix",
            "Industrial Transformation Manager at Vivix",
          ),
          image: "/images/palestrantes/aristoteles-neto.jpg",
          bio: t(
            "Aristóteles Terceiro Neto é gerente de Transformação Industrial na Vivix. Engenheiro eletricista, especialista em Indústria 4.0 e possui formação executiva em Transformação Digital pelo Massachusetts Institute of Technology (MIT). Além de professor e mentor em transformação digital e IA.",
            "Aristóteles Terceiro Neto is the Industrial Transformation Manager at Vivix. An electrical engineer and Industry 4.0 specialist, he holds an executive certificate in Digital Transformation from the Massachusetts Institute of Technology (MIT). He is also a professor and mentor in digital transformation and AI.",
          ),
          linkedin: "https://www.linkedin.com/in/aristotelestn/",
        },
        {
          id: "liuam-cardoso",
          name: "Líuam Cardoso",
          role: t(
            "Especialista em Estratégia Comercial e Inteligência de Mercado",
            "Commercial Strategy and Market Intelligence Specialist",
          ),
          image: "/images/palestrantes/liuam-cardoso.jpg",
          bio: t(
            "Líuam Cardoso é graduado em Sistemas de Informação e pós-graduado em Marketing pela Universidade Federal Fluminense (UFF). Com 18 anos de experiência no setor vidreiro, atuou nas áreas de Vendas e Marketing em diversos países da América do Sul. É também especialista em estratégia comercial, inteligência de mercado e desenvolvimento de negócios.",
            "Líuam Cardoso holds a degree in Information Systems and a postgraduate degree in Marketing from Universidade Federal Fluminense (UFF). With 18 years of experience in the glass sector, he has led Sales and Marketing operations across several South American countries. He specializes in commercial strategy, market intelligence, and business development.",
          ),
          linkedin: null,
        },
      ],
    },
    {
      id: "mercado",
      title: t(
        "Talk | Para onde vai o mercado do vidro? Uma visão global sobre os movimentos que podem redefinir o setor",
        "Talk | Where is the glass market heading? A global perspective on movements reshaping the industry",
      ),
      speakers: [
        {
          id: "davide-cappellino",
          name: "Davide Cappellino",
          role: t(
            "Presidente da Divisão de Arquitetura da AGC Europa e Américas",
            "President of the Architectural Glass Division at AGC Europe and Americas",
          ),
          image: "/images/palestrantes/davide-cappellino.jpg",
          bio: t(
            "Italiano, Cappellino é presidente da Divisão de Arquitetura da AGC Europa e Américas. Passou pelo Brasil de 2011 a 2016, quando permaneceu à frente da operação da AGC em nosso país. Atualmente, também é chairman do conselho da entidade Glass For Europe.",
            "Italian, Cappellino is President of the Architectural Glass Division at AGC Europe and Americas. He served in Brazil from 2011 to 2016 at the helm of AGC's operations in the country. Currently, he is also Chairman of the Board of Glass For Europe.",
          ),
          linkedin: "https://www.linkedin.com/in/davide-cappellino-0231b22/",
        },
        {
          id: "leopoldo-castiella",
          name: "Leopoldo Castiella",
          role: t(
            "Chefe de Vidro Arquitetônico SBU Global e Diretor-Executivo-Sênior do Grupo NSG",
            "Head of Architectural Glass Global SBU and Senior Executive Director at NSG Group",
          ),
          image: "/images/palestrantes/leopoldo-castiella.jpg",
          bio: t(
            "Argentino, Castiella é chefe de Vidro Arquitetônico SBU Global e diretor-executivo- sênior do Grupo NSG. Foi, por treze anos, diretor-executivo da Cebrace. Também atuou como presidente da Vasa Vidriería Argentina e da Associação Brasileira das Indústrias de Vidro (Abividro).",
            "Argentine, Castiella is Head of Architectural Glass Global SBU and Senior Executive Director at NSG Group. For thirteen years, he served as CEO of Cebrace. He also served as President of Vasa Vidriería Argentina and the Brazilian Association of Glass Industries (Abividro).",
          ),
          linkedin:
            "https://www.linkedin.com/in/leopoldo-cm-garc%C3%A9s-castiella-19a948123/",
        },
      ],
    },
    {
      id: "gestao",
      title: t(
        "Palestra | Gestão – O paradoxo da geração Z e a alta performance no trabalho",
        "Keynote | Management – The Gen Z paradox and high performance in the workplace",
      ),
      speakers: [
        {
          id: "dado-schneider",
          name: "Dado Schneider",
          role: t(
            "Doutor em comunicação, escritor e criador da marca Claro",
            "Ph.D. in Communications, Author and Creator of the Claro brand",
          ),
          image: "/images/palestrantes/dado-schneider.jpg",
          bio: t(
            "Dado Schneider é Doutor em Comunicação pela Pontifícia Universidade Católica do Rio Grande do Sul (PUC-RS), especialista em mudança e cooperação entre as gerações e nos impactos da Geração Z no mercado de trabalho, criador da marca Claro e autor dos livros “O mundo mudou… Bem na minha vez!” e “Desacomodado”.",
            "Dado Schneider holds a Ph.D. in Communications from Pontifícia Universidade Católica do Rio Grande do Sul (PUC-RS). He is an expert in change management, intergenerational collaboration, and the impact of Gen Z in the workplace, creator of the Claro brand, and author of bestselling books.",
          ),
          linkedin: "https://www.linkedin.com/in/dado-schneider/",
        },
      ],
    },
    {
      id: "tributario",
      title: t(
        "Palestra | Reforma tributária – Não é só imposto: Como a Reforma Tributária mexe com preços, créditos, contratos e negócios",
        "Keynote | Tax Reform – Beyond taxes: How the Tax Reform impacts pricing, credits, contracts, and business",
      ),
      speakers: [
        {
          id: "lucilene-prado",
          name: "Lucilene Prado",
          role: t(
            "Sócia-Fundadora e Líder da Prática Tributária da Prado Santarossa",
            "Founding Partner and Tax Practice Leader at Prado Santarossa",
          ),
          image: "/images/palestrantes/lucilene-prado.png",
          bio: t(
            "Lucilene Prado é sócia fundadora e Líder da Prática Tributária da Prado Santarossa. Possui mais de 33 anos de experiência em Direito Tributário e Empresarial. Trabalhou nos departamentos jurídico e tributário de empresas como Natura Cosméticos e foi sócia do FM/Derraik Advogados. Graduada em Direito pela Universidade de Ribeirão Preto, possui pós-graduação em Direito Tributário pelo Instituto Brasileiro de Estudos Tributários (Ibet) e certificação como Conselheira de Administração e Governança Corporativa pelo Instituto Brasileiro de Governança Corporativa (IBGC).",
            "Lucilene Prado is the founding partner and Tax Practice Leader at Prado Santarossa. She has over 33 years of experience in Tax and Corporate Law. She worked in the legal and tax departments of companies such as Natura Cosméticos and was a partner at FM/Derraik Advogados. She holds a Law degree from Universidade de Ribeirão Preto, a postgraduate degree in Tax Law from IBET, and is a certified Board Member by IBGC.",
          ),
          linkedin: "https://www.linkedin.com/in/lucilene-prado-b3aa083/",
        },
        {
          id: "halim-abud-neto",
          name: "Halim José Abud Neto",
          role: t(
            "Sócio do DNA LAW e Consultor Jurídico da Abravidro",
            "Partner at DNA LAW and Legal Consultant for Abravidro",
          ),
          image: "/images/palestrantes/halim-abud-neto.jpeg",
          bio: t(
            "Halim José Abud Neto é sócio do DNA LAW, Advogado, especialista em Direito Tributário pelo Instituto Brasileiro de Estudos Tributários (IBET), Consultor Jurídico da Abravidro, Conselheiro do Conselho Superior de Direito (CSD) e do Conselho de Assuntos Tributários (CAT) da Federação do Comércio de Bens, Serviços e Turismo (Fecomercio-SP), Diretor do Centro do Comércio do Estado de São Paulo (Cecomercio), Assessor Jurídico na Agenda Legislativa da Indústria da Confederação Nacional da Indústria (CNI).",
            "Halim José Abud Neto is a partner at DNA LAW, attorney, Tax Law specialist by IBET, Legal Consultant for Abravidro, Counselor at Fecomercio-SP, Director at Cecomercio, and Legal Advisor for the National Confederation of Industry (CNI).",
          ),
          linkedin: null,
        },
      ],
    },
    {
      id: "energia",
      title: t(
        "Talk | Energia – Energia: muito além do preço – Riscos, oportunidades e decisões estratégicas para as empresas",
        "Talk | Energy – Beyond price: Risks, opportunities, and strategic decisions for businesses",
      ),
      speakers: [
        {
          id: "jean-tremura",
          name: "Jean Vinicius Tremura",
          role: t(
            "Diretor de Projetos na Involt",
            "Project Director at Involt",
          ),
          image: "/images/palestrantes/jean-tremura.jpg",
          bio: t(
            "Jean Tremura é executivo no setor de energias renováveis há mais de 25 anos, com experiência em eficiência energética, geração distribuída e soluções sustentáveis. É diretor de Projetos na Involt. Formado em Ciências Econômicas pela Universidade Presbiteriana Mackenzie, possui MBA em Gestão Estratégica e Econômica pela Fundação Getulio Vargas (FGV) e pós-graduação em Eficiência Energética, Cogeração e Energias Renováveis pelo Programa de Educação Continuada da Universidade de São Paulo (USP–PECE).",
            "Jean Tremura is an executive in the renewable energy sector with over 25 years of experience in energy efficiency, distributed generation, and sustainable solutions. He is Project Director at Involt. He holds a degree in Economics from Universidade Presbiteriana Mackenzie, an MBA from FGV, and a postgraduate degree in Energy Efficiency from USP-PECE.",
          ),
          linkedin:
            "https://www.linkedin.com/in/jean-vinicius-tremura-009426186/",
        },
        {
          id: "carlos-schoeps",
          name: "Carlos Schoeps",
          role: t(
            "Sócio-Diretor da Replace Consultoria",
            "Managing Partner at Replace Consultoria",
          ),
          image: "/images/palestrantes/carlos-schoeps.jpg",
          bio: t(
            "Carlos Alberto Schoeps é Engenheiro Eletricista formado pela Escola de Engenharia Mauá e Sócio-Diretor da Replace Consultoria. Possui ampla experiência no setor elétrico, com atuação em planejamento do suprimento de energia, regulação, mercado livre, mercado regulado, geração distribuída, entre outros.",
            "Carlos Alberto Schoeps is an electrical engineer graduated from Escola de Engenharia Mauá and Managing Partner at Replace Consultoria. He has extensive experience in the power sector, focusing on energy supply planning, regulation, free market, regulated market, and distributed generation.",
          ),
          linkedin: "https://www.linkedin.com/in/carlos-schoeps-0673b42/",
        },
      ],
    },
    {
      id: "economia",
      title: t(
        "Palestra | E agora, Brasil? O cenário econômico depois das eleições",
        "Keynote | What's next, Brazil? The economic landscape after elections",
      ),
      speakers: [
        {
          id: "alexandre-schwartsman",
          name: "Alexandre Schwartsman",
          role: t(
            "Consultor na Pinotti & Schwartsman Associados",
            "Consultant at Pinotti & Schwartsman Associados",
          ),
          image: "/images/palestrantes/alexandre-schwartsman.jpg",
          bio: t(
            "Alexandre Schwartsman é consultor da Pinotti & Schwartsman Associados. Foi também Diretor para Assuntos Internacionais do Banco Central do Brasil e membro votante do Comitê de Política Monetária (Copom). É Doutor em Economia pela Universidade da Califórnia (Berkeley). Colunista da Revista Veja e do jornal O Estado de São Paulo, além de comentarista semanal para a Rádio CBN.",
            "Alexandre Schwartsman is a consultant at Pinotti & Schwartsman Associados. He previously served as Director of International Affairs at the Central Bank of Brazil and a voting member of the Monetary Policy Committee (Copom). He holds a Ph.D. in Economics from the University of California (Berkeley). Columnist for Veja and O Estado de S. Paulo, and weekly commentator on CBN Radio.",
          ),
          linkedin: "https://www.linkedin.com/in/alex-schwartsman-328a5913/",
        },
      ],
    },
  ]

  return (
    <section
      id="palestrantes"
      className="py-16 bg-gradient-to-b from-[#01356b] via-[#014991] to-[#012d59] text-white overflow-hidden relative"
    >
      {/* Ícone branco de fundo (Marca d'água à esquerda) */}
      <div className="absolute -left-42 bottom-10 w-200 opacity-20 hidden lg:block pointer-events-none">
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
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            {t("Palestrantes", "Speakers")}
          </h2>
        </div>

        {/* Grid de sessões organizadas por tema */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-[#003873]/80 rounded-2xl border border-white/15 p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm"
            >
              <div>
                <h3 className="text-sm md:text-base font-sans font-bold text-white leading-snug mb-5">
                  {session.title}
                </h3>
              </div>

              {/* Fotos lado a lado em tamanho maior */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-white/10">
                {session.speakers.map((speaker) => (
                  <button
                    key={speaker.id}
                    onClick={() => setSelectedSpeaker(speaker)}
                    className="flex-1 min-w-[100px] max-w-[160px] flex flex-col items-center text-center group cursor-pointer"
                  >
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#002a54] border-2 border-white/20 shadow-lg group-hover:border-amber-400 group-hover:scale-105 transition-all duration-300 mb-2.5">
                      {speaker.image ? (
                        <Image
                          src={speaker.image}
                          alt={speaker.name}
                          fill
                          sizes="(max-width: 640px) 96px, 112px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          <Users className="w-10 h-10" />
                        </div>
                      )}
                    </div>

                    <h4 className="text-xs md:text-sm font-semibold font-sans text-white group-hover:text-amber-300 transition-colors leading-tight line-clamp-2">
                      {speaker.name}
                    </h4>
                    <span className="text-[11px] text-blue-200 mt-1 group-hover:text-white">
                      {t("Ver bio", "View bio")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal com animação para biografia */}
      <AnimatePresence>
        {selectedSpeaker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedSpeaker(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-[#01356b] border border-white/20 rounded-2xl shadow-2xl p-6 z-10 max-h-[85vh] overflow-y-auto text-white"
            >
              <button
                onClick={() => setSelectedSpeaker(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                title={t("Fechar", "Close")}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-4 pr-6">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#002a54] shrink-0 border border-white/20 shadow-md">
                  {selectedSpeaker.image ? (
                    <Image
                      src={selectedSpeaker.image}
                      alt={selectedSpeaker.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <Users className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {selectedSpeaker.name}
                    </h3>
                    {selectedSpeaker.linkedin && (
                      <a
                        href={selectedSpeaker.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-80 hover:scale-110 transition-all inline-flex items-center"
                        title={`LinkedIn: ${selectedSpeaker.name}`}
                      >
                        <Image
                          src="/images/linkedin-svgrepo-com.svg"
                          alt="LinkedIn"
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-sm"
                        />
                      </a>
                    )}
                  </div>

                  {selectedSpeaker.role && (
                    <p className="text-xs font-medium text-amber-300 mt-1 leading-snug">
                      {selectedSpeaker.role}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-line">
                  {selectedSpeaker.bio}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
