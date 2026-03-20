-- ─── TENANTS (centro do multi-tenant) ───
CREATE TABLE tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  domain TEXT,
  logo_url TEXT, favicon_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#10b981',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  custom_css TEXT,
  allow_public_registration BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  max_whatsapp_accounts INT DEFAULT 1, max_agents INT DEFAULT 1,
  max_contacts INT DEFAULT 1000, max_team_members INT DEFAULT 3,
  facebook_pixel_id TEXT, google_analytics_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── TEAM MEMBERS ───
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'supervisor', 'agent')),
  permissions JSONB, is_active BOOLEAN DEFAULT true,
  invited_at TIMESTAMPTZ DEFAULT now(), joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── WHATSAPP ACCOUNTS ───
CREATE TABLE whatsapp_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, phone_number TEXT,
  phone_number_id TEXT, waba_id TEXT, access_token TEXT,
  instance_name TEXT, instance_id TEXT,
  connection_type TEXT DEFAULT 'cloud_api' CHECK (connection_type IN ('cloud_api', 'evolution')),
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'banned')),
  routing_mode TEXT DEFAULT 'human' CHECK (routing_mode IN ('ai_agent', 'human', 'hybrid', 'flow')),
  agent_id UUID, flow_id UUID,
  learning_mode BOOLEAN DEFAULT false,
  messages_used INT DEFAULT 0, messages_limit INT DEFAULT 500,
  qr_code TEXT, webhook_url TEXT, metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── AGENTS ───
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, description TEXT, avatar_url TEXT,
  provider TEXT DEFAULT 'openai' CHECK (provider IN ('openai', 'gemini', 'anthropic', 'minimax')),
  model TEXT DEFAULT 'gpt-4o', api_key TEXT,
  system_prompt TEXT, temperature FLOAT DEFAULT 0.7, max_tokens INT DEFAULT 1000,
  knowledge_base JSONB,
  test_mode BOOLEAN DEFAULT false, test_phone_numbers JSONB,
  is_public BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
  whatsapp_account_id UUID, response_time_ms INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── AGENT KNOWLEDGE ───
CREATE TABLE agent_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'faq', 'url', 'text')),
  title TEXT NOT NULL, content TEXT,
  file_url TEXT, file_name TEXT, file_size INT, url TEXT,
  embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
  metadata JSONB, created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── CONTACTS ───
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT, phone TEXT NOT NULL, email TEXT, avatar_url TEXT,
  tags JSONB DEFAULT '[]', origin TEXT DEFAULT 'whatsapp',
  notes TEXT, custom_fields JSONB DEFAULT '{}',
  is_blocked BOOLEAN DEFAULT false, last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, phone)
);

-- ─── PIPELINE STAGES ───
CREATE TABLE pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, color TEXT DEFAULT '#6366f1',
  "order" INT DEFAULT 0, is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── LEADS ───
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  stage_id UUID REFERENCES pipeline_stages(id),
  assigned_to_id UUID, title TEXT, value FLOAT,
  temperature TEXT DEFAULT 'cold' CHECK (temperature IN ('hot', 'warm', 'cold')),
  temperature_score FLOAT DEFAULT 0,
  tags JSONB DEFAULT '[]', notes TEXT, source TEXT,
  whatsapp_account_id UUID, conversation_count INT DEFAULT 0,
  last_contact_at TIMESTAMPTZ, closed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'archived')),
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── CONVERSATIONS ───
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  whatsapp_account_id UUID, agent_id UUID,
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram', 'facebook', 'telegram')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'bot')),
  assigned_to UUID, unread_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ, metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── MESSAGES ───
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'sticker', 'reaction', 'template')),
  content TEXT, media_url TEXT, media_caption TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  sent_by TEXT DEFAULT 'user' CHECK (sent_by IN ('user', 'agent', 'bot', 'system')),
  sent_by_id UUID, metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── FLOWS ───
CREATE TABLE flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, description TEXT,
  nodes JSONB, edges JSONB, is_active BOOLEAN DEFAULT false,
  trigger_type TEXT DEFAULT 'keyword' CHECK (trigger_type IN ('keyword', 'first_message', 'schedule', 'webhook', 'manual')),
  trigger_value TEXT, whatsapp_account_id UUID, execution_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── CAMPAIGNS ───
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, message TEXT NOT NULL,
  media_url TEXT, media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'document')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed')),
  campaign_type TEXT DEFAULT 'mass' CHECK (campaign_type IN ('mass', 'remarketing')),
  scheduled_at TIMESTAMPTZ, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  filter_origin TEXT, filter_tags JSONB, filter_interaction TEXT,
  whatsapp_account_ids JSONB, use_rotation BOOLEAN DEFAULT true,
  total_contacts INT DEFAULT 0, sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0, read_count INT DEFAULT 0, failed_count INT DEFAULT 0,
  created_by_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── TEMPLATES ───
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'utility' CHECK (category IN ('marketing', 'utility', 'authentication', 'service')),
  language TEXT DEFAULT 'pt_BR', content TEXT NOT NULL,
  variables JSONB, media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'document')),
  buttons JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  whatsapp_template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── SCHEDULES ───
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  title TEXT NOT NULL, description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL, duration INT DEFAULT 60,
  recurrence TEXT CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  reminder_sent BOOLEAN DEFAULT false, assigned_to_id UUID, whatsapp_account_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── TASKS ───
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to_id UUID, contact_id UUID REFERENCES contacts(id),
  lead_id UUID REFERENCES leads(id),
  due_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── SUBSCRIPTIONS ───
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT, stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ, current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── USAGE ───
CREATE TABLE usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  messages_sent INT DEFAULT 0, messages_received INT DEFAULT 0,
  ai_tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, month)
);

-- ─── TRIGGERS AND UPDATED_AT ───
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_modtime BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_whatsapp_accounts_modtime BEFORE UPDATE ON whatsapp_accounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_agents_modtime BEFORE UPDATE ON agents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_contacts_modtime BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_conversations_modtime BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_flows_modtime BEFORE UPDATE ON flows FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_campaigns_modtime BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_templates_modtime BEFORE UPDATE ON templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_schedules_modtime BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─── ROW LEVEL SECURITY ───
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Tenant access" ON tenants FOR ALL USING (
  owner_id = auth.uid() OR id IN (SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Team Members isolation" ON team_members FOR ALL USING (
  tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Accounts isolation" ON whatsapp_accounts FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Agents isolation" ON agents FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Agent Knowledge isolation" ON agent_knowledge FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Contacts isolation" ON contacts FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Pipeline Stages isolation" ON pipeline_stages FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Leads isolation" ON leads FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Conversations isolation" ON conversations FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Messages isolation" ON messages FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Flows isolation" ON flows FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Campaigns isolation" ON campaigns FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Templates isolation" ON templates FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Schedules isolation" ON schedules FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Tasks isolation" ON tasks FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Subscriptions isolation" ON subscriptions FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Usage isolation" ON usage FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid() UNION SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true));

-- ÍNDICES RECOMENDADOS MÍNIMOS
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_contacts_tenant_id_phone ON contacts(tenant_id, phone);
CREATE INDEX idx_conversations_tenant_id_status ON conversations(tenant_id, status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_leads_tenant_id_status ON leads(tenant_id, status);
