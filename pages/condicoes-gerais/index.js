import Head from "next/head"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  Info,
  AlertTriangle,
  Clock,
  Wifi,
  MapPin,
  Compass,
  CheckCircle,
  BookOpen,
} from "lucide-react"

import Navbar from "@/components/home/Navbar"
import Footer from "@/components/home/Footer"

// Dynamic icon mapping based on section index
const getSectionIcon = (idNum) => {
  switch (idNum) {
    case 1:
    case 6:
    case 9:
    case 10:
    case 16:
    case 18:
    case 19:
    case 20:
    case 21:
    case 22:
      return Info
    case 2:
    case 23:
      return FileText
    case 3:
    case 25:
      return CheckCircle
    case 4:
    case 7:
      return AlertTriangle
    case 5:
    case 11:
    case 17:
      return Clock
    case 8:
    case 15:
      return Compass
    case 12:
      return MapPin
    case 13:
    case 24:
      return Info
    case 14:
      return Wifi
    default:
      return Info
  }
}

// Automatically formats email and phone tokens inside text strings as clickable links
const formatContactsAndUrls = (text) => {
  if (!text) return ""

  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g
  const phoneRegex = /(\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4})/g
  const tokenRegex =
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)|(\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4})/g

  const tokens = text.split(tokenRegex)
  if (tokens.length === 1) return text

  return tokens.map((token, i) => {
    if (!token) return null

    // Check if token is an email
    if (
      emailRegex.test(token) ||
      (token.includes("@") && token.includes("."))
    ) {
      return (
        <a
          key={i}
          href={`mailto:${token}`}
          className="text-logo-blue hover:underline font-semibold inline-flex items-center gap-1"
        >
          {token}
        </a>
      )
    }

    // Check if token is a phone
    if (phoneRegex.test(token)) {
      const cleanPhone = token.replace(/[^\d+]/g, "")
      return (
        <a
          key={i}
          href={`tel:${cleanPhone}`}
          className="text-logo-blue hover:underline font-semibold inline-flex items-center gap-1"
        >
          {token}
        </a>
      )
    }

    return token
  })
}

// Text phrases that should be highlighted in red (fidedigno verbatim)
const RED_PHRASES = [
  "até a data da última parcela de pagamento no dia limitada a 30/10/2026.",
  "Atenção: não está incluso o almoço no dia do check-in, 05 de novembro de 2026, quinta-feira.",
  "Não faz parte do pacote do all inclusive. Cobrado na conta do hóspede.",
  "A não devolução da toalha acarreta a cobrança de R$ 52,00 por unidade no check-out.",
  "(48) 3261-1772.",
  "Esse valor não é reembolsável.",
]

const applyRedHighlights = (text) => {
  if (!text) return ""

  // Escape special characters for regex
  const escaped = RED_PHRASES.map((phrase) =>
    phrase.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
  )
  const regex = new RegExp(`(${escaped.join("|")})`, "g")

  const parts = text.split(regex)
  if (parts.length === 1) {
    return formatContactsAndUrls(text)
  }

  return parts.map((part, i) => {
    if (!part) return null

    const isRed = RED_PHRASES.some(
      (phrase) => phrase.toLowerCase() === part.toLowerCase(),
    )
    if (isRed) {
      if (part.includes("3261-1772")) {
        return (
          <a
            key={i}
            href="tel:4832611772"
            className="text-logo-red hover:underline font-bold bg-red-50/50 px-1.5 py-0.5 rounded border border-red-100/50 inline-block md:inline"
          >
            {part}
          </a>
        )
      }
      return (
        <span
          key={i}
          className="text-logo-red font-bold bg-red-50/50 px-1.5 py-0.5 rounded border border-red-100/50 inline-block md:inline animate-pulse-subtle"
        >
          {part}
        </span>
      )
    }

    return formatContactsAndUrls(part)
  })
}

// Bold labels preceding a colon (e.g. "Individual: 1 adulto" -> "Individual: 1 adulto")
const formatInLineBold = (text) => {
  if (!text) return ""

  const colonIndex = text.indexOf(":")
  if (colonIndex > 0 && colonIndex < 40) {
    const prefix = text.substring(0, colonIndex)
    const suffix = text.substring(colonIndex + 1)

    return (
      <>
        <strong className="font-semibold text-slate-950">{prefix}:</strong>
        {applyRedHighlights(suffix)}
      </>
    )
  }

  return applyRedHighlights(text)
}

