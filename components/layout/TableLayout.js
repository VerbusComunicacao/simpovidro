import useUser from "@/hooks/useUser"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import Link from "next/link"

export default function TableLayout({ children, pageActions }) {
  const { user, isLoading, logout } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Carregando...
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6 pb-4 border-b">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold">Área administrativa</h1>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/table" legacyBehavior>
              <a className="text-gray-600 hover:text-gray-900 font-medium">
                Hotéis
              </a>
            </Link>
            <Link href="/table/room-types" legacyBehavior>
              <a className="text-gray-600 hover:text-gray-900 font-medium">
                Tipos de Quarto
              </a>
            </Link>
            <Link href="/table/room-categories" legacyBehavior>
              <a className="text-gray-600 hover:text-gray-900 font-medium">
                Categorias de Quarto
              </a>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {pageActions}
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </header>
      <main className="mt-6">{children}</main>
    </div>
  )
}
