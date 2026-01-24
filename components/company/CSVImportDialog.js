import { useState, useRef } from "react"
import Papa from "papaparse"
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
import {
  FileUp,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

export function CSVImportDialog({ children, onImportSuccess }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const downloadTemplate = () => {
    const headers = [
      "Razão Social",
      "Nome Fantasia (Crachá)",
      "CNPJ",
      "Responsável",
      "Email",
      "Telefone",
      "Logradouro",
      "Número",
      "Complemento",
      "Bairro",
      "CEP",
      "Cidade",
      "Estado",
      "Data Último Registro",
      "Permissão (A/I)",
    ]
    const example = [
      "Empresa Exemplo LTDA",
      "Exemplo",
      "00.000.000/0001-00",
      "João Silva",
      "contato@exemplo.com",
      "(11) 99999-9999",
      "Rua das Flores",
      "123",
      "Sala 1",
      "Centro",
      "01234-567",
      "São Paulo",
      "SP",
      "15/01/2026",
      "A",
    ]
    const csvContent = Papa.unparse([headers, example])
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "modelo_importacao_empresas.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setResults(null)

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (parseResults) => {
        const rows = parseResults.data
        if (rows.length === 0) {
          setError("O arquivo está vazio.")
          setLoading(false)
          return
        }

        const firstRow = rows[0]
        // Heurística para detectar se é o template padrão ou o arquivo do usuário
        const isHeaderTemplate =
          firstRow.includes("Razão Social") ||
          firstRow.includes("Corporate Name")

        let dataToProcess = []

        if (isHeaderTemplate) {
          // Processamento baseado em CABEÇALHOS (Template Padrão)
          const headers = firstRow.map((h) => (h || "").toString().trim())
          dataToProcess = rows.slice(1).map((row) => {
            const getCol = (name) => {
              const idx = headers.indexOf(name)
              const val = idx !== -1 ? row[idx] : null
              return (val || "").toString().trim()
            }

            return {
              corporate_name: getCol("Razão Social"),
              badge: getCol("Nome Fantasia (Crachá)"),
              cnpj: getCol("CNPJ"),
              responsible_person: getCol("Responsável"),
              email: getCol("Email"),
              phone: getCol("Telefone"),
              address: getCol("Logradouro"),
              address_number: getCol("Número"),
              address_complement: getCol("Complemento"),
              neighborhood: getCol("Bairro"),
              zip_code: getCol("CEP"),
              city: getCol("Cidade"),
              state: getCol("Estado"),
              last_registration_date: getCol("Data Último Registro"),
              permission: getCol("Permissão (A/I)"),
            }
          })
        } else {
          // Processamento baseado em POSIÇÕES (Arquivo do usuário)
          dataToProcess = rows.map((row) => {
            const cleanRow = (row || []).map((cell) =>
              (cell || "").toString().trim(),
            )

            return {
              corporate_name: cleanRow[0],
              badge: cleanRow[1],
              cnpj: cleanRow[2],
              // Col 3 é tipo, Col 4 é nome da rua
              address: [cleanRow[3], cleanRow[4]]
                .filter(Boolean)
                .join(" ")
                .trim(),
              address_number: cleanRow[5],
              address_complement: cleanRow[6],
              neighborhood: cleanRow[7],
              city: cleanRow[8],
              state: cleanRow[9],
              phone: cleanRow[11],
              email: cleanRow[12],
              responsible_person: cleanRow[13],
              zip_code: cleanRow[14],
              last_registration_date: cleanRow[15],
              permission: "A",
            }
          })
        }

        // Limpeza FINAL e aplicação de padrões
        const cleanedData = dataToProcess
          .map((item) => {
            const newItem = { ...item }
            Object.keys(newItem).forEach((key) => {
              let val = newItem[key]

              // Tratar strings "NULL" ou vazias/nulas
              if (
                val === "NULL" ||
                val === "" ||
                val === undefined ||
                val === null
              ) {
                if (key === "permission") val = "A"
                else val = ""
              }

              // Normalizar last_registration_date para formato que o Postgres aceite
              if (key === "last_registration_date") {
                if (!val || val === "NULL" || val === "") {
                  val = null
                } else {
                  const dateParts = val.toString().split("/")
                  if (dateParts.length === 3) {
                    // Tenta converter DD/MM/YYYY para YYYY-MM-DD
                    const d = dateParts[0].padStart(2, "0")
                    const m = dateParts[1].padStart(2, "0")
                    const y = dateParts[2]
                    const isoDate = `${y}-${m}-${d}`
                    if (!isNaN(new Date(isoDate).getTime())) {
                      val = isoDate
                    } else {
                      val = null
                    }
                  } else {
                    const parsedDate = new Date(val)
                    val = !isNaN(parsedDate.getTime())
                      ? parsedDate.toISOString()
                      : null
                  }
                }
              }

              newItem[key] = val
            })
            return newItem
          })
          .filter((item) => item.corporate_name)

        try {
          const response = await fetch("/api/v1/companies/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cleanedData),
          })

          const data = await response.json()
          if (response.ok) {
            setResults(data)
            if (onImportSuccess) onImportSuccess()
          } else {
            setError(data.message || "Erro ao processar arquivo.")
          }
        } catch (err) {
          setError("Ocorreu um erro de conexão ao enviar os dados.")
        } finally {
          setLoading(false)
          if (fileInputRef.current) fileInputRef.current.value = ""
        }
      },
      error: () => {
        setError("Erro ao ler o arquivo CSV.")
        setLoading(false)
      },
    })
  }

  const resetState = () => {
    setResults(null)
    setError(null)
    setLoading(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (!val) resetState()
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Empresas via CSV</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV seguindo o modelo para importar múltiplas
            empresas.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center gap-4">
          {!results && !loading && (
            <>
              <div
                className="w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-8 w-8 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">
                  Clique para selecionar o arquivo
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadTemplate}
                className="text-blue-600"
              >
                <Download className="h-4 w-4 mr-2" /> Baixar Modelo CSV
              </Button>
            </>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-500">Processando importação...</p>
            </div>
          )}

          {error && (
            <div className="w-full p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-900">
                  Erro na Importação
                </p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          )}

          {results && (
            <div className="w-full space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex flex-col items-center">
                  <span className="text-2xl font-bold text-green-700">
                    {results.successCount}
                  </span>
                  <span className="text-xs text-green-600 font-medium uppercase tracking-wider">
                    Sucesso
                  </span>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center">
                  <span className="text-2xl font-bold text-red-700">
                    {results.errorCount}
                  </span>
                  <span className="text-xs text-red-600 font-medium uppercase tracking-wider">
                    Erros
                  </span>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y bg-gray-50">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="p-3">
                      <p className="text-xs font-bold text-gray-700">
                        Linha {err.row}: {err.corporate_name}
                      </p>
                      <p className="text-xs text-red-600">{err.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {results.errorCount === 0 && (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Todas as empresas foram importadas!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {results ? (
            <Button onClick={() => setOpen(false)} className="w-full">
              Fechar
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Cancelar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
