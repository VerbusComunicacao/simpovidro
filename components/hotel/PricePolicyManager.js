import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

export function PricePolicyManager({
  policies,
  onChange,
  hideSideLabel = false,
}) {
  const handleAddPolicy = () => {
    onChange([...policies, { max_age: "", percentage: "", description: "" }])
  }

  const handleRemovePolicy = (index) => {
    const newPolicies = policies.filter((_, i) => i !== index)
    onChange(newPolicies)
  }

  const handlePolicyChange = (index, field, value) => {
    const newPolicies = [...policies]
    newPolicies[index] = { ...newPolicies[index], [field]: value }
    onChange(newPolicies)
  }

  return (
    <div className={hideSideLabel ? "" : "grid grid-cols-4 items-start gap-4"}>
      {!hideSideLabel && (
        <Label className="text-right pt-2">Políticas de Idade</Label>
      )}
      <div className={hideSideLabel ? "space-y-4" : "col-span-3 space-y-4"}>
        {policies.map((policy, index) => (
          <div
            key={index}
            className="flex gap-2 items-start p-2 border rounded-md bg-gray-50"
          >
            <div className="grid gap-2 flex-1">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Idade Máx.</Label>
                  <Input
                    type="number"
                    value={policy.max_age}
                    onChange={(e) =>
                      handlePolicyChange(index, "max_age", e.target.value)
                    }
                    placeholder="Ex: 5"
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Porcentagem (%)</Label>
                  <Input
                    type="number"
                    value={policy.percentage}
                    onChange={(e) =>
                      handlePolicyChange(index, "percentage", e.target.value)
                    }
                    placeholder="Ex: 50"
                    className="h-8"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={policy.description}
                  onChange={(e) =>
                    handlePolicyChange(index, "description", e.target.value)
                  }
                  placeholder="Ex: Crianças até 5 anos não pagam"
                  className="h-8"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="mt-6 h-8 w-8"
              onClick={() => handleRemovePolicy(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddPolicy}
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar Política
        </Button>
      </div>
    </div>
  )
}
