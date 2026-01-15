import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hotel, LogOut, ChevronLeft } from "lucide-react"
import useUser from "@/hooks/useUser"
import { useRouter } from "next/router"

export default function RegistrationHeader({ showBackButton = false }) {
  const { user, logout } = useUser()
  const router = useRouter()

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="md:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          <Link
            href="/inscricao"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Hotel className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:inline-block">
              Simpovidro 2026
            </span>
          </Link>

          {showBackButton && (
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hidden md:flex items-center gap-2 text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:flex text-gray-600"
              >
                <Link href="/meus-pedidos">Meus Pedidos</Link>
              </Button>

              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {user.name || user.username}
                </span>
                <span className="text-xs text-gray-500">{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          ) : (
            <Button
              asChild
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Link href="/login">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
