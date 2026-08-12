import { useState } from "react"
import TableLayout from "@/components/layout/TableLayout"
import useUser from "@/hooks/useUser"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronDown,
  Download,
  FileText,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
} from "lucide-react"
import { exportToExcel, flattenDataForExport } from "@/lib/exportUtils"
import { useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"

function parseSortableValue(val) {
  if (typeof val === "number") return val
  if (typeof val === "boolean") return val ? 1 : 0
  if (typeof val !== "string") return null
  const trimmed = val.trim()

  // Currency: R$ 1.500,00 or R$1.500,00 or R$ 1500,00
  if (/^R\$\s*[\d.,]+$/i.test(trimmed)) {
    const cleaned = trimmed
      .replace(/[R$\s]/gi, "")
      .replace(/\./g, "")
      .replace(",", ".")
    const num = parseFloat(cleaned)
    if (!isNaN(num)) return num
  }

  // Date: DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/")
    const d = new Date(`${year}-${month}-${day}`).getTime()
    if (!isNaN(d)) return d
  }

  // Number string: "123" or "45.67"
  if (!isNaN(Number(trimmed)) && trimmed !== "") {
    return Number(trimmed)
  }

  return null
}

function sortItems(items, key, direction) {
  if (!Array.isArray(items) || !key) return items

  return [...items].sort((a, b) => {
    let aVal = a[key]
    let bVal = b[key]

    if (aVal === null || aVal === undefined) aVal = ""
    if (bVal === null || bVal === undefined) bVal = ""

    const aNum = parseSortableValue(aVal)
    const bNum = parseSortableValue(bVal)

    if (aNum !== null && bNum !== null) {
      return direction === "asc" ? aNum - bNum : bNum - aNum
    }

    const strA = String(aVal).toLowerCase()
    const strB = String(bVal).toLowerCase()

    if (strA < strB) return direction === "asc" ? -1 : 1
    if (strA > strB) return direction === "asc" ? 1 : -1
    return 0
  })
}

