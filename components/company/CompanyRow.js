import { Badge } from "@/components/ui/badge"
import { Mail, User } from "lucide-react"
import { CompanyDialog } from "@/components/company/CompanyDialog"

export function CompanyRow({ company, onUpdate, onDelete }) {
  return (
    <tr className="group hover:bg-gray-50 transition-colors border-b last:border-0">
      <td className="py-4 px-4 align-top">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {company.corporate_name}
          </span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <CompanyDialog companyToEdit={company} onCompanySuccess={onUpdate}>
              <button className="text-[11px] text-blue-600 hover:text-blue-800 font-medium">
                Editar
              </button>
            </CompanyDialog>
            <span className="text-gray-300 text-[10px]">|</span>
            <button
              className="text-[11px] text-red-600 hover:text-red-800 font-medium"
              onClick={onDelete}
            >
              Excluir
            </button>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 align-top">
        <span className="text-xs font-mono text-gray-500">{company.cnpj}</span>
      </td>
      <td className="py-4 px-4 align-top">
        <div className="flex flex-col text-xs text-gray-600">
          <span className="font-medium text-gray-900">
            {company.city} - {company.state}
          </span>
          <span className="text-[10px] text-gray-400">
            {company.neighborhood}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 align-top">
        <div className="flex flex-col gap-1 text-xs text-gray-600">
          {company.responsible_person && (
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 text-gray-400" />
              {company.responsible_person}
            </div>
          )}
          {company.email && (
            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
              <Mail className="h-3 w-3 text-gray-400" />
              {company.email}
            </div>
          )}
        </div>
      </td>
      <td className="py-4 px-4 align-top">
        <Badge
          variant="outline"
          className={`${
            company.permission === "A"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-gray-200 bg-gray-50 text-gray-600"
          } text-[10px] px-2 py-0 h-5`}
        >
          {company.permission === "A" ? "Ativa" : "Inativa"}
        </Badge>
      </td>
      <td className="py-4 px-4 align-top text-right">
        {(company.discount_name ||
          company.custom_discount_percentage !== null) && (
          <Badge
            variant="outline"
            className="border-orange-200 text-orange-700 bg-orange-50 text-[10px] px-2 py-0 h-5"
          >
            {company.custom_discount_percentage !== null
              ? `${Number(company.custom_discount_percentage)}%`
              : `${Number(company.discount_value)}%`}
          </Badge>
        )}
      </td>
    </tr>
  )
}
