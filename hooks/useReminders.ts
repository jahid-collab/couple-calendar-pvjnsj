
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Database } from '@/app/integrations/supabase/types';
import { Reminder } from '@/types/Event';

type ReminderRow = Database['public']['Tables']['reminders']['Row'];
type ReminderInsert = Database['public']['Tables']['reminders']['Insert'];

export function useReminders(coupleId: string | null | undefined) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!coupleId) return;

    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('couple_id', coupleId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Error fetching reminders:', error);
        throw error;
      }

      // Convert database format to app format
      const formattedReminders: Reminder[] = (data || []).map((reminder: ReminderRow) => ({
        id: reminder.id,
        title: reminder.title,
        completed: reminder.completed,
        dueDate: reminder.due_date || undefined,
        shared: reminder.shared,
      }));

      setReminders(formattedReminders);
    } catch (error) {
      console.error('Error in fetchReminders:', error);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    fetchReminders();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('reminders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          console.log('Reminders changed, refetching...');
          fetchReminders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, fetchReminders]);

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'completed'>, userId: string) => {
    if (!coupleId) throw new Error('No couple ID');

    const reminderInsert: ReminderInsert = {
      couple_id: coupleId,
      created_by: userId,
      title: reminder.title,
      completed: false,
      due_date: reminder.dueDate || null,
      shared: reminder.shared,
    };

    const { data, error } = await supabase
      .from('reminders')
      .insert(reminderInsert)
      .select()
      .single();

    if (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }

    return data;
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    const { data, error } = await supabase
      .from('reminders')
      .update({ completed })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling reminder:', error);
      throw error;
    }

    return data;
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    const { data, error } = await supabase
      .from('reminders')
      .update({
        title: updates.title,
        completed: updates.completed,
        due_date: updates.dueDate || null,
        shared: updates.shared,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }

    return data;
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  };

  return {
    reminders,
    loading,
    addReminder,
    toggleReminder,
    updateReminder,
    deleteReminder,
    refetch: fetchReminders,
  };
}
