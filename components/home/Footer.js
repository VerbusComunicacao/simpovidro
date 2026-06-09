import { Facebook, Instagram, Linkedin, Phone, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Footer({ scrollToSection }) {
  return (
    <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <Image
                src="/images/icon-17-simpovidro.png"
                alt="Simpovidro Icon"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-white font-title text-xl uppercase tracking-tight">
                Simpovidro
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Referência nacional e internacional no setor vidreiro. Excelência
              em organização pela Abravidro.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 tracking-tight uppercase text-xs">
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
                  href="#local"
                  onClick={(e) => scrollToSection(e, "local")}
                  className="hover:text-white transition-colors"
                >
                  Local
                </a>
              </li>
              <li>
                <a
                  href="#programacao"
                  onClick={(e) => scrollToSection(e, "programacao")}
                  className="hover:text-white transition-colors"
                >
                  Programação (em breve)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 tracking-tight uppercase text-xs">
              Logística
            </h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href="#condicoes-especiais"
                  onClick={(e) => scrollToSection(e, "condicoes-especiais")}
                  className="hover:text-white transition-colors"
                >
                  Condições Especiais
                </a>
              </li>
              <li>
                <a
                  href="#acomodacoes"
                  onClick={(e) => scrollToSection(e, "acomodacoes")}
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
                  Informe seu voo
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
            <h4 className="text-white font-bold mb-6 tracking-tight uppercase text-xs">
              Organização
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Image
                  src={"/images/logo_branco_ABRAVIDRO.png"}
                  alt={`Simpovidro Icon`}
                  width={140}
                  height={140}
                />
              </div>
              <p className="flex items-center gap-2 italic">
                <Phone className="h-3 w-3" /> (11) 3873-9908
              </p>
              <p className="flex items-center gap-2 italic">
                <Mail className="h-3 w-3" /> simpovidro@abravidro.org.br
              </p>
            </div>
            <div className="flex gap-4 mt-5">
              <a href="https://www.facebook.com/Abravidro">
                <Facebook className="h-5 w-5 hover:text-white cursor-pointer transition-colors" />
              </a>
              <a href="https://www.instagram.com/abravidro/">
                <Instagram className="h-5 w-5 hover:text-white cursor-pointer transition-colors" />
              </a>
              <a href="https://br.linkedin.com/company/abravidro">
                <Linkedin className="h-5 w-5 hover:text-white cursor-pointer transition-colors" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium uppercase tracking-[0.2em]">
          <p>
            © 2026 Associação Brasileira de Distribuidores e Processadores de
            Vidros Planos.
          </p>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-white">Privacidade</span>
            <Link
              href="/condicoes-gerais"
              className="cursor-pointer hover:text-white"
            >
              Condições Gerais
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
