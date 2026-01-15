import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import {
  Plus,
  Search,
  Loader2,
  MapPin,
  Phone,
  Mail,
  User,
  Pencil,
} from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"

import { CompanyDialog } from "@/components/company/CompanyDialog"

const fetcher = async (url) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    error.info = await res.json()
    error.status = res.status
    throw error
  }

  return res.json()
}

export default function CompaniesTable() {
  const {
    data: companies,
    error: companiesError,
    mutate,
  } = useSWR("/api/v1/companies", fetcher)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (companiesError) {
      setIsErrorDialogOpen(true)
    }
  }, [companiesError])

  const filteredCompanies = companies?.filter((company) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      company.corporate_name?.toLowerCase().includes(searchLower) ||
      company.cnpj?.includes(searchTerm) ||
      company.city?.toLowerCase().includes(searchLower) ||
      company.responsible_person?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <TableLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Empresas</h2>
          <p className="text-sm text-gray-500">
            Listagem de todas as empresas cadastradas no sistema.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, CNPJ, cidade..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {!companies && !companiesError && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {filteredCompanies && filteredCompanies.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          Nenhuma empresa encontrada para a busca &quot;{searchTerm}&quot;.
        </div>
      )}

      {filteredCompanies && filteredCompanies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card
              key={company.id}
              className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="bg-blue-600 p-6 text-white relative">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold leading-tight line-clamp-2">
                      {company.corporate_name}
                    </CardTitle>
                    {company.cnpj && (
                      <CardDescription className="text-blue-100 font-mono text-xs opacity-90">
                        {company.cnpj}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {company.badge && (
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm whitespace-nowrap">
                        {company.badge}
                      </Badge>
                    )}
                    <CompanyDialog
                      onCompanySuccess={mutate}
                      companyToEdit={company}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </CompanyDialog>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-gray-700">
                      {company.address}, {company.address_number}
                    </p>
                    {company.address_complement && (
                      <p className="text-xs text-gray-500 italic">
                        {company.address_complement}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {company.neighborhood}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {company.city} - {company.state}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  {company.responsible_person && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <User className="h-4 w-4 text-gray-400" />
                      {company.responsible_person}
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {company.phone}
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 truncate">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {company.email}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Badge
                    className={`${
                      company.permission === "A"
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-gray-400 hover:bg-gray-500"
                    } text-white border-none px-4 py-1`}
                  >
                    {company.permission === "A" ? "Ativa" : "Inativa"}
                  </Badge>

                  {company.discount_status === "S" && (
                    <Badge
                      variant="outline"
                      className="border-gray-200 text-gray-700 bg-gray-50 px-4 py-1"
                    >
                      Desconto
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <CompanyDialog onCompanySuccess={mutate}>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform p-0"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </CompanyDialog>
      </div>

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Carregar Empresas"
        message={
          companiesError?.info?.message || "Ocorreu um erro ao buscar os dados."
        }
        actionMessage={companiesError?.info?.action}
        onRetry={mutate}
      />
    </TableLayout>
  )
}
