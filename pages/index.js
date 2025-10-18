import { Header, HeroSection, Footer } from "../components"

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Header />
      <HeroSection />
      <Footer />
    </div>
  )
}
