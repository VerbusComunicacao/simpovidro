import { useState } from "react"
import { Menu, X } from "lucide-react"
import Image from "next/image"

export const navItems = [
  { name: "Sobre", id: "sobre" },
  { name: "Local", id: "local" },
  { name: "Condições Especiais", id: "condicoes-especiais" },
  { name: "Dicas e lembretes", id: "dicas" },
]

export default function Navbar({ scrollToSection }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-3 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
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
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={`#${item.id}`}
              onClick={(e) => scrollToSection(e, item.id)}
              className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {item.name}
            </a>
          ))}
          {/*
          <Button
            className="bg-logo-navy hover:bg-blue-700 text-white rounded-full px-6"
            onClick={() => router.push("/inscricao")}
          >
            Inscreva-se
          </Button>*/}
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
          {navItems.map((item) => (
            <a
              key={item.name}
              href={`#${item.id}`}
              onClick={(e) => {
                setIsOpen(false)
                scrollToSection(e, item.id)
              }}
              className="text-slate-700 hover:text-blue-600 font-semibold text-base py-1 transition-colors cursor-pointer"
            >
              {item.name}
            </a>
          ))}
          {/*<Button
            className="bg-logo-navy hover:bg-blue-700 text-white rounded-full w-full py-6 text-base font-bold shadow-md shadow-blue-200 mt-2"
            onClick={() => {
              setIsOpen(false)
              router.push("/inscricao")
            }}
          >
            Inscreva-se
          </Button>*/}
        </div>
      )}
    </nav>
  )
}
