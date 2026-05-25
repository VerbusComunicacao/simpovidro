import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import Image from "next/image"

export const navItems = [
  { name: "Sobre", id: "sobre" },
  { name: "Local", id: "local" },
  { name: "Condições Especiais", id: "condicoes-especiais" },
  { name: "Dicas e lembretes", id: "dicas" },
]

export default function Navbar({ scrollToSection, router }) {

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
          <span className="text-xl font-bold tracking-tight text-slate-900 font-title uppercase">
            Simpovidro
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
          <Button
            className="bg-logo-navy hover:bg-blue-700 text-white rounded-full px-6"
            onClick={() => router.push("/inscricao")}
          >
            Inscreva-se
          </Button>
        </div>

        <button className="md:hidden">
          <Menu className="text-slate-900" />
        </button>
      </div>
    </nav>
  )
}
