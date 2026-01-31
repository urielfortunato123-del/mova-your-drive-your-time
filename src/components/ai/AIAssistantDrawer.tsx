import React, { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  Sparkles, 
  TrendingUp, 
  FileText, 
  MapPin,
  Trash2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDriverAI } from "@/hooks/useDriverAI";
import ReactMarkdown from 'react-markdown';

export function AIAssistantDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    quickActions,
  } = useDriverAI();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          size="icon"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
          </span>
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 h-full">
        <SheetHeader className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold flex items-center gap-2">
                MovA IA
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </p>
              <p className="text-xs text-muted-foreground font-normal">
                Seu assistente inteligente
              </p>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                className="text-muted-foreground hover:text-destructive"
                title="Limpar conversa"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Olá, motorista! 👋</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                  Sou o MovA IA, seu assistente inteligente. Posso analisar seus ganhos, 
                  dar dicas e responder suas dúvidas!
                </p>
                
                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">Ações rápidas:</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 text-left"
                      onClick={quickActions.analyzeEarnings}
                      disabled={isLoading}
                    >
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>Analisar meus ganhos</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 text-left"
                      onClick={quickActions.getSummary}
                      disabled={isLoading}
                    >
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span>Resumo do meu desempenho</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 text-left"
                      onClick={quickActions.getSuggestions}
                      disabled={isLoading}
                    >
                      <MapPin className="w-4 h-4 text-orange-500" />
                      <span>Sugestões de horários e regiões</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))
            )}
            
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta..."
              className="flex-1"
              disabled={isLoading}
              maxLength={500}
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            ✨ Powered by MovA IA • Respostas baseadas nos seus dados reais
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface MessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3 animate-scale-in",
        isUser 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-muted text-foreground rounded-bl-md"
      )}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 pl-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                code: ({ children }) => (
                  <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p className={cn(
          "text-[10px] mt-1",
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
