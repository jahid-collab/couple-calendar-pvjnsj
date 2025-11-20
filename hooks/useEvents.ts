
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Database } from '@/app/integrations/supabase/types';
import { Event } from '@/types/Event';

type EventRow = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];

export function useEvents(coupleId: string | null | undefined) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!coupleId) {
      console.log('fetchEvents: No coupleId');
      return;
    }

    try {
      console.log('fetchEvents: Fetching events for couple:', coupleId);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      console.log('fetchEvents: Fetched events:', data);

      // Convert database format to app format
      const formattedEvents: Event[] = (data || []).map((event: EventRow) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        type: event.type as Event['type'],
        description: event.description || undefined,
        color: event.color,
        emoji: event.emoji || undefined,
      }));

      console.log('fetchEvents: Formatted events:', formattedEvents);
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    console.log('useEvents: coupleId changed:', coupleId);
    if (!coupleId) {
      console.log('useEvents: No coupleId, setting loading to false');
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
        (payload) => {
          console.log('Events changed, payload:', payload);
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, fetchEvents]);

  const addEvent = async (event: Omit<Event, 'id'>, userId: string) => {
    console.log('=== addEvent called ===');
    console.log('event:', event);
    console.log('userId:', userId);
    console.log('coupleId:', coupleId);

    if (!coupleId) {
      const error = new Error('No couple ID - you must be connected with a partner');
      console.error('addEvent error:', error);
      throw error;
    }

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

    console.log('addEvent: Inserting event:', eventInsert);

    const { data, error } = await supabase
      .from('events')
      .insert(eventInsert)
      .select()
      .single();

    if (error) {
      console.error('=== addEvent Supabase error ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      throw error;
    }

    console.log('addEvent: Event inserted successfully:', data);
    return data;
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    console.log('updateEvent called:', id, updates);
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

    console.log('Event updated successfully:', data);
    return data;
  };

  const deleteEvent = async (id: string) => {
    console.log('deleteEvent called:', id);
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }

    console.log('Event deleted successfully');
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
