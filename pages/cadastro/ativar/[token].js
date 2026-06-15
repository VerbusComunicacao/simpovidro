import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
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
  const isEn = router?.locale === "en"
  const t = useCallback((pt, en) => (isEn ? en : pt), [isEn])

  const { token } = router.query
  const [status, setStatus] = useState("loading") // loading, success, error
  const [message, setMessage] = useState("Ativando sua conta...")
  const [actionMessage, setActionMessage] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)

  const handleLanguageChange = (lang) => {
    router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: lang },
    )
  }

  const displayMessage =
    message || t("Ativando sua conta...", "Activating your account...")
  const displayActionMessage = actionMessage

  const activateAccount = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/activations/${token}${isEn ? "?lang=en" : ""}`,
        {
          method: "PATCH",
        },
      )

      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        setStatus("success")
        setMessage(
          data.message ||
            t(
              "Sua conta foi ativada com sucesso! Agora você já pode fazer login.",
              "Your account was successfully activated! You can now log in.",
            ),
        )
      } else {
        const data = await response.json()
        setMessage(
          data.message ||
            t("Erro ao ativar a conta.", "Error activating your account."),
        )
        if (data.action) setActionMessage(data.action)
        setStatus("error")
        setIsErrorDialogOpen(true)
      }
    } catch (error) {
      setMessage(
        t(
          "Ocorreu um erro inesperado. Tente novamente mais tarde.",
          "An unexpected error occurred. Please try again later.",
        ),
      )
      setStatus("error")
      setIsErrorDialogOpen(true)
    }
  }, [token, isEn, t])

  useEffect(() => {
    if (!router.isReady) return
    if (token) {
      activateAccount()
    }
  }, [token, router.isReady, activateAccount])

  return (
    <div className="relative flex justify-center items-center min-h-screen overflow-hidden p-4">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/simpovidro.webp"
          alt="Background"
          fill
          className="object-cover brightness-[0.4]"
          priority
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      {/* Language Selector */}
      <div className="fixed top-4 right-4 flex items-center space-x-1 bg-white/80 backdrop-blur border border-slate-200/60 p-1 rounded-full shadow-sm z-50">
        <button
          type="button"
          onClick={() => handleLanguageChange("pt-BR")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            !isEn
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          PT
        </button>
        <button
          type="button"
          onClick={() => handleLanguageChange("en")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            isEn
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          EN
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>
              {t("Ativação de Conta", "Account Activation")}
            </CardTitle>
            <CardDescription>
              {status === "loading"
                ? t("Aguarde um momento...", "Please wait...")
                : t("Resultado da ativação", "Activation result")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6 text-center">
            {status === "loading" && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            )}
            {status === "success" && (
              <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 transition-all scale-110">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
            )}
            <p className={status === "error" ? "text-red-500" : ""}>
              {displayMessage}
            </p>
          </CardContent>
          {status === "success" && (
            <CardFooter className="flex justify-center border-t py-4">
              <Button className="w-full" onClick={() => router.push("/login")}>
                {t("Ir para o Login", "Go to Login")}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => router.push("/login")}
        title={t("Erro na Ativação", "Activation Error")}
        message={displayMessage}
        actionMessage={displayActionMessage}
        closeText={t("Ir para Login", "Go to Login")}
      />
    </div>
  )
}
