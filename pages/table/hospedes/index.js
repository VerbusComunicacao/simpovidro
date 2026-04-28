import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { Plus, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import TableLayout from "@/components/layout/TableLayout"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { GuestDialog } from "@/components/guest/GuestDialog"
import { GuestRow } from "@/components/guest/GuestRow"
import { GuestImportButton } from "@/components/guest/GuestImportButton"

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

export default function GuestsTable() {
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setPage(1) // Reset to page 1 when search changes
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const {
    data: guestsResponse,
    error: guestsError,
    mutate,
    isLoading,
  } = useSWR(
    `/api/v1/guests?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearchTerm)}`,
    fetcher,
  )

  useEffect(() => {
    if (guestsError) {
      setIsErrorDialogOpen(true)
    }
  }, [guestsError])

  const guests = guestsResponse?.data || []
  const meta = guestsResponse?.meta

  return (
    <TableLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Hóspedes</h2>
          <p className="text-sm text-gray-500">
            Listagem de todos os hóspedes cadastrados no sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, CPF ou email..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <GuestImportButton onImportSuccess={() => mutate()} />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {!isLoading && guests.length === 0 && !guestsError && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          Nenhum hóspede encontrado para a busca &quot;{searchTerm}&quot;.
        </div>
      )}

      {!isLoading && guests.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    onUpdate={() => mutate()}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4 bg-gray-50">
              <span className="text-sm text-gray-500">
                Mostrando {guests.length} de {meta.total} registros
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <div className="text-sm font-medium px-2">
                  Página {page} de {meta.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page === meta.totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <GuestDialog onGuestSuccess={() => mutate()}>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform p-0"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </GuestDialog>
      </div>

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro ao Carregar Hóspedes"
        message={
          guestsError?.info?.message || "Ocorreu um erro ao buscar os dados."
        }
        actionMessage={guestsError?.info?.action}
        onRetry={() => mutate()}
      />
    </TableLayout>
  )
}
