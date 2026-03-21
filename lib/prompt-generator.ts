export interface WizardData {
  agentName: string
  businessName: string
  businessType: string
  businessDescription: string
  businessHours: { weekdays: string; saturday: string; sunday: string }
  location: string
  services: Record<string, unknown>
  personality: 'professional' | 'friendly' | 'casual'
  useEmojis: boolean
  unknownResponse: string
  limitTopics: boolean
  knowledgeFaqs?: Array<{ question: string; answer: string }>
  websiteUrl?: string
}

export function generateSystemPrompt(data: WizardData): string {
  const toneMap = {
    professional: 'profissional e formal, usando linguagem respeitosa',
    friendly: 'amigável e descontraído, criando conexão com o cliente',
    casual: 'casual e jovem, com linguagem próxima e moderna',
  }

  const faqSection = data.knowledgeFaqs?.length
    ? `\n## Perguntas frequentes\n${data.knowledgeFaqs
        .map((f) => `P: ${f.question}\nR: ${f.answer}`)
        .join('\n\n')}`
    : ''

  return `Você é ${data.agentName}, assistente virtual da empresa ${data.businessName}.

## Sobre a empresa
${data.businessDescription}
Tipo de negócio: ${data.businessType}
Localização: ${data.location}
Horário de funcionamento:
- Segunda a Sexta: ${data.businessHours.weekdays}
- Sábado: ${data.businessHours.saturday}
- Domingo: ${data.businessHours.sunday}

## Serviços e informações
${JSON.stringify(data.services, null, 2)}

## Comportamento
- Tom de voz: ${toneMap[data.personality]}
- ${data.useEmojis ? 'Use emojis com moderação para tornar a conversa mais amigável.' : 'Não use emojis nas respostas.'}
- Quando não souber responder algo: ${data.unknownResponse}
${data.limitTopics ? '- IMPORTANTE: Fale APENAS sobre assuntos relacionados ao negócio. Se perguntarem sobre outros temas, redirecione educadamente para o foco do atendimento.' : ''}
- Sempre responda em português brasileiro
- Seja objetivo e claro — respostas curtas salvo quando detalhes forem necessários
- Nunca invente informações — se não souber, seja honesto${faqSection}
${data.websiteUrl ? `\n## Site do negócio\n${data.websiteUrl}` : ''}`
}
