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
import { Download, FileText, Loader2 } from "lucide-react"
import { exportToCSV, flattenDataForExport } from "@/lib/exportUtils"
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

const reportTypes = [
  {
    value: "complete",
    label: "Relatório Completo",
    description: "Todos os participantes com informações completas",
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

  const handleExportCSV = () => {
    if (!reportData) return

    const reportLabel =
      reportTypes.find((r) => r.value === selectedReport)?.label || "relatorio"
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `${reportLabel.toLowerCase().replace(/\s+/g, "_")}_${timestamp}`

    // Flatten data for CSV export
    const flattenedData = flattenDataForExport(reportData)
    exportToCSV(flattenedData, filename)
  }

  const renderReportPreview = () => {
    if (!reportData) return null

    if (selectedReport === "by-age") {
      // Prepare data for charts
      const data = reportData.map((item) => ({
        name: item.age_range,
        Total: parseInt(item.total),
        Masculino: parseInt(item.male_count),
        Feminino: parseInt(item.female_count),
        Outros: parseInt(item.other_count),
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
        {
          name: "Outros",
          value: data.reduce((acc, curr) => acc + curr.Outros, 0),
        },
      ].filter((item) => item.value > 0)

      const COLORS = ["#0088FE", "#FF8042", "#00C49F"]

      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80 border rounded p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Distribuição por Idade e Gênero
              </h3>
              <ResponsiveContainer width="100%" height="100%">
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
                  <Bar dataKey="Outros" stackId="a" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-80 border rounded p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Gênero Global
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
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
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">Detalhamento</h3>
            <div className="max-h-96 overflow-y-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">
                      Faixa Etária
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">Total</th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Homens
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Mulheres
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Outros
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{row.age_range}</td>
                      <td className="px-4 py-2 font-bold">{row.total}</td>
                      <td className="px-4 py-2">{row.male_count}</td>
                      <td className="px-4 py-2">{row.female_count}</td>
                      <td className="px-4 py-2">{row.other_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }

    if (Array.isArray(reportData) && reportData.length === 0) {
      return <p className="text-gray-500">Nenhum dado encontrado</p>
    }

    return (
      <div className="overflow-x-auto">
        <p className="text-sm text-gray-600 mb-2">
          Total de registros: <strong>{reportData.length}</strong>
        </p>
        <div className="max-h-96 overflow-y-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {reportData.length > 0 &&
                  Object.keys(reportData[0])
                    .filter(
                      (key) =>
                        typeof reportData[0][key] !== "object" ||
                        reportData[0][key] === null,
                    )
                    .map((key) => (
                      <th
                        key={key}
                        className="px-4 py-2 text-left font-semibold"
                      >
                        {key}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {reportData.slice(0, 50).map((row, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  {Object.entries(row)
                    .filter(
                      ([, value]) =>
                        typeof value !== "object" || value === null,
                    )
                    .map(([key, value]) => (
                      <td key={key} className="px-4 py-2">
                        {value === true
                          ? "Sim"
                          : value === false
                            ? "Não"
                            : value || "-"}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
          {reportData.length > 50 && (
            <p className="p-4 text-sm text-gray-500 text-center">
              Mostrando 50 de {reportData.length} registros. Exporte para ver
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
                <Select value={selectedHotel} onValueChange={setSelectedHotel}>
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
                  onValueChange={setSelectedReport}
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
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>{renderReportPreview()}</CardContent>
          </Card>
        )}
      </div>
    </TableLayout>
  )
}
