import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { PricePolicyManager } from "./PricePolicyManager"

export function EditHotelDialog({ children, hotel, onHotelUpdated }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(hotel.name)
  const [email, setEmail] = useState(hotel.email)
  const [phone, setPhone] = useState(hotel.phone)
  const [address, setAddress] = useState(hotel.address)
  const [city, setCity] = useState(hotel.city)
  const [state, setState] = useState(hotel.state)
  const [country, setCountry] = useState(hotel.country)
  const [checkInDate, setCheckInDate] = useState("")
  const [checkOutDate, setCheckOutDate] = useState("")
  const [error, setError] = useState("")
  const [action, setAction] = useState("")
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pricePolicies, setPricePolicies] = useState(hotel.price_policies || [])

  useEffect(() => {
    setName(hotel.name || "")
    setEmail(hotel.email || "")
    setPhone(hotel.phone || "")
    setAddress(hotel.address || "")
    setCity(hotel.city || "")
    setState(hotel.state || "")
    setCountry(hotel.country || "Brasil")
    setCheckInDate(
      hotel.check_in_date
        ? new Date(hotel.check_in_date).toISOString().slice(0, 16)
        : "",
    )
    setCheckOutDate(
      hotel.check_out_date
        ? new Date(hotel.check_out_date).toISOString().slice(0, 16)
        : "",
    )
    setPricePolicies(hotel.price_policies || [])
  }, [hotel])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setAction("")
    setLoading(true)

    const response = await fetch(`/api/v1/hotels/${hotel.id}`, {
      method: "PATCH",
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
        price_policies: pricePolicies,
      }),
    })

    setLoading(false)

    if (response.ok) {
      onHotelUpdated()
      setOpen(false)
    } else {
      const data = await response.json()
      setError(data.message || "Ocorreu um erro ao editar o hotel.")
      if (data.action) {
        setAction(data.action)
      }
      setIsErrorDialogOpen(true)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Hotel</DialogTitle>
            <DialogDescription>Atualize os dados do hotel.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="max-h-[70vh] overflow-y-auto px-1">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name-edit" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name-edit"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-edit" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email-edit"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone-edit" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="phone-edit"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address-edit" className="text-right">
                    Endereço
                  </Label>
                  <Input
                    id="address-edit"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="city-edit" className="text-right">
                    Cidade
                  </Label>
                  <Input
                    id="city-edit"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="state-edit" className="text-right">
                    Estado
                  </Label>
                  <Input
                    id="state-edit"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="country-edit" className="text-right">
                    País
                  </Label>
                  <Input
                    id="country-edit"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="check-in-edit" className="text-right">
                    Entrada
                  </Label>
                  <Input
                    id="check-in-edit"
                    type="datetime-local"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="check-out-edit" className="text-right">
                    Saída
                  </Label>
                  <Input
                    id="check-out-edit"
                    type="datetime-local"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <PricePolicyManager
                policies={pricePolicies}
                onChange={setPricePolicies}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Editar Hotel"
        message={error}
        actionMessage={action}
      />
    </>
  )
}
