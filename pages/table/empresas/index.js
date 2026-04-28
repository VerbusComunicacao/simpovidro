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
  FileUp,
  Filter,
  LayoutGrid,
  List,
  X,
} from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { CompanyDialog } from "@/components/company/CompanyDialog"
import { CSVImportDialog } from "@/components/company/CSVImportDialog"
import { cn } from "@/lib/utils"
import { CompanyRow } from "@/components/company/CompanyRow"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const [statusFilter, setStatusFilter] = useState("all")
  const [discountFilter, setDiscountFilter] = useState("all")
  const [viewMode, setViewMode] = useState("list")

  useEffect(() => {
    if (companiesError) {
      setIsErrorDialogOpen(true)
    }
  }, [companiesError])

  const handleDeleteCompany = async (company) => {
    if (
      window.confirm(
        `Tem certeza que deseja apagar a empresa ${company.corporate_name}? Isso removerá o vínculo de todas as inscrições associadas.`,
      )
    ) {
      try {
        const response = await fetch(`/api/v1/companies/${company.id}`, {
          method: "DELETE",
        })
        if (!response.ok) throw new Error()
        mutate()
      } catch (error) {
        alert("Erro ao excluir empresa.")
      }
    }
  }

  const filteredCompanies = Array.isArray(companies)
    ? companies.filter((company) => {
        const searchLower = searchTerm.toLowerCase()

        // Filtro de Texto
        const matchesSearch =
          company.corporate_name?.toLowerCase().includes(searchLower) ||
          company.cnpj?.includes(searchTerm) ||
          company.city?.toLowerCase().includes(searchLower) ||
          company.responsible_person?.toLowerCase().includes(searchLower)

        // Filtro de Status (Ativa/Inativa)
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && company.permission === "A") ||
          (statusFilter === "inactive" && company.permission === "I")

        // Filtro de Desconto
        const matchesDiscount =
          discountFilter === "all" ||
          (discountFilter === "with" &&
            (company.discount_id !== null ||
              company.custom_discount_percentage !== null)) ||
          (discountFilter === "without" &&
            company.discount_id === null &&
            company.custom_discount_percentage === null)

        return matchesSearch && matchesStatus && matchesDiscount
      })
    : []

  return (
    <TableLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Empresas</h2>
            <CompanyDialog onCompanySuccess={() => mutate()}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </CompanyDialog>
          </div>
          <p className="text-sm text-gray-500">
            Listagem de todas as empresas cadastradas no sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 rounded-md transition-all",
                viewMode === "grid"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-900",
              )}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 rounded-md transition-all",
                viewMode === "list"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-900",
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block" />

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={discountFilter} onValueChange={setDiscountFilter}>
              <SelectTrigger className="w-[150px] bg-white">
                <SelectValue placeholder="Desconto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Descontos</SelectItem>
                <SelectItem value="with">Com Desconto</SelectItem>
                <SelectItem value="without">Sem Desconto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block" />

          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={async () => {
              if (
                window.confirm(
                  "TEM CERTEZA? Isso apagará TODAS as empresas do sistema permanentemente.",
                )
              ) {
                await fetch("/api/v1/companies/batch", { method: "DELETE" })
                mutate()
              }
            }}
          >
            Apagar Todas
          </Button>
          <CSVImportDialog onImportSuccess={() => mutate()}>
            <Button
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <FileUp className="mr-2 h-4 w-4" /> Importar CSV
            </Button>
          </CSVImportDialog>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!companies && !companiesError && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {filteredCompanies.length === 0 &&
        companies &&
        !companiesError &&
        Array.isArray(companies) && (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
            Nenhuma empresa encontrada para a busca &quot;{searchTerm}&quot;.
          </div>
        )}

      {filteredCompanies.length > 0 && viewMode === "grid" && (
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
                    <div className="flex items-center gap-1">
                      <CompanyDialog
                        onCompanySuccess={() => mutate()}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20 hover:text-red-200"
                        onClick={() => handleDeleteCompany(company)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
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

                  {(company.discount_name ||
                    company.custom_discount_percentage !== null) && (
                    <Badge
                      variant="outline"
                      className="border-orange-200 text-orange-700 bg-orange-50 px-4 py-1"
                    >
                      {company.custom_discount_percentage !== null
                        ? `Exclusivo: ${Number(company.custom_discount_percentage)}%`
                        : `${company.discount_name}: ${Number(company.discount_value)}%`}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredCompanies.length > 0 && viewMode === "list" && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Razão Social
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    CNPJ
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Cidade
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Desconto
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <CompanyRow
                    key={company.id}
                    company={company}
                    onUpdate={() => mutate()}
                    onDelete={() => handleDeleteCompany(company)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Carregar Empresas"
        message={
          companiesError?.info?.message || "Ocorreu um erro ao buscar os dados."
        }
        actionMessage={companiesError?.info?.action}
        onRetry={() => mutate()}
      />
    </TableLayout>
  )
}
