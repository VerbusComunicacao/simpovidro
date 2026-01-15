import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin } from "lucide-react"
import Image from "next/image"
import router from "next/router"

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-[60vh]">
        <Image
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1473&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Simpovidro 2026"
          layout="fill"
          objectFit="cover"
          quality={100}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Simpovidro 2026
            </h1>
            <p className="mt-3 max-w-2xl text-xl">
              O maior encontro do setor vidreiro da América do Sul.
            </p>
            <div className="mt-8">
              <Button onClick={() => router.push("/inscricao")} size="lg">
                Inscreva-se Agora
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Sobre o Evento
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Organizado a cada dois anos pela Abravidro, o Simpovidro é o
              principal encontro do setor vidreiro na América do Sul. Reúne, em
              um ambiente descontraído, centenas de profissionais do segmento e
              suas famílias para uma programação cheia de conteúdo técnico,
              networking e lazer.
            </p>
            <p className="mt-4 text-lg text-gray-600">
              De caráter internacional, o simpósio recebe participantes não só
              do Brasil, mas de outras partes do mundo. É uma grande
              oportunidade para se relacionar com atuais ou futuros clientes,
              trocar informações de mercado e fechar negócios.
            </p>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold">Data</p>
                    <p>31 de outubro a 3 de novembro</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold">Local</p>
                    <p>Vila Galé Alagoas, Barra de Santo Antônio (AL)</p>
                  </div>
                </div>
                <div className="mt-8">
                  <Button
                    onClick={() => router.push("/inscricao")}
                    className="bg-blue-600"
                    size="lg"
                  >
                    Garanta sua vaga!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Localização
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Inaugurado em 2022, o Vila Galé Alagoas é o maior resort all
                inclusive do Estado, localizado à beira da belíssima Praia do
                Carro Quebrado, conhecida por suas falésias e piscinas naturais
                de água cristalina.
              </p>
              <p className="mt-4 text-lg text-gray-600">
                O resort está a cerca de 75 km do Aeroporto Internacional de
                Maceió – Zumbi dos Palmares. De carro, o trajeto pode ser
                percorrido de uma a uma hora e meia.
              </p>
            </div>
            <div className="h-96 rounded-lg bg-gray-300">
              {/* Placeholder for map */}
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">Mapa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Garanta sua Vaga no Simpovidro 2026!
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Não perca a chance de participar do maior encontro do setor vidreiro
            da América do Sul.
          </p>
          <div className="mt-8">
            <Button size="lg" variant="light">
              Inscreva-se Agora
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
