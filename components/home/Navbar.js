import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function Navbar({ scrolled, scrollToSection, router }) {
  const navItems = [
    { name: "Sobre", id: "sobre" },
    { name: "Palestrantes", id: "palestrantes" },
    { name: "Painéis", id: "paineis" },
    { name: "Programação", id: "programacao" },
    { name: "Preços", id: "precos" },
    { name: "Dicas e lembretes", id: "dicas" },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <span
            className={`text-xl font-bold tracking-tight ${
              scrolled ? "text-slate-900" : "text-white"
            }`}
          >
            Simpovidro
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={`#${item.id}`}
              onClick={(e) => scrollToSection(e, item.id)}
              className={`${
                scrolled
                  ? "text-slate-600 hover:text-blue-600"
                  : "text-white/80 hover:text-white"
              } transition-colors cursor-pointer`}
            >
              {item.name}
            </a>
          ))}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
            onClick={() => router.push("/inscricao")}
          >
            Inscreva-se
          </Button>
        </div>

        <button className="md:hidden text-white">
          <Menu className={scrolled ? "text-slate-900" : "text-white"} />
        </button>
      </div>
    </nav>
  )
}
