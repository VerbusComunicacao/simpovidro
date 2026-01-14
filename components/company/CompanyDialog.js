import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErrorDialog from "@/components/ui/ErrorDialog";
import { maskPhone, maskCNPJ, maskCEP } from "@/lib/masks";

export function CompanyDialog({
  children,
  onCompanySuccess,
  companyToEdit = null,
}) {
  const isEditMode = !!companyToEdit;
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    corporate_name: "",
    badge: "",
    cnpj: "",
    address: "",
    address_number: "",
    address_complement: "",
    neighborhood: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    responsible_person: "",
    zip_code: "",
    permission: "A",
    discount_status: "N",
  });

  useEffect(() => {
    if (companyToEdit) {
      setFormData({
        corporate_name: companyToEdit.corporate_name || "",
        badge: companyToEdit.badge || "",
        cnpj: companyToEdit.cnpj || "",
        address: companyToEdit.address || "",
        address_number: companyToEdit.address_number || "",
        address_complement: companyToEdit.address_complement || "",
        neighborhood: companyToEdit.neighborhood || "",
        city: companyToEdit.city || "",
        state: companyToEdit.state || "",
        phone: companyToEdit.phone || "",
        email: companyToEdit.email || "",
        responsible_person: companyToEdit.responsible_person || "",
        zip_code: companyToEdit.zip_code || "",
        permission: companyToEdit.permission || "A",
        discount_status: companyToEdit.discount_status || "N",
      });
    } else {
      setFormData({
        corporate_name: "",
        badge: "",
        cnpj: "",
        address: "",
        address_number: "",
        address_complement: "",
        neighborhood: "",
        city: "",
        state: "",
        phone: "",
        email: "",
        responsible_person: "",
        zip_code: "",
        permission: "A",
        discount_status: "N",
      });
    }
  }, [companyToEdit, open]);

  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let maskedValue = value;
    if (name === "phone") maskedValue = maskPhone(value);
    if (name === "cnpj") maskedValue = maskCNPJ(value);
    if (name === "zip_code") maskedValue = maskCEP(value);

    setFormData((prev) => ({ ...prev, [name]: maskedValue }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAction("");
    setLoading(true);

    const url = isEditMode 
      ? `/api/v1/companies/${companyToEdit.id}`
      : "/api/v1/companies";
    
    const method = isEditMode ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    setLoading(false);

    if (response.ok) {
      if (onCompanySuccess) onCompanySuccess();
      setOpen(false);
    } else {
      const data = await response.json();
      setError(data.message || `Ocorreu um erro ao ${isEditMode ? 'editar' : 'adicionar'} a empresa.`);
      if (data.action) {
        setAction(data.action);
      }
      setIsErrorDialogOpen(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Empresa' : 'Adicionar Nova Empresa'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Atualize os dados da empresa parceira.' 
                : 'Preencha os dados da nova empresa parceira.'
              } Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="max-h-[70vh] overflow-y-auto px-1">
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="corporate_name">Razão Social *</Label>
                    <Input
                      id="corporate_name"
                      name="corporate_name"
                      value={formData.corporate_name}
                      onChange={handleChange}
                      placeholder="Nome completo da empresa"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="badge">Ref (Crachá) *</Label>
                    <Input
                      id="badge"
                      name="badge"
                      value={formData.badge}
                      onChange={handleChange}
                      placeholder="Identificação curta"
                      maxLength={23}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleChange}
                      placeholder="00.000.000/0000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsible_person">Responsável *</Label>
                    <Input
                      id="responsible_person"
                      name="responsible_person"
                      value={formData.responsible_person}
                      onChange={handleChange}
                      placeholder="Nome do responsável"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Contato *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="exemplo@empresa.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3 text-gray-500">Endereço</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="address">Logradouro *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Rua, Avenida..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_number">Número *</Label>
                      <Input
                        id="address_number"
                        name="address_number"
                        value={formData.address_number}
                        onChange={handleChange}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_complement">Complemento</Label>
                      <Input
                        id="address_complement"
                        name="address_complement"
                        value={formData.address_complement}
                        onChange={handleChange}
                        placeholder="Apto, Sala, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleChange}
                        placeholder="Centro"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip_code">CEP *</Label>
                      <Input
                        id="zip_code"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={handleChange}
                        placeholder="00000-000"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Nome da cidade"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado (UF) *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Ex: SP"
                        maxLength={100}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="permission">Status de Permissão *</Label>
                    <Select 
                      onValueChange={(val) => handleSelectChange("permission", val)} 
                      value={formData.permission}
                      required
                    >
                      <SelectTrigger id="permission">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Ativo</SelectItem>
                        <SelectItem value="I">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_status">Status de Desconto *</Label>
                    <Select 
                      onValueChange={(val) => handleSelectChange("discount_status", val)} 
                      value={formData.discount_status}
                      required
                    >
                      <SelectTrigger id="discount_status">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S">Sim (Atribuir desconto)</SelectItem>
                        <SelectItem value="N">Não (Sem desconto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Salvando..." : (isEditMode ? "Salvar Alterações" : "Adicionar Empresa")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title={`Erro ao ${isEditMode ? 'Editar' : 'Adicionar'} Empresa`}
        message={error}
        actionMessage={action}
      />
    </>
  );
}
