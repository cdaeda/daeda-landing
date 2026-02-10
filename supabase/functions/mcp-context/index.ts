// Supabase Edge Function for Model Context Protocol (MCP)
// This provides intelligent context retrieval and conversation enhancement

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

// Industry-specific AI use case database
const INDUSTRY_AI_USE_CASES: Record<string, any[]> = {
  healthcare: [
    { useCase: 'Medical image analysis for faster diagnostics', benefit: 'Reduce diagnosis time by 60%' },
    { useCase: 'Patient triage automation', benefit: 'Improve ER wait times' },
    { useCase: 'Drug discovery acceleration', benefit: 'Cut R&D costs by 30%' },
    { useCase: 'Predictive health monitoring', benefit: 'Early intervention' },
  ],
  finance: [
    { useCase: 'Fraud detection in real-time', benefit: 'Prevent 95% of fraudulent transactions' },
    { useCase: 'Algorithmic trading', benefit: 'Optimize investment returns' },
    { useCase: 'Credit risk assessment', benefit: 'Faster loan approvals' },
    { useCase: 'Customer service automation', benefit: '24/7 support coverage' },
  ],
  retail: [
    { useCase: 'Demand forecasting', benefit: 'Reduce inventory waste by 25%' },
    { useCase: 'Personalized recommendations', benefit: 'Increase sales by 15%' },
    { useCase: 'Visual search capabilities', benefit: 'Enhanced shopping experience' },
    { useCase: 'Dynamic pricing optimization', benefit: 'Maximize revenue' },
  ],
  manufacturing: [
    { useCase: 'Predictive maintenance', benefit: 'Reduce downtime by 40%' },
    { useCase: 'Quality control automation', benefit: '99.9% defect detection' },
    { useCase: 'Supply chain optimization', benefit: 'Lower logistics costs' },
    { useCase: 'Production scheduling AI', benefit: 'Maximize throughput' },
  ],
  'real estate': [
    { useCase: 'Property valuation models', benefit: 'Accurate pricing in seconds' },
    { useCase: 'Lead scoring automation', benefit: 'Focus on hot prospects' },
    { useCase: 'Document processing', benefit: 'Automate contract review' },
  ],
  legal: [
    { useCase: 'Contract analysis', benefit: 'Review 10x faster' },
    { useCase: 'Legal research automation', benefit: 'Find relevant cases instantly' },
    { useCase: 'Document generation', benefit: 'Draft standard agreements' },
  ],
  marketing: [
    { useCase: 'Content generation', benefit: 'Scale content production' },
    { useCase: 'Audience segmentation', benefit: 'Hyper-targeted campaigns' },
    { useCase: 'A/B test optimization', benefit: 'Maximize conversion rates' },
  ],
  hr: [
    { useCase: 'Resume screening', benefit: 'Find best candidates faster' },
    { useCase: 'Employee sentiment analysis', benefit: 'Improve retention' },
    { useCase: 'Interview scheduling', benefit: 'Reduce coordination time' },
  ],
  education: [
    { useCase: 'Personalized learning paths', benefit: 'Improve student outcomes' },
    { useCase: 'Automated grading', benefit: 'Save teacher time' },
    { useCase: 'Student engagement analytics', benefit: 'Identify at-risk students' },
  ],
  logistics: [
    { useCase: 'Route optimization', benefit: 'Reduce fuel costs by 20%' },
    { useCase: 'Delivery time prediction', benefit: 'Improve customer satisfaction' },
    { useCase: 'Warehouse automation', benefit: 'Faster fulfillment' },
  ],
}

// Common business pain points and AI solutions
const PAIN_POINT_SOLUTIONS = [
  {
    painPoint: 'manual data entry',
    aiSolution: 'Intelligent document processing with OCR and NLP',
    impact: 'Reduce processing time by 80%',
  },
  {
    painPoint: 'slow customer support',
    aiSolution: 'AI chatbots with human handoff',
    impact: 'Instant responses, 24/7 availability',
  },
  {
    painPoint: 'forecasting errors',
    aiSolution: 'ML-based demand prediction',
    impact: '25-40% improvement in accuracy',
  },
  {
    painPoint: 'high employee turnover',
    aiSolution: 'Predictive attrition modeling',
    impact: 'Proactive retention strategies',
  },
  {
    painPoint: 'compliance monitoring',
    aiSolution: 'Automated regulatory scanning',
    impact: 'Real-time compliance alerts',
  },
  {
    painPoint: 'inventory management',
    aiSolution: 'AI-powered stock optimization',
    impact: 'Reduce carrying costs by 30%',
  },
]

