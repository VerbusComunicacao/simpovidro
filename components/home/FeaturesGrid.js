import FeatureCard from "./FeatureCard"

const features = [
  {
    icon: "👥",
    title: "Gestão de Membros",
    description:
      "Cadastre e organize informações dos membros da sua igreja de forma segura e eficiente.",
  },
  {
    icon: "📅",
    title: "Eventos e Cultos",
    description:
      "Organize eventos, cultos e atividades da igreja com lembretes automáticos.",
  },
  {
    icon: "💰",
    title: "Controle Financeiro",
    description:
      "Gerencie dízimos, ofertas e despesas da igreja com relatórios detalhados.",
  },
]

export default function FeaturesGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "2rem",
        marginTop: "4rem",
      }}
    >
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  )
}
