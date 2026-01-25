import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  ride_id: string;
  sender_type: 'driver' | 'passenger';
  sender_id: string;
  message: string;
  message_type: 'text' | 'location' | 'quick';
  latitude?: number;
  longitude?: number;
  is_read: boolean;
  created_at: string;
}

export const QUICK_MESSAGES = [
  "Cheguei ao local",
  "Estou a caminho",
  "Estou a 5 minutos",
  "Pode confirmar o local?",
  "Aguardando no ponto combinado",
  "Trânsito intenso, vou atrasar um pouco",
  "Já estou saindo",
  "Obrigado!"
];

interface UseChatOptions {
  rideId: string;
  rideStatus: string;
}

export function useChat({ rideId, rideStatus }: UseChatOptions) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isChatActive = rideStatus === 'confirmed' || rideStatus === 'in_progress';

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!rideId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages((data || []) as ChatMessage[]);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!rideId) return;

    fetchMessages();

    let channel: RealtimeChannel | null = null;

    if (isChatActive) {
      channel = supabase
        .channel(`chat-${rideId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `ride_id=eq.${rideId}`,
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [rideId, isChatActive, fetchMessages]);

  // Send text message
  const sendMessage = useCallback(async (text: string, type: 'text' | 'quick' = 'text') => {
    if (!user?.id || !rideId || !isChatActive || !text.trim()) return false;

    setSending(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          ride_id: rideId,
          sender_type: 'driver',
          sender_id: user.id,
          message: text.trim(),
          message_type: type,
        });

      if (insertError) throw insertError;
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erro ao enviar mensagem');
      return false;
    } finally {
      setSending(false);
    }
  }, [user?.id, rideId, isChatActive]);

  // Send location
  const sendLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!user?.id || !rideId || !isChatActive) return false;

    setSending(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          ride_id: rideId,
          sender_type: 'driver',
          sender_id: user.id,
          message: '📍 Localização compartilhada',
          message_type: 'location',
          latitude,
          longitude,
        });

      if (insertError) throw insertError;
      return true;
    } catch (err) {
      console.error('Error sending location:', err);
      setError('Erro ao enviar localização');
      return false;
    } finally {
      setSending(false);
    }
  }, [user?.id, rideId, isChatActive]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!user?.id || !rideId) return;

    const unreadIds = messages
      .filter((m) => !m.is_read && m.sender_id !== user.id)
      .map((m) => m.id);

    if (unreadIds.length === 0) return;

    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', unreadIds);

      setMessages((prev) =>
        prev.map((m) =>
          unreadIds.includes(m.id) ? { ...m, is_read: true } : m
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [user?.id, rideId, messages]);

  const unreadCount = messages.filter(
    (m) => !m.is_read && m.sender_id !== user?.id
  ).length;

  return {
    messages,
    loading,
    sending,
    error,
    isChatActive,
    unreadCount,
    sendMessage,
    sendLocation,
    markAsRead,
    quickMessages: QUICK_MESSAGES,
  };
}
