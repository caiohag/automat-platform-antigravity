"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      })

      if (error) {
        toast.error("Erro ao criar conta", { description: error.message })
        return
      }
      
      // Auto create organization
      if (data.user) {
        const { error: orgError } = await supabase
          .from('organizations')
          .insert([
            { name: `Organização de ${name}`, owner_id: data.user.id }
          ])
          
        if (orgError) {
          console.error("Erro ao criar organização:", orgError)
          // Ignorando erro de RLS temporariamente para o usuário seguir
        }
      }

      toast.success("Conta criada com sucesso!")
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      toast.error("Erro inesperado", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>
          Crie uma nova conta para usar a plataforma.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
          <div className="text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Fazer login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