// Preprocess verbatim content to introduce splits at squished subheaders/lists
const preprocessContent = (text, sectionId) => {
  if (!text) return ""

  let processed = text

  // 1. If Section 2 (Data da inscrição), split sub-sections (2.1., 2.2., etc.) and category compositions
  if (sectionId === "data-inscricao") {
    processed = processed.split(/(?=2\.\d+\.)/g).join("\n")
    processed = processed
      .split(
        /(?=Individual:|Dupla Casal:|Dupla Solteiro:|Dupla \+ \d+ crian[çc]as?:|3 a 4 adultos(?:\s*\+\s*crian[çc]as?)?:|5 a 6 adultos(?:\s*\+\s*crian[çc]as?)?:|Dupla a compartir:)/g,
      )
      .join("\n")
  }

  // 2. If Section 14 (Internet), split steps (1., 2., 3., 4., Caso tenha)
  if (sectionId === "internet") {
    processed = processed
      .split(
        /(?=1\.\s+Conecte-se|2\.\s+Acesse|3\.\s+Marque|4\.\s+Preencha|Caso tenha)/g,
      )
      .join("\n")
  }

  // 3. If Section 23 (Extras), split 23.1.
  if (sectionId === "extras") {
    processed = processed.split(/(?=23\.1\.)/g).join("\n")
  }

  return processed
}

