// Supabase Edge Function for Brave API Web Search
// This provides real-time business/industry research capabilities

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BRAVE_API_KEY = Deno.env.get('BRAVE_API_KEY')
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'

interface SearchRequest {
  query: string;
  count?: number;
  offset?: number;
  country?: string;
  search_lang?: string;
}

interface BraveResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  profile?: {
    name?: string;
    long_name?: string;
  };
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!BRAVE_API_KEY) {
      throw new Error('BRAVE_API_KEY not configured')
    }

    const { query, count = 5, country = 'US', search_lang = 'en' }: SearchRequest = await req.json()

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build search URL with parameters
    const searchParams = new URLSearchParams({
      q: query,
      count: count.toString(),
      country,
      search_lang,
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
      const errorText = await response.text()
      console.error('Brave API error:', response.status, errorText)
      throw new Error(`Brave API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract and format relevant results
    const results: BraveResult[] = (data.web?.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      description: result.description,
      age: result.age,
      profile: result.profile ? {
        name: result.profile.name,
        long_name: result.profile.long_name,
      } : undefined,
    }))

    // Also extract related queries if available
    const relatedQueries = data.query?.related || []

    return new Response(
      JSON.stringify({
        success: true,
        query: query,
        results,
        relatedQueries: relatedQueries.slice(0, 3),
        totalResults: data.web?.total_results || results.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in brave-search function:', error)
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
