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

export default function LoginPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady || isLoading) return
    if (user) {
      const redirect = router.query.redirect || "/inscricao"
      router.replace(redirect)
    }
  }, [user, isLoading, router])

  if (isLoading || user) {
    return <div>Carregando...</div>
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

      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Acesse sua Conta
            </CardTitle>
            <CardDescription>
              Entre com seu email e senha para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex-col items-center">
            <div className="mt-4 text-sm">
              <Link href="/forgot-password" passHref>
                <span className="text-blue-600 hover:underline">
                  Esqueceu a senha?
                </span>
              </Link>
            </div>
            <div className="mt-2 text-sm">
              Não tem uma conta?{" "}
              <Link href="/cadastro" passHref>
                <span className="text-blue-600 hover:underline">
                  Cadastre-se
                </span>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function LoginForm() {
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
      setError("Por favor, preencha todos os campos.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      })

      const responseBody = await response.json()

      if (response.status === 201) {
        await fetchUser()
        // The useEffect in LoginPage will handle redirection
        return
      }

      setError(responseBody.message || "Ocorreu um erro ao tentar fazer login.")
    } catch (err) {
      setError("Ocorreu um erro ao tentar fazer login.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formState.email}
          onChange={handleChange}
          placeholder="seu.email@exemplo.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formState.password}
          onChange={handleChange}
          placeholder="Digite sua senha"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  )
}