// Custom parser component that transforms raw lines into styled components without altering text characters
const VerbatimFormatter = ({ text, sectionId }) => {
  if (!text) return null

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const isCancelamento = sectionId === "cancelamento"

  return (
    <div className="space-y-4">
      {lines.map((line, idx) => {
        // A. Custom sub-headers formatting (keeps original casing & text)
        if (line === "Hotel Internacional" || line === "Vilas portuguesas") {
          return (
            <h3
              key={idx}
              className="text-base md:text-lg font-bold font-title text-logo-navy border-b border-slate-100 pb-2 mt-6 mb-3"
            >
              {line}
            </h3>
          )
        }

        if (
          line === "TABELA DE PREÇOS, COM DATAS E VALORES" ||
          line === "Portifólio de cervejas:"
        ) {
          return (
            <h4
              key={idx}
              className="text-sm font-bold tracking-wider text-slate-800 uppercase mt-6 mb-2"
            >
              {line}
            </h4>
          )
        }

        if (line === "Costão do Santinho Resort") {
          return (
            <h3
              key={idx}
              className="text-lg font-bold font-title text-logo-navy mt-4 mb-1"
            >
              {line}
            </h3>
          )
        }

        // B. Detect numbered items like 2.1, 3.6.1, 13.10 etc.
        const subNumMatch = line.match(
          /^(\d+(?:\.\d+)+)(?:\.|\s*-\s*|\s*–\s*|\s+)\s*(.*)/,
        )
        if (subNumMatch) {
          const [_, num, rest] = subNumMatch
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 border p-4 rounded-2xl transition-all duration-200 ${
                isCancelamento
                  ? "bg-amber-50/40 border-amber-200/80 hover:border-amber-300 shadow-sm"
                  : "bg-slate-50/50 border-slate-100 hover:border-slate-200/80"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center font-bold text-xs px-2.5 py-1 rounded-full h-fit flex-shrink-0 ${
                  isCancelamento
                    ? "bg-amber-100 text-amber-700"
                    : "bg-logo-navy/10 text-logo-navy"
                }`}
              >
                {num}
              </span>
              <p
                className={`font-light text-sm md:text-base leading-relaxed ${
                  isCancelamento ? "text-amber-900" : "text-slate-700"
                }`}
              >
                {formatInLineBold(rest)}
              </p>
            </div>
          )
        }

        // C. Detect ordered steps like 1., 2., 3., 4.
        const orderedListMatch = line.match(/^([1-9]\.)\s*(.*)/)
        if (orderedListMatch) {
          const [_, num, rest] = orderedListMatch
          return (
            <div key={idx} className="flex items-start gap-3 pl-4 my-2">
              <span className="inline-flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-700 w-5 h-5 rounded-full flex-shrink-0">
                {num.replace(".", "")}
              </span>
              <p className="font-light text-slate-700 text-sm md:text-base leading-relaxed">
                {formatInLineBold(rest)}
              </p>
            </div>
          )
        }

        // D. Detect sub-lists like (a), (b), (c)
        const letterListMatch = line.match(/^\(([a-d])\)\s*(.*)/)
        if (letterListMatch) {
          const [_, letter, rest] = letterListMatch
          return (
            <div key={idx} className="flex items-start gap-3 pl-6 my-1">
              <span className="inline-flex items-center justify-center font-semibold text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded h-fit flex-shrink-0 uppercase">
                {letter}
              </span>
              <p className="font-light text-slate-600 text-sm md:text-base leading-relaxed">
                {formatInLineBold(rest)}
              </p>
            </div>
          )
        }

        // E. Detect standard bullet lists
        if (
          line.startsWith("-") ||
          line.startsWith("•") ||
          line.startsWith("*")
        ) {
          const rest = line.replace(/^[-•*]\s*/, "")
          return (
            <div
              key={idx}
              className="pl-6 relative font-light text-slate-600 before:content-[''] before:absolute before:left-2 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-logo-blue before:rounded-full text-sm md:text-base leading-relaxed my-1.5"
            >
              {formatInLineBold(rest)}
            </div>
          )
        }

        // F. Highlight large uppercase warnings (Check-in/Check-out/etc.)
        const isWarningText =
          line.includes("CHECK-IN") ||
          line.includes("CHECK-OUT") ||
          line.includes("MULTA") ||
          line.startsWith("**")
        if (isWarningText && line.length < 150) {
          return (
            <div
              key={idx}
              className="bg-amber-50/40 border border-amber-200/60 p-4 rounded-2xl flex items-start gap-3 my-2"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-900 font-medium text-sm md:text-base leading-relaxed">
                {formatInLineBold(line)}
              </p>
            </div>
          )
        }

        // G. Standard verbatim paragraph
        return (
          <p
            key={idx}
            className="font-light text-slate-700 text-sm md:text-base leading-relaxed"
          >
            {formatInLineBold(line)}
          </p>
        )
      })}
    </div>
  )
}

export default function CondicoesGerais({ sections }) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "")

  // Custom scroll navigation back to homepage section anchors
  const handleHomeScroll = (e, id) => {
    e.preventDefault()
    router.push(`/#${id}`)
  }

  // Handle local scroll to specific section
  const handleLocalScroll = (e, id) => {
    e.preventDefault()
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      const offset = 90 // sticky headers offset
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  // Monitor scrolling to highlight the active section in ToC
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120

      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const top = element.offsetTop
          const height = element.offsetHeight

          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [sections])

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <Head>
        <title>Regulamento e Condições Gerais | 17º Simpovidro</title>
        <meta
          name="description"
          content="Confira as condições gerais, regras de cancelamento, hospedagem, inclusões e o regulamento completo do 17º Simpovidro, organizado pela Abravidro."
        />
        <meta name="robots" content="index, follow" />
      </Head>

      {/* Navigation Menu */}
      <Navbar scrollToSection={handleHomeScroll} />

      {/* Premium Gradient Hero Header */}
      <header className="relative bg-gradient-to-br from-slate-900 via-logo-navy to-slate-950 text-white pt-36 pb-20 px-6 overflow-hidden">
        {/* Abstract background shapes for visual appeal */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl animate-blob"></div>
          <div className="absolute top-10 -right-4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Regulamento Oficial
          </div>

          <h1 className="text-4xl md:text-5xl font-title font-bold tracking-tight mb-4 leading-tight">
            Condições Gerais de Contratação
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl font-light leading-relaxed">
            Consulte as normas, hospedagens inclusas, políticas de cancelamento
            e o regulamento original completo do 17º Simpovidro.
          </p>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col lg:flex-row gap-10">
        {/* Left Side: Table of Contents (Sticky on Desktop) */}
        <div className="lg:w-1/4 lg:sticky lg:top-24 h-fit space-y-6">
          {/* Table of Contents (Desktop Navigation) */}
          <div className="hidden lg:block bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-none">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-3">
              Seções
            </h3>
            <nav className="space-y-1">
              {sections.map((section) => {
                const isActive = activeSection === section.id

                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => handleLocalScroll(e, section.id)}
                    className={`block text-xs py-2.5 px-3 rounded-lg font-medium transition-all duration-200 border-l-2 leading-relaxed ${
                      isActive
                        ? "bg-slate-50 border-logo-navy text-logo-navy font-bold translate-x-1"
                        : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50 hover:border-slate-200"
                    }`}
                  >
                    {section.title}
                  </a>
                )
              })}
            </nav>
          </div>

          {/* Table of Contents (Mobile/Tablet Dropdown Selector) */}
          <div className="lg:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <label
              htmlFor="section-select"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
            >
              Ir para a seção
            </label>
            <select
              id="section-select"
              value={activeSection}
              onChange={(e) => handleLocalScroll(e, e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-logo-blue/20"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title.length > 50
                    ? `${section.title.substring(0, 47)}...`
                    : section.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Full Document Content */}
        <div className="lg:w-3/4 space-y-8">
          {sections.map((section, idx) => {
            const IconComponent = getSectionIcon(section.number)
            const isCancellation = section.id === "cancelamento"

            return (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
                className={`bg-white rounded-3xl p-6 md:p-8 border shadow-sm transition-all duration-300 scroll-mt-24 ${
                  isCancellation
                    ? "border-amber-200 bg-gradient-to-b from-white to-amber-50/10 hover:border-amber-300 hover:shadow-amber-100/50"
                    : "border-slate-200/80 hover:border-slate-300 hover:shadow-slate-100"
                }`}
              >
                {/* Section Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className={`p-3 rounded-2xl flex-shrink-0 ${
                      isCancellation
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-logo-navy"
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-title font-bold text-slate-900 leading-tight">
                      {section.title}
                    </h2>
                    {isCancellation && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 bg-amber-100/60 px-2.5 py-0.5 rounded-full">
                        Atenção Importante
                      </span>
                    )}
                  </div>
                </div>

                {/* Verbatim Preprocessed & Styled Content */}
                <VerbatimFormatter
                  text={preprocessContent(section.content, section.id)}
                  sectionId={section.id}
                />
              </motion.section>
            )
          })}
        </div>
      </main>

      {/* Footer Component */}
      <Footer scrollToSection={handleHomeScroll} />
    </div>
  )
}

export async function getStaticProps() {
  const fs = require("fs")
  const path = require("path")
  const filePath = path.join(process.cwd(), "condicoes-gerais.txt")
  const text = fs.readFileSync(filePath, "utf-8").replace(/m2/g, "m²")

  const titles = [
    "1. Introdução",
    "2. Data da inscrição, condições de pagamento e valores.",
    "3. Dos direitos inclusos na inscrição",
    "4. Do cancelamento da inscrição",
    "5. Período de hospedagem",
    "6. Das responsabilidades do participante",
    "7. Do extravio de bagagem",
    "8. Dos traslados",
    "9. Do acesso ao evento",
    "10. Do credenciamento",
    "11. Dos horários e datas de entrada e saída",
    "12. Demais informações sobre o hotel",
    "13. Principais ramais:",
    "14. Da utilização da Internet",
    "15. Das opções de lazer e suas condições de uso",
    "16. Do lazer e da estrutura para crianças",
    "17. Dos horários dos Alimentos e Bebidas:",
    "18. Reservas de Restaurantes Temáticos – Jantar:",
    "19. Bares:",
    "20. Frigobar dos apartamentos:",
    "21. Exclusivo da Ala Internacional",
    "22. Quartos",
    "23. Dos extras não inclusos na inscrição",
    "24. Das demais informações",
    "25. Do aceite",
  ]

  const sections = []
  for (let i = 0; i < titles.length; i++) {
    const currentTitle = titles[i]
    const nextTitle = titles[i + 1]

    const startIndex = text.indexOf(currentTitle)
    if (startIndex === -1) {
      continue
    }

    const contentStartIndex = startIndex + currentTitle.length
    let contentEndIndex = text.length

    if (nextTitle) {
      const nextIndex = text.indexOf(nextTitle)
      if (nextIndex !== -1) {
        contentEndIndex = nextIndex
      }
    }

    const content = text.slice(contentStartIndex, contentEndIndex)

    // Create clean semantic IDs based on index
    const idNum = i + 1
    let sectionId = ""
    if (idNum === 1) sectionId = "introducao"
    else if (idNum === 2) sectionId = "data-inscricao"
    else if (idNum === 3) sectionId = "direitos-inclusos"
    else if (idNum === 4) sectionId = "cancelamento"
    else if (idNum === 5) sectionId = "periodo-hospedagem"
    else if (idNum === 6) sectionId = "responsabilidades"
    else if (idNum === 7) sectionId = "extravio-bagagem"
    else if (idNum === 8) sectionId = "traslados"
    else if (idNum === 9) sectionId = "acesso-evento"
    else if (idNum === 10) sectionId = "credenciamento"
    else if (idNum === 11) sectionId = "horarios-entrada-saida"
    else if (idNum === 12) sectionId = "info-hotel"
    else if (idNum === 13) sectionId = "ramais"
    else if (idNum === 14) sectionId = "internet"
    else if (idNum === 15) sectionId = "lazer"
    else if (idNum === 16) sectionId = "criancas"
    else if (idNum === 17) sectionId = "horarios-alimentos"
    else if (idNum === 18) sectionId = "restaurantes-tematicos"
    else if (idNum === 19) sectionId = "bares"
    else if (idNum === 20) sectionId = "frigobar"
    else if (idNum === 21) sectionId = "exclusivo-ala-internacional"
    else if (idNum === 22) sectionId = "quartos"
    else if (idNum === 23) sectionId = "extras"
    else if (idNum === 24) sectionId = "demais-informacoes"
    else if (idNum === 25) sectionId = "aceite"

    sections.push({
      id: sectionId,
      number: idNum,
      title: currentTitle,
      content: content.trim(),
    })
  }

  return {
    props: {
      sections,
    },
  }
}
