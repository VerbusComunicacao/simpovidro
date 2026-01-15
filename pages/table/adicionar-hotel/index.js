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

export default function AddHotelPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("Brasil")
  const [checkInDate, setCheckInDate] = useState("")
  const [checkOutDate, setCheckOutDate] = useState("")
  const [
    associatedCompanyDiscountPercentage,
    setAssociatedCompanyDiscountPercentage,
  ] = useState("20.00")
  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pricePolicies, setPricePolicies] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setAction("")
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
        associated_company_discount_percentage:
          associatedCompanyDiscountPercentage,
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
                    onChange={(e) => setPhone(e.target.value)}
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
                <div className="space-y-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
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
                <div className="space-y-1.5">
                  <Label htmlFor="associated_discount">
                    Desconto p/ Empresa (%)
                  </Label>
                  <Input
                    id="associated_discount"
                    type="number"
                    step="0.01"
                    value={associatedCompanyDiscountPercentage}
                    onChange={(e) =>
                      setAssociatedCompanyDiscountPercentage(e.target.value)
                    }
                    placeholder="20.00"
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
