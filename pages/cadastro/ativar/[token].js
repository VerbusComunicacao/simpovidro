import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ErrorDialog from "@/components/ui/ErrorDialog"

export default function Activate() {
  const router = useRouter()
  const { token } = router.query
  const [step, setStep] = useState("activating") // activating, guest_form, success
  const [message, setMessage] = useState("Ativando sua conta...")
  const [actionMessage, setActionMessage] = useState("")
  const [error, setError] = useState(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  
  // Guest Form State
  const [guestData, setGuestData] = useState({
    name: "",
    phone: "",
    gender: "",
    rg_number: "",
    cpf_number: "",
    birth_date: "",
    address: "",
    city: "",
    state: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    if (token && step === "activating") {
      activateAccount()
    }
  }, [token, router.isReady])

  const activateAccount = async () => {
    try {
      const response = await fetch(`/api/v1/activations/${token}`, {
        method: "PATCH",
      })

      if (response.ok) {
        const user = await response.json()
        setGuestData(prev => ({ ...prev, name: user.full_name }))
        setStep("guest_form")
      } else {
        const data = await response.json()
        setMessage(data.message || "Erro ao ativar a conta.")
        if (data.action) setActionMessage(data.action)
        setError(true)
        setIsErrorDialogOpen(true)
      }
    } catch (error) {
      setMessage("Ocorreu um erro. Tente novamente mais tarde.")
      setError(true)
      setIsErrorDialogOpen(true)
    }
  }

  const handleGuestSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    try {
      const response = await fetch("/api/v1/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guestData),
      })

      if (response.ok) {
        setStep("success")
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      } else {
        const data = await response.json()
        setMessage(data.message || "Erro ao salvar seus dados.")
        setError(true)
        setIsErrorDialogOpen(true)
      }
    } catch (err) {
      setMessage("Erro de conexão. Tente novamente.")
      setError(true)
      setIsErrorDialogOpen(true)
    } finally {
      setLoading(false)
    }
  }

  if (step === "activating") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Ativação de Conta</CardTitle>
            <CardDescription>Aguarde um momento enquanto validamos sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p>{message}</p>
          </CardContent>
        </Card>
        <ErrorDialog
          isOpen={isErrorDialogOpen}
          onClose={() => router.push("/login")}
          title="Erro na Ativação"
          message={message}
          actionMessage={actionMessage}
          closeText="Ir para Login"
        />
      </div>
    )
  }

  if (step === "guest_form") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Complete seu Perfil</CardTitle>
            <CardDescription>
              Conta ativada! Agora, preencha seus dados para completar o cadastro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGuestSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-full">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  value={guestData.name} 
                  onChange={e => setGuestData({...guestData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  placeholder="(00) 00000-0000"
                  value={guestData.phone} 
                  onChange={e => setGuestData({...guestData, phone: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select 
                  onValueChange={val => setGuestData({...guestData, gender: val})}
                  required
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input 
                  id="rg" 
                  value={guestData.rg_number} 
                  onChange={e => setGuestData({...guestData, rg_number: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input 
                  id="cpf" 
                  placeholder="000.000.000-00"
                  value={guestData.cpf_number} 
                  onChange={e => setGuestData({...guestData, cpf_number: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input 
                  id="birth_date" 
                  type="date"
                  value={guestData.birth_date} 
                  onChange={e => setGuestData({...guestData, birth_date: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input 
                  id="city" 
                  value={guestData.city} 
                  onChange={e => setGuestData({...guestData, city: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2 col-span-full">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input 
                  id="address" 
                  placeholder="Rua, Número, Bairro"
                  value={guestData.address} 
                  onChange={e => setGuestData({...guestData, address: e.target.value})} 
                />
              </div>
              <Button type="submit" className="col-span-full mt-4" disabled={loading}>
                {loading ? "Salvando..." : "Concluir Cadastro"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <ErrorDialog
          isOpen={isErrorDialogOpen}
          onClose={() => setIsErrorDialogOpen(false)}
          title="Erro ao Salvar"
          message={message}
        />
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-md text-center py-8">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-3xl">
              ✓
            </div>
            <CardTitle>Tudo Pronto!</CardTitle>
            <CardDescription className="text-lg pt-2">
              Seu perfil foi criado com sucesso. Você será redirecionado para o painel em instantes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return null
}
