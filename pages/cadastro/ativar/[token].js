import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ErrorDialog from "@/components/ui/ErrorDialog";

export default function Activate() {
  const router = useRouter();
  const { token } = router.query;
  const [message, setMessage] = useState("Ativando sua conta...");
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  useEffect(() => {
    if (token) {
      activateAccount();
    } else {
      setMessage("Token de ativação não encontrado na URL.");
      setError(true);
      setIsErrorDialogOpen(true);
    }
  }, [token]);

  const activateAccount = async () => {
    try {
      const response = await fetch(`/api/v1/activations/${token}`, {
        method: "PATCH",
      });

      if (response.ok) {
        setMessage(
          "Conta ativada com sucesso! Você será redirecionado para o login."
        );
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        const data = await response.json();
        setMessage(data.message || "Erro ao ativar a conta.");
        if (data.action) {
          setActionMessage(data.action);
        }
        setError(true);
        setIsErrorDialogOpen(true);
      }
    } catch (error) {
      setMessage("Ocorreu um erro. Tente novamente mais tarde.");
      setError(true);
      setIsErrorDialogOpen(true);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ativação de Conta</CardTitle>
          <CardDescription>
            {error ? "Ocorreu um problema" : "Aguarde um momento"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className={error ? "text-red-500" : ""}>{message}</p>
        </CardContent>
      </Card>

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => router.push("/login")}
        title="Erro na Ativação"
        message={message}
        actionMessage={actionMessage}
        closeText="Ir para Login"
      />
    </div>
  );
}
