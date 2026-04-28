import RegistrationHeader from "./RegistrationHeader"
import Head from "next/head"
import Sponsors from "@/components/home/Sponsors"
import Footer from "@/components/home/Footer"
import { useRouter } from "next/router"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function RegistrationLayout({
  children,
  title = "Simpovidro 2026 - Inscrição",
  showBackButton = false,
}) {
  const router = useRouter()

  const scrollToSection = (e, id) => {
    e.preventDefault()
    // If we are not in home, we should redirect to home first
    router.push(`/#${id}`)
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Head>
          <title>{title}</title>
        </Head>

        <RegistrationHeader showBackButton={showBackButton} />

        <main className="flex-1">{children}</main>

        <Sponsors variant="full" />

        <Footer scrollToSection={scrollToSection} />
      </div>
    </TooltipProvider>
  )
}
