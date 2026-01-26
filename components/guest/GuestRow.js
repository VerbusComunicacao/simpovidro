import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { GuestDialog } from "./GuestDialog"

export function GuestRow({ guest, onUpdate }) {
  return (
    <tr className="hover:bg-gray-50 border-b group transition-colors">
      <td className="py-4 px-4 text-sm">
        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {guest.name}
        </div>
        {guest.badge_name && (
          <div className="text-xs text-gray-400 italic">
            Crachá: {guest.badge_name}
          </div>
        )}
      </td>
      <td className="py-4 px-4 text-sm font-mono text-gray-600">
        {guest.cpf_number}
      </td>
      <td className="py-4 px-4 text-sm text-gray-600">{guest.email || "-"}</td>
      <td className="py-4 px-4 text-sm text-gray-600 truncate max-w-[150px]">
        {guest.phone}
      </td>
      <td className="py-4 px-4 text-sm text-right">
        <GuestDialog guestToEdit={guest} onGuestSuccess={onUpdate}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </GuestDialog>
      </td>
    </tr>
  )
}
