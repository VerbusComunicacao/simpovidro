import { useState } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { useLocale } from "@/hooks/useLocale"

export default function Register() {
  const { t, isEn } = useLocale()
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  /*
  const handleLanguageChange = (lang) => {
    router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: lang },
    )
  }
  */

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setAction("")
    setLoading(true)

    if (password !== confirmPassword) {
      setError(t("As senhas não coincidem.", "Passwords do not match."))
      setIsErrorDialogOpen(true)
      setLoading(false)
      return
    }

    const response = await fetch("/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        lang: isEn ? "en" : "pt-BR",
      }),
    })

    setLoading(false)

    if (response.ok) {
      setSuccess(true)
    } else {
      const data = await response.json()
      setError(
        data.message ||
          t(
            "Ocorreu um erro no seu cadastro.",
            "An error occurred during registration.",
          ),
      )
      if (data.action) {
        setAction(data.action)
      }
      setIsErrorDialogOpen(true)
    }
  }

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
      {/*
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
      */}

      <div className="relative z-10 w-full max-w-md px-4">
        {success ? (
          <Card className="w-full text-center py-8">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
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
              <CardTitle>
                {t("Verifique seu e-mail", "Verify your email")}
              </CardTitle>
              <CardDescription className="text-base pt-2">
                {t(
                  <>
                    Enviamos um link de ativação para <strong>{email}</strong>.
                    Por favor, acesse seu e-mail para confirmar seu cadastro.
                  </>,
                  <>
                    We sent an activation link to <strong>{email}</strong>.
                    Please check your email to confirm your registration.
                  </>,
                )}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pb-0">
              <Button variant="outline" onClick={() => router.push("/login")}>
                {t("Voltar para o Login", "Back to Login")}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                {t("Crie sua conta", "Create your account")}
              </CardTitle>
              <CardDescription>
                {t(
                  "Preencha os dados abaixo para se cadastrar.",
                  "Fill in the details below to register.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="fullName">
                    {t("Nome Completo", "Full Name")}
                  </Label>
                  <Input
                    id="fullName"
                    placeholder={t("Ex: João Silva", "E.g. John Doe")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">{t("E-mail", "Email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">{t("Senha", "Password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="confirmPassword">
                    {t("Confirme a Senha", "Confirm Password")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading
                    ? t("Processando...", "Processing...")
                    : t("Cadastrar", "Register")}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t py-4">
              <p className="text-sm text-gray-500">
                {t("Já tem uma conta? ", "Already have an account? ")}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold"
                  onClick={() => router.push("/login")}
                >
                  {t("Entre aqui", "Log in here")}
                </Button>
              </p>
            </CardFooter>
          </Card>
        )}
      </div>

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title={t("Erro no Cadastro", "Registration Error")}
        message={error}
        actionMessage={action}
        closeText={t("Fechar", "Close")}
      />
    </div>
  )
}

export async function getServerSideProps() {
  return {
    props: {},
  }
}
