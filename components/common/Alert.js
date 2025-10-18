export default function Alert({ type = "error", children, style = {} }) {
  const alertStyles = {
    error: {
      background: "rgba(255, 107, 107, 0.2)",
      border: "1px solid #ff6b6b",
      color: "#ff6b6b",
    },
    success: {
      background: "rgba(76, 175, 80, 0.2)",
      border: "1px solid #4caf50",
      color: "#4caf50",
    },
    info: {
      background: "rgba(33, 150, 243, 0.2)",
      border: "1px solid #2196f3",
      color: "#2196f3",
    },
    warning: {
      background: "rgba(255, 193, 7, 0.2)",
      border: "1px solid #ffc107",
      color: "#ffc107",
    },
  }

  const baseStyle = {
    borderRadius: "8px",
    padding: "1rem",
    fontSize: "0.9rem",
    marginBottom: "1.5rem",
    ...alertStyles[type],
    ...style,
  }

  return <div style={baseStyle}>{children}</div>
}
