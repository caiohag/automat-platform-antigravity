"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Runtime Production Error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 border rounded-lg bg-destructive/10 text-destructive m-8">
      <AlertTriangle className="w-12 h-12 mb-4" />
      <h2 className="text-xl font-bold mb-2">Erro Crítico de Servidor Renderizado</h2>
      <p className="mb-4">Ocorreu um erro letal ao tentar montar esta página na Vercel:</p>
      
      <pre className="bg-black/80 text-red-400 p-4 rounded-md w-full max-w-2xl overflow-auto text-sm mb-6 border border-red-500 flex-wrap">
        {error.name}: {error.message}
        {"\n\n"}
        Digest: {error.digest || "N/A"}
      </pre>

      <Button onClick={() => reset()} variant="destructive">
        Tentar Novamente
      </Button>
    </div>
  )
}
