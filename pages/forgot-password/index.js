"use client"

import { useState } from "react"
import Link from "next/link"
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
import { useLocale } from "@/hooks/useLocale"

export default function ForgotPasswordPage() {
  const { t, isEn } = useLocale()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch("/api/v1/password-recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, lang: isEn ? "en" : "pt-BR" }),
      })

      const responseBody = await response.json()

      if (response.ok) {
        setMessage(responseBody.message)
      } else {
        setError(
          responseBody.message ||
            t(
              "Ocorreu um erro ao tentar solicitar a recuperação.",
              "An error occurred while requesting password recovery.",
            ),
        )
      }
    } catch (err) {
      setError(
        t(
          "Ocorreu um erro ao tentar solicitar a recuperação.",
          "An error occurred while requesting password recovery.",
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {t("Recuperar Senha", "Reset Password")}
          </CardTitle>
          <CardDescription>
            {t(
              "Informe seu e-mail para receber um link de redefinição de senha.",
              "Enter your email to receive a password reset link.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="text-center space-y-4">
              <p className="text-green-600 font-medium">{message}</p>
              <Link href="/login" passHref>
                <Button variant="outline" className="w-full">
                  {t("Voltar para o login", "Back to login")}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("Email", "Email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t(
                    "seu.email@exemplo.com",
                    "your.email@example.com",
                  )}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? t("Enviando...", "Sending...")
                  : t("Enviar link de recuperação", "Send recovery link")}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" passHref>
            <span className="text-sm text-blue-600 hover:underline">
              {t("Voltar para o login", "Back to login")}
            </span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export async function getServerSideProps() {
  return {
    props: {},
  }
}
