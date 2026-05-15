import { useState, useRef, useEffect } from 'react';
import { useWebHaptics } from 'web-haptics/react';
import { Send, User, Bot, AlertCircle, Info, Leaf, Activity, BrainCircuit, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Message, DiagnosisResult } from '@/src/types';
import { getChatResponse } from '@/src/services/geminiService';
import { supabaseService } from '@/src/services/supabaseService';
import { predict, extractSymptoms, adjust, KnowledgeBase, setKnowledgeBase } from '@/src/services/medicalEngine';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

export default function ChatInterface() {
  const shouldReduceMotion = useReducedMotion();
  const { trigger } = useWebHaptics();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I’m HealthNet AI, your primary care assistant. How can I help you today? Please remember, I am an AI and not a replacement for professional medical advice.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReasoning, setSelectedReasoning] = useState<Message | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<{symptoms: string[], diagnoses: DiagnosisResult[]} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await supabaseService.getChatHistory('main-session');
        if (history && history.length > 0) {
          const formattedHistory: Message[] = history.map(h => ({
            id: h.id.toString(),
            role: h.role,
            content: h.content,
            timestamp: new Date(h.timestamp).getTime(),
            type: h.type,
            reasoning: h.reasoning
          }));
          setMessages(formattedHistory);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    loadHistory();
  }, []);

  // Initialize Medical Knowledge Base from Supabase
  useEffect(() => {
    const initKB = async () => {
      try {
        const knowledge = await supabaseService.getMedicalKnowledge();
        if (knowledge && knowledge.length > 0) {
          const newKB: KnowledgeBase = {};
          knowledge.forEach((item: any) => {
            newKB[item.disease] = {
              symptoms: item.symptoms,
              urgency: item.urgency,
              recommendations: item.recommendations,
              herbalAlternatives: item.herbal_alternatives
            };
          });
          setKnowledgeBase(newKB);
        }
      } catch (error) {
        console.error('Error loading medical knowledge:', error);
      }
    };
    initKB();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    trigger('success');

    // Save user message to Supabase
    supabaseService.saveMessage('main-session', userMessage).catch(console.error);

    try {
      // 1. LOCAL PREDICTION (Predict Step)
      const detectedSymptoms = extractSymptoms(input);
      const localResults = predict(detectedSymptoms);
      
      let assistantMessage: Message;

      if (localResults.length > 0 && localResults[0].confidence > 0.6) {
        // High confidence local prediction
        const topResult = localResults[0];
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Based on your symptoms (${detectedSymptoms.join(', ')}), my internal analysis suggests a high probability of **${topResult.condition}**. \n\n**Next Steps:** ${topResult.recommendations.join(', ')}. \n\n**Herbal Options:** ${topResult.herbalAlternatives?.join(', ') || 'N/A'}`,
          timestamp: Date.now(),
          type: 'diagnosis',
          reasoning: {
            steps: [`Detected symptoms: ${detectedSymptoms.join(', ')}`, `Weighted matching against knowledge base`, topResult.explanation],
            confidence: topResult.confidence,
          },
          metadata: { local: true, symptoms: detectedSymptoms, topResult }
        };
        
        // Setup for Feedback (Compare & Adjust)
        setPendingFeedback({ symptoms: detectedSymptoms, diagnoses: localResults });
      } else {
        // Fallback to Gemini if local confidence is low
        const chatHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        chatHistory.push({ role: 'user', content: input });

        const responseData = await getChatResponse(chatHistory);

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseData.content || 'I’m sorry, I couldn’t process that request.',
          timestamp: Date.now(),
          reasoning: responseData.reasoning,
          metadata: { local: false }
        };
      }

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Save assistant message to Supabase
      supabaseService.saveMessage('main-session', assistantMessage).catch(console.error);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error. Please check your connection and try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleFeedback = async (actualCondition: string) => {
    if (!pendingFeedback) return;
    
    trigger('success');
    const updatedKB = adjust(pendingFeedback.symptoms, actualCondition);
    
    // Persist to Supabase (Adjust Step)
    try {
      await supabaseService.updateMedicalKnowledge(actualCondition, updatedKB[actualCondition]);
      setPendingFeedback(null);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Thank you for the feedback. I have adjusted my internal parameters to better recognize **${actualCondition}** based on these symptoms. This helps me provide better feedback in the future.`,
        timestamp: Date.now(),
        type: 'text'
      }]);
    } catch (error) {
      console.error("Failed to persist feedback", error);
    }
  };

  const motionProps = shouldReduceMotion
    ? { initial: false, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
      };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 h-full min-h-[500px] sm:min-h-[600px] relative z-10">
      <div className="lg:col-span-8 flex flex-col h-full bg-white/40 ring-1 ring-white/60 backdrop-blur-3xl rounded-[24px] sm:rounded-[32px] shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Chat Header - Higher contrast and cleaner typography */}
        <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-white/40 flex items-center justify-between bg-white/20">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 ring-4 ring-primary/5">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-white rounded-full shimmer" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none">HealthNet AI</h3>
              <div className="flex items-center gap-2 mt-1 sm:mt-2">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Clinical Expert</Badge>
                <div className="hidden xs:flex items-center gap-1.5 ml-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">Active</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50 transition-colors h-9 w-9 sm:h-10 sm:w-10">
              <Info className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-400" />
            </Button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full px-4 py-6 sm:px-8 sm:py-8" ref={scrollRef}>
            <div
              role="log"
              aria-label="Conversation history"
              aria-live="polite"
              className="space-y-6 sm:space-y-8"
            >
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 420, 
                      damping: 28,
                      delay: i * 0.05 
                    }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 sm:gap-4 max-w-[92%] sm:max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-1.5 sm:gap-2`}>
                        <div
                          className={`group relative px-4 py-3 sm:px-6 sm:py-4 rounded-[20px] sm:rounded-[24px] text-sm sm:text-[15px] font-medium leading-relaxed transition-all duration-300 ${
                            m.role === 'user'
                              ? 'bg-slate-900 text-white rounded-tr-none shadow-xl shadow-slate-200'
                              : 'bg-white text-slate-800 rounded-tl-none border border-white/80 shadow-md shadow-slate-100/50'
                          }`}
                        >
                          {m.content}
                          {m.reasoning && (
                            <button
                              onClick={() => {
                                trigger('nudge');
                                setSelectedReasoning(m);
                              }}
                              className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 bg-white border border-slate-100 shadow-xl rounded-2xl p-1.5 sm:p-2 text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                            >
                              <BrainCircuit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            {new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(m.timestamp)}
                          </span>
                          {m.role === 'assistant' && (
                            <div className="flex items-center gap-1 opacity-40">
                              <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Feedback UI (Compare Step) */}
                {pendingFeedback && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="flex justify-start pt-4"
                  >
                    <Card className="bg-primary/5 border-primary/20 shadow-none rounded-[24px] w-full max-w-[85%]">
                      <CardHeader className="py-3 px-6">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4" /> Compare & Adjust
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-6 pb-4 space-y-3">
                        <p className="text-xs text-slate-500 font-medium">Was this assessment correct? Select the actual condition if different to help me learn.</p>
                        <div className="flex flex-wrap gap-2">
                          {pendingFeedback.diagnoses.map(d => (
                            <Button key={d.condition} size="sm" variant="outline" onClick={() => handleFeedback(d.condition)} className="text-[10px] h-8 rounded-full border-primary/20 hover:bg-primary hover:text-white transition-all">
                              {d.condition}
                            </Button>
                          ))}
                          <Button size="sm" variant="ghost" onClick={() => setPendingFeedback(null)} className="text-[10px] h-8 rounded-full text-slate-400">
                            Dismiss
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Skeleton Loading Indicator */}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="flex justify-start pt-2"
                >
                  <div className="bg-white/60 border border-white rounded-tl-none rounded-[20px] px-5 py-4 sm:px-6 sm:py-5 shadow-sm space-y-2.5 w-[60%] max-w-xs">
                    <div className="skeleton h-3 w-full rounded-full" />
                    <div className="skeleton h-3 w-[75%] rounded-full" />
                    <div className="skeleton h-3 w-[50%] rounded-full" />
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input Bar - Floating & Premium */}
        <div className="p-4 sm:p-8 mt-auto border-t border-white/40 bg-white/20">
          <div className="relative group max-w-4xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-[28px] sm:rounded-[32px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative flex items-center gap-2 sm:gap-3 bg-white p-2 sm:p-3 rounded-[24px] sm:rounded-[28px] border border-white/50 shadow-xl input-glow transition-all duration-300">
              <Input
                ref={inputRef}
                placeholder="Ask HealthNet..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-slate-900 placeholder:text-slate-400 placeholder:font-medium h-10 sm:h-12 px-3 sm:px-5 text-sm sm:text-base"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="h-10 sm:h-12 px-5 sm:px-8 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[9px] sm:text-[11px] btn-press shadow-lg shrink-0"
              >
                <span className="hidden xs:inline mr-2">Send</span> <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[
              { icon: Activity, label: 'Symptom', hint: "I'm feeling..." },
              { icon: Leaf, label: 'Herbal', hint: "Recommend remedies for..." },
              { icon: BrainCircuit, label: 'Docs', isDialog: true }
            ].map((btn) => (
              <Button
                key={btn.label}
                variant="ghost"
                size="sm"
                onClick={() => {
                  trigger('nudge');
                  if (btn.hint) setInput(btn.hint);
                }}
                className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-white/40 hover:bg-white text-slate-500 hover:text-primary border border-white/60 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] transition-all"
              >
                <btn.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" /> {btn.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Reasoning Sidebar - Premium Upgrade */}
      <div className="lg:col-span-4 h-[400px] lg:h-full">
        <div className="glass-panel h-full rounded-[24px] sm:rounded-[32px] flex flex-col overflow-hidden">
          <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-white/40 bg-primary/5 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
              <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-slate-800">Intelligence</h4>
          </div>
          
          <div className="flex-1 p-6 sm:p-8 overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedReasoning ? (
                <motion.div
                  key={selectedReasoning.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 sm:space-y-10 h-full overflow-y-auto pr-2 scrollbar-hide"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Match</span>
                      <span className="text-lg sm:text-xl font-black text-primary tabular-nums">
                        {Math.round((selectedReasoning.reasoning?.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(selectedReasoning.reasoning?.confidence || 0) * 100}%` }}
                        transition={{ duration: 1, ease: 'circOut' }}
                        className="h-full bg-gradient-to-r from-primary to-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <h5 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <Zap className="w-3 h-3" /> Logic Flow
                    </h5>
                    <div className="space-y-3 sm:space-y-4">
                      {selectedReasoning.reasoning?.steps.map((step, i) => (
                        <div key={i} className="relative pl-7 sm:pl-8 group">
                          <div className="absolute left-0 top-0.5 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[9px] sm:text-[10px] font-black group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                            {i + 1}
                          </div>
                          <p className="text-[12px] sm:text-[13px] font-medium text-slate-600 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedReasoning.reasoning?.sources && (
                    <div className="space-y-3 sm:space-y-4">
                       <h5 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                         <ShieldCheck className="w-3 h-3" /> EVIDENCE
                       </h5>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {selectedReasoning.reasoning.sources.map((source, i) => (
                          <Badge key={i} variant="outline" className="bg-white/40 border-white/60 text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg lowercase tracking-tight">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 sm:px-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100/50 rounded-[24px] sm:rounded-[28px] flex items-center justify-center mb-4 sm:mb-6 animate-pulse">
                    <BrainCircuit className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" strokeWidth={1.5} />
                  </div>
                  <h5 className="text-sm sm:text-base font-black text-slate-900 mb-2">Neural Analysis</h5>
                  <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed">
                    Select a message to unveil the clinical logic behind the AI's response.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
