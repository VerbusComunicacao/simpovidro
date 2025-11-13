import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorDialog from "@/components/ui/ErrorDialog";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAction("");
    setSuccess("");
    setLoading(true);

    const response = await fetch("/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    setLoading(false);

    if (response.ok) {
      setSuccess(
        "Cadastro realizado com sucesso! Verifique seu email para ativar sua conta."
      );
      setUsername("");
      setEmail("");
      setPassword("");
    } else {
      const data = await response.json();
      setError(data.message || "Ocorreu um erro no seu cadastro.");
      if (data.action) {
        setAction(data.action);
      }
      setIsErrorDialogOpen(true);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cadastro</CardTitle>
          <CardDescription>
            Crie sua conta para acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  placeholder="Seu nome de usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {success && (
              <p className="text-green-500 text-sm mt-4">{success}</p>
            )}
            <CardFooter className="flex justify-end px-0 pt-6">
              <Button type="submit" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Erro no Cadastro"
        message={error}
        actionMessage={action}
      />
    </div>
  );
}
