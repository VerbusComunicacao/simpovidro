export default function Button({
  children,
  variant = "primary",
  onClick,
  style = {},
  ...props
}) {
  const baseStyle = {
    border: "none",
    padding: "1rem 2rem",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s",
    ...style,
  }

  const variants = {
    primary: {
      background: "white",
      color: "#667eea",
      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    },
    secondary: {
      background: "transparent",
      color: "white",
      border: "2px solid white",
    },
    header: {
      background: "#667eea",
      color: "white",
      padding: "0.5rem 1rem",
      borderRadius: "5px",
      fontSize: "1rem",
      marginLeft: "1rem",
    },
  }

  const finalStyle = {
    ...baseStyle,
    ...variants[variant],
  }

  return (
    <button style={finalStyle} onClick={onClick} {...props}>
      {children}
    </button>
  )
}
