
import { useEffect, useState } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Database } from '@/app/integrations/supabase/types';
import { Event } from '@/types/Event';

type EventRow = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];

export function useEvents(coupleId: string | null | undefined) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    fetchEvents();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          console.log('Events changed, refetching...');
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const fetchEvents = async () => {
    if (!coupleId) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      // Convert database format to app format
      const formattedEvents: Event[] = (data || []).map((event: EventRow) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        type: event.type,
        description: event.description || undefined,
        color: event.color,
        emoji: event.emoji || undefined,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (event: Omit<Event, 'id'>, userId: string) => {
    if (!coupleId) throw new Error('No couple ID');

    const eventInsert: EventInsert = {
      couple_id: coupleId,
      created_by: userId,
      title: event.title,
      date: event.date,
      type: event.type,
      description: event.description || null,
      color: event.color,
      emoji: event.emoji || null,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(eventInsert)
      .select()
      .single();

    if (error) {
      console.error('Error adding event:', error);
      throw error;
    }

    return data;
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    const { data, error } = await supabase
      .from('events')
      .update({
        title: updates.title,
        date: updates.date,
        type: updates.type,
        description: updates.description || null,
        color: updates.color,
        emoji: updates.emoji || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    return data;
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
}
