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
import { Search, Loader2, UserPlus, RefreshCw } from "lucide-react"
import { GuestDialog } from "./GuestDialog"

export function ReplaceGuestDialog({ children, sale, oldGuest, onConfirm }) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedNewGuest, setSelectedNewGuest] = useState(null)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchTerm("")
      setDebouncedSearchTerm("")
      setSearchResults([])
      setSelectedNewGuest(null)
    }
  }, [open])

  // Debounce searchTerm changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Perform search when debounced term changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([])
        return
      }

      setSearching(true)
      try {
        const res = await fetch(
          `/api/v1/guests?search=${encodeURIComponent(debouncedSearchTerm)}&limit=10`,
        )
        if (res.ok) {
          const data = await res.json()
          // Filter out guests already in the sale
          const currentGuestIds = sale.guests?.map((g) => g.id) || []
          const filtered = (data.data || []).filter(
            (g) => !currentGuestIds.includes(g.id),
          )
          setSearchResults(filtered)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }

    performSearch()
  }, [debouncedSearchTerm, sale.guests])

  const handleSelectGuest = (guest) => {
    setSelectedNewGuest(guest)
  }

  const handleNewGuestCreated = (newGuest) => {
    setSelectedNewGuest(newGuest)
  }

  const handleConfirmSwap = () => {
    if (!selectedNewGuest) return
    if (onConfirm) {
      onConfirm(selectedNewGuest)
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Substituir Hóspede
          </DialogTitle>
          <DialogDescription>
            Substitua <strong>{oldGuest.name}</strong> por outro hóspede nesta
            inscrição.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!selectedNewGuest ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-gray-700">
                  Buscar Hóspede Cadastrado
                </Label>
                <GuestDialog onGuestSuccess={handleNewGuestCreated}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Novo Hóspede
                  </Button>
                </GuestDialog>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por Nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-gray-200"
                />
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto border rounded-lg p-1 bg-gray-50/50">
                {searching ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-sm">Buscando...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((guest) => (
                    <button
                      key={guest.id}
                      type="button"
                      onClick={() => handleSelectGuest(guest)}
                      className="w-full flex items-center justify-between p-3 hover:bg-white hover:shadow-sm rounded-lg transition-all text-left border border-transparent hover:border-gray-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {guest.name}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          CPF: {guest.cpf_number}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 hover:underline">
                        Selecionar
                      </span>
                    </button>
                  ))
                ) : searchTerm.length >= 2 ? (
                  <p className="text-center text-sm text-gray-500 py-8">
                    Nenhum hóspede encontrado.
                  </p>
                ) : (
                  <p className="text-center text-xs text-gray-400 py-8 italic">
                    Digite pelo menos 2 caracteres para buscar.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
                <h4 className="font-bold text-blue-900 text-sm">
                  Confirmação da Substituição
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3 rounded border border-gray-150">
                    <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">
                      Sairá da Inscrição
                    </p>
                    <p className="font-bold text-red-600">{oldGuest.name}</p>
                    <p className="text-gray-500 font-mono mt-0.5">
                      {oldGuest.cpf_number}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-150">
                    <p className="text-blue-400 font-bold uppercase tracking-wider text-[9px] mb-1">
                      Entrará na Inscrição
                    </p>
                    <p className="font-bold text-green-600">
                      {selectedNewGuest.name}
                    </p>
                    <p className="text-gray-500 font-mono mt-0.5">
                      {selectedNewGuest.cpf_number}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNewGuest(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Voltar para a busca
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          {selectedNewGuest && (
            <Button
              type="button"
              onClick={handleConfirmSwap}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirmar Substituição
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
