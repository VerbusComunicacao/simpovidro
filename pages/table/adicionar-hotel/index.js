import { useState } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { PricePolicyManager } from "@/components/hotel/PricePolicyManager"
import { maskPhone } from "@/lib/masks"
import { validatePhone } from "@/lib/validators"
import { LocationSelector } from "@/components/ui/LocationSelector"

export default function AddHotelPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [stateCode, setStateCode] = useState("")
  const [country, setCountry] = useState("Brasil")
  const [countryCode, setCountryCode] = useState("BR")
  const [checkInDate, setCheckInDate] = useState("")
  const [checkOutDate, setCheckOutDate] = useState("")
  const [checkoutQuestion, setCheckoutQuestion] = useState("")
  const [checkoutQuestionEn, setCheckoutQuestionEn] = useState("")
  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pricePolicies, setPricePolicies] = useState([])

  const handleLocationChange = (loc) => {
    if (loc.country !== undefined) setCountry(loc.country)
    if (loc.countryCode !== undefined) setCountryCode(loc.countryCode)
    if (loc.state !== undefined) setState(loc.state)
    if (loc.stateCode !== undefined) setStateCode(loc.stateCode)
    if (loc.city !== undefined) setCity(loc.city)
  }

  const handlePhoneChange = (e) => {
    setPhone(maskPhone(e.target.value))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setAction("")
    setAction("")

    if (phone && !validatePhone(phone)) {
      setError("Telefone inválido.")
      return
    }

    setLoading(true)

    const response = await fetch("/api/v1/hotels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        address,
        city,
        state,
        country,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        checkout_question: checkoutQuestion,
        checkout_question_en: checkoutQuestionEn,
        price_policies: pricePolicies,
      }),
    })

    setLoading(false)

    if (response.ok) {
      router.push("/table")
    } else {
      const data = await response.json()
      setError(data.message || "Ocorreu um erro ao adicionar o hotel.")
      if (data.action) {
        setAction(data.action)
      }
      setIsErrorDialogOpen(true)
    }
  }

  const pageActions = (
    <Link href="/table" passHref>
      <Button variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
    </Link>
  )

  return (
    <TableLayout pageActions={pageActions}>
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Adicionar Novo Hotel</CardTitle>
            <CardDescription>Preencha os dados do novo hotel.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <LocationSelector
                    countryCode={countryCode}
                    stateCode={stateCode}
                    cityName={city}
                    onLocationChange={handleLocationChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="check_in_date">Início do evento</Label>
                  <Input
                    id="check_in_date"
                    type="datetime-local"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="check_out_date">Fim do evento</Label>
                  <Input
                    id="check_out_date"
                    type="datetime-local"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="checkout_question">
                    Pergunta no Checkout (Opcional)
                  </Label>
                  <Input
                    id="checkout_question"
                    value={checkoutQuestion}
                    onChange={(e) => setCheckoutQuestion(e.target.value)}
                    placeholder="Ex: Qual o tamanho da camiseta de cada participante?"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="checkout_question_en">
                    Pergunta no Checkout (Inglês)
                  </Label>
                  <Input
                    id="checkout_question_en"
                    value={checkoutQuestionEn}
                    onChange={(e) => setCheckoutQuestionEn(e.target.value)}
                    placeholder="Ex: What is the T-shirt size for each participant?"
                  />
                </div>
              </div>

              <div className="my-6 border-t pt-6">
                <h3 className="text-sm font-medium mb-4">
                  Políticas de Preço por Idade
                </h3>
                <PricePolicyManager
                  policies={pricePolicies}
                  onChange={setPricePolicies}
                  hideSideLabel={true}
                />
              </div>
              <div className="flex justify-end mt-6">
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Hotel"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Adicionar Hotel"
        message={error}
        actionMessage={action}
      />
    </TableLayout>
  )
}
