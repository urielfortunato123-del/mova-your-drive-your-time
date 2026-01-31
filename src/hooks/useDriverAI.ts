import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RideData {
  total_rides: number;
  total_earnings: number;
  total_waiting_value: number;
  avg_per_ride: number;
  best_day: string;
  best_day_earnings: number;
  rides_by_day: Record<string, { rides: number; earnings: number }>;
}

type MessageType = 'chat' | 'analysis' | 'summary' | 'suggestions';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/driver-ai-assistant`;

export function useDriverAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRideData = useCallback(async (): Promise<RideData | null> => {
    if (!user?.id) return null;

    try {
      // Get driver profile
      const { data: profile } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return null;

      // Fetch rides from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: rides } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', profile.id)
        .eq('status', 'completed')
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false });

      if (!rides || rides.length === 0) return null;

      // Calculate metrics
      const ridesByDay: Record<string, { rides: number; earnings: number }> = {};
      let bestDay = '';
      let bestDayEarnings = 0;

      rides.forEach(ride => {
        const date = new Date(ride.completed_at!).toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          day: '2-digit', 
          month: '2-digit' 
        });
        
        if (!ridesByDay[date]) {
          ridesByDay[date] = { rides: 0, earnings: 0 };
        }
        ridesByDay[date].rides++;
        ridesByDay[date].earnings += ride.estimated_value + (ride.waiting_value || 0);

        if (ridesByDay[date].earnings > bestDayEarnings) {
          bestDayEarnings = ridesByDay[date].earnings;
          bestDay = date;
        }
      });

      const totalEarnings = rides.reduce((sum, r) => sum + r.estimated_value, 0);
      const totalWaiting = rides.reduce((sum, r) => sum + (r.waiting_value || 0), 0);

      return {
        total_rides: rides.length,
        total_earnings: totalEarnings,
        total_waiting_value: totalWaiting,
        avg_per_ride: totalEarnings / rides.length,
        best_day: bestDay,
        best_day_earnings: bestDayEarnings,
        rides_by_day: ridesByDay,
      };
    } catch (err) {
      console.error('Error fetching ride data:', err);
      return null;
    }
  }, [user?.id]);

  const sendMessage = useCallback(async (
    content: string, 
    type: MessageType = 'chat',
    includeRideData: boolean = true
  ) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === assistantId) {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { 
          id: assistantId, 
          role: 'assistant', 
          content: assistantContent,
          timestamp: new Date()
        }];
      });
    };

    try {
      const rideData = includeRideData ? await fetchRideData() : null;

      const messagesToSend = messages
        .concat(userMessage)
        .map(m => ({ role: m.role, content: m.content }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: messagesToSend,
          rideData,
          type,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error('AI chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar mensagem';
      setError(errorMessage);
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ Desculpe, ocorreu um erro: ${errorMessage}. Por favor, tente novamente.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, fetchRideData]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const quickActions = {
    analyzeEarnings: () => sendMessage(
      "Analise meus ganhos recentes e me dê insights sobre como estou performando", 
      'analysis'
    ),
    getSummary: () => sendMessage(
      "Faça um resumo completo do meu desempenho recente", 
      'summary'
    ),
    getSuggestions: () => sendMessage(
      "Me dê sugestões de melhores horários e regiões para trabalhar", 
      'suggestions'
    ),
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    quickActions,
  };
}
