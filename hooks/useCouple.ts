
import { useEffect, useState } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Database } from '@/app/integrations/supabase/types';

type Couple = Database['public']['Tables']['couples']['Row'];
type CoupleProfile = Database['public']['Tables']['couple_profiles']['Row'];

export function useCouple(userId: string | undefined) {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<CoupleProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchCoupleData();
  }, [userId]);

  const fetchCoupleData = async () => {
    if (!userId) return;

    try {
      console.log('Fetching couple data for user:', userId);
      
      // Fetch user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('couple_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      } else {
        console.log('Profile data:', profileData);
        setProfile(profileData);
      }

      // Fetch couple data
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .single();

      if (coupleError && coupleError.code !== 'PGRST116') {
        console.error('Error fetching couple:', coupleError);
      } else if (coupleData) {
        console.log('Couple data:', coupleData);
        setCouple(coupleData);

        // Fetch partner's profile
        const partnerId = coupleData.user1_id === userId ? coupleData.user2_id : coupleData.user1_id;
        const { data: partnerData, error: partnerError } = await supabase
          .from('couple_profiles')
          .select('*')
          .eq('user_id', partnerId)
          .single();

        if (partnerError && partnerError.code !== 'PGRST116') {
          console.error('Error fetching partner profile:', partnerError);
        } else {
          console.log('Partner profile data:', partnerData);
          setPartnerProfile(partnerData);
        }
      }
    } catch (error) {
      console.error('Error in fetchCoupleData:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCouple = async (partnerEmail: string) => {
    if (!userId) throw new Error('User not authenticated');

    // Find partner by email
    const { data: partnerData, error: partnerError } = await supabase
      .from('couple_profiles')
      .select('user_id')
      .eq('partner_email', partnerEmail)
      .single();

    if (partnerError) {
      throw new Error('Partner not found. Make sure they have signed up.');
    }

    // Create couple
    const { data, error } = await supabase
      .from('couples')
      .insert({
        user1_id: userId,
        user2_id: partnerData.user_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating couple:', error);
      throw error;
    }

    // Update both profiles with couple_id
    await supabase
      .from('couple_profiles')
      .update({ couple_id: data.id })
      .in('user_id', [userId, partnerData.user_id]);

    await fetchCoupleData();
    return data;
  };

  const updateProfile = async (updates: Partial<CoupleProfile>) => {
    if (!userId) throw new Error('User not authenticated');

    console.log('Updating profile with:', updates);

    // Use upsert to handle both insert and update cases
    const { data, error } = await supabase
      .from('couple_profiles')
      .upsert(
        {
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    console.log('Profile updated successfully:', data);
    setProfile(data);
    return data;
  };

  return {
    couple,
    profile,
    partnerProfile,
    loading,
    createCouple,
    updateProfile,
    refetch: fetchCoupleData,
  };
}
