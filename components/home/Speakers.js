import { useState, useEffect } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { X, Users } from "lucide-react"

export default function Speakers() {
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
      title:
        "Talk | IA na indústria vidreira – Menos promessa, mais resultado – Casos reais de aplicação na cadeia do vidro",
      speakers: [
        {
          id: "tiago-amor",
          name: "Tiago Amor",
          role: "CEO da Lecom",
          image: "/images/palestrantes/tiago-amor.jpg",
          bio: "Tiago Amor é CEO da Lecom – plataforma pioneira em hiperautomação – e graduado em sistemas da informação pela Universidade Estadual Paulista (Unesp), onde também se especializou em Gestão Empresarial. Além disso, é especialista em gestão de projetos pela Fundação Getulio Vargas (FGV).",
          linkedin: "https://www.linkedin.com/in/tiagoamor/?locale=pt",
        },
        {
          id: "aristoteles-neto",
          name: "Aristóteles Terceiro Neto",
          role: "Gerente de Transformação Industrial na Vivix",
          image: "/images/palestrantes/aristoteles-neto.jpg",
          bio: "Aristóteles Terceiro Neto é gerente de Transformação Industrial na Vivix. Engenheiro eletricista, especialista em Indústria 4.0 e possui formação executiva em Transformação Digital pelo Massachusetts Institute of Technology (MIT). Além de professor e mentor em transformação digital e IA.",
          linkedin: "https://www.linkedin.com/in/aristotelestn/",
        },
        {
          id: "liuam-cardoso",
          name: "Líuam Cardoso",
          role: "Especialista em Estratégia Comercial e Inteligência de Mercado",
          image: "/images/palestrantes/liuam-cardoso.jpg",
          bio: "Líuam Cardoso é graduado em Sistemas de Informação e pós-graduado em Marketing pela Universidade Federal Fluminense (UFF). Com 18 anos de experiência no setor vidreiro, atuou nas áreas de Vendas e Marketing em diversos países da América do Sul. É também especialista em estratégia comercial, inteligência de mercado e desenvolvimento de negócios.",
          linkedin: null,
        },
      ],
    },
    {
      id: "mercado",
      title:
        "Talk | Para onde vai o mercado do vidro? Uma visão global sobre os movimentos que podem redefinir o setor",
      speakers: [
        {
          id: "davide-cappellino",
          name: "Davide Cappellino",
          role: "Presidente da Divisão de Arquitetura da AGC Europa e Américas",
          image: "/images/palestrantes/davide-cappellino.jpg",
          bio: "Italiano, Cappellino é presidente da Divisão de Arquitetura da AGC Europa e Américas. Passou pelo Brasil de 2011 a 2016, quando permaneceu à frente da operação da AGC em nosso país. Atualmente, também é chairman do conselho da entidade Glass For Europe.",
          linkedin: "https://www.linkedin.com/in/davide-cappellino-0231b22/",
        },
        {
          id: "leopoldo-castiella",
          name: "Leopoldo Castiella",
          role: "Chefe de Vidro Arquitetônico SBU Global e Diretor-Executivo-Sênior do Grupo NSG",
          image: "/images/palestrantes/leopoldo-castiella.jpg",
          bio: "Argentino, Castiella é chefe de Vidro Arquitetônico SBU Global e diretor-executivo- sênior do Grupo NSG. Foi, por treze anos, diretor-executivo da Cebrace. Também atuou como presidente da Vasa Vidriería Argentina e da Associação Brasileira das Indústrias de Vidro (Abividro).",
          linkedin:
            "https://www.linkedin.com/in/leopoldo-cm-garc%C3%A9s-castiella-19a948123/",
        },
      ],
    },
    {
      id: "gestao",
      title:
        "Palestra | Gestão – O paradoxo da geração Z e a alta performance no trabalho",
      speakers: [
        {
          id: "dado-schneider",
          name: "Dado Schneider",
          role: "Doutor em comunicação, escritor e criador da marca Claro",
          image: "/images/palestrantes/dado-schneider.jpg",
          bio: "Dado Schneider é Doutor em Comunicação pela Pontifícia Universidade Católica do Rio Grande do Sul (PUC-RS), especialista em mudança e cooperação entre as gerações e nos impactos da Geração Z no mercado de trabalho, criador da marca Claro e autor dos livros “O mundo mudou… Bem na minha vez!” e “Desacomodado”.",
          linkedin: "https://www.linkedin.com/in/dado-schneider/",
        },
      ],
    },
    {
      id: "tributario",
      title:
        "Palestra | Reforma tributária – Não é só imposto: Como a Reforma Tributária mexe com preços, créditos, contratos e negócios",
      speakers: [
        {
          id: "lucilene-prado",
          name: "Lucilene Prado",
          role: "Sócia-Fundadora e Líder da Prática Tributária da Prado Santarossa",
          image: "/images/palestrantes/lucilene-prado.png",
          bio: "Lucilene Prado é sócia fundadora e Líder da Prática Tributária da Prado Santarossa. Possui mais de 33 anos de experiência em Direito Tributário e Empresarial. Trabalhou nos departamentos jurídico e tributário de empresas como Natura Cosméticos e foi sócia do FM/Derraik Advogados. Graduada em Direito pela Universidade de Ribeirão Preto, possui pós-graduação em Direito Tributário pelo Instituto Brasileiro de Estudos Tributários (Ibet) e certificação como Conselheira de Administração e Governança Corporativa pelo Instituto Brasileiro de Governança Corporativa (IBGC).",
          linkedin: "https://www.linkedin.com/in/lucilene-prado-b3aa083/",
        },
        {
          id: "halim-abud-neto",
          name: "Halim José Abud Neto",
          role: "Sócio do DNA LAW e Consultor Jurídico da Abravidro",
          image: "/images/palestrantes/halim-abud-neto.jpeg",
          bio: "Halim José Abud Neto é sócio do DNA LAW, Advogado, especialista em Direito Tributário pelo Instituto Brasileiro de Estudos Tributários (IBET), Consultor Jurídico da Abravidro, Conselheiro do Conselho Superior de Direito (CSD) e do Conselho de Assuntos Tributários (CAT) da Federação do Comércio de Bens, Serviços e Turismo (Fecomercio-SP), Diretor do Centro do Comércio do Estado de São Paulo (Cecomercio), Assessor Jurídico na Agenda Legislativa da Indústria da Confederação Nacional da Indústria (CNI).",
          linkedin: null,
        },
      ],
    },
    {
      id: "energia",
      title:
        "Talk | Energia – Energia: muito além do preço – Riscos, oportunidades e decisões estratégicas para as empresas",
      speakers: [
        {
          id: "jean-tremura",
          name: "Jean Vinicius Tremura",
          role: "Diretor de Projetos na Involt",
          image: "/images/palestrantes/jean-tremura.jpg",
          bio: "Jean Tremura é executivo no setor de energias renováveis há mais de 25 anos, com experiência em eficiência energética, geração distribuída e soluções sustentáveis. É diretor de Projetos na Involt. Formado em Ciências Econômicas pela Universidade Presbiteriana Mackenzie, possui MBA em Gestão Estratégica e Econômica pela Fundação Getulio Vargas (FGV) e pós-graduação em Eficiência Energética, Cogeração e Energias Renováveis pelo Programa de Educação Continuada da Universidade de São Paulo (USP–PECE).",
          linkedin:
            "https://www.linkedin.com/in/jean-vinicius-tremura-009426186/",
        },
        {
          id: "carlos-schoeps",
          name: "Carlos Schoeps",
          role: "Sócio-Diretor da Replace Consultoria",
          image: "/images/palestrantes/carlos-schoeps.jpg",
          bio: "Carlos Alberto Schoeps é Engenheiro Eletricista formado pela Escola de Engenharia Mauá e Sócio-Diretor da Replace Consultoria. Possui ampla experiência no setor elétrico, com atuação em planejamento do suprimento de energia, regulação, mercado livre, mercado regulado, geração distribuída, entre outros.",
          linkedin: "https://www.linkedin.com/in/carlos-schoeps-0673b42/",
        },
      ],
    },
    {
      id: "economia",
      title:
        "Palestra | E agora, Brasil? O cenário econômico depois das eleições",
      speakers: [
        {
          id: "alexandre-schwartsman",
          name: "Alexandre Schwartsman",
          role: "Consultor na Pinotti & Schwartsman Associados",
          image: "/images/palestrantes/alexandre-schwartsman.jpg",
          bio: "Alexandre Schwartsman é consultor da Pinotti & Schwartsman Associados. Foi também Diretor para Assuntos Internacionais do Banco Central do Brasil e membro votante do Comitê de Política Monetária (Copom). É Doutor em Economia pela Universidade da Califórnia (Berkeley). Colunista da Revista Veja e do jornal O Estado de São Paulo, além de comentarista semanal para a Rádio CBN.",
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
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            Palestrantes
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
                <h3 className="text-sm md:text-base font-bold text-white leading-snug mb-5">
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

                    <h4 className="text-xs md:text-sm font-semibold text-white group-hover:text-amber-300 transition-colors leading-tight line-clamp-2">
                      {speaker.name}
                    </h4>
                    <span className="text-[11px] text-blue-200 mt-1 group-hover:text-white">
                      Ver bio
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
                        title={`LinkedIn de ${selectedSpeaker.name}`}
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
