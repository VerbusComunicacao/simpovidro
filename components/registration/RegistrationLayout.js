import RegistrationHeader from "./RegistrationHeader"
import Head from "next/head"

export default function RegistrationLayout({ 
  children, 
  title = "Simpovidro 2025 - Inscrição",
  showBackButton = false 
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>{title}</title>
      </Head>

      <RegistrationHeader showBackButton={showBackButton} />

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 Simpovidro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
