import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useRouter } from "next/router"
import RegistrationLayout from "@/components/registration/RegistrationLayout"

export default function RegistrationSuccessPage() {
  const router = useRouter()

  return (
    <RegistrationLayout title="Inscrição Confirmada - Simpovidro 2025">
      <div className="flex items-center justify-center p-4 py-20">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
          <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Inscrição Confirmada!
          </h1>

          <p className="text-gray-600">
            Sua pré-inscrição foi realizada com sucesso. Você receberá em breve
            um email com os detalhes do pagamento e confirmação da reserva.
          </p>

          <div className="pt-4 space-y-3">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push("/inscricao")}
            >
              Voltar para Inscrições
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/meus-pedidos")}
            >
              Ir para Meus Pedidos
            </Button>
          </div>
        </div>
      </div>
    </RegistrationLayout>
  )
}
