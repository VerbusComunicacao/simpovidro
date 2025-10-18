import { useState } from "react"
import { useRouter } from "next/router"
import AuthLayout from "../components/auth/AuthLayout"
import RegisterForm from "../components/auth/RegisterForm"
import { Button, Alert } from "../components"

export default function Register() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (formData) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Erro ao criar conta")
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Conta Criada!"
        subtitle="Sua conta foi criada com sucesso. Redirecionando para o login..."
      >
        <Alert
          type="success"
          style={{ textAlign: "center", padding: "1.5rem" }}
        >
          ✅ Conta criada com sucesso! Você será redirecionado para o login em
          breve.
        </Alert>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Criar Conta"
      subtitle="Junte-se à nossa comunidade e gerencie sua igreja"
    >
      {error && <Alert type="error">{error}</Alert>}

      <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <p style={{ color: "rgba(255, 255, 255, 0.8)", marginBottom: "1rem" }}>
          Já tem uma conta?
        </p>
        <Button
          variant="secondary"
          onClick={() => router.push("/login")}
          style={{ padding: "0.75rem 1.5rem" }}
        >
          Fazer Login
        </Button>
      </div>
    </AuthLayout>
  )
}
