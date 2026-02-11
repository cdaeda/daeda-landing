// Supabase Edge Function: Knowledge Search with Smart Caching
// Searches local knowledgebase first, then Brave API if needed
// Summarizes and caches results for future use

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const BRAVE_API_KEY = 'BSAdGKT2xhOUAWSuXqbUPs8glqsULrU'
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

// Create a hash of the query for caching
function hashQuery(query: string): string {
  let hash = 0
  const cleanQuery = query.toLowerCase().trim()
  for (let i = 0; i < cleanQuery.length; i++) {
    const char = cleanQuery.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

// Check if knowledgebase has relevant info
async function searchKnowledgebase(supabase: any, query: string): Promise<any[]> {
  const queryHash = hashQuery(query)
  
  // Try exact hash match first
  const { data: exactMatch } = await supabase
    .from('ai_knowledgebase')
    .select('*')
    .eq('query_hash', queryHash)
    .single()
  
  if (exactMatch) {
    // Update access count and timestamp
    await supabase
      .from('ai_knowledgebase')
      .update({ 
        use_count: exactMatch.use_count + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', exactMatch.id)
    
    return [exactMatch]
  }
  
  // Try fuzzy text search on query and summary
  const { data: related } = await supabase
    .from('ai_knowledgebase')
    .select('*')
    .or(`query.ilike.%${query}%,summary.ilike.%${query}%`)
    .order('use_count', { ascending: false })
    .limit(3)
  
  return related || []
}

// Call Brave API
async function searchBrave(query: string): Promise<any> {
  const searchParams = new URLSearchParams({
    q: query,
    count: '5',
    country: 'US',
    search_lang: 'en',
    safesearch: 'moderate',
    text_decorations: 'false',
  })

  const response = await fetch(`${BRAVE_API_URL}?${searchParams}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': BRAVE_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`Brave API error: ${response.status}`)
  }

  const data = await response.json()
  
  return {
    results: (data.web?.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    })),
    relatedQueries: (data.query?.related || []).slice(0, 3),
  }
}

// Summarize search results for AI consumption
function summarizeForAI(results: any[]): string {
  if (!results.length) return ''
  
  const summaries = results.map((r, i) => {
    const desc = r.description?.substring(0, 200) || ''
    return `[${i + 1}] ${r.title}: ${desc}`
  })
  
  return summaries.join('\n')
}

// Create AI-optimized compact summary
function createAIOptimizedContent(query: string, results: any[]): string {
  const keyPoints = results.slice(0, 3).map((r, i) => {
    const desc = r.description || ''
    const keyInsight = desc.split('.')[0] || desc.substring(0, 100)
    return `• ${r.title}: ${keyInsight}`
  }).join('\n')
  
  return `TOPIC: ${query}\nKEY INSIGHTS:\n${keyPoints}`
}

// Cache results to knowledgebase
async function cacheToKnowledgebase(
  supabase: any,
  query: string,
  sourceType: string,
  content: string,
  summary: string,
  aiOptimized: string,
  metadata: any
): Promise<void> {
  const queryHash = hashQuery(query)
  
  await supabase.from('ai_knowledgebase').insert({
    query,
    query_hash: queryHash,
    source_type: sourceType,
    content,
    summary,
    ai_optimized_content: aiOptimized,
    metadata,
  })
}

interface SearchRequest {
  query: string;
  industry?: string;
  context?: string;
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
    
    const { query, industry, context }: SearchRequest = await req.json()

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Search local knowledgebase first
    console.log('Searching knowledgebase for:', query)
    const kbResults = await searchKnowledgebase(supabase, query)
    
    // If we have relevant cached results, return them
    if (kbResults.length > 0 && kbResults[0].query_hash === hashQuery(query)) {
      console.log('Cache hit for query:', query)
      return new Response(
        JSON.stringify({
          success: true,
          source: 'cache',
          results: kbResults.map(r => ({
            title: 'Cached Knowledge',
            url: '',
            description: r.ai_optimized_content,
          })),
          aiOptimized: kbResults[0].ai_optimized_content,
          summary: kbResults[0].summary,
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: If we have related but not exact match, note it but still search
    const relatedKnowledge = kbResults.length > 0 
      ? kbResults.map(r => r.ai_optimized_content).join('\n\n')
      : null

    // Step 3: Call Brave API for fresh results
    console.log('Cache miss - searching Brave API for:', query)
    const braveData = await searchBrave(query)

    if (braveData.results.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          source: 'none',
          results: [],
          aiOptimized: relatedKnowledge || 'No relevant information found.',
          cached: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 4: Summarize and create AI-optimized content
    const summary = summarizeForAI(braveData.results)
    const aiOptimized = createAIOptimizedContent(query, braveData.results)
    const fullContent = braveData.results.map((r: any) => 
      `${r.title}\n${r.url}\n${r.description}`
    ).join('\n\n---\n\n')

    // Step 5: Cache the results
    await cacheToKnowledgebase(
      supabase,
      query,
      'brave_search',
      fullContent,
      summary,
      aiOptimized,
      {
        industry,
        context,
        result_count: braveData.results.length,
        related_queries: braveData.relatedQueries,
      }
    )

    // Step 6: Combine with related knowledge if available
    const finalAIOptimized = relatedKnowledge
      ? `RELATED KNOWLEDGE:\n${relatedKnowledge}\n\nNEW RESEARCH:\n${aiOptimized}`
      : aiOptimized

    return new Response(
      JSON.stringify({
        success: true,
        source: 'brave',
        results: braveData.results,
        aiOptimized: finalAIOptimized,
        summary,
        relatedQueries: braveData.relatedQueries,
        cached: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in knowledge-search function:', error)
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
