import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Container from "components/common/Container"
import Button from "components/common/Button"
import Alert from "components/common/Alert"

export default function Activate() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [alertType, setAlertType] = useState("info")
  const router = useRouter()
  const { token } = router.query

  useEffect(() => {
    if (token) {
      handleActivate()
    }
  }, [token])

  const handleActivate = async () => {
    if (!token) {
      setMessage("Token não encontrado")
      setAlertType("error")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/v1/activation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Conta ativada com sucesso! Você pode fazer login agora.")
        setAlertType("success")

        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setMessage(data.message || "Erro ao ativar conta")
        setAlertType("error")
      }
    } catch (error) {
      setMessage("Erro ao ativar conta. Tente novamente mais tarde.")
      setAlertType("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem 0" }}>
        <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
          Ativar Conta
        </h1>

        {token ? (
          <div>
            <p style={{ textAlign: "center", marginBottom: "2rem" }}>
              {loading
                ? "Ativando sua conta..."
                : "Clique no botão abaixo para ativar sua conta:"}
            </p>

            {!loading && (
              <div style={{ textAlign: "center" }}>
                <Button
                  onClick={handleActivate}
                  disabled={loading}
                  style={{ marginBottom: "1rem" }}
                >
                  Ativar Conta
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p style={{ textAlign: "center" }}>
            Token não encontrado. Verifique o link do email.
          </p>
        )}

        {message && (
          <Alert type={alertType} style={{ marginTop: "1rem" }}>
            {message}
          </Alert>
        )}

        {alertType === "success" && (
          <p
            style={{
              textAlign: "center",
              marginTop: "1rem",
              fontSize: "0.9rem",
            }}
          >
            Você será redirecionado para a página de login em alguns segundos...
          </p>
        )}
      </div>
    </Container>
  )
}
