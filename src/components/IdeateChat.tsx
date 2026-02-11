import { useState, useRef, useEffect } from 'react';
import { Lightbulb, Send, X, ChevronRight, Loader2, CheckCircle, Sparkles, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { siteConfig } from '../content.config';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  suggestionChips?: string[];
  hasSearchResults?: boolean;
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

interface IdeateChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const GEMINI_API_KEY = 'AIzaSyBUUYr8pBcqraJbK2joNYXmKw0mlI8NYaA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Supabase Edge Function URLs
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MCP_CONTEXT_URL = `${SUPABASE_URL}/functions/v1/mcp-context`;
const KNOWLEDGE_SEARCH_URL = `${SUPABASE_URL}/functions/v1/knowledge-search`;

// Starting question chips for users to select - phrased as common business scenarios
const STARTING_QUESTIONS = [
  "I'm spending too much time on repetitive tasks",
  "I want to improve how we handle customer inquiries",
  "I have data but struggle to get useful insights from it",
  "I'm curious about AI but not sure where it fits my business",
  "My team is overwhelmed with manual processes",
  "I want to explore new AI-powered opportunities",
];

export function IdeateChat({ isOpen, onClose }: IdeateChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showStartingChips, setShowStartingChips] = useState(true);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    painPoints: [],
    goals: [],
    currentTools: [],
    stakeholders: [],
  });
  const [, setSearchResults] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (shouldAutoScroll && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Handle scroll to detect if user is reading older messages
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && !showContactForm) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, showContactForm]);

  // Load or create chat session
  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeSession();
    }
  }, [isOpen]);

  const initializeSession = async () => {
    try {
      // Clear old session format to ensure fresh welcome message
      localStorage.removeItem('ideate_chat_session');
      
      const savedSession = localStorage.getItem('ideate_chat_v2');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const { data: messagesData } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', parsed.id)
          .order('created_at', { ascending: true });
        
        if (messagesData && messagesData.length > 0) {
          setSessionId(parsed.id);
          setMessages(messagesData.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.created_at,
          })));
          setShowStartingChips(false);
          
          // Load context from session
          const { data: contextData } = await supabase
            .from('chat_context')
            .select('*')
            .eq('session_id', parsed.id)
            .single();
          
          if (contextData) {
            setConversationContext(contextData.context);
          }
          return;
        }
      }

      // Create new session
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({ status: 'active' })
        .select()
        .single();

      if (error) throw error;
      
      if (session) {
        setSessionId(session.id);
        localStorage.setItem('ideate_chat_v2', JSON.stringify({ id: session.id }));
        setShowStartingChips(true);
        
        const welcomeMessage = {
          id: crypto.randomUUID(),
          role: 'model' as const,
          content: siteConfig.ideate.initialMessage,
          timestamp: new Date().toISOString(),
        };
        
        setMessages([welcomeMessage]);
        
        await supabase.from('chat_messages').insert({
          session_id: session.id,
          role: 'model',
          content: welcomeMessage.content,
        });
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      const fallbackId = crypto.randomUUID();
      setSessionId(fallbackId);
      setShowStartingChips(true);
      setMessages([{
        id: crypto.randomUUID(),
        role: 'model',
        content: siteConfig.ideate.initialMessage,
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const saveMessage = async (message: Message) => {
    if (!sessionId) return;
    
    try {
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: message.role,
        content: message.content,
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // Call MCP Context Edge Function for smart context retrieval
  const getMCPContext = async (userMessage: string): Promise<any> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(MCP_CONTEXT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          sessionId,
          userMessage,
          industry: conversationContext.industry,
          companySize: conversationContext.companySize,
          previousContext: conversationContext,
        }),
      });

      if (!response.ok) throw new Error('MCP context request failed');
      
      const data = await response.json();
      
      // Update local context state
      if (data.enhancedContext?.context) {
        setConversationContext(data.enhancedContext.context);
        
        // Save context to database
        await supabase.from('chat_context').upsert({
          session_id: sessionId,
          context: data.enhancedContext.context,
          updated_at: new Date().toISOString(),
        });
      }
      
      return data.enhancedContext;
    } catch (error) {
      console.error('Error getting MCP context:', error);
      return null;
    }
  };

  // Call Knowledge Search Edge Function (searches KB first, then Brave API if needed)
  const performKnowledgeSearch = async (query: string): Promise<any> => {
    try {
      setIsSearching(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(KNOWLEDGE_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          query: `${query} AI use cases`,
          industry: conversationContext.industry,
          context: conversationContext.painPoints?.join(', '),
        }),
      });

      if (!response.ok) throw new Error('Knowledge search request failed');
      
      const data = await response.json();
      setSearchResults(data);
      setIsSearching(false);
      return data;
    } catch (error) {
      console.error('Error performing knowledge search:', error);
      setIsSearching(false);
      return null;
    }
  };

  // Build enhanced system prompt with context
  const buildSystemPrompt = (mcpContext: any): string => {
    let enhancedPrompt = `You are a friendly, approachable AI business consultant for Daeda Group. Your job is to help business owners explore how AI could help them—even if they've never used AI before.

INTERVIEW STYLE - CONSULTATIVE & SUGGESTIVE:
Think of yourself as a knowledgeable colleague sharing ideas over coffee, not a survey conducting an interview.

✓ DO:
- Share stories about what similar businesses have done
- Offer suggestions proactively ("One thing you might consider is...")
- Educate about AI capabilities in plain language
- Build on what they share with related ideas
- Validate their challenges before suggesting solutions

✗ DON'T:
- Ask rapid-fire questions like a questionnaire
- Make them feel quizzed or tested
- Demand specifics before offering value
- Use jargon or assume technical knowledge

CONVERSATION FLOW:
1. OPEN: Acknowledge their situation and share a relevant observation
2. EXPLORE: Offer 2-3 suggestions based on what they've shared
3. EDUCATE: Briefly explain how the AI approach works
4. INVITE: Ask what resonates or what they'd like to explore further

YOUR APPROACH - BE SUGGESTIVE, NOT INTERROGATIVE:
✓ Lead with suggestions and best practices
✓ Share what similar businesses typically do
✓ Offer ideas they might not have considered
✓ Educate gently without jargon
✗ Avoid pointed questions like "What's your budget?"
✗ Don't make them feel behind or uninformed

CONVERSATION STYLE:
- Assume they're AI-curious but not AI-experienced
- Use phrases like:
  * "A lot of businesses in your situation find success with..."
  * "Have you considered trying..."
  * "One approach that works well is..."
  * "Something you might explore is..."
- Share 1-2 concrete examples of what similar companies have done
- Keep suggestions practical and relatable
- If they mention a challenge, suggest 2-3 possible approaches

EXAMPLE SUGGESTIONS BY TOPIC:
- Manual data entry → "Have you looked into AI that can read and process documents automatically?"
- Slow customer response → "Many businesses use AI assistants that can handle common questions instantly—have you explored that?"
- Overwhelmed team → "One option is automating the repetitive tasks first. What's taking up most of your team's time right now?"
- Not sure where to start → "A good first step is often automating one repetitive task. What do you or your team do over and over that feels tedious?"

RESPONSE LENGTH:
Keep responses concise—aim for 2-4 short paragraphs maximum. Break up longer thoughts into digestible chunks. If you have a lot to share, focus on the most relevant 1-2 points and invite them to ask for more details.

USING RESEARCH INSIGHTS:
When "CURRENT INDUSTRY RESEARCH" is provided, incorporate those insights naturally into your response. Reference specific examples or trends to support your recommendations, but don't quote the research verbatim—paraphrase and synthesize.

END EVERY RESPONSE WITH:
2-3 clickable suggestion chips in [SUGGESTIONS: option1 | option2 | option3] format that offer natural next steps or related ideas to explore.

WHEN TO OFFER SUBMISSION ("DONE" CRITERIA):
Only offer to connect them with the Daeda team when ALL of these are true:
1. You understand their business type/industry
2. You've identified at least one specific pain point or opportunity
3. You've described at least one concrete AI solution approach
4. They've expressed interest OR asked about next steps/pricing

DO NOT offer to submit if:
- You're still in early discovery (first 2-3 messages)
- You haven't suggested any specific AI solutions yet
- They haven't shown interest in moving forward
- The conversation is still exploratory

When offering submission, say something like:
"I have a good sense of what you're looking for and how AI could help. Would you like me to connect you with our team for a detailed proposal and pricing?"`;

    // Add context information if available
    if (mcpContext?.context) {
      const ctx = mcpContext.context;
      enhancedPrompt += `\n\nCURRENT BUSINESS CONTEXT:`;
      
      if (ctx.industry) enhancedPrompt += `\n- Industry: ${ctx.industry}`;
      if (ctx.companySize) enhancedPrompt += `\n- Company Size: ${ctx.companySize}`;
      if (ctx.painPoints?.length > 0) enhancedPrompt += `\n- Identified Pain Points: ${ctx.painPoints.join(', ')}`;
      if (ctx.goals?.length > 0) enhancedPrompt += `\n- Goals: ${ctx.goals.join(', ')}`;
      if (ctx.currentTools?.length > 0) enhancedPrompt += `\n- Current Tools: ${ctx.currentTools.join(', ')}`;
      if (ctx.budgetRange) enhancedPrompt += `\n- Budget Range: ${ctx.budgetRange}`;
      if (ctx.timeline) enhancedPrompt += `\n- Timeline: ${ctx.timeline}`;
    }

    // Add relevant AI use cases
    if (mcpContext?.relevantUseCases?.length > 0) {
      enhancedPrompt += `\n\nRELEVANT AI USE CASES FOR THIS BUSINESS:`;
      mcpContext.relevantUseCases.forEach((useCase: any, i: number) => {
        enhancedPrompt += `\n${i + 1}. ${useCase.useCase} - ${useCase.benefit}`;
      });
    }

    // Add pain point matches
    if (mcpContext?.painPointMatches?.length > 0) {
      enhancedPrompt += `\n\nAI SOLUTIONS FOR IDENTIFIED PAIN POINTS:`;
      mcpContext.painPointMatches.forEach((match: any, i: number) => {
        enhancedPrompt += `\n${i + 1}. ${match.painPoint} → ${match.aiSolution} (${match.impact})`;
      });
    }

    // Add conversation stage guidance
    if (mcpContext?.conversationStage) {
      enhancedPrompt += `\n\nCONVERSATION STAGE: ${mcpContext.conversationStage.toUpperCase()}`;
      
      switch (mcpContext.conversationStage) {
        case 'discovery':
          enhancedPrompt += `\nFocus on understanding their business, industry, and main challenges.`;
          break;
        case 'exploration':
          enhancedPrompt += `\nDive deeper into specific pain points and explore AI solution possibilities.`;
          break;
        case 'solutioning':
          enhancedPrompt += `\nProvide concrete AI solution recommendations and implementation approaches.`;
          break;
        case 'closing':
          enhancedPrompt += `\nSummarize findings and gauge readiness for a formal proposal.`;
          break;
      }
    }

    // Add research insights if available
    if (mcpContext?.researchInsights) {
      enhancedPrompt += `\n\nCURRENT INDUSTRY RESEARCH (use to support your recommendations):\n${mcpContext.researchInsights}`;
    }

    // Add suggested questions
    if (mcpContext?.suggestedQuestions?.length > 0) {
      enhancedPrompt += `\n\nSUGGESTED QUESTIONS TO ASK NEXT:`;
      mcpContext.suggestedQuestions.forEach((q: string) => {
        enhancedPrompt += `\n- ${q}`;
      });
    }

    enhancedPrompt += `\n\nIMPORTANT: When you have enough information and have outlined concrete AI solutions, offer to connect them with the Daeda team for a detailed proposal. Only do this when you clearly understand their needs.`;

    return enhancedPrompt;
  };

  // Parse AI response to extract suggestion chips
  const parseAIResponse = (response: string): { cleanContent: string; chips: string[] } => {
    const suggestionMatch = response.match(/\[SUGGESTIONS:\s*([^\]]+)\]/);
    if (suggestionMatch) {
      const chips = suggestionMatch[1].split('|').map(s => s.trim()).filter(Boolean);
      const cleanContent = response.replace(/\[SUGGESTIONS:[^\]]*\]/, '').trim();
      return { cleanContent, chips };
    }
    return { cleanContent: response, chips: [] };
  };

  const callGemini = async (userMessage: string, conversationHistory: Message[], mcpContext: any): Promise<{ content: string; chips: string[] }> => {
    try {
      const systemPrompt = buildSystemPrompt(mcpContext);
      
      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'I understand. I will use the provided business context to give personalized AI consulting advice.' }] },
        ...conversationHistory.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        { role: 'user', parts: [{ text: userMessage }] },
      ];

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 800,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response at this time.';
      
      const { cleanContent, chips } = parseAIResponse(rawResponse);
      return { content: cleanContent, chips };
    } catch (error) {
      console.error('Error calling Gemini:', error);
      return { 
        content: "I'm having trouble connecting right now. Let me try a different approach - could you tell me more about what business challenge you're facing or what growth opportunity you're exploring?",
        chips: ["Process automation", "Data analysis", "Customer experience", "Cost reduction"]
      };
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowStartingChips(false);
    setIsLoading(true);

    await saveMessage(userMessage);

    // Get MCP context first (this updates our understanding of the conversation)
    const mcpContext = await getMCPContext(messageText);

    // Smart search: Only search if we need more intelligence
    // Skip search if: we have cached knowledge, or we're still in early discovery
    let searchData = null;
    const messageCount = messages.length;
    const shouldSearch = 
      mcpContext?.conversationStage === 'exploration' && 
      mcpContext?.context?.industry &&
      messageCount > 2; // Don't search on first few messages
    
    if (shouldSearch) {
      const searchQuery = `${mcpContext.context.industry} AI ${mcpContext.context.painPoints?.[0] || 'automation'}`;
      searchData = await performKnowledgeSearch(searchQuery);
    }

    // Get AI response with enhanced context
    // Include search data in the system prompt if available
    const enrichedMcpContext = searchData?.aiOptimized 
      ? { ...mcpContext, researchInsights: searchData.aiOptimized }
      : mcpContext;
    
    const aiResponse = await callGemini(messageText, messages, enrichedMcpContext);

    // Add subtle indicator if we used fresh research
    let finalContent = aiResponse.content;
    if (searchData?.source === 'brave' && searchData?.results?.length > 0) {
      finalContent += `\n\n*[Researched current industry trends for this advice.]*`;
    }

    const modelMessage: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      content: finalContent,
      timestamp: new Date().toISOString(),
      suggestionChips: aiResponse.chips.length > 0 ? aiResponse.chips : undefined,
      hasSearchResults: !!searchData,
    };

    setMessages(prev => [...prev, modelMessage]);
    await saveMessage(modelMessage);

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (chipText: string) => {
    setInput(chipText);
    inputRef.current?.focus();
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactInfo.name || !contactInfo.email) return;

    try {
      await supabase.from('ideation_submissions').insert({
        session_id: sessionId,
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        chat_summary: messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
        context: conversationContext,
      });

      if (sessionId) {
        await supabase
          .from('chat_sessions')
          .update({ status: 'submitted' })
          .eq('id', sessionId);
        
        localStorage.removeItem('ideate_chat_v2');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting:', error);
      setIsSubmitted(true);
    }
  };

  const handleUserResponseToOffer = (wantsToSubmit: boolean) => {
    if (wantsToSubmit) {
      setShowContactForm(true);
    } else {
      const response: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: "No problem! Feel free to keep exploring your idea with me. What other questions do you have about how AI could help your business?",
        timestamp: new Date().toISOString(),
        suggestionChips: ["Show me AI examples", "How much does AI cost?", "How long does implementation take?"],
      };
      setMessages(prev => [...prev, response]);
      saveMessage(response);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const isOfferMessage = lastMessage?.role === 'model' && (
    lastMessage.content.toLowerCase().includes('connect you with our team') ||
    (lastMessage.content.toLowerCase().includes('proposal') && lastMessage.content.toLowerCase().includes('would you like'))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full sm:w-[45%] lg:w-[35%] xl:w-[30%] h-full bg-[#0B0F1C]/98 backdrop-blur-xl border-l border-white/20 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Glass edge highlight */}
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[#F6B047]/50 to-transparent" />
        
        {/* Close button on left edge */}
        <button
          onClick={onClose}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 group"
        >
          <div className="bg-[#0B0F1C]/90 backdrop-blur-sm shadow-xl rounded-full p-2 border border-white/30 hover:bg-[#0B0F1C] hover:scale-110 transition-all duration-300">
            <ChevronRight 
              size={20} 
              className="text-white group-hover:translate-x-0.5 transition-transform" 
              strokeWidth={2.5}
            />
          </div>
        </button>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F6B047] to-[#F6B047]/50 flex items-center justify-center">
              <Sparkles size={20} className="text-[#0B0F1C]" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{siteConfig.ideate.drawerTitle}</h3>
              <p className="text-white/50 text-xs">{siteConfig.ideate.drawerSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSearching && (
              <div className="flex items-center gap-1 text-[#F6B047] text-xs animate-pulse">
                <Search size={12} />
                <span>Researching...</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        {!showContactForm ? (
          <>
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth"
              style={{ overscrollBehavior: 'contain' }}
            >
              {messages.map((message, index) => (
                <div key={message.id}>
                  <div
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                        message.role === 'user'
                          ? 'bg-[#F6B047] text-[#0B0F1C] rounded-br-md'
                          : 'bg-white/10 text-white border border-white/10 rounded-bl-md'
                      }`}
                    >
                      {message.content.split('\n').map((line, i, arr) => {
                        const isHeader = line.startsWith('**') && line.endsWith('**');
                        const isBullet = line.startsWith('•');
                        const isNote = line.startsWith('*[') && line.endsWith(']*');
                        return (
                          <span key={i} className={i < arr.length - 1 ? 'block mb-0.5' : 'block'}>
                            {isBullet ? (
                              <span className="ml-3">{line}</span>
                            ) : isHeader ? (
                              <strong className="text-[#F6B047] block mt-1.5 mb-0.5">{line.replace(/\*\*/g, '')}</strong>
                            ) : isNote ? (
                              <span className="text-white/50 italic text-xs">{line.replace(/\*\[|\]\*/g, '')}</span>
                            ) : (
                              line
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Suggestion chips for AI messages */}
                  {message.role === 'model' && message.suggestionChips && message.suggestionChips.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 ml-1">
                      {message.suggestionChips.map((chip, chipIndex) => (
                        <button
                          key={chipIndex}
                          onClick={() => handleChipClick(chip)}
                          className="bg-white/10 hover:bg-[#F6B047]/20 border border-white/20 hover:border-[#F6B047]/50 text-white/80 hover:text-white text-xs px-3 py-1.5 rounded-full transition-all"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Starting question chips - only show after welcome message */}
                  {message.role === 'model' && index === 0 && showStartingChips && (
                    <div className="mt-4 space-y-2">
                      <p className="text-white/50 text-xs mb-2">Or click a topic to explore:</p>
                      <div className="flex flex-wrap gap-2">
                        {STARTING_QUESTIONS.map((question, qIndex) => (
                          <button
                            key={qIndex}
                            onClick={() => handleSend(question)}
                            className="bg-[#F6B047]/10 hover:bg-[#F6B047]/20 border border-[#F6B047]/30 hover:border-[#F6B047]/60 text-white/90 hover:text-white text-xs px-3 py-2 rounded-lg transition-all text-left leading-tight"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm text-white/70">Thinking...</span>
                  </div>
                </div>
              )}
              
              {/* Offer response buttons */}
              {isOfferMessage && !isLoading && (
                <div className="flex gap-3 justify-center mt-4">
                  <button
                    onClick={() => handleUserResponseToOffer(true)}
                    className="bg-[#F6B047] text-[#0B0F1C] px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#F6B047]/90 transition-all"
                  >
                    Yes, connect me!
                  </button>
                  <button
                    onClick={() => handleUserResponseToOffer(false)}
                    className="bg-white/10 text-white border border-white/20 px-5 py-2 rounded-full text-sm hover:bg-white/20 transition-all"
                  >
                    Not yet
                  </button>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-white/10 flex-shrink-0">
              {/* Quick suggestion chips above input */}
              {!isLoading && messages.length > 1 && messages.length < 4 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-white/40 text-xs py-1">Ideas to explore:</span>
                  {["What are businesses like mine doing with AI?", "Where do companies usually start with AI?", "What are some quick wins with AI?"].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(suggestion)}
                      className="text-[#F6B047]/70 hover:text-[#F6B047] text-xs underline decoration-dotted"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your business challenge or idea..."
                  className="w-full bg-white/5 border border-white/20 rounded-2xl pl-4 pr-12 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#F6B047]/50 resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 bottom-3 p-2 bg-[#F6B047] rounded-full text-[#0B0F1C] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F6B047]/90 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-white/30 text-xs mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        ) : !isSubmitted ? (
          /* Contact Form */
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#F6B047]/20 flex items-center justify-center mx-auto mb-4">
                <Lightbulb size={28} className="text-[#F6B047]" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-2">Ready to bring your idea to life?</h3>
              <p className="text-white/60 text-sm">
                We'll review our conversation and get back to you with a detailed AI solution proposal and pricing within 1-2 business days.
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="text-white/80 text-sm font-medium mb-1.5 block">Name *</label>
                <input
                  type="text"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#F6B047]/50"
                />
              </div>
              
              <div>
                <label className="text-white/80 text-sm font-medium mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="you@company.com"
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#F6B047]/50"
                />
              </div>
              
              <div>
                <label className="text-white/80 text-sm font-medium mb-1.5 block">Phone</label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#F6B047]/50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#F6B047] text-[#0B0F1C] py-4 rounded-xl font-semibold text-sm hover:bg-[#F6B047]/90 transition-all mt-6 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Submit for AI Solution Proposal
              </button>
              
              <button
                type="button"
                onClick={() => setShowContactForm(false)}
                className="w-full text-white/50 text-sm hover:text-white transition-colors py-2"
              >
                Go back to chat
              </button>
            </form>
          </div>
        ) : (
          /* Success State */
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h3 className="text-white font-semibold text-2xl mb-3">We've received your submission!</h3>
            <p className="text-white/60 text-sm max-w-xs mx-auto mb-8">
              Our team will review your AI solution needs and get back to you with a proposed approach and pricing within 1-2 business days.
            </p>
            <button
              onClick={onClose}
              className="bg-[#F6B047] text-[#0B0F1C] px-8 py-3 rounded-full font-semibold text-sm hover:bg-[#F6B047]/90 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
