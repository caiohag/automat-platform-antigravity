"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Palette, Globe, Monitor, Save } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function WhiteLabelClient({ tenant }: { tenant: any }) {
  const [platformName, setPlatformName] = useState(tenant?.custom_domain ? tenant.name : (tenant?.name || "Automat"))
  const [primaryColor, setPrimaryColor] = useState(tenant?.primary_color || "#6366f1")
  const [secondaryColor, setSecondaryColor] = useState(tenant?.secondary_color || "#8b5cf6")
  const [defaultTheme, setDefaultTheme] = useState(tenant?.default_theme || "dark")
  const [customDomain, setCustomDomain] = useState(tenant?.custom_domain || "")
  const [customCss, setCustomCss] = useState(tenant?.custom_css || "")
  const [allowPublicSignup, setAllowPublicSignup] = useState(tenant?.allow_public_signup ?? true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id) { toast.error("Tenant não encontrado"); return }
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: platformName,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          default_theme: defaultTheme,
          custom_domain: customDomain || null,
          custom_css: customCss || null,
          allow_public_signup: allowPublicSignup,
        })
        .eq('id', tenant.id)
      if (error) throw error
      toast.success("Configurações salvas com sucesso!")
    } catch (err) {
      toast.error("Erro ao salvar configurações")
    } finally { setIsSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">White-Label</h1>
        <p className="text-muted-foreground">Personalize a plataforma com a identidade visual da sua empresa.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Identidade Visual</CardTitle>
            <CardDescription>Configure o nome e cores da sua plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pname">Nome da Plataforma</Label>
              <Input id="pname" value={platformName} onChange={e => setPlatformName(e.target.value)} placeholder="Ex: MeuCRM, AtendMax..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pcolor">Cor Primária</Label>
                <div className="flex gap-2 items-center">
                  <Input id="pcolor" type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-10 w-20 cursor-pointer p-1" />
                  <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="#6366f1" className="flex-1 font-mono" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="scolor">Cor Secundária</Label>
                <div className="flex gap-2 items-center">
                  <Input id="scolor" type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="h-10 w-20 cursor-pointer p-1" />
                  <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} placeholder="#8b5cf6" className="flex-1 font-mono" />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tema Padrão</Label>
              <Select value={defaultTheme} onValueChange={(val) => val && setDefaultTheme(val)}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark (Escuro)</SelectItem>
                  <SelectItem value="light">Light (Claro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Domínio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Domínio Personalizado</CardTitle>
            <CardDescription>Configure um domínio próprio para seus clientes acessarem a plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="cdomain">Domínio</Label>
              <Input id="cdomain" value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="app.meucrm.com.br" />
              <p className="text-xs text-muted-foreground">Configure um CNAME no DNS do seu domínio apontando para platform.automat.com</p>
            </div>
          </CardContent>
        </Card>

        {/* CSS customizado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Monitor className="w-5 h-5" /> CSS Customizado</CardTitle>
            <CardDescription>Adicione estilos CSS extras para personalizar ainda mais a interface.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={customCss}
              onChange={e => setCustomCss(e.target.value)}
              placeholder=":root { --radius: 0; } .sidebar { background: linear-gradient(...) }"
              className="min-h-[140px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Opções */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Permitir Registro Público</Label>
                <p className="text-sm text-muted-foreground">Novos usuários podem criar contas diretamente no seu domínio.</p>
              </div>
              <Switch checked={allowPublicSignup} onCheckedChange={setAllowPublicSignup} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} size="lg">
            <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