function SortableHeader({
  label,
  columnKey,
  sortConfig,
  onSort,
  align = "left",
  className = "",
}) {
  const isSorted = sortConfig.key === columnKey
  const isAsc = sortConfig.direction === "asc"

  return (
    <th
      onClick={() => onSort(columnKey)}
      className={`px-4 py-2.5 font-semibold whitespace-nowrap cursor-pointer select-none hover:bg-gray-200/80 transition-colors ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      <div
        className={`flex items-center gap-1.5 ${
          align === "right" ? "justify-end" : "justify-start"
        }`}
      >
        <span>{label}</span>
        {isSorted ? (
          isAsc ? (
            <ArrowUp className="h-4 w-4 text-blue-600 shrink-0 font-bold" />
          ) : (
            <ArrowDown className="h-4 w-4 text-blue-600 shrink-0 font-bold" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 opacity-60 hover:opacity-100 shrink-0" />
        )}
      </div>
    </th>
  )
}

const reportTypes = [
  {
    value: "complete",
    label: "Relatório Completo",
    description: "Todos os participantes com informações completas",
  },
  {
    value: "financial",
    label: "Relatório Financeiro de Inscrições",
    description: "Relatório por inscrição",
  },
  {
    value: "checkout-questions",
    label: "Questionário da inscrição",
    description: "Apenas as respostas dos participantes à pergunta.",
  },
  {
    value: "by-company",
    label: "Participantes por Empresa",
    description: "Agrupado por empresa (CNPJ)",
  },
  {
    value: "by-age",
    label: "Participantes por Faixa Etária",
    description: "Agrupado por idade e gênero",
  },
  {
    value: "by-country",
    label: "Participantes por País",
    description: "Distribuição geográfica por nação",
  },
  {
    value: "by-uf",
    label: "Participantes por Estado (UF)",
    description: "Distribuição geográfica por estado brasileiro",
  },
  {
    value: "by-accommodation",
    label: "Participantes por tipo de acomodação e totais",
    description:
      "Distribuição de apartamentos, hóspedes e valores por tipo de acomodação",
  },
  {
    value: "companies-by-activity",
    label: "Empresas por área de atuação",
    description: "Distribuição de empresas por área de atuação",
  },
  {
    value: "companies-discount",
    label: "Empresas com Desconto",
    description: "Lista empresas (inscritas ou não) com desconto",
  },
]

export default function RelatoriosPage() {
  const { user, isLoading: userLoading } = useUser()
  const router = useRouter()
  const [selectedReport, setSelectedReport] = useState("")
  const [selectedHotel, setSelectedHotel] = useState("")
  const [hotels, setHotels] = useState([])
  const [reportData, setReportData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [expandedCompanies, setExpandedCompanies] = useState({})
  const [participantSearch, setParticipantSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  const toggleCompany = (index) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [index]: prev[index] === undefined ? false : !prev[index],
    }))
  }

  useEffect(() => {
    // Fetch hotels for the filter (user already has read:content permission)
    fetch("/api/v1/hotels")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setHotels(data)
        } else {
          console.error("Hotels response is not an array:", data)
          setHotels([])
        }
      })
      .catch((err) => {
        console.error("Error fetching hotels:", err)
        setHotels([])
      })
  }, [])

  if (userLoading) {
    return (
      <TableLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </TableLayout>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  if (!user.features?.includes("read:sale:others")) {
    return (
      <TableLayout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-red-500">
            Você não tem permissão para acessar relatórios.
          </p>
        </div>
      </TableLayout>
    )
  }

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      setError("Selecione um tipo de relatório")
      return
    }

    setIsLoading(true)
    setError("")
    setReportData(null)
    setParticipantSearch("")
    setSortConfig({ key: null, direction: "asc" })

    try {
      const response = await fetch(
        `/api/v1/reports?type=${selectedReport}&hotel_id=${selectedHotel}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao gerar relatório")
      }

      const data = await response.json()
      setReportData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportExcel = () => {
    if (!reportData) return

    const reportLabel =
      reportTypes.find((r) => r.value === selectedReport)?.label || "relatorio"
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `${reportLabel.toLowerCase().replace(/\s+/g, "_")}_${timestamp}`

    // Flatten data for export
    let dataToExport
    if (selectedReport === "by-age") {
      dataToExport = reportData.ranges
    } else if (selectedReport === "by-accommodation") {
      dataToExport = reportData.map((item) => ({
        ACOMODAÇÃO: item.accommodation,
        CATEGORIA: item.category,
        "QTD. APTO.": item.apartment_count,
        "QTD. DISP.": item.available_rooms,
        "Nº PAX": item.pax_count,
        "VALOR TOTAL": item.total_value,
      }))
    } else if (selectedReport === "by-company") {
      dataToExport = reportData.flatMap((company) => {
        const participants = company.participants || []
        if (participants.length === 0) {
          return [
            {
              Empresa: company["Nome da empresa"],
              CNPJ: company["CNPJ"],
              Estado: company["Estado"],
              "Tipo de Associação": company["Tipo de Associação"],
              "Total de Participantes": company["Total de participantes"],
              "Nº da Venda": "",
              Participante: "",
              CPF: "",
              Email: "",
              Idade: "",
              "Nome no Crachá": "",
            },
          ]
        }
        return participants.map((p) => ({
          Empresa: company["Nome da empresa"],
          CNPJ: company["CNPJ"],
          Estado: company["Estado"],
          "Tipo de Associação": company["Tipo de Associação"],
          "Total de Participantes": company["Total de participantes"],
          "Nº da Venda": p.sale_number || "",
          Participante: p.name || "",
          CPF: p.cpf || "",
          Email: p.email || "",
          Idade: p.age !== undefined && p.age !== null ? p.age : "",
          "Nome no Crachá": p.badge_name || "",
        }))
      })
    } else {
      dataToExport = reportData
    }
    const flattenedData = flattenDataForExport(dataToExport)
    exportToExcel(flattenedData, filename)
  }

  const renderReportPreview = () => {
    if (!reportData) return null

    if (selectedReport === "by-age") {
      const ranges = reportData.ranges || []
      const summary = reportData.summary || []

      // Prepare data for charts
      const data = ranges.map((item) => ({
        name: item.age_range,
        Total: parseInt(item.total),
        Masculino: parseInt(item.male_count),
        Feminino: parseInt(item.female_count),
      }))

      const genderData = [
        {
          name: "Masculino",
          value: data.reduce((acc, curr) => acc + curr.Masculino, 0),
        },
        {
          name: "Feminino",
          value: data.reduce((acc, curr) => acc + curr.Feminino, 0),
        },
      ].filter((item) => item.value > 0)

      const COLORS = ["#0088FE", "#FF8042"]
      const CATEGORY_COLORS = [
        "#10B981",
        "#3B82F6",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
      ]

      const categoryData = [
        {
          name: "Adultos",
          value: parseInt(
            summary.find((item) => item.Descrição === "Adultos")?.Quantidade ||
              0,
          ),
        },
        ...summary
          .filter(
            (item) =>
              item.Descrição !== "Homens" &&
              item.Descrição !== "Mulheres" &&
              item.Descrição !== "Total" &&
              item.Descrição !== "Adultos",
          )
          .map((item) => ({
            name: item.Descrição,
            value: parseInt(item.Quantidade || 0),
          })),
      ].filter((item) => item.value > 0)

      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 border rounded p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Distribuição por Idade e Sexo
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Masculino" stackId="a" fill="#0088FE" />
                  <Bar dataKey="Feminino" stackId="a" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 border rounded p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Distribuição por Sexo
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 border rounded p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Total de adultos e crianças
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="hidden md:block"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4">
                Quantidade de participantes por sexo e idade
              </h3>
              <div className="max-h-96 overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <SortableHeader
                        label="Descrição"
                        columnKey="Descrição"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Quantidade"
                        columnKey="Quantidade"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortItems(
                      summary,
                      sortConfig.key,
                      sortConfig.direction,
                    ).map((row, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap font-medium">
                          {row.Descrição}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-bold">
                          {row.Quantidade}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4">
                Detalhamento por Faixa Etária
              </h3>
              <div className="max-h-96 overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <SortableHeader
                        label="Faixa Etária"
                        columnKey="age_range"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Total"
                        columnKey="total"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Masculino"
                        columnKey="male_count"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Feminino"
                        columnKey="female_count"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortItems(
                      ranges,
                      sortConfig.key,
                      sortConfig.direction,
                    ).map((row, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          {row.age_range}
                        </td>
                        <td className="px-4 py-2 font-bold whitespace-nowrap">
                          {row.total}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {row.male_count}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {row.female_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (selectedReport === "by-uf" && Array.isArray(reportData)) {
      const data = reportData.map((item) => ({
        state: item.state,
        Participantes: parseInt(item.total_participants),
      }))

      return (
        <div className="space-y-8">
          <div className="h-96 border rounded p-4">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Distribuição de Participantes por Estado (UF)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="state" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="Participantes" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">
              Detalhamento por Estado
            </h3>
            <div className="max-h-96 overflow-y-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <SortableHeader
                      label="Estado"
                      columnKey="state"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Total de Participantes"
                      columnKey="total_participants"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortItems(
                    reportData,
                    sortConfig.key,
                    sortConfig.direction,
                  ).map((row, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap font-medium">
                        {row.state}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-bold">
                        {row.total_participants}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }

    if (selectedReport === "by-accommodation" && Array.isArray(reportData)) {
      const totalApto = reportData.reduce(
        (sum, item) => sum + parseInt(item.apartment_count || 0),
        0,
      )
      const totalAvailable = reportData.reduce(
        (sum, item) => sum + parseInt(item.available_rooms || 0),
        0,
      )
      const totalPax = reportData.reduce(
        (sum, item) => sum + parseInt(item.pax_count || 0),
        0,
      )
      const totalValue = reportData.reduce(
        (sum, item) => sum + parseFloat(item.total_value || 0),
        0,
      )

      return (
        <div className="space-y-8">
          <div className="overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Participantes por Tipo de Acomodação
            </h3>
            <div className="max-h-[500px] overflow-y-auto border rounded shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-yellow-400 sticky top-0 font-bold border-b border-gray-300">
                  <tr>
                    <SortableHeader
                      label="Acomodação"
                      columnKey="accommodation"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="uppercase tracking-wider text-gray-900 font-bold"
                    />
                    <SortableHeader
                      label="Categoria"
                      columnKey="category"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="uppercase tracking-wider text-gray-900 font-bold"
                    />
                    <SortableHeader
                      label="Qtd. Apto."
                      columnKey="apartment_count"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      align="right"
                      className="uppercase tracking-wider text-gray-900 font-bold"
                    />
                    <SortableHeader
                      label="Qtd. Disp."
                      columnKey="available_rooms"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      align="right"
                      className="uppercase tracking-wider text-gray-900 font-bold"
                    />
                    <SortableHeader
                      label="Nº Pax"
                      columnKey="pax_count"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      align="right"
                      className="uppercase tracking-wider text-gray-900 font-bold"
                    />
                    <SortableHeader
                      label="Valor Total"
                      columnKey="total_value"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      align="right"
                      className="uppercase tracking-wider text-gray-900 font-bold"
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortItems(
                    reportData,
                    sortConfig.key,
                    sortConfig.direction,
                  ).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        {row.accommodation}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 font-semibold">
                        {row.category}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-700">
                        {row.apartment_count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-700">
                        {row.available_rooms}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-700">
                        {row.pax_count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                        {parseFloat(row.total_value || 0).toLocaleString(
                          "pt-BR",
                          {
                            style: "currency",
                            currency: "BRL",
                          },
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-yellow-400 font-bold border-t-2 border-gray-400">
                  <tr>
                    <td className="px-4 py-3 text-left text-gray-900 uppercase font-black">
                      Totais
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right text-gray-900 font-black">
                      {totalApto}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-black">
                      {totalAvailable}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-black">
                      {totalPax}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-black">
                      {totalValue.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )
    }

    if (
      selectedReport === "companies-by-activity" &&
      Array.isArray(reportData)
    ) {
      const data = reportData.map((item) => ({
        activity_sector: item.activity_sector,
        Empresas: parseInt(item.total_companies),
      }))

      return (
        <div className="space-y-8">
          <div className="h-96 border rounded p-4">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Empresas por Área de Atuação
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="activity_sector" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Empresas" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">
              Detalhamento por Área de Atuação
            </h3>
            <div className="max-h-96 overflow-y-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <SortableHeader
                      label="Área de Atuação"
                      columnKey="activity_sector"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Total de Empresas"
                      columnKey="total_companies"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortItems(
                    reportData,
                    sortConfig.key,
                    sortConfig.direction,
                  ).map((row, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap font-medium">
                        {row.activity_sector}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-bold">
                        {row.total_companies}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }

    if (selectedReport === "by-company" && Array.isArray(reportData)) {
      const searchNormalized = participantSearch
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

      const filteredReportData = reportData
        .map((company) => {
          const participants = company.participants || []
          if (!searchNormalized)
            return { ...company, filteredParticipants: participants }

          const companyName = (company["Nome da empresa"] || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")

          const isCompanyMatch = companyName.includes(searchNormalized)

          const filteredParticipants = participants.filter((p) => {
            const name = (p.name || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
            const badgeName = (p.badge_name || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
            const saleNum = String(p.sale_number || "").toLowerCase()
            const cpf = (p.cpf || "").replace(/\D/g, "")
            const email = (p.email || "").toLowerCase()

            return (
              name.includes(searchNormalized) ||
              badgeName.includes(searchNormalized) ||
              saleNum.includes(searchNormalized) ||
              cpf.includes(searchNormalized) ||
              email.includes(searchNormalized)
            )
          })

          if (isCompanyMatch || filteredParticipants.length > 0) {
            return {
              ...company,
              filteredParticipants:
                isCompanyMatch && filteredParticipants.length === 0
                  ? participants
                  : filteredParticipants,
            }
          }
          return null
        })
        .filter(Boolean)

      const totalCompanies = filteredReportData.length
      const totalParticipants = filteredReportData.reduce(
        (acc, curr) => acc + (curr.filteredParticipants?.length || 0),
        0,
      )

      return (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg border">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Relatório de Participantes por Empresa
              </h3>
              <p className="text-sm text-gray-600">
                Total de Empresas: <strong>{totalCompanies}</strong> | Total de
                Participantes: <strong>{totalParticipants}</strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar participante..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allExpanded = filteredReportData.every(
                    (_, idx) => expandedCompanies[idx] !== false,
                  )
                  const newState = {}
                  filteredReportData.forEach((_, idx) => {
                    newState[idx] = !allExpanded
                  })
                  setExpandedCompanies(newState)
                }}
              >
                {filteredReportData.every(
                  (_, idx) => expandedCompanies[idx] !== false,
                )
                  ? "Recolher Todos"
                  : "Expandir Todos"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReportData.map((company, index) => {
              const isExpanded = expandedCompanies[index] !== false
              const participants = company.filteredParticipants || []

              return (
                <div
                  key={index}
                  className="border rounded-lg overflow-hidden shadow-sm bg-white"
                >
                  {/* Header da Empresa */}
                  <div
                    className="bg-blue-50 hover:bg-blue-100/80 p-4 cursor-pointer flex flex-wrap items-center justify-between gap-4 transition-colors"
                    onClick={() => toggleCompany(index)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-950 text-base">
                        {company["Nome da empresa"]}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-200 text-blue-900 border border-blue-300">
                        {company["Tipo de Associação"]}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-700">
                      <div>
                        <span className="font-medium text-gray-500">
                          CNPJ:{" "}
                        </span>
                        <span className="font-semibold">{company["CNPJ"]}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">UF: </span>
                        <span className="font-semibold font-mono">
                          {company["Estado"]}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">
                          Participantes:{" "}
                        </span>
                        <span className="font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                          {participants.length}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          isExpanded ? "transform rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Tabela de Participantes */}
                  {isExpanded && (
                    <div className="p-4 bg-gray-50/50 border-t">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-2">
                        Participantes vinculados ({participants.length})
                      </h4>
                      {participants.length > 0 ? (
                        <div className="overflow-x-auto border rounded-lg bg-white shadow-inner">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b text-gray-800">
                              <tr>
                                <SortableHeader
                                  label="Nº Venda"
                                  columnKey="sale_number"
                                  sortConfig={sortConfig}
                                  onSort={handleSort}
                                />
                                <SortableHeader
                                  label="Nome"
                                  columnKey="name"
                                  sortConfig={sortConfig}
                                  onSort={handleSort}
                                />
                                <SortableHeader
                                  label="CPF"
                                  columnKey="cpf"
                                  sortConfig={sortConfig}
                                  onSort={handleSort}
                                />
                                <SortableHeader
                                  label="E-mail"
                                  columnKey="email"
                                  sortConfig={sortConfig}
                                  onSort={handleSort}
                                />
                                <SortableHeader
                                  label="Idade"
                                  columnKey="age"
                                  sortConfig={sortConfig}
                                  onSort={handleSort}
                                />
                                <SortableHeader
                                  label="Nome no Crachá"
                                  columnKey="badge_name"
                                  sortConfig={sortConfig}
                                  onSort={handleSort}
                                />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {sortItems(
                                participants,
                                sortConfig.key,
                                sortConfig.direction,
                              ).map((person, pIndex) => (
                                <tr
                                  key={pIndex}
                                  className="hover:bg-blue-50/60 transition-colors"
                                >
                                  <td className="px-4 py-2.5 text-gray-700 font-mono text-xs font-semibold">
                                    {person.sale_number || "-"}
                                  </td>
                                  <td className="px-4 py-2.5 font-medium text-gray-900">
                                    {person.name || "-"}
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">
                                    {person.cpf || "-"}
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-600">
                                    {person.email || "-"}
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-600">
                                    {person.age !== undefined &&
                                    person.age !== null
                                      ? person.age
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-600 font-medium">
                                    {person.badge_name || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Nenhum participante encontrado.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (!Array.isArray(reportData)) {
      return null
    }

    if (reportData.length === 0) {
      return <p className="text-gray-500">Nenhum dado encontrado</p>
    }

    const sortedData = sortItems(
      reportData,
      sortConfig.key,
      sortConfig.direction,
    )

    const keys =
      reportData.length > 0
        ? Object.keys(reportData[0]).filter(
            (key) =>
              typeof reportData[0][key] !== "object" ||
              reportData[0][key] === null,
          )
        : []

    return (
      <div className="overflow-x-auto">
        <p className="text-sm text-gray-600 mb-2">
          Total de registros: <strong>{reportData.length}</strong>
        </p>
        <div className="max-h-96 overflow-y-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {keys.map((key) => (
                  <SortableHeader
                    key={key}
                    label={key}
                    columnKey={key}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.slice(0, 50).map((row, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  {Object.entries(row)
                    .filter(
                      ([, value]) =>
                        typeof value !== "object" || value === null,
                    )
                    .map(([key, value]) => (
                      <td key={key} className="px-4 py-2 whitespace-nowrap">
                        {value === true
                          ? "Sim"
                          : value === false
                            ? "-"
                            : typeof value === "number" && key === "Valor Total"
                              ? value.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })
                              : value || "-"}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
          {sortedData.length > 50 && (
            <p className="p-4 text-sm text-gray-500 text-center">
              Mostrando 50 de {sortedData.length} registros. Exporte para ver
              todos.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <TableLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Relatórios</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gerar Relatório</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2 w-full md:w-72">
                <Label htmlFor="hotel-filter">Selecione um hotel</Label>
                <Select
                  value={selectedHotel}
                  onValueChange={(val) => {
                    setSelectedHotel(val)
                    setReportData(null)
                    setError("")
                  }}
                >
                  <SelectTrigger id="hotel-filter">
                    <SelectValue placeholder="Selecione um hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full md:w-72">
                <Label htmlFor="report-type">Tipo de Relatório</Label>
                <Select
                  value={selectedReport}
                  onValueChange={(val) => {
                    setSelectedReport(val)
                    setReportData(null)
                    setError("")
                  }}
                >
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Selecione um relatório" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-gray-500">
                            {type.description}
                          </p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={!selectedReport || !selectedHotel || isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                "Gerar Relatório"
              )}
            </Button>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
        </Card>

        {reportData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Visualização do Relatório</CardTitle>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
            </CardHeader>
            <CardContent>{renderReportPreview()}</CardContent>
          </Card>
        )}
      </div>
    </TableLayout>
  )
}