interface ContextRequest {
  sessionId?: string;
  userMessage: string;
  industry?: string;
  companySize?: string;
  previousContext?: any;
}

interface ConversationContext {
  industry?: string;
  companySize?: string;
  painPoints: string[];
  goals: string[];
  currentTools: string[];
  budgetRange?: string;
  timeline?: string;
  stakeholders: string[];
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
    
    const { sessionId, userMessage, industry, companySize, previousContext }: ContextRequest = await req.json()

    // 1. Extract insights from the current message
    const extractedInsights = extractInsights(userMessage)
    
    // 2. Retrieve relevant conversation history if sessionId provided
    let conversationHistory: any[] = []
    if (sessionId) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (messages) {
        conversationHistory = messages.reverse()
      }
    }

    // 3. Build conversation context
    const context: ConversationContext = buildContext(
      conversationHistory,
      extractedInsights,
      industry,
      companySize,
      previousContext
    )

    // 4. Get relevant AI use cases based on industry
    const relevantUseCases = getRelevantUseCases(context.industry, context.painPoints)

    // 5. Get pain point solutions
    const painPointMatches = getPainPointSolutions(context.painPoints)

    // 6. Generate contextual questions based on conversation stage
    const suggestedQuestions = generateContextualQuestions(context, conversationHistory.length)

    // 7. Build enhanced context for the AI
    const enhancedContext = {
      context,
      relevantUseCases,
      painPointMatches,
      suggestedQuestions,
      conversationStage: getConversationStage(conversationHistory.length),
      knowledgeGaps: identifyKnowledgeGaps(context),
    }

    return new Response(
      JSON.stringify({
        success: true,
        enhancedContext,
        insights: extractedInsights,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in mcp-context function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function extractInsights(message: string): any {
  const insights: any = {
    mentionedIndustries: [],
    mentionedPainPoints: [],
    mentionedGoals: [],
    companySize: null,
    urgency: null,
  }

  const lowerMessage = message.toLowerCase()

  // Extract industry mentions
  const industries = Object.keys(INDUSTRY_AI_USE_CASES)
  industries.forEach(industry => {
    if (lowerMessage.includes(industry)) {
      insights.mentionedIndustries.push(industry)
    }
  })

  // Extract pain point mentions
  PAIN_POINT_SOLUTIONS.forEach(({ painPoint }) => {
    if (lowerMessage.includes(painPoint.toLowerCase())) {
      insights.mentionedPainPoints.push(painPoint)
    }
  })

  // Extract company size
  if (lowerMessage.match(/\b(startup|small business|solo|freelance|1-10)\b/)) {
    insights.companySize = 'small'
  } else if (lowerMessage.match(/\b(medium|mid-size|growing|11-100|11-50)\b/)) {
    insights.companySize = 'medium'
  } else if (lowerMessage.match(/\b(enterprise|large|corporation|500+|1000+)\b/)) {
    insights.companySize = 'enterprise'
  }

  // Extract urgency
  if (lowerMessage.match(/\b(urgent|asap|immediately|this week|right away)\b/)) {
    insights.urgency = 'high'
  } else if (lowerMessage.match(/\b(this month|soon|quickly)\b/)) {
    insights.urgency = 'medium'
  }

  // Extract goals (keywords)
  const goalKeywords = ['improve', 'increase', 'reduce', 'save', 'grow', 'scale', 'optimize', 'automate', 'streamline']
  goalKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      // Extract the phrase around the goal
      const regex = new RegExp(`[^.]*${keyword}[^.]*\.?`, 'gi')
      const matches = message.match(regex)
      if (matches) {
        insights.mentionedGoals.push(...matches.map(m => m.trim()))
      }
    }
  })

  return insights
}

