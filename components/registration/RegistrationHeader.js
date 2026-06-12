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
  const isEn = router.locale === "en"
  const t = (pt, en) => (isEn ? en : pt)

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
            <span className="text-xl font-title font-bold text-slate-900 sm:inline-block">
              17
              <span className="text-xl font-sans font-bold">º</span> SIMPOVIDRO
            </span>
          </Link>

          {/* Nav Items - Same as Home Navbar */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-bold text-slate-600">
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
                <Link
                  key={item.id}
                  href={`/#${item.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {name}
                </Link>
              )
            })}
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
              {t("Voltar", "Back")}
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">
                  {user.name || user.username}
                </span>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                  {t("Logado", "Logged In")}
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
                    <Link href="/table">{t("Painel", "Admin Panel")}</Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-slate-600 font-bold hover:text-blue-600"
                >
                  <Link href="/meus-pedidos">
                    {t("Meus Pedidos", "My Orders")}
                  </Link>
                </Button>

                {/* Language Switcher */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200/60 mr-2 gap-0.5">
                  <button
                    onClick={() =>
                      router.push(router.pathname, router.asPath, {
                        locale: "pt-BR",
                      })
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
                      router.push(router.pathname, router.asPath, {
                        locale: "en",
                      })
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
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="gap-2 border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-100 hover:bg-red-50 rounded-full px-4 shadow-sm cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline font-bold">
                    {t("Sair", "Sign Out")}
                  </span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
              >
                {t("Entrar", "Sign In")}
              </Link>
              <Button
                asChild
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 font-bold shadow-md shadow-blue-200"
              >
                <Link href="/inscricao">{t("Inscreva-se", "Register")}</Link>
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
              <Link
                key={item.id}
                href={`/#${item.id}`}
                onClick={() => setIsOpen(false)}
                className="text-slate-700 hover:text-blue-600 font-semibold text-base py-1 transition-colors"
              >
                {name}
              </Link>
            )
          })}
          {!user && (
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-full py-6 text-base font-bold shadow-md shadow-blue-200 mt-2"
              onClick={() => setIsOpen(false)}
            >
              <Link href="/inscricao">{t("Inscreva-se", "Register")}</Link>
            </Button>
          )}
        </div>
      )}
    </header>
  )
}
