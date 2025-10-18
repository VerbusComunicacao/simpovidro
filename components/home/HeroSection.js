import { useEffect } from "react"
import Button from "../common/Button"
import Container from "../common/Container"
import FeaturesGrid from "./FeaturesGrid"
import UserWelcome from "./UserWelcome"
import useUser from "../../hooks/useUser"

export default function HeroSection() {
  const { user, isLoading, fetchUser } = useUser()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const getWelcomeMessage = () => {
    if (isLoading) return "Carregando..."
    if (user) return "Bem-vindo de volta!"
    return "Gestão Completa para sua Igreja"
  }

  const getDescription = () => {
    if (user) {
      return `Olá ${user.username}! Acesse todas as funcionalidades da sua igreja em um só lugar.`
    }
    return "Organize membros, eventos, finanças e muito mais em uma plataforma moderna e fácil de usar."
  }

  const getButtonText = () => {
    if (user) return "Acessar Dashboard"
    return "Começar Agora"
  }

  return (
    <main
      style={{
        padding: "4rem 0",
        textAlign: "center",
      }}
    >
      <Container>
        <UserWelcome />

        <h2
          style={{
            color: "white",
            fontSize: "3rem",
            marginBottom: "1rem",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          {getWelcomeMessage()}
        </h2>

        <p
          style={{
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: "1.2rem",
            marginBottom: "2rem",
            maxWidth: "600px",
            margin: "0 auto 2rem auto",
            lineHeight: "1.6",
          }}
        >
          {getDescription()}
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "4rem",
          }}
        >
          <Button variant="primary">{getButtonText()}</Button>
          {!user && <Button variant="secondary">Saiba Mais</Button>}
        </div>

        <FeaturesGrid />
      </Container>
    </main>
  )
}