function buildContext(
  history: any[],
  insights: any,
  providedIndustry?: string,
  providedSize?: string,
  previousContext?: any
): ConversationContext {
  const context: ConversationContext = {
    industry: providedIndustry || previousContext?.industry || insights.mentionedIndustries[0],
    companySize: providedSize || previousContext?.companySize || insights.companySize,
    painPoints: previousContext?.painPoints || [],
    goals: previousContext?.goals || [],
    currentTools: previousContext?.currentTools || [],
    budgetRange: previousContext?.budgetRange,
    timeline: previousContext?.timeline,
    stakeholders: previousContext?.stakeholders || [],
  }

  // Merge insights from current message
  if (insights.mentionedPainPoints.length > 0) {
    context.painPoints = [...new Set([...context.painPoints, ...insights.mentionedPainPoints])]
  }
  if (insights.mentionedGoals.length > 0) {
    context.goals = [...new Set([...context.goals, ...insights.mentionedGoals])]
  }

  // Extract from conversation history
  history.forEach(msg => {
    if (msg.role === 'user') {
      // Look for tool mentions
      const toolMatches = msg.content.match(/\b(Excel|Salesforce|HubSpot|Slack|Teams|SAP|Oracle|QuickBooks|Shopify|WordPress)\b/gi)
      if (toolMatches) {
        context.currentTools = [...new Set([...context.currentTools, ...toolMatches])]
      }

      // Look for budget mentions
      const budgetMatch = msg.content.match(/\$?([\d,]+(?:k|K|000)?)\s*(budget|cost|spend)/i)
      if (budgetMatch && !context.budgetRange) {
        context.budgetRange = budgetMatch[1]
      }

      // Look for timeline mentions
      const timelineMatch = msg.content.match(/\b(\d+\s*(week|month|day|year)s?)\b/i)
      if (timelineMatch && !context.timeline) {
        context.timeline = timelineMatch[0]
      }
    }
  })

  return context
}

function getRelevantUseCases(industry?: string, painPoints: string[] = []): any[] {
  let useCases: any[] = []

  if (industry && INDUSTRY_AI_USE_CASES[industry.toLowerCase()]) {
    useCases = INDUSTRY_AI_USE_CASES[industry.toLowerCase()]
  }

  // If no specific industry or few results, include general use cases
  if (useCases.length === 0) {
    useCases = [
      { useCase: 'Process automation', benefit: 'Save 10+ hours per week' },
      { useCase: 'Data analysis & insights', benefit: 'Make data-driven decisions' },
      { useCase: 'Customer service automation', benefit: '24/7 instant responses' },
      { useCase: 'Content generation', benefit: 'Scale marketing efforts' },
    ]
  }

  return useCases.slice(0, 3)
}

function getPainPointSolutions(painPoints: string[]): any[] {
  if (painPoints.length === 0) return []

  return PAIN_POINT_SOLUTIONS
    .filter(solution => 
      painPoints.some(pain => 
        solution.painPoint.toLowerCase().includes(pain.toLowerCase()) ||
        pain.toLowerCase().includes(solution.painPoint.toLowerCase())
      )
    )
    .slice(0, 3)
}

function generateContextualQuestions(context: ConversationContext, messageCount: number): string[] {
  const questions: string[] = []

  if (messageCount < 3) {
    // Early stage questions
    if (!context.industry) {
      questions.push("What industry is your business in?")
    }
    if (!context.companySize) {
      questions.push("How many people are on your team?")
    }
    questions.push("What's the biggest challenge you're facing right now?")
  } else {
    // Deeper questions based on context
    if (context.painPoints.length > 0 && context.currentTools.length === 0) {
      questions.push("What tools or software are you currently using to handle this?")
    }
    if (!context.budgetRange) {
      questions.push("Do you have a budget range in mind for this project?")
    }
    if (!context.timeline) {
      questions.push("What's your ideal timeline for implementing a solution?")
    }
    if (context.currentTools.length > 0) {
      questions.push("How well are your current tools working for you?")
    }
  }

  return questions.slice(0, 2)
}

function getConversationStage(messageCount: number): string {
  if (messageCount < 3) return 'discovery'
  if (messageCount < 6) return 'exploration'
  if (messageCount < 10) return 'solutioning'
  return 'closing'
}

function identifyKnowledgeGaps(context: ConversationContext): string[] {
  const gaps: string[] = []
  
  if (!context.industry) gaps.push('industry')
  if (!context.companySize) gaps.push('companySize')
  if (context.painPoints.length === 0) gaps.push('painPoints')
  if (!context.budgetRange) gaps.push('budget')
  if (!context.timeline) gaps.push('timeline')
  
  return gaps
}
