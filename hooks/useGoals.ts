
import { useEffect, useState } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Database } from '@/app/integrations/supabase/types';
import { Goal } from '@/types/Event';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];

export function useGoals(coupleId: string | null | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    fetchGoals();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('goals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          console.log('Goals changed, refetching...');
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const fetchGoals = async () => {
    if (!coupleId) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error);
        throw error;
      }

      // Convert database format to app format
      const formattedGoals: Goal[] = (data || []).map((goal: GoalRow) => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        progress: goal.progress,
        targetDate: goal.target_date || undefined,
        color: goal.color,
        emoji: goal.emoji || undefined,
      }));

      setGoals(formattedGoals);
    } catch (error) {
      console.error('Error in fetchGoals:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'progress'>, userId: string) => {
    if (!coupleId) {
      console.error('No couple ID available');
      throw new Error('No couple ID');
    }

    console.log('Adding goal to database:', {
      couple_id: coupleId,
      created_by: userId,
      title: goal.title,
      description: goal.description,
      progress: 0,
      target_date: goal.targetDate || null,
      color: goal.color,
      emoji: goal.emoji || null,
    });

    const goalInsert: GoalInsert = {
      couple_id: coupleId,
      created_by: userId,
      title: goal.title,
      description: goal.description,
      progress: 0,
      target_date: goal.targetDate || null,
      color: goal.color,
      emoji: goal.emoji || null,
    };

    const { data, error } = await supabase
      .from('goals')
      .insert(goalInsert)
      .select()
      .single();

    if (error) {
      console.error('Error adding goal:', error);
      throw error;
    }

    console.log('Goal added successfully:', data);
    return data;
  };

  const updateGoalProgress = async (id: string, progress: number) => {
    const { data, error } = await supabase
      .from('goals')
      .update({ progress })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }

    return data;
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const { data, error } = await supabase
      .from('goals')
      .update({
        title: updates.title,
        description: updates.description,
        progress: updates.progress,
        target_date: updates.targetDate || null,
        color: updates.color,
        emoji: updates.emoji || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating goal:', error);
      throw error;
    }

    return data;
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  };

  return {
    goals,
    loading,
    addGoal,
    updateGoalProgress,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
}
