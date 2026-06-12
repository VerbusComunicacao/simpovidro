import { useState } from "react"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/router"

export const navItems = [
  { name: "Sobre", id: "sobre" },
  { name: "Local", id: "local" },
  { name: "Condições Especiais", id: "condicoes-especiais" },
]

export default function Navbar({ scrollToSection, router: propRouter }) {
  const localRouter = useRouter()
  const router = propRouter || localRouter
  const [isOpen, setIsOpen] = useState(false)
  const isEn = router?.locale === "en"
  const t = (pt, en) => (isEn ? en : pt)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-3 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 cursor-pointer no-underline"
        >
          <Image
            src="/images/icon-17-simpovidro.png"
            alt="Simpovidro Icon"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-xl font-title font-bold text-slate-900 sm:inline-block">
            17
            <span className="text-xl font-sans font-bold">º</span> SIMPOVIDRO
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item) => {
            const name =
              item.id === "sobre"
                ? t("Sobre", "About")
                : item.id === "local"
                  ? t("Local", "Location")
                  : item.id === "condicoes-especiais"
                    ? t("Condições Especiais", "Special Conditions")
                    : item.name
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {name}
              </a>
            )
          })}

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200/60 mr-2 gap-0.5">
            <button
              onClick={() =>
                router.push(router.pathname, router.asPath, { locale: "pt-BR" })
              }
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer text-sm ${
                router.locale !== "en"
                  ? "bg-white shadow-sm scale-110"
                  : "opacity-50 hover:opacity-100"
              }`}
              title="Português"
            >
              🇧🇷
            </button>
            <button
              onClick={() =>
                router.push(router.pathname, router.asPath, { locale: "en" })
              }
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer text-sm ${
                router.locale === "en"
                  ? "bg-white shadow-sm scale-110"
                  : "opacity-50 hover:opacity-100"
              }`}
              title="English"
            >
              🇺🇸
            </button>
          </div>

          <Button
            className="bg-logo-navy hover:bg-blue-700 text-white rounded-full px-6 cursor-pointer"
            onClick={() => router.push("/inscricao")}
          >
            {t("Inscreva-se", "Register")}
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <X className="text-slate-900 h-6 w-6" />
          ) : (
            <Menu className="text-slate-900 h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-100 absolute top-full left-0 right-0 py-6 px-6 shadow-xl flex flex-col gap-4 z-40 transition-all duration-300">
          {navItems.map((item) => {
            const name =
              item.id === "sobre"
                ? t("Sobre", "About")
                : item.id === "local"
                  ? t("Local", "Location")
                  : item.id === "condicoes-especiais"
                    ? t("Condições Especiais", "Special Conditions")
                    : item.name
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  setIsOpen(false)
                  scrollToSection(e, item.id)
                }}
                className="text-slate-700 hover:text-blue-600 font-semibold text-base py-1 transition-colors cursor-pointer"
              >
                {name}
              </a>
            )
          })}

          {/* Mobile Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200/60 mr-auto gap-0.5 mt-2">
            <button
              onClick={() => {
                setIsOpen(false)
                router.push(router.pathname, router.asPath, { locale: "pt-BR" })
              }}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer text-sm ${
                router.locale !== "en"
                  ? "bg-white shadow-sm scale-110"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              🇧🇷 Português
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                router.push(router.pathname, router.asPath, { locale: "en" })
              }}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer text-sm ${
                router.locale === "en"
                  ? "bg-white shadow-sm scale-110"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              🇺🇸 English
            </button>
          </div>

          <Button
            className="bg-logo-navy hover:bg-blue-700 text-white rounded-full w-full py-6 text-base font-bold shadow-md shadow-blue-200 mt-2 cursor-pointer"
            onClick={() => {
              setIsOpen(false)
              router.push("/inscricao")
            }}
          >
            {t("Inscreva-se", "Register")}
          </Button>
        </div>
      )}
    </nav>
  )
}
