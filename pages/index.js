import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  MapPin,
  Users,
  Star,
  Zap,
  Hotel,
  Plane,
  ChevronRight,
  Menu,
  Facebook,
  Instagram,
  Linkedin,
  Phone,
  Mail,
  Info,
  History,
  ShieldCheck,
} from "lucide-react"
import Image from "next/image"
import Head from "next/head"
import router from "next/router"
import { useState, useEffect } from "react"

const HERO_IMAGE = "/images/hero_banner.png"
const RESORT_IMAGE = "/images/resort.png"

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (e, id) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80, // Offset for sticky header
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Head>
        <title>17º Simpovidro | O Encontro do Setor Vidreiro</title>
        <meta
          name="description"
          content="O maior encontro do setor vidreiro da América do Sul. Inovação, networking e excelência profissional."
        />
      </Head>

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm py-3"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            <span
              className={`text-xl font-bold tracking-tight ${
                scrolled ? "text-slate-900" : "text-white"
              }`}
            >
              Simpovidro
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {[
              { name: "Sobre", id: "sobre" },
              { name: "Palestrantes", id: "palestrantes" },
              { name: "Programação", id: "programacao" },
              { name: "Preços", id: "precos" },
              { name: "Dicas e lembretes", id: "dicas" },
            ].map((item) => (
              <a
                key={item.name}
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className={`${
                  scrolled
                    ? "text-slate-600 hover:text-blue-600"
                    : "text-white/80 hover:text-white"
                } transition-colors cursor-pointer`}
              >
                {item.name}
              </a>
            ))}
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
              onClick={() => router.push("/inscricao")}
            >
              Inscreva-se
            </Button>
          </div>

          <button className="md:hidden text-white">
            <Menu className={scrolled ? "text-slate-900" : "text-white"} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={HERO_IMAGE}
            alt="Futuristic Glass Architecture"
            layout="fill"
            objectFit="cover"
            priority
            className="brightness-[0.45] saturate-[0.85] contrast-[1.05]"
          />
          {/* Sofisticated Blue Tint Overlay - Legibilidade sem "sujar" o visual */}
          <div className="absolute inset-0 bg-blue-950/20 mix-blend-multiply"></div>
          {/* Depth Gradient - Removido o to-slate-50 para não branquear os stats */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md px-4 py-1 text-sm rounded-full">
            Inovação & Networking
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] italic">
            17º SIMPOVIDRO
          </h1>
          <p className="text-xl md:text-2xl text-blue-50 max-w-3xl mx-auto mb-10 font-bold leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            Redefinindo os horizontes da indústria vidreira. Um encontro de
            exclusividade, negócios e alto nível técnico no paraíso de Alagoas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-14 px-10 text-lg shadow-xl shadow-blue-500/25 transition-transform hover:scale-105"
              onClick={() => router.push("/inscricao")}
            >
              Quero Me Inscrever <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-lg border-white/20 text-white hover:bg-white/20 rounded-full h-14 px-10 text-lg transition-all"
              onClick={(e) => scrollToSection(e, "programacao")}
            >
              Ver Programação
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Calendar, label: "31 Out - 03 Nov", sub: "2026" },
              {
                icon: MapPin,
                label: "Vila Galé Alagoas",
                sub: "Barra de Santo Antônio",
              },
              { icon: Users, label: "+1.000", sub: "Participantes" },
              { icon: Star, label: "Excelência", sub: "Abravidro" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <stat.icon className="h-6 w-6 text-blue-400 mb-2" />
                <span className="font-bold text-lg">{stat.label}</span>
                <span className="text-xs text-white/60 uppercase tracking-widest">
                  {stat.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro Section - Sobre */}
      <section id="sobre" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-blue-600 font-bold uppercase tracking-widest text-sm">
                O Evento
              </h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                Mais que um simpósio, uma experiência transformadora.
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                Organizado pela Abravidro, o Simpovidro consolida sua posição
                como o ambiente estratégico central para networking, debates e
                atualização do setor vidreiro brasileiro.
              </p>
              <div className="space-y-4 pt-4">
                {[
                  "Desenvolvimento Técnico de Ponta",
                  "Networking de Alto Nível",
                  "Experiência Internacional",
                  "Ambiente Familiar Exclusivo",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={RESORT_IMAGE}
                alt="Vila Galé Alagoas"
                layout="fill"
                objectFit="cover"
              />
              <div className="absolute bottom-6 left-6 right-6 p-6 bg-blue-900/60 backdrop-blur-sm border border-white/30 rounded-2xl text-white">
                <p className="font-bold text-lg">Hospitalidade Vila Galé</p>
                <p className="text-sm opacity-90">
                  O maior resort all-inclusive de Alagoas aguarda por você.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Speakers Section */}
      <section
        id="palestrantes"
        className="py-24 bg-slate-900 text-white overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-4">
              Mentes Brilhantes
            </h2>
            <h3 className="text-4xl md:text-5xl font-black mb-6">
              Palestrantes Confirmados
            </h3>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Líderes de pensamento e especialistas globais compartilhando
              insights que moldarão o futuro do nosso setor.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                name: "Roberto Justus",
                role: "Negócios & Liderança",
                specialty: "Estratégia Empresarial",
                image: "/images/roberto-justos.webp",
              },
              {
                name: "Ricardo Amorim",
                role: "Economia & Futuro",
                specialty: "Análise de Mercado",
                image: "/images/ricardo-amorim.jpg",
              },
              {
                name: "Menzinho",
                role: "Criatividade & Performance",
                specialty: "Comunicação Disruptiva",
                image: "/images/menzinho.jpg",
              },
            ].map((p, i) => (
              <div key={i} className="group relative">
                <div className="aspect-[3/4] rounded-3xl bg-slate-800 overflow-hidden mb-6 relative shadow-2xl transition-all duration-500 group-hover:shadow-blue-500/10 group-hover:-translate-y-2">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      layout="fill"
                      objectFit="cover"
                      className="grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                      <Users className="h-24 w-24 opacity-10" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10"></div>
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-black group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                    {p.name}
                  </h4>
                  <p className="text-blue-400 font-bold text-sm mt-1">
                    {p.role}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-black underline decoration-blue-500/30 underline-offset-4">
                    {p.specialty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programming Preview */}
      <section id="programacao" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4">
                Programação
              </h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                Um roteiro pensado para o seu sucesso.
              </h3>
            </div>
            <Button variant="ghost" className="text-blue-600 font-bold">
              Ver Cronograma Completo <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                day: "Dia 1",
                theme: "Abertura & Networking",
                time: "31 Out",
                desc: "Welcome Cocktail e cerimônia de abertura oficial.",
              },
              {
                day: "Dia 2",
                theme: "Inovação Técnica",
                time: "01 Nov",
                desc: "Palestras técnicas e rodadas de negócios para líderes.",
              },
              {
                day: "Dia 3",
                theme: "Futuro do Setor",
                time: "02 Nov",
                desc: "Encerramento técnico e jantar de gala comemorativo.",
              },
            ].map((d, i) => (
              <Card
                key={i}
                className="border-none shadow-lg hover:shadow-xl transition-shadow bg-slate-50"
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                    >
                      {d.day}
                    </Badge>
                    <span className="text-slate-400 font-bold">{d.time}</span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {d.theme}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">{d.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Acomodações Sidebar */}
      <section
        id="precos"
        className="py-24 bg-slate-50 border-y border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                Benefícios & Inscrição
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed font-medium">
                O Simpovidro é um evento exclusivo. Garanta condições especiais
                através do associativismo e participe do maior encontro do
                setor.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-16 h-16 text-blue-600" />
                  </div>
                  <h4 className="text-blue-900 font-black text-xl mb-2 italic">
                    SÓCIO ABRAVIDRO
                  </h4>
                  <div className="text-5xl font-black text-blue-600 mb-4 tracking-tighter">
                    20%{" "}
                    <span className="text-lg font-bold text-blue-400">OFF</span>
                  </div>
                  <p className="text-blue-700/70 text-sm font-bold leading-relaxed">
                    Desconto exclusivo para empresas associadas à Abravidro em
                    todas as categorias de inscrição.
                  </p>
                </div>

                <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl hover:shadow-blue-500/10 transition-shadow group relative overflow-hidden text-white">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <MapPin className="w-16 h-16 text-blue-400" />
                  </div>
                  <h4 className="text-blue-400 font-black text-xl mb-2 italic uppercase">
                    Entidades Regionais
                  </h4>
                  <div className="text-5xl font-black text-white mb-4 tracking-tighter">
                    15%{" "}
                    <span className="text-lg font-bold text-slate-500">
                      OFF
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm font-bold leading-relaxed">
                    Condição especial para associados de entidades regionais
                    parceiras do Simpovidro.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl border-l-4 border-l-blue-600">
                <Info className="h-6 w-6 text-blue-600 shrink-0" />
                <p className="text-sm text-slate-600 font-bold italic">
                  As inscrições contemplam acesso total às palestras, feira de
                  negócios, coquetel de abertura e jantar de encerramento.
                </p>
              </div>
            </div>

            <div id="logistica" className="space-y-6">
              <Card className="bg-blue-600 text-white border-none shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hotel className="h-5 w-5" /> Acomodações
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Exclusividade Vila Galé Alagoas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm opacity-90">
                    Centralizamos as reservas para garantir que você esteja no
                    coração do evento com tarifas especiais Simpovidro.
                  </p>
                  <Button className="w-full bg-white text-blue-600 hover:bg-slate-100">
                    Consultar Quartos
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Plane className="h-5 w-5 text-blue-600" /> Passagens Aéreas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Nossa agência parceira oferece suporte logístico completo
                    para o seu voo até Maceió.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Solicitar Cotação
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Dicas & Lembretes */}
      <section id="dicas" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4">
              Preparação
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 italic tracking-tighter">
              Dicas & Lembretes
            </h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Vestimenta",
                desc: "Esporte fino para as reuniões técnicas e casual chic para os eventos sociais.",
              },
              {
                title: "Check-in",
                desc: "Início oficial às 15h do dia 31 de Outubro. Chegue cedo para o networking.",
              },
              {
                title: "Transporte",
                desc: "Shuttles oficiais disponíveis entre o aeroporto e o resort em horários marcados.",
              },
              {
                title: "Exclusividade",
                desc: "Lembre-se de portar seu crachá em todas as áreas do evento e refeições.",
              },
            ].map((tip, i) => (
              <div
                key={i}
                className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-colors group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 transition-colors">
                  <Info className="h-6 w-6 text-blue-600 group-hover:text-white" />
                </div>
                <h4 className="text-xl font-bold mb-3">{tip.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Edições Anteriores & Credibilidade */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 italic tracking-tighter uppercase">
                Uma Tradição de Sucesso
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed italic font-medium">
                Através das edições anteriores, o Simpovidro já reuniu mais de
                15.000 profissionais, gerando bilhões em parcerias e negócios.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  "16ª Edição - Alagoas",
                  "15ª Edição - Mato Grosso",
                  "14ª Edição - Pernambuco",
                ].map((ed, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="px-4 py-2 bg-white text-slate-600 border-slate-200 font-bold flex gap-2"
                  >
                    <History className="h-4 w-4 text-blue-600" /> {ed}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square bg-slate-200 rounded-3xl overflow-hidden relative shadow-lg grayscale">
                <Image
                  src={HERO_IMAGE}
                  alt="History"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="aspect-square bg-slate-200 rounded-3xl overflow-hidden relative shadow-lg translate-y-8">
                <Image
                  src={RESORT_IMAGE}
                  alt="History 2"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors - Partners Area */}
      <section id="patrocinadores" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">
              Apoio Estratégico
            </h2>
            <h3 className="text-3xl font-black text-slate-900">
              Principais Patrocinadores
            </h3>
          </div>

          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-50 hover:opacity-100 transition-opacity">
            {["Diamante", "Platina", "Ouro", "Prata", "Bronze"].map((level) => (
              <div
                key={level}
                className="flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-crosshair"
              >
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                  <Star className="w-8 h-8 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-tighter uppercase">
                  {level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-20 bg-blue-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Pronto para o maior evento da sua carreira?
          </h2>
          <p className="text-lg text-blue-100 mb-10 opacity-80">
            Junte-se à elite do setor vidreiro e transforme seu futuro. Vagas
            limitadas.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-700 hover:bg-slate-100 rounded-full h-14 px-12 text-lg shadow-2xl transition-transform hover:scale-110"
            onClick={() => router.push("/inscricao")}
          >
            Garantir Minha Vaga Agora
          </Button>
        </div>
      </section>

      {/* Condições Gerais / Segurança CTA */}
      <section className="py-12 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            <p className="text-sm font-bold text-slate-700">
              A sua segurança e privacidade são prioridades.{" "}
              <a href="#" className="underline text-blue-600 ml-1">
                Leia as Condições Gerais.
              </a>
            </p>
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">
            ORGANIZAÇÃO: ABRAVIDRO
          </p>
        </div>
      </section>

      {/* Final CTA Full Screen */}
      <section className="py-32 bg-slate-950 relative overflow-hidden text-center text-white">
        <div className="absolute top-0 left-0 w-full h-full">
          <Image
            src={HERO_IMAGE}
            alt="Glass BG"
            layout="fill"
            objectFit="cover"
            className="opacity-20 saturate-0 scale-125 blur-sm"
          />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-color"></div>
          <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter leading-none uppercase">
            Presença Única. Futuro Sólido.
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 opacity-80 font-light leading-relaxed">
            Não fique de fora do ambiente de negócios mais qualificado da
            América Latina.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 items-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-16 px-14 text-xl font-bold shadow-2xl transition-all hover:scale-110 shadow-blue-500/50"
              onClick={() => router.push("/inscricao")}
            >
              INSCREVA-SE AGORA
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-white/20 text-white hover:bg-white/10 rounded-full h-16 px-14 text-xl font-bold"
            >
              FALAR COM CONSULTOR
            </Button>
          </div>
        </div>
      </section>
      <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                  S
                </div>
                <span className="text-white font-bold text-xl">Simpovidro</span>
              </div>
              <p className="text-sm leading-relaxed">
                Referência nacional e internacional no setor vidreiro.
                Excelência em organização pela Abravidro.
              </p>
              <div className="flex gap-4">
                <Facebook className="h-5 w-5 hover:text-white cursor-pointer transition-colors" />
                <Instagram className="h-5 w-5 hover:text-white cursor-pointer transition-colors" />
                <Linkedin className="h-5 w-5 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 italic tracking-tight uppercase text-xs">
                Menu
              </h4>
              <ul className="space-y-4 text-slate-400">
                <li>
                  <a
                    href="#sobre"
                    onClick={(e) => scrollToSection(e, "sobre")}
                    className="hover:text-white transition-colors"
                  >
                    Sobre
                  </a>
                </li>
                <li>
                  <a
                    href="#palestrantes"
                    onClick={(e) => scrollToSection(e, "palestrantes")}
                    className="hover:text-white transition-colors"
                  >
                    Palestrantes
                  </a>
                </li>
                <li>
                  <a
                    href="#programacao"
                    onClick={(e) => scrollToSection(e, "programacao")}
                    className="hover:text-white transition-colors"
                  >
                    Programação
                  </a>
                </li>
                <li>
                  <a
                    href="#patrocinadores"
                    onClick={(e) => scrollToSection(e, "patrocinadores")}
                    className="hover:text-white transition-colors"
                  >
                    Patrocinadores
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 italic tracking-tight uppercase text-xs">
                Logística
              </h4>
              <ul className="space-y-4 text-sm">
                <li>
                  <a
                    href="#precos"
                    onClick={(e) => scrollToSection(e, "precos")}
                    className="hover:text-white transition-colors"
                  >
                    Benfícios & Investimento
                  </a>
                </li>
                <li>
                  <a
                    href="#logistica"
                    onClick={(e) => scrollToSection(e, "logistica")}
                    className="hover:text-white transition-colors"
                  >
                    Acomodações
                  </a>
                </li>
                <li>
                  <a
                    href="#logistica"
                    onClick={(e) => scrollToSection(e, "logistica")}
                    className="hover:text-white transition-colors"
                  >
                    Passagens
                  </a>
                </li>
                <li>
                  <a
                    href="#dicas"
                    onClick={(e) => scrollToSection(e, "dicas")}
                    className="hover:text-white transition-colors"
                  >
                    Dicas & Lembretes
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 italic tracking-tight uppercase text-xs">
                Organização
              </h4>
              <div className="space-y-2 text-sm">
                <p className="text-slate-200">Abravidro</p>
                <p className="flex items-center gap-2 italic">
                  <Phone className="h-3 w-3" /> (11) 3873-9908
                </p>
                <p className="flex items-center gap-2 italic">
                  <Mail className="h-3 w-3" /> abravidro@abravidro.org.br
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium uppercase tracking-[0.2em]">
            <p>
              © 2026 Associação Brasileira de Distribuidores e Processadores de
              Vidros Planos.
            </p>
            <div className="flex gap-6">
              <span className="cursor-pointer hover:text-white">
                Privacidade
              </span>
              <span className="cursor-pointer hover:text-white">
                Condições Gerais
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
