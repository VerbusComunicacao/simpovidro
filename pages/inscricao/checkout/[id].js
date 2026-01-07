import Head from "next/head"
import { useRouter } from "next/router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Loader2 } from "lucide-react"
import RegistrationLayout from "@/components/registration/RegistrationLayout"

import * as cookie from "cookie"
import session from "models/session"
import guest from "models/guest"
import room from "models/room"
import userModel from "models/user"
import { maskCPF, maskPhone, maskRG } from "@/lib/masks"

export default function CheckoutPage({ room, user, guestProfile }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    // Personal
    name: guestProfile?.name || user.full_name || "",
    email: user.email || "", // Email is usually fixed to account but we display it
    phone: guestProfile?.phone || "",
    gender: guestProfile?.gender || "",
    rg_number: guestProfile?.rg_number || "",
    cpf_number: guestProfile?.cpf_number || "",
    birth_date: guestProfile?.birth_date ? new Date(guestProfile.birth_date).toISOString().split('T')[0] : "",
    nationality: guestProfile?.nationality || "Brasileira",
    
    // Address
    address: guestProfile?.address || "",
    address_number: guestProfile?.address_number || "",
    address_complement: guestProfile?.address_complement || "",
    neighborhood: guestProfile?.neighborhood || "",
    city: guestProfile?.city || "",
    state: guestProfile?.state || "",
    country: guestProfile?.country || "Brasil",

    // Health / Emergency
    emergency_contact_name: guestProfile?.emergency_contact_name || "",
    emergency_contact_phone: guestProfile?.emergency_contact_phone || "",
    blood_type: guestProfile?.blood_type || "",
    special_needs_details: guestProfile?.special_needs_details || "",
    health_observations: guestProfile?.health_observations || "",
  })

  // Handlers for form changes
  const handleChange = (e) => {
    let { name, value } = e.target

    if (name === "cpf_number") {
      value = maskCPF(value)
    } else if (name === "rg_number") {
      value = maskRG(value)
    } else if (name === "phone" || name === "emergency_contact_phone") {
      value = maskPhone(value)
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/v1/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: room.id,
          guest_data: formData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao realizar inscrição.")
      }

      router.push("/inscricao/sucesso")
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <RegistrationLayout title="Finalizar Inscrição - Simpovidro 2025" showBackButton>
      <div className="py-8 px-4">
        <div className="container max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="md:col-span-1 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Quarto Selecionado</p>
                <p className="font-semibold">{room.name || room.room_type}</p>
                <p className="text-sm text-gray-600">{room.room_category}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="text-2xl font-bold text-blue-600">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(room.price_per_night)}
                </p>
                <p className="text-xs text-gray-500">Valor referente a todo o evento</p>
              </div>
            </CardContent>
           </Card>
        </div>

        {/* Guest Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Dados do Participante</CardTitle>
                <CardDescription>
                  {guestProfile 
                    ? "Confirme seus dados abaixo para finalizar a inscrição." 
                    : "Preencha seus dados completos para realizar a inscrição."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {/* Personal Data */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Dados Pessoais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="birth_date">Data de Nascimento *</Label>
                      <Input id="birth_date" name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf_number">CPF *</Label>
                      <Input id="cpf_number" name="cpf_number" value={formData.cpf_number} onChange={handleChange} placeholder="000.000.000-00" required />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="rg_number">RG *</Label>
                      <Input id="rg_number" name="rg_number" value={formData.rg_number} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label htmlFor="gender">Gênero *</Label>
                      <Select value={formData.gender} onValueChange={(val) => handleSelectChange("gender", val)} required>
                        <SelectTrigger>
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
                      <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" required />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Endereço</h3>
                   <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Rua / Logradouro</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleChange} />
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address_number">Número</Label>
                        <Input id="address_number" name="address_number" value={formData.address_number} onChange={handleChange} />
                      </div>
                       <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="address_complement">Complemento</Label>
                        <Input id="address_complement" name="address_complement" value={formData.address_complement} onChange={handleChange} />
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input id="city" name="city" value={formData.city} onChange={handleChange} />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input id="state" name="state" value={formData.state} onChange={handleChange} maxLength={2} placeholder="UF" />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                        <Input id="country" name="country" value={formData.country} onChange={handleChange} />
                      </div>
                   </div>
                </div>

                {/* Health & Emergency */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Saúde e Emergência</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Nome Contato Emergência</Label>
                        <Input id="emergency_contact_name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">Telefone Emergência</Label>
                        <Input id="emergency_contact_phone" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="health_observations">Observações de Saúde / Alergias</Label>
                      <Input id="health_observations" name="health_observations" value={formData.health_observations} onChange={handleChange} placeholder="Ex: Alérgico a camarão, diabetes, etc." />
                   </div>
                </div>

                <div className="pt-4">
                   <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                        </>
                      ) : (
                        "Confirmar Inscrição"
                      )}
                   </Button>
                </div>

              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
    </RegistrationLayout>
  )
}

export async function getServerSideProps(context) {
  const { id } = context.params
  
  // 1. Validate Session
  const cookies = cookie.parse(context.req.headers.cookie || "")
  const sessionToken = cookies.session_id

  if (!sessionToken) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    }
  }

  try {
    const sessionObject = await session.findOneValidByToken(sessionToken)
    const user = await userModel.findOneById(sessionObject.user_id)
    
    // 2. Fetch Room
    const targetRoom = await room.findOneById(id)
    if (!targetRoom) {
       return { notFound: true } // Or redirect to 404
    }

    // 3. Fetch Guest Profile
    const guestProfile = await guest.findOneByUserId(user.id)

    return {
      props: {
        room: JSON.parse(JSON.stringify(targetRoom)),
         // Serialization: Dates might need JSON stringify if not handled automatically
        user: JSON.parse(JSON.stringify(user)),
        guestProfile: guestProfile ? JSON.parse(JSON.stringify(guestProfile)) : null
      },
    }

  } catch (error) {
    // Session invalid or other error
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    }
  }
}
