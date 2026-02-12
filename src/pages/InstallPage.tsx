import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

type StepStatus = "idle" | "running" | "ok" | "error";

interface InstallStepState {
  test: StepStatus;
  migrate: StepStatus;
  seed: StepStatus;
  finalize: StepStatus;
}

const InstallPage = () => {
  const navigate = useNavigate();
  const [databaseUrl, setDatabaseUrl] = useState("postgres://app:app@postgres:5432/app");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [steps, setSteps] = useState<InstallStepState>({
    test: "idle",
    migrate: "idle",
    seed: "idle",
    finalize: "idle",
  });
  const [installing, setInstalling] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "ok" | "error">("idle");

  const resetMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleTestConnection = async () => {
    resetMessages();
    setTestResult("idle");
    try {
      const res = await fetch("/api/install/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult("ok");
        setStatusMessage("Conexão com o banco de dados bem-sucedida.");
      } else {
        setTestResult("error");
        setErrorMessage(data.error || "Falha ao testar conexão com o banco de dados.");
      }
    } catch (err) {
      setTestResult("error");
      setErrorMessage("Erro inesperado ao testar conexão. Verifique se o serviço postgres está acessível.");
    }
  };

  const handleInstall = async () => {
    resetMessages();
    setInstalling(true);
    setSteps({
      test: "running",
      migrate: "idle",
      seed: "idle",
      finalize: "idle",
    });

    try {
      const res = await fetch("/api/install/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl, adminEmail, adminPassword }),
      });
      const data = await res.json();

      const nextSteps: InstallStepState = {
        test: data.steps?.test?.status === "ok" ? "ok" : data.steps?.test?.status === "error" ? "error" : "idle",
        migrate:
          data.steps?.migrate?.status === "ok" ? "ok" : data.steps?.migrate?.status === "error" ? "error" : "idle",
        seed: data.steps?.seed?.status === "ok" ? "ok" : data.steps?.seed?.status === "error" ? "error" : "idle",
        finalize:
          data.steps?.finalize?.status === "ok"
            ? "ok"
            : data.steps?.finalize?.status === "error"
            ? "error"
            : "idle",
      };
      setSteps(nextSteps);

      if (!res.ok || !data.ok) {
        setErrorMessage(
          data.steps?.test?.message ||
            data.steps?.migrate?.message ||
            data.steps?.seed?.message ||
            data.steps?.finalize?.message ||
            data.error ||
            "Falha na instalação. Tente novamente e verifique os logs do servidor."
        );
        return;
      }

      setStatusMessage("Instalação concluída com sucesso! Redirecionando para o app...");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } catch (err) {
      setErrorMessage("Erro inesperado durante a instalação. Verifique os logs do servidor e tente novamente.");
    } finally {
      setInstalling(false);
    }
  };

  const renderStepBadge = (label: string, status: StepStatus) => {
    const base = "px-3 py-1 rounded-full text-xs flex items-center gap-1";
    if (status === "ok") {
      return (
        <div className={`${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200`}>
          <CheckCircle2 className="w-3 h-3" />
          {label}
        </div>
      );
    }
    if (status === "error") {
      return (
        <div className={`${base} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200`}>
          <AlertCircle className="w-3 h-3" />
          {label}
        </div>
      );
    }
    if (status === "running") {
      return (
        <div className={`${base} bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200`}>
          <span className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          {label}
        </div>
      );
    }
    return <div className={`${base} bg-muted text-muted-foreground`}>{label}</div>;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute -top-2 -left-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Instalação do Stellar Field Buddy</h1>
            <p className="text-sm text-muted-foreground">
              Configure a conexão com o PostgreSQL e aplique a instalação inicial do sistema.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">DATABASE_URL</label>
            <Input
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              placeholder="postgres://user:password@host:5432/database"
            />
            <p className="text-xs text-muted-foreground">
              Por padrão, usamos o banco interno do Docker Compose:{" "}
              <code>postgres://app:app@postgres:5432/app</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail do administrador</label>
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha do administrador</label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={installing}>
              Testar conexão
            </Button>
            <Button size="sm" onClick={handleInstall} disabled={installing || !databaseUrl}>
              {installing ? "Instalando..." : "Instalar"}
            </Button>

            {testResult === "ok" && (
              <span className="text-xs text-emerald-600 dark:text-emerald-300">Conexão validada com sucesso.</span>
            )}
            {testResult === "error" && (
              <span className="text-xs text-red-600 dark:text-red-300">Falha ao conectar ao banco.</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {renderStepBadge("Teste de conexão", steps.test)}
            {renderStepBadge("Migrations", steps.migrate)}
            {renderStepBadge("Seed inicial", steps.seed)}
            {renderStepBadge("Finalização", steps.finalize)}
          </div>

          {statusMessage && (
            <div className="text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {statusMessage}
            </div>
          )}
          {errorMessage && (
            <div className="text-xs text-red-600 dark:text-red-300 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          <p className="text-xs text-muted-foreground pt-2">
            Este assistente pode ser executado novamente em caso de falha; as migrations e seeds são projetados para
            serem idempotentes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstallPage;
