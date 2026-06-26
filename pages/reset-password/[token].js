"use client"

import { useState } from "react"
import { useRouter } from "next/router"
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

export default function ResetPasswordPage() {
  const { t } = useLocale()
  const router = useRouter()
  const { token } = router.query

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError(t("As senhas não coincidem.", "Passwords do not match."))
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/v1/password-recovery/${token}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const responseBody = await response.json()

      if (response.ok) {
        setMessage(responseBody.message)
      } else {
        setError(
          responseBody.message ||
            t(
              "Ocorreu um erro ao tentar redefinir a senha.",
              "An error occurred while resetting the password.",
            ),
        )
      }
    } catch (err) {
      setError(
        t(
          "Ocorreu um erro ao tentar redefinir a senha.",
          "An error occurred while resetting the password.",
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  if (!token && router.isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-red-600 font-medium">
          {t(
            "Token de recuperação não encontrado.",
            "Recovery token not found.",
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {t("Nova Senha", "New Password")}
          </CardTitle>
          <CardDescription>
            {t(
              "Digite sua nova senha abaixo para redefinir o acesso.",
              "Enter your new password below to reset access.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="text-center space-y-4">
              <p className="text-green-600 font-medium">{message}</p>
              <Link href="/login" passHref>
                <Button className="w-full">
                  {t("Fazer login agora", "Log in now")}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  {t("Nova Senha", "New Password")}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t(
                    "Digite sua nova senha",
                    "Enter your new password",
                  )}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("Confirmar Nova Senha", "Confirm New Password")}
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t(
                    "Confirme sua nova senha",
                    "Confirm your new password",
                  )}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? t("Redefinindo...", "Resetting...")
                  : t("Redefinir Senha", "Reset Password")}
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
