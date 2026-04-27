import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import Papa from "papaparse"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { maskCPF, maskPhone, maskRG } from "@/lib/masks"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function GuestImportButton({ onImportSuccess }) {
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [isResultOpen, setIsResultOpen] = useState(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef(null)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const parseCsvFields = (row) => {
    const normalizedRow = {}
    Object.keys(row).forEach((key) => {
      normalizedRow[key.trim().toLowerCase()] = row[key]
    })

    const getValue = (keys) => {
      for (const k of keys) {
        if (normalizedRow[k]) return normalizedRow[k].trim()
      }
      return ""
    }

    const rawCpf = getValue(["cpf", "cpf_number", "cpf number"])
    const rawRg = getValue(["rg", "rg_number", "rg number"])
    const rawPhone = getValue(["telefone", "celular", "phone"])

    const rawDate = getValue([
      "data de nascimento",
      "data nascimento",
      "datanascimento",
      "nascimento",
      "data_nascimento",
      "birth_date",
      "birth date",
    ])
    let formattedDate = rawDate
    if (rawDate && rawDate.includes("/")) {
      const parts = rawDate.split("/")
      if (parts.length === 3) {
        if (parts[0].length <= 2 && parts[2].length === 4) {
          const day = parts[0].padStart(2, "0")
          const month = parts[1].padStart(2, "0")
          formattedDate = `${parts[2]}-${month}-${day}`
        }
      }
    }

    const rawGender = getValue(["sexo", "gênero", "genero", "gender"])
    let formattedGender = ""
    if (rawGender) {
      formattedGender = rawGender.toUpperCase().startsWith("F") ? "F" : "M"
    }

    const getBoolValue = (keys) => {
      const val = getValue(keys)
      return (
        val === "sim" ||
        val === "true" ||
        val === "1" ||
        val === "s" ||
        val === "yes"
      )
    }

    return {
      name: getValue(["nome", "name", "nome completo", "nomecompleto"]),
      badge_name: getValue([
        "crachá",
        "cracha",
        "nome no crachá",
        "nomecracha",
        "badge_name",
        "badge name",
        "nome cracha",
        "nome crachá",
      ]),
      email: getValue(["email", "e-mail"]),
      phone: rawPhone ? maskPhone(rawPhone) : "",
      gender: formattedGender,
      rg_number: rawRg ? maskRG(rawRg) : "",
      cpf_number: rawCpf ? maskCPF(rawCpf) : "",
      birth_date: formattedDate,
      company_cnpj: getValue(["cnpj", "empresa", "company_cnpj"]),
      medication_details: getValue([
        "medicamentos",
        "medicação",
        "medicacoes",
        "medication_details",
        "remedios",
        "remédios",
      ]),
      blood_type: getValue([
        "tipo sanguíneo",
        "tipo sanguineo",
        "tiposanguineo",
        "tipo sanguin",
        "tipo_sanguineo",
        "blood_type",
        "sangue",
      ]),
      blood_rh_factor: getValue([
        "fator rh",
        "fatorrh",
        "fator rg",
        "rh",
        "fator_rh",
        "blood_rh_factor",
      ]),
      health_observations: getValue([
        "observações médicas",
        "observacoesmedicas",
        "obs médicas",
        "obs medicas",
        "observações de saúde",
        "observacoes medicas",
        "health_observations",
        "observacoes",
      ]),
      special_needs_details: getValue([
        "necessidades especiais",
        "necessidadesespeciais",
        "special_needs_details",
        "pcd",
        "necessidades_especiais",
      ]),
      has_heart_condition: getBoolValue([
        "problema cardíaco",
        "problemacardiaco",
        "problema cardiaco",
        "has_heart_condition",
        "cardiaco",
      ]),
      has_diabetes: getBoolValue(["diabetes", "diabete", "has_diabetes"]),
      has_high_blood_pressure: getBoolValue([
        "pressão alta",
        "pressaoalta",
        "pressao alta",
        "has_high_blood_pressure",
        "hipertensao",
      ]),
      has_low_blood_pressure: getBoolValue([
        "pressão baixa",
        "pressaobaixa",
        "pressao baixa",
        "has_low_blood_pressure",
        "hipotensao",
      ]),
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const guestsData = results.data.map(parseCsvFields)

          const response = await fetch("/api/v1/guests/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ guests_data: guestsData }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(
              data.message || "Erro desconhecido ao processar o arquivo.",
            )
          }

          setImportResult(data)
          setIsResultOpen(true)
          if (data.success > 0 && onImportSuccess) {
            onImportSuccess()
          }
        } catch (error) {
          setErrorMessage(error.message)
          setIsErrorDialogOpen(true)
        } finally {
          setIsUploading(false)
          e.target.value = null
        }
      },
      error: (error) => {
        setErrorMessage(`Falha ao ler o arquivo CSV: ${error.message}`)
        setIsErrorDialogOpen(true)
        setIsUploading(false)
        e.target.value = null
      },
    })
  }

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={handleButtonClick}
        disabled={isUploading}
        className="flex items-center gap-2 bg-white"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {isUploading ? "Processando..." : "Importar CSV"}
      </Button>

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro na Importação"
        message={errorMessage}
      />

      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resultado da Importação</DialogTitle>
            <DialogDescription>
              Veja o resumo do processamento do seu arquivo CSV.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {importResult && (
              <>
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">
                    {importResult.success} hóspede(s) importado(s) com sucesso.
                  </span>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">
                        {importResult.errors.length} erro(s) encontrado(s):
                      </span>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto text-sm border border-gray-200 rounded-md p-3 bg-gray-50 space-y-3">
                      {importResult.errors.map((err, idx) => (
                        <div
                          key={idx}
                          className="pb-2 border-b last:border-0 last:pb-0 border-gray-200"
                        >
                          <div className="font-semibold text-gray-700">
                            Linha {err.row} ({err.name})
                          </div>
                          <div className="text-red-600 mt-0.5">
                            {err.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsResultOpen(false)}>Concluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
