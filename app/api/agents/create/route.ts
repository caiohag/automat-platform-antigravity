import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// This route uses the service role key to bypass RLS for initial tenant/agent creation
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the user is authenticated via their session
    const supabaseUser = await createServerClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { agentName, businessName, businessDescription, systemPrompt, knowledgeBase } = body

    if (!agentName || !systemPrompt) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    // 3. Create admin client that bypasses RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. Check if user already has a tenant
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    let tenantId = existingTenant?.id

    // 5. If no tenant, create one
    if (!tenantId) {
      const slug = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ?? `user-${Date.now()}`
      
      // Check if slug already exists and make it unique if needed
      const { data: slugCheck } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      
      const finalSlug = slugCheck ? `${slug}-${Date.now()}` : slug

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
        console.error('Tenant creation error:', tenantError)
        return NextResponse.json({ error: `Erro ao criar tenant: ${tenantError?.message}` }, { status: 500 })
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
        console.error('Team member creation error:', memberError)
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
      console.error('Agent creation error:', agentError)
      return NextResponse.json({ error: `Erro ao criar agente: ${agentError?.message}` }, { status: 500 })
    }

    return NextResponse.json({ agentId: agent.id, tenantId }, { status: 201 })
  } catch (err: any) {
    console.error('Unexpected error in agent creation:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
