# Automat Platform — Regras do Projeto

## O que é este projeto
Plataforma SaaS para criação de agentes de IA que atendem pelo WhatsApp e Instagram DM.
O usuário cria agentes via wizard de 5 passos — nunca escreve prompts manualmente.
MVP focado em e-commerce e clínicas.

## Stack obrigatória
- Next.js 14+ com App Router (diretório app/)
- TypeScript strict
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- OpenAI API diretamente (pacote npm "openai") — NUNCA via proxy
- Stripe para pagamentos
- Evolution API para WhatsApp
- Meta Graph API para Instagram
- Deploy na Vercel
- Fonte: Plus Jakarta Sans
- Dark mode como padrão
- Interface 100% em Português (BR)
- Ícones: Lucide React

## PROIBIDO
- Express.js (usar API Routes do Next.js)
- tRPC (usar Server Actions ou API Routes)
- MySQL / Drizzle ORM (usar Supabase PostgreSQL)
- Wouter (usar next/navigation e next/link)
- Vite (Next.js tem bundler próprio)
- Jose / JWT manual (Supabase Auth gerencia sessões)
- Framer Motion (usar CSS transitions)
- Qualquer infraestrutura do Manus (forge.manus.im, Manus OAuth, vite-plugin-manus-runtime)

## Padrões de código
- Server Components por padrão para páginas
- Client Components ('use client') apenas quando precisa de useState, useEffect, onClick
- Server Actions ('use server') para mutations (criar, editar, deletar)
- API Routes (app/api/*/route.ts) para webhooks e endpoints de IA
- Supabase browser client: lib/supabase/client.ts
- Supabase server client: lib/supabase/server.ts
- Middleware protege rotas /dashboard/*
- Variáveis sensíveis NUNCA em NEXT_PUBLIC_

## Estrutura do projeto
```
app/(auth)/         → login, register (público)
app/(dashboard)/    → dashboard, agents, chat, contacts, settings (autenticado)
app/api/            → webhooks (stripe, whatsapp, instagram), endpoints IA
components/ui/      → shadcn/ui
components/         → componentes do app
lib/supabase/       → client.ts, server.ts
lib/openai.ts       → OpenAI client
lib/stripe.ts       → Stripe client
lib/evolution.ts    → Evolution API client
types/              → tipos TypeScript
```

## Banco de dados (Supabase PostgreSQL)
Tabelas MVP: organizations, agents, knowledge_base, whatsapp_accounts, contacts, conversations, messages, subscriptions, usage.
RLS habilitado em todas as tabelas — usuário só acessa dados da sua organização.
UUIDs como primary keys. Timestamps com TIMESTAMPTZ.

## Onboarding wizard (5 passos)
1. Informações do negócio (nome, tipo, descrição, horário)
2. Serviços/produtos (formulário dinâmico por nicho)
3. Personalidade do agente (tom, nome, emojis, limites)
4. Base de conhecimento (upload PDF, FAQ, URL)
5. Teste e ativação (chat preview, conectar WhatsApp)

O sistema gera o system prompt automaticamente a partir dos dados coletados.

## Regras de UI
- Todos os labels, botões, placeholders e mensagens em português (BR)
- Componentes shadcn/ui (instalar via npx shadcn@latest add)
- Toasts via Sonner
- Dark mode obrigatório
- Estilo visual: Linear, Vercel Dashboard
- Mobile-first, responsivo