import { useState } from "react"
import Button from "components/common/Button.js"
import Container from "components/common/Container.js"

export default function RegisterForm({ onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem"
    }

    if (formData.password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres"
    }

    if (!formData.username.trim()) {
      newErrors.username = "Nome de usuário é obrigatório"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      const { confirmPassword, ...userData } = formData
      onSubmit(userData)
    }
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
            Nome de Usuário
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: `1px solid ${errors.username ? "#ff6b6b" : "rgba(255, 255, 255, 0.3)"}`,
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: "1rem",
              backdropFilter: "blur(10px)",
            }}
            placeholder="seu_usuario"
          />
          {errors.username && (
            <p
              style={{
                color: "#ff6b6b",
                fontSize: "0.875rem",
                marginTop: "0.25rem",
              }}
            >
              {errors.username}
            </p>
          )}
        </div>

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
              border: `1px solid ${errors.email ? "#ff6b6b" : "rgba(255, 255, 255, 0.3)"}`,
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: "1rem",
              backdropFilter: "blur(10px)",
            }}
            placeholder="seu@email.com"
          />
          {errors.email && (
            <p
              style={{
                color: "#ff6b6b",
                fontSize: "0.875rem",
                marginTop: "0.25rem",
              }}
            >
              {errors.email}
            </p>
          )}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
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
              border: `1px solid ${errors.password ? "#ff6b6b" : "rgba(255, 255, 255, 0.3)"}`,
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: "1rem",
              backdropFilter: "blur(10px)",
            }}
            placeholder="Mínimo 6 caracteres"
          />
          {errors.password && (
            <p
              style={{
                color: "#ff6b6b",
                fontSize: "0.875rem",
                marginTop: "0.25rem",
              }}
            >
              {errors.password}
            </p>
          )}
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
            Confirmar Senha
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: `1px solid ${errors.confirmPassword ? "#ff6b6b" : "rgba(255, 255, 255, 0.3)"}`,
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: "1rem",
              backdropFilter: "blur(10px)",
            }}
            placeholder="Confirme sua senha"
          />
          {errors.confirmPassword && (
            <p
              style={{
                color: "#ff6b6b",
                fontSize: "0.875rem",
                marginTop: "0.25rem",
              }}
            >
              {errors.confirmPassword}
            </p>
          )}
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
          {isLoading ? "Criando conta..." : "Criar Conta"}
        </Button>
      </form>
    </Container>
  )
}
