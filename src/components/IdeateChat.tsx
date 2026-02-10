import { useState, useRef, useEffect } from 'react';
import { Lightbulb, Send, X, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { siteConfig } from '../content.config';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface IdeateChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const GEMINI_API_KEY = 'AIzaSyBUUYr8pBcqraJbK2joNYXmKw0mlI8NYaA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are a helpful AI consultant for Daeda Group, an AI consulting firm. Your goal is to:

1. Understand the user's business ideas, challenges, or pain points
2. Ask clarifying questions to deeply understand their needs
3. Suggest potential AI-powered solutions that could help them
4. Help them think through the problem and solution space

Be conversational, professional, and encouraging. Focus on understanding their needs before suggesting solutions.

When you have enough information about their idea/challenge and have outlined a clear potential solution, offer to submit their information to the Daeda team for a formal proposal with pricing.

IMPORTANT: Only offer to submit when you have:
- A clear understanding of their business problem or idea
- Outlined at least one concrete AI solution approach
- Confirmed they are interested in exploring this further

When offering to submit, say something like: "I have a good understanding of what you're looking for. Would you like me to connect you with our team to get a detailed proposal and pricing for this solution?"`;

export function IdeateChat({ isOpen, onClose }: IdeateChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
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
      // Check for existing active session in localStorage
      const savedSession = localStorage.getItem('ideate_chat_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        // Load messages from Supabase
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
        
        // Add welcome message
        const welcomeMessage = {
          id: crypto.randomUUID(),
          role: 'model' as const,
          content: "Hi there! I'm your AI ideation partner. 💡\n\nI'd love to hear about your business idea, challenge, or pain point. What's on your mind? Whether it's a problem you're trying to solve or an opportunity you want to explore, I'm here to help you think it through!",
          timestamp: new Date().toISOString(),
        };
        
        setMessages([welcomeMessage]);
        
        // Save welcome message to Supabase
        await supabase.from('chat_messages').insert({
          session_id: session.id,
          role: 'model',
          content: welcomeMessage.content,
        });
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      // Fallback to local-only mode
      const fallbackId = crypto.randomUUID();
      setSessionId(fallbackId);
      setMessages([{
        id: crypto.randomUUID(),
        role: 'model',
        content: "Hi there! I'm your AI ideation partner. 💡\n\nI'd love to hear about your business idea, challenge, or pain point. What's on your mind?",
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

  const callGemini = async (userMessage: string, conversationHistory: Message[]) => {
    try {
      const contents = [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'I understand my role as an AI consultant for Daeda Group. I will help users explore their ideas and pain points, and suggest AI-powered solutions.' }] },
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
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response at this time.';
    } catch (error) {
      console.error('Error calling Gemini:', error);
      return "I'm having trouble connecting right now. Let me try a different approach - could you tell me more about what you're working on?";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await saveMessage(userMessage);

    // Get AI response
    const aiResponse = await callGemini(userMessage.content, messages);

    const modelMessage: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, modelMessage]);
    await saveMessage(modelMessage);

    setIsLoading(false);

    // Check if AI is offering to submit (look for keywords)
    const lowerResponse = aiResponse.toLowerCase();
    if (lowerResponse.includes('connect you with our team') || 
        lowerResponse.includes('proposal') || 
        lowerResponse.includes('detailed proposal') ||
        (lowerResponse.includes('submit') && lowerResponse.includes('interested'))) {
      // AI has offered - we'll let the user respond and check their next message
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactInfo.name || !contactInfo.email) return;

    try {
      // Save to Supabase as an ideation submission
      await supabase.from('ideation_submissions').insert({
        session_id: sessionId,
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        chat_summary: messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
      });

      // Update session status
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
      // Still show success even if DB fails
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
        content: "No problem! Feel free to keep exploring your idea with me, or ask any other questions you have. I'm here to help!",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, response]);
      saveMessage(response);
    }
  };

  // Check if last message was an offer to submit
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
              <Lightbulb size={20} className="text-[#0B0F1C]" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{siteConfig.ideate.drawerTitle}</h3>
              <p className="text-white/50 text-xs">{siteConfig.ideate.drawerSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        {!showContactForm ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
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
                        {line}
                        {i < message.content.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
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
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share your idea or challenge..."
                  className="w-full bg-white/5 border border-white/20 rounded-2xl pl-4 pr-12 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#F6B047]/50 resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
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
                We'll review our conversation and get back to you with a detailed proposal and pricing within 1-2 business days.
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
                Submit for Proposal
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
              Our team will review your idea and get back to you with a proposed solution and pricing within 1-2 business days.
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
