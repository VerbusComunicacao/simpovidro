import Head from "next/head"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"

// Home Components
import Navbar from "@/components/home/Navbar"
import Hero from "@/components/home/Hero"
import AboutEvent from "@/components/home/AboutEvent"
import Location from "@/components/home/Location"
import Speakers from "@/components/home/Speakers"
import Panels from "@/components/home/Panels"
import Schedule from "@/components/home/Schedule"
import Pricing from "@/components/home/Pricing"
import Tips from "@/components/home/Tips"
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
      setScrolled(window.scrollY > 50)
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
          content="Onde o mercado vidreiro se encontra para redefinir o amanhã."
        />
      </Head>

      <Navbar
        scrolled={scrolled}
        scrollToSection={scrollToSection}
        router={router}
      />

      <main>
        <Hero
          scrollToSection={scrollToSection}
          router={router}
          HERO_IMAGE={HERO_IMAGE}
        />

        <Sponsors variant="compact" />

        <AboutEvent scrollToSection={scrollToSection} />

        <Location />

        <Speakers />

        <Panels scrollToSection={scrollToSection} />

        <Schedule />

        <Pricing />

        <Tips />

        <History />

        <Sponsors variant="full" />

        <CTA router={router} HERO_IMAGE={HERO_IMAGE} />
      </main>

      <Footer scrollToSection={scrollToSection} />
    </div>
  )
}
