export default function FeatureCard({ icon, title, description }) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.1)",
        padding: "2rem",
        borderRadius: "15px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <div
        style={{
          fontSize: "3rem",
          marginBottom: "1rem",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          color: "white",
          fontSize: "1.5rem",
          marginBottom: "1rem",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "rgba(255, 255, 255, 0.8)",
          lineHeight: "1.6",
        }}
      >
        {description}
      </p>
    </div>
  )
}
