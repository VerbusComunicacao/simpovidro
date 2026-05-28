import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, ChevronLeft, Menu, X } from "lucide-react"
import useUser from "@/hooks/useUser"
import { useRouter } from "next/router"
import authorization from "@/models/authorization"
import Image from "next/image"
import { navItems } from "@/components/home/Navbar"

export default function RegistrationHeader({ showBackButton = false }) {
  const { user, logout } = useUser()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="bg-white/90 backdrop-blur-md shadow-sm border-b sticky top-0 pgm-header-shadow z-50 py-3">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-all group"
          >
            <Image
              src="/images/icone-simpovidro.svg"
              alt="Simpovidro Icon"
              width={40}
              height={40}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-xl font-title tracking-tight text-slate-900 hidden sm:inline-block">
              Simpovidro
            </span>
          </Link>

          {/* Nav Items - Same as Home Navbar */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-bold text-slate-600">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={`/#${item.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hidden md:flex items-center gap-2 text-slate-600 font-bold"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">
                  {user.name || user.username}
                </span>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                  Logado
                </span>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                {authorization.can(user, "create:content") && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex text-slate-600 font-bold hover:text-blue-600"
                  >
                    <Link href="/table">Painel</Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-slate-600 font-bold hover:text-blue-600"
                >
                  <Link href="/meus-pedidos">Meus Pedidos</Link>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="gap-2 border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-100 hover:bg-red-50 rounded-full px-4 shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline font-bold">Sair</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
              >
                Entrar
              </Link>
              <Button
                asChild
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 font-bold shadow-md shadow-blue-200"
              >
                <Link href="/inscricao">Inscreva-se</Link>
              </Button>
            </div>
          )}

          {/* Hamburger Menu on mobile */}
          <button className="xl:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <X className="text-slate-900 h-6 w-6" />
            ) : (
              <Menu className="text-slate-900 h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="xl:hidden bg-white/95 backdrop-blur-md border-t border-slate-100 absolute top-full left-0 right-0 py-6 px-6 shadow-xl flex flex-col gap-4 z-40 transition-all duration-300">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={`/#${item.id}`}
              onClick={() => setIsOpen(false)}
              className="text-slate-700 hover:text-blue-600 font-semibold text-base py-1 transition-colors"
            >
              {item.name}
            </Link>
          ))}
          {!user && (
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-full py-6 text-base font-bold shadow-md shadow-blue-200 mt-2"
              onClick={() => setIsOpen(false)}
            >
              <Link href="/inscricao">Inscreva-se</Link>
            </Button>
          )}
        </div>
      )}
    </header>
  )
}
