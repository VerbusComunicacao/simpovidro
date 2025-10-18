export default function Container({ children, style = {} }) {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 2rem",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
