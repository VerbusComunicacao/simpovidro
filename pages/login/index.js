"use client"

import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import Link from "next/link"
import useUser from "@/hooks/useUser"
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
import Image from "next/image"
import Sponsors from "@/components/home/Sponsors"

export default function LoginPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  const isEn = router.locale === "en" || router.query.lang === "en"
  const t = (pt, en) => (isEn ? en : pt)

  const handleLanguageChange = (lang) => {
    router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: lang },
    )
  }

  useEffect(() => {
    if (!router.isReady || isLoading) return
    if (user) {
      const redirect = router.query.redirect || "/inscricao"
      router.replace(redirect)
    }
  }, [user, isLoading, router])

  if (isLoading || user) {
    return <div>{t("Carregando...", "Loading...")}</div>
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
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
            <CardTitle className="text-2xl font-bold">
              {t("Acesse sua Conta", "Access your Account")}
            </CardTitle>
            <CardDescription>
              {t(
                "Entre com seu email e senha para continuar.",
                "Sign in with your email and password to continue.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm isEn={isEn} t={t} />
          </CardContent>
          <CardFooter className="flex-col items-center">
            <div className="mt-4 text-sm">
              <Link href="/forgot-password" passHref>
                <span className="text-blue-600 hover:underline">
                  {t("Esqueceu a senha?", "Forgot password?")}
                </span>
              </Link>
            </div>
            <div className="mt-2 text-sm">
              {t("Não tem uma conta? ", "Don't have an account? ")}
              <Link href="/cadastro" passHref>
                <span className="text-blue-600 hover:underline">
                  {t("Cadastre-se", "Sign up")}
                </span>
              </Link>
            </div>
            <Sponsors variant="mini" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function LoginForm({ isEn, t }) {
  const { fetchUser } = useUser()
  const [formState, setFormState] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formState.email || !formState.password) {
      setError(
        t("Por favor, preencha todos os campos.", "Please fill in all fields."),
      )
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formState,
          lang: isEn ? "en" : "pt-BR",
        }),
      })

      const responseBody = await response.json()

      if (response.status === 201) {
        await fetchUser()
        // The useEffect in LoginPage will handle redirection
        return
      }

      setError(
        responseBody.message ||
          t(
            "Ocorreu um erro ao tentar fazer login.",
            "An error occurred while trying to log in.",
          ),
      )
    } catch (err) {
      setError(
        t(
          "Ocorreu um erro ao tentar fazer login.",
          "An error occurred while trying to log in.",
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("Email", "Email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formState.email}
          onChange={handleChange}
          placeholder="your.email@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("Senha", "Password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formState.password}
          onChange={handleChange}
          placeholder={t("Digite sua senha", "Enter your password")}
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("Entrando...", "Signing in...") : t("Entrar", "Sign In")}
      </Button>
    </form>
  )
}
