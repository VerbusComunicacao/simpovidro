import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ErrorDialog from "@/components/ui/ErrorDialog"

export default function Activate() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState("loading") // loading, success, error
  const [message, setMessage] = useState("Ativando sua conta...")
  const [actionMessage, setActionMessage] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    if (token) {
      activateAccount()
    }
  }, [token, router.isReady])

  const activateAccount = async () => {
    try {
      const response = await fetch(`/api/v1/activations/${token}`, {
        method: "PATCH",
      })

      if (response.ok) {
        setStatus("success")
        setMessage("Sua conta foi ativada com sucesso! Agora você já pode fazer login.")
      } else {
        const data = await response.json()
        setMessage(data.message || "Erro ao ativar a conta.")
        if (data.action) setActionMessage(data.action)
        setStatus("error")
        setIsErrorDialogOpen(true)
      }
    } catch (error) {
      setMessage("Ocorreu um erro inesperado. Tente novamente mais tarde.")
      setStatus("error")
      setIsErrorDialogOpen(true)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Ativação de Conta</CardTitle>
          <CardDescription>
            {status === "loading" ? "Aguarde um momento..." : "Resultado da ativação"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6 text-center">
          {status === "loading" && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          )}
          {status === "success" && (
            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 transition-all scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          )}
          <p className={status === "error" ? "text-red-500" : ""}>{message}</p>
        </CardContent>
        {status === "success" && (
          <CardFooter className="flex justify-center border-t py-4">
            <Button className="w-full" onClick={() => router.push("/login")}>
              Ir para o Login
            </Button>
          </CardFooter>
        )}
      </Card>

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => router.push("/login")}
        title="Erro na Ativação"
        message={message}
        actionMessage={actionMessage}
        closeText="Ir para Login"
      />
    </div>
  )
}
