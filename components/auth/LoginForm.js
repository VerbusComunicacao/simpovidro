import { useState } from "react"
import Button from "components/common/Button.js"
import Container from "components/common/Container.js"

export default function LoginForm({ onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Container style={{ maxWidth: "400px", margin: "2rem auto" }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "white",
              fontWeight: "bold",
            }}
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: "1rem",
              backdropFilter: "blur(10px)",
            }}
            placeholder="seu@email.com"
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "white",
              fontWeight: "bold",
            }}
          >
            Senha
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: "1rem",
              backdropFilter: "blur(10px)",
            }}
            placeholder="Sua senha"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.1rem",
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
          disabled={isLoading}
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Container>
  )
}
