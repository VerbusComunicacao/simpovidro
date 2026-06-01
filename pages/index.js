import Head from "next/head"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"

// Home Components
import Navbar from "@/components/home/Navbar"
import Hero from "@/components/home/Hero"
import AboutEvent from "@/components/home/AboutEvent"
import Location from "@/components/home/Location"
import Accommodations from "@/components/home/Accommodations"
import Pricing from "@/components/home/Pricing"
import History from "@/components/home/History"
import Sponsors from "@/components/home/Sponsors"
import CTA from "@/components/home/CTA"
import Footer from "@/components/home/Footer"

const HERO_IMAGE = "/images/simpovidro.webp"

export default function Home() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 550)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (e, id) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80, // Offset for sticky header
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Head>
        <title>17º Simpovidro | O Encontro do Setor Vidreiro</title>
        <meta
          name="description"
          content="Participe do 17º Simpovidro (5 a 8 de novembro de 2026), o maior encontro do setor vidreiro no Brasil, realizado pela Abravidro no Costão do Santinho, Florianópolis. Networking, negócios e lazer."
        />
        <meta
          name="keywords"
          content="Simpovidro, Simpovidro 2026, Abravidro, setor vidreiro, evento de vidro, Costão do Santinho, Florianópolis, networking, encontro vidreiro, indústria do vidro"
        />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Abravidro" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.simpovidro.com.br/" />
        <meta
          property="og:title"
          content="17º Simpovidro | O Encontro do Setor Vidreiro"
        />
        <meta
          property="og:description"
          content="Participe do maior encontro da cadeia produtiva do vidro no Brasil, de 5 a 8 de novembro de 2026, no Costão do Santinho Resort, Florianópolis."
        />
        <meta
          property="og:image"
          content="https://www.simpovidro.com.br/images/simpovidro.webp"
        />
        <meta property="og:site_name" content="Simpovidro" />
        <meta property="og:locale" content="pt_BR" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.simpovidro.com.br/" />
        <meta
          name="twitter:title"
          content="17º Simpovidro | O Encontro do Setor Vidreiro"
        />
        <meta
          name="twitter:description"
          content="Participe do maior encontro da cadeia produtiva do vidro no Brasil, de 5 a 8 de novembro de 2026, no Costão do Santinho Resort, Florianópolis."
        />
        <meta
          name="twitter:image"
          content="https://www.simpovidro.com.br/images/simpovidro.webp"
        />

        {/* Canonical */}
        <link rel="canonical" href="https://www.simpovidro.com.br/" />
      </Head>

      <Navbar
        scrolled={scrolled}
        scrollToSection={scrollToSection}
        router={router}
      />

      <AnimatePresence>
        {scrolled && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-[64px] left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm"
          >
            <Sponsors variant="compact" />
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <Hero
          scrollToSection={scrollToSection}
          router={router}
          HERO_IMAGE={HERO_IMAGE}
        />

        <AboutEvent scrollToSection={scrollToSection} />

        <Location />

        <Accommodations />

        <Pricing scrollToSection={scrollToSection} />

        <History />

        <Sponsors variant="full" />

        <CTA router={router} HERO_IMAGE={HERO_IMAGE} />
      </main>

      <Footer scrollToSection={scrollToSection} />
    </div>
  )
}
