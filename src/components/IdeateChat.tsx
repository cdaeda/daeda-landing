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
const BRAVE_SEARCH_URL = `${SUPABASE_URL}/functions/v1/brave-search`;

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

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      const savedSession = localStorage.getItem('ideate_chat_session');
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
        localStorage.setItem('ideate_chat_session', JSON.stringify({ id: session.id }));
        setShowStartingChips(true);
        
        const welcomeMessage = {
          id: crypto.randomUUID(),
          role: 'model' as const,
          content: "Hi there! I'm your AI business ideation partner. 💡\n\nI'm here to help you explore how AI might help your business—no technical background needed!\n\n**Here's what we can chat about:**\n• Finding ways to save time on repetitive tasks\n• Improving how you serve customers\n• Getting more from your data\n• Exploring new AI opportunities you might not know about\n\n**What's on your mind?** Feel free to share what's working well, what's frustrating, or just what you're curious about. I'm here to share ideas and suggestions!\n\nOr pick a topic below to explore:",
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
        content: "Hi there! I'm your AI business ideation partner. 💡\n\nI'm here to help you explore how AI might help your business—no technical background needed!\n\n**Here's what we can chat about:**\n• Finding ways to save time on repetitive tasks\n• Improving how you serve customers\n• Getting more from your data\n• Exploring new AI opportunities\n\nWhat's on your mind? Feel free to share what's working well, what's frustrating, or what you're curious about!",
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

  // Call Brave Search Edge Function
  const performWebSearch = async (query: string): Promise<any> => {
    try {
      setIsSearching(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(BRAVE_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          query: `${query} AI use cases business automation`,
          count: 3,
        }),
      });

      if (!response.ok) throw new Error('Brave search request failed');
      
      const data = await response.json();
      setSearchResults(data);
      setIsSearching(false);
      return data;
    } catch (error) {
      console.error('Error performing web search:', error);
      setIsSearching(false);
      return null;
    }
  };

  // Build enhanced system prompt with context
  const buildSystemPrompt = (mcpContext: any): string => {
    let enhancedPrompt = `You are a friendly, approachable AI business consultant for Daeda Group. Your job is to help business owners explore how AI could help them—even if they've never used AI before.

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

END EVERY RESPONSE WITH:
2-3 clickable suggestion chips in [SUGGESTIONS: option1 | option2 | option3] format that offer natural next steps or related ideas to explore.`;

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
            maxOutputTokens: 2048,
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

    // Optionally perform web search if we're in exploration stage
    let searchData = null;
    if (mcpContext?.conversationStage === 'exploration' && mcpContext?.context?.industry) {
      searchData = await performWebSearch(`${mcpContext.context.industry} ${mcpContext.context.painPoints?.[0] || ''}`);
    }

    // Get AI response with enhanced context
    const aiResponse = await callGemini(messageText, messages, mcpContext);

    // If we have search results, append a brief mention
    let finalContent = aiResponse.content;
    if (searchData?.results?.length > 0) {
      finalContent += `\n\n*[I've found some relevant industry insights that support this approach.]*`;
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
        
        localStorage.removeItem('ideate_chat_session');
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
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((message, index) => (
                <div key={message.id}>
                  <div
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-[#F6B047] text-[#0B0F1C] rounded-br-md'
                          : 'bg-white/10 text-white border border-white/10 rounded-bl-md'
                      }`}
                    >
                      {message.content.split('\n').map((line, i) => (
                        <span key={i}>
                          {line.startsWith('•') ? (
                            <span className="block ml-3 my-1">{line}</span>
                          ) : line.startsWith('**') && line.endsWith('**') ? (
                            <strong className="text-[#F6B047] block mt-2 mb-1">{line.replace(/\*\*/g, '')}</strong>
                          ) : line.startsWith('*[') && line.endsWith(']*') ? (
                            <span className="text-white/50 italic text-xs block mt-2">{line.replace(/\*\[|\]\*/g, '')}</span>
                          ) : (
                            line
                          )}
                          {i < message.content.split('\n').length - 1 && <br />}
                        </span>
                      ))}
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
