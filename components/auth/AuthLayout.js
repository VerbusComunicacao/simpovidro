import Container from "components/common/Container.js"

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 0",
      }}
    >
      <Container style={{ textAlign: "center" }}>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "3rem 2rem",
            borderRadius: "20px",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              color: "white",
              fontSize: "2.5rem",
              marginBottom: "0.5rem",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            IgrejaConnect
          </h1>

          <h2
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "1.5rem",
              marginBottom: "1rem",
              fontWeight: "600",
            }}
          >
            {title}
          </h2>

          {subtitle && (
            <p
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "1rem",
                marginBottom: "2rem",
                lineHeight: "1.5",
              }}
            >
              {subtitle}
            </p>
          )}

          {children}
        </div>
      </Container>
    </div>
  )
}
