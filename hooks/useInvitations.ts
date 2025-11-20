
import { useState } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

export interface PartnerInvitation {
  id: string;
  inviter_id: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'expired';
  invitation_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface SendInvitationResult {
  success: boolean;
  message: string;
  invitationLink: string;
  invitationToken: string;
  emailSent: boolean;
  emailError?: any;
  resendResponse?: any;
}

export function useInvitations() {
  const [loading, setLoading] = useState(false);

  const sendInvitation = async (inviteeEmail: string, inviterName: string): Promise<SendInvitationResult> => {
    setLoading(true);
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Get the project URL
      const supabaseUrl = supabase.supabaseUrl;
      const functionUrl = `${supabaseUrl}/functions/v1/send-partner-invitation`;

      console.log('Calling Edge Function:', functionUrl);

      // Call the Edge Function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteeEmail,
          inviterName,
        }),
      });

      const data = await response.json();
      console.log('Edge Function response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      return data as SendInvitationResult;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitationToken: string) => {
    setLoading(true);
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get the invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('partner_invitations')
        .select('*')
        .eq('invitation_token', invitationToken)
        .eq('status', 'pending')
        .single();

      if (invitationError || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Check if the user's email matches the invitation
      if (user.email !== invitation.invitee_email) {
        throw new Error('This invitation was sent to a different email address');
      }

      // Update the user's profile with partner email
      const { error: profileError } = await supabase
        .from('couple_profiles')
        .upsert({
          user_id: user.id,
          partner_email: invitation.invitee_email,
        });

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // Try to create the couple relationship
      const { data: inviterProfile } = await supabase
        .from('couple_profiles')
        .select('user_id')
        .eq('user_id', invitation.inviter_id)
        .single();

      if (inviterProfile) {
        // Create couple
        const { data: couple, error: coupleError } = await supabase
          .from('couples')
          .insert({
            user1_id: invitation.inviter_id,
            user2_id: user.id,
          })
          .select()
          .single();

        if (coupleError) {
          console.error('Error creating couple:', coupleError);
          throw coupleError;
        }

        // Update both profiles with couple_id
        await supabase
          .from('couple_profiles')
          .update({ couple_id: couple.id })
          .in('user_id', [invitation.inviter_id, user.id]);

        // Mark invitation as accepted
        await supabase
          .from('partner_invitations')
          .update({ status: 'accepted' })
          .eq('invitation_token', invitationToken);

        return couple;
      }

      throw new Error('Inviter profile not found');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getInvitationByToken = async (invitationToken: string) => {
    try {
      const { data, error } = await supabase
        .from('partner_invitations')
        .select('*')
        .eq('invitation_token', invitationToken)
        .single();

      if (error) {
        console.error('Error fetching invitation:', error);
        return null;
      }

      return data as PartnerInvitation;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      return null;
    }
  };

  return {
    loading,
    sendInvitation,
    acceptInvitation,
    getInvitationByToken,
  };
}
