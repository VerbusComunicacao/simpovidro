import Head from "next/head"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
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
import condicoesMarkdown from "@/condicoes-gerais.md"

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

/* eslint-disable no-unused-vars */
const MarkdownComponents = {
  h3: ({ node, ...props }) => (
    <h3
      className="text-lg md:text-xl font-bold font-title text-logo-navy mt-6 mb-3 border-b border-slate-100 pb-2"
      {...props}
    />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-base font-bold text-slate-800 mt-4 mb-2" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p
      className="font-light text-slate-700 text-sm md:text-base leading-relaxed my-3"
      {...props}
    />
  ),
  ul: ({ node, ...props }) => <ul className="my-3 space-y-2" {...props} />,
  li: ({ node, ...props }) => (
    <li className="pl-6 relative font-light text-slate-700 before:content-[''] before:absolute before:left-2 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-logo-blue before:rounded-full text-sm md:text-base leading-relaxed">
      {props.children}
    </li>
  ),
  ol: ({ node, ...props }) => (
    <ol
      className="list-decimal pl-6 my-3 space-y-2 text-slate-700 text-sm md:text-base font-light"
      {...props}
    />
  ),
  a: ({ node, ...props }) => (
    <a
      className="text-logo-blue hover:underline font-semibold"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  tr: ({ node, ...props }) => (
    <tr className="hover:bg-slate-50/50 transition-colors" {...props} />
  ),
  img: ({ node, alt = "", ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className="mx-auto rounded-2xl border border-slate-200/80 shadow-sm my-6 max-w-full h-auto"
      {...props}
    />
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-slate-950" {...props} />
  ),
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="bg-amber-50/40 border border-amber-200/80 p-5 rounded-2xl flex flex-col gap-2 my-5 shadow-sm">
      {props.children}
    </blockquote>
  ),
}
/* eslint-enable no-unused-vars */

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

      <Navbar scrollToSection={handleHomeScroll} />

      {/* Premium Gradient Hero Header */}
      <header className="relative bg-gradient-to-br from-slate-900 via-logo-navy to-slate-950 text-white pt-36 pb-20 px-6 overflow-hidden">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col lg:flex-row gap-10">
        {/* Left Side: Table of Contents */}
        <div className="lg:w-1/4 lg:sticky lg:top-24 h-fit space-y-6">
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
                  </div>
                </div>

                {/* Markdown Content rendered cleanly */}
                <ReactMarkdown
                  rehypePlugins={[rehypeRaw]}
                  components={MarkdownComponents}
                >
                  {section.content}
                </ReactMarkdown>
              </motion.section>
            )
          })}
        </div>
      </main>

      <Footer scrollToSection={handleHomeScroll} />
    </div>
  )
}

export async function getStaticProps() {
  const text = condicoesMarkdown

  const sections = []

  // Use regex to match all '## X. Title' occurrences
  const headerRegex = /^##\s+(\d+)\.\s+(.*)$/gm
  let match
  let lastIndex = 0
  let currentSection = null

  while ((match = headerRegex.exec(text)) !== null) {
    if (currentSection) {
      currentSection.content = text.substring(lastIndex, match.index).trim()
      sections.push(currentSection)
    }

    const idNum = parseInt(match[1], 10)
    currentSection = {
      idNum,
      title: `${idNum}. ${match[2].trim()}`,
      content: "",
    }
    lastIndex = match.index + match[0].length
  }

  // push the last section
  if (currentSection) {
    currentSection.content = text.substring(lastIndex).trim()
    sections.push(currentSection)
  }

  // map IDs for navigation
  const mappedSections = sections.map((sec) => {
    let sectionId = ""
    if (sec.idNum === 1) sectionId = "introducao"
    else if (sec.idNum === 2) sectionId = "data-inscricao"
    else if (sec.idNum === 3) sectionId = "direitos-inclusos"
    else if (sec.idNum === 4) sectionId = "cancelamento"
    else if (sec.idNum === 5) sectionId = "periodo-hospedagem"
    else if (sec.idNum === 6) sectionId = "responsabilidades"
    else if (sec.idNum === 7) sectionId = "extravio-bagagem"
    else if (sec.idNum === 8) sectionId = "traslados"
    else if (sec.idNum === 9) sectionId = "acesso-evento"
    else if (sec.idNum === 10) sectionId = "credenciamento"
    else if (sec.idNum === 11) sectionId = "horarios-entrada-saida"
    else if (sec.idNum === 12) sectionId = "info-hotel"
    else if (sec.idNum === 13) sectionId = "ramais"
    else if (sec.idNum === 14) sectionId = "internet"
    else if (sec.idNum === 15) sectionId = "lazer"
    else if (sec.idNum === 16) sectionId = "criancas"
    else if (sec.idNum === 17) sectionId = "horarios-alimentos"
    else if (sec.idNum === 18) sectionId = "restaurantes-tematicos"
    else if (sec.idNum === 19) sectionId = "bares"
    else if (sec.idNum === 20) sectionId = "frigobar"
    else if (sec.idNum === 21) sectionId = "exclusivo-ala-internacional"
    else if (sec.idNum === 22) sectionId = "quartos"
    else if (sec.idNum === 23) sectionId = "extras"
    else if (sec.idNum === 24) sectionId = "demais-informacoes"
    else if (sec.idNum === 25) sectionId = "aceite"

    return {
      id: sectionId,
      number: sec.idNum,
      title: sec.title,
      content: sec.content,
    }
  })

  return {
    props: {
      sections: mappedSections,
    },
  }
}
