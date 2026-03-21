import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// This route uses the service role key to bypass RLS for initial tenant/agent creation
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the user is authenticated via their session cookies
    const cookieStore = await cookies()
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { /* ignore in route handler */ }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado. Faça login novamente.' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { agentName, businessName, businessDescription, systemPrompt, knowledgeBase } = body

    if (!agentName || !systemPrompt) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos (nome do agente e system prompt).' }, { status: 400 })
    }

    // 3. Create admin client that bypasses RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. Check if user already has a tenant
    const { data: existingTenant, error: tenantSelectErr } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (tenantSelectErr) {
      console.error('[API] Error selecting tenant:', tenantSelectErr)
    }

    let tenantId = existingTenant?.id

    // 5. If no tenant, create one
    if (!tenantId) {
      const baseSlug = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ?? 'user'
      
      // Check if slug already exists and make it unique if needed
      const { data: slugCheck } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('slug', baseSlug)
        .maybeSingle()
      
      const finalSlug = slugCheck ? `${baseSlug}-${Date.now()}` : baseSlug

      const { data: newTenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert({ 
          name: businessName || 'Minha Empresa', 
          slug: finalSlug, 
          owner_id: user.id 
        })
        .select('id')
        .single()

      if (tenantError || !newTenant) {
        console.error('[API] Tenant creation error:', JSON.stringify(tenantError))
        return NextResponse.json({ error: `Erro ao criar tenant: ${tenantError?.message || 'Desconhecido'}` }, { status: 500 })
      }

      tenantId = newTenant.id

      // 6. Create team_member for the owner
      const { error: memberError } = await supabaseAdmin.from('team_members').insert({
        tenant_id: tenantId,
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
        role: 'admin',
        status: 'active',
        is_active: true,
      })

      if (memberError) {
        console.error('[API] Team member creation error:', JSON.stringify(memberError))
        // Non-blocking — continue to create agent
      }
    }

    // 7. Create the agent
    const { data: agent, error: agentError } = await supabaseAdmin.from('agents').insert({
      tenant_id: tenantId,
      name: agentName,
      description: businessDescription || '',
      system_prompt: systemPrompt,
      model: 'gpt-4o',
      temperature: 0.7,
      is_active: false,
      test_mode: true,
      knowledge_base: knowledgeBase || {},
    }).select('id').single()

    if (agentError || !agent) {
      console.error('[API] Agent creation error:', JSON.stringify(agentError))
      return NextResponse.json({ error: `Erro ao criar agente: ${agentError?.message || 'Desconhecido'}` }, { status: 500 })
    }

    return NextResponse.json({ agentId: agent.id, tenantId }, { status: 201 })
  } catch (err: any) {
    console.error('[API] Unexpected error:', err?.message || err)
    return NextResponse.json({ error: `Erro interno: ${err?.message || 'Verifique os logs do servidor'}` }, { status: 500 })
  }
}
