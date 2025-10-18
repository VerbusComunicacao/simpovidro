import { useEffect } from "react"
import useUser from "../../hooks/useUser"

export default function UserWelcome() {
  const { user, isLoading, fetchUser } = useUser()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  if (isLoading) {
    return (
      <div
        style={{
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: "1.1rem",
          marginBottom: "1rem",
        }}
      >
        Carregando...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div
      style={{
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: "1.1rem",
        marginBottom: "1rem",
        fontWeight: "500",
      }}
    >
      Olá, <strong>{user.username}</strong>! 👋
    </div>
  )
}
