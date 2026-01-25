import React, { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, MapPin, Zap, Lock, ExternalLink, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useChat, ChatMessage, QUICK_MESSAGES } from "@/hooks/useChat";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";

interface ChatDrawerProps {
  rideId: string;
  passengerName: string;
  rideStatus: string;
}

export function ChatDrawer({ rideId, passengerName, rideStatus }: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { position } = useGeolocation();

  const {
    messages,
    loading,
    sending,
    isChatActive,
    unreadCount,
    sendMessage,
    sendLocation,
    markAsRead,
    quickMessages,
  } = useChat({ rideId, rideStatus });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAsRead();
    }
  }, [isOpen, unreadCount, markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    const success = await sendMessage(newMessage.trim());
    if (success) {
      setNewMessage("");
      inputRef.current?.focus();
    }
  };

  const handleQuickMessage = async (msg: string) => {
    const success = await sendMessage(msg, 'quick');
    if (success) {
      setShowQuickMessages(false);
      toast.success("Mensagem enviada!");
    }
  };

  const handleSendLocation = async () => {
    if (!position) {
      toast.error("Localização não disponível");
      return;
    }
    
    const success = await sendLocation(position[0], position[1]);
    if (success) {
      toast.success("Localização enviada!");
    }
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
          variant="outline" 
          className="relative gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40"
        >
          <MessageCircle className="w-5 h-5 text-primary" />
          <span>Chat</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b border-border bg-card">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold">{passengerName}</p>
              <p className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                {isChatActive ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Chat ativo
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    Chat encerrado
                  </>
                )}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Info Banner */}
        {!isChatActive && (
          <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              O chat é encerrado automaticamente após a conclusão da corrida. 
              As mensagens ficam salvas como histórico.
            </p>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Nenhuma mensagem ainda.
                </p>
                {isChatActive && (
                  <p className="text-muted-foreground text-xs mt-1">
                    Envie uma mensagem para o passageiro.
                  </p>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Quick Messages */}
        {showQuickMessages && isChatActive && (
          <div className="px-4 py-3 border-t border-border bg-muted/30 max-h-48 overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Mensagens rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {quickMessages.map((msg, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => handleQuickMessage(msg)}
                  disabled={sending}
                >
                  {msg}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          {isChatActive ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={showQuickMessages ? "secondary" : "outline"}
                  size="icon"
                  className="shrink-0"
                  onClick={() => setShowQuickMessages(!showQuickMessages)}
                  title="Mensagens rápidas"
                >
                  <Zap className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={handleSendLocation}
                  disabled={sending || !position}
                  title="Enviar localização"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  disabled={sending}
                  maxLength={500}
                />
                <Button 
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                💬 Chat seguro • Mensagens monitoradas • Sem exposição de dados
              </p>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Chat encerrado
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isDriver = message.sender_type === "driver";
  const time = format(new Date(message.created_at), "HH:mm", { locale: ptBR });

  const openLocationInMaps = () => {
    if (message.latitude && message.longitude) {
      window.open(
        `https://www.google.com/maps?q=${message.latitude},${message.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div className={cn(
      "flex",
      isDriver ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2.5 animate-scale-in",
        isDriver 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-muted text-foreground rounded-bl-md",
        message.message_type === 'quick' && "border-2 border-primary/20"
      )}>
        {message.message_type === 'location' && message.latitude && message.longitude ? (
          <button
            onClick={openLocationInMaps}
            className="flex items-center gap-2 hover:underline"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Ver localização</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        )}
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isDriver ? "justify-end" : "justify-start"
        )}>
          {message.message_type === 'quick' && (
            <Zap className={cn(
              "w-3 h-3",
              isDriver ? "text-primary-foreground/70" : "text-muted-foreground"
            )} />
          )}
          <p className={cn(
            "text-[10px]",
            isDriver ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {time}
          </p>
        </div>
      </div>
    </div>
  );
}
