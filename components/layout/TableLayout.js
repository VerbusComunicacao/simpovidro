import useUser from "@/hooks/useUser"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Hotel,
  ClipboardList,
  Building2,
  BedDouble,
  Layers,
  ShieldCheck,
  Tag,
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"

const navItems = [
  { href: "/table", label: "Hotéis", icon: Hotel },
  { href: "/table/inscricoes", label: "Inscrições", icon: ClipboardList },
  { href: "/table/empresas", label: "Empresas", icon: Building2 },
  { href: "/table/discounts", label: "Descontos", icon: Tag },
  { href: "/table/room-types", label: "Tipos de Quarto", icon: BedDouble },
  {
    href: "/table/room-categories",
    label: "Categorias de Quarto",
    icon: Layers,
  },
]

export default function TableLayout({ children, pageActions }) {
  const { user, isLoading, logout } = useUser()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login")
        return
      }

      if (!user.features?.includes("read:content")) {
        router.replace("/inscricao")
      }
    }
  }, [user, isLoading, router])

  if (isLoading || !user || !user.features?.includes("read:content")) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Carregando...
      </div>
    )
  }

  const isActive = (href) => router.pathname === href

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 className="font-bold text-lg text-blue-600">Simpovidro</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isMobileMenuOpen ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-white border-r min-h-screen fixed md:sticky top-0 z-40 transition-all duration-300 md:translate-x-0`}
      >
        <div className="p-6 hidden md:block">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Área administrativa
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} legacyBehavior>
              <a
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={`h-4 w-4 ${
                    isActive(item.href) ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                {item.label}
              </a>
            </Link>
          ))}

          {user.features?.includes("update:user:others") && (
            <Link href="/table/features" legacyBehavior>
              <a
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/table/features")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ShieldCheck
                  className={`h-4 w-4 ${
                    isActive("/table/features")
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
                Funcionalidades
              </a>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t space-y-2">
          {pageActions && <div className="md:hidden">{pageActions}</div>}
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="mr-3 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-gray-50 flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white h-16 border-b px-8 items-center justify-between sticky top-0 z-30">
          <div className="font-medium text-gray-500">
            {navItems.find((i) => isActive(i.href))?.label || "Admin"}
          </div>
          <div className="flex items-center gap-4">
            {pageActions}
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-900">
                {user.email}
              </span>
              <span className="text-xs text-gray-500">Administrador</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  )
}
