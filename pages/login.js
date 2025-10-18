import { useState } from "react"
import { useRouter } from "next/router"
import AuthLayout from "../components/auth/AuthLayout"
import LoginForm from "../components/auth/LoginForm"
import { Button, Alert } from "../components"

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (formData) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Login bem-sucedido, redirecionar para dashboard ou home
        router.push("/")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Erro ao fazer login")
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse sua conta para gerenciar sua igreja"
    >
      {error && <Alert type="error">{error}</Alert>}

      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <p style={{ color: "rgba(255, 255, 255, 0.8)", marginBottom: "1rem" }}>
          Ainda não tem uma conta?
        </p>
        <Button
          variant="secondary"
          onClick={() => router.push("/register")}
          style={{ padding: "0.75rem 1.5rem" }}
        >
          Criar Conta
        </Button>
      </div>
    </AuthLayout>
  )
}
