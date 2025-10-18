import { useRouter } from "next/router"
import Button from "components/common/Button.js"
import useUser from "../../hooks/useUser"

export default function Header() {
  const router = useRouter()
  const { user, isLoading, logout } = useUser()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const renderUserNav = () => {
    if (isLoading) {
      return (
        <div style={{ color: "#667eea", fontSize: "0.9rem" }}>
          Carregando...
        </div>
      )
    }

    if (user) {
      return (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span
            style={{
              color: "#333",
              fontSize: "0.9rem",
              marginRight: "0.5rem",
            }}
          >
            Olá, {user.username}
          </span>
          <Button
            variant="header"
            onClick={handleLogout}
            style={{
              background: "transparent",
              color: "#e74c3c",
              border: "1px solid #e74c3c",
            }}
          >
            Sair
          </Button>
        </div>
      )
    }

    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          variant="header"
          onClick={() => router.push("/login")}
          style={{
            background: "transparent",
            color: "#667eea",
            border: "1px solid #667eea",
          }}
        >
          Entrar
        </Button>
        <Button variant="header" onClick={() => router.push("/register")}>
          Cadastrar
        </Button>
      </div>
    )
  }

  return (
    <header
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        padding: "1rem 2rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            color: "#333",
            margin: 0,
            fontSize: "1.8rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => router.push("/")}
        >
          IgrejaConnect
        </h1>
        <nav>{renderUserNav()}</nav>
      </div>
    </header>
  )
}
