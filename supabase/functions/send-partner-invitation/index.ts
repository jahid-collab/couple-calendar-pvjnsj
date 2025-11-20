
// eslint-disable-next-line import/no-unresolved
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// eslint-disable-next-line import/no-unresolved
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Invalid authorization token:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Parse request body
    const { inviteeEmail, inviterName } = await req.json();

    if (!inviteeEmail) {
      console.error('Missing invitee email');
      return new Response(
        JSON.stringify({ error: 'Missing invitee email' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    console.log(`Processing invitation from ${user.email} to ${inviteeEmail}`);
    console.log('RESEND_API_KEY configured:', !!RESEND_API_KEY);
    if (RESEND_API_KEY) {
      console.log('RESEND_API_KEY length:', RESEND_API_KEY.length);
      console.log('RESEND_API_KEY starts with:', RESEND_API_KEY.substring(0, 7));
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabaseAdmin
      .from('partner_invitations')
      .select('*')
      .eq('inviter_id', user.id)
      .eq('invitee_email', inviteeEmail)
      .eq('status', 'pending')
      .single();

    let invitationToken: string;

    if (existingInvitation) {
      // Use existing invitation token
      invitationToken = existingInvitation.invitation_token;
      console.log('Using existing invitation token:', invitationToken);
    } else {
      // Create new invitation
      const { data: newInvitation, error: invitationError } = await supabaseAdmin
        .from('partner_invitations')
        .insert({
          inviter_id: user.id,
          invitee_email: inviteeEmail,
          status: 'pending',
        })
        .select()
        .single();

      if (invitationError || !newInvitation) {
        console.error('Error creating invitation:', invitationError);
        return new Response(
          JSON.stringify({ error: 'Failed to create invitation', details: invitationError?.message }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      invitationToken = newInvitation.invitation_token;
      console.log('Created new invitation token:', invitationToken);
    }

    // Create invitation link
    const invitationLink = `https://natively.dev/accept-invitation?token=${invitationToken}`;
    console.log('Invitation link:', invitationLink);

    // Prepare email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: bold;
            }
            .content { 
              padding: 40px 30px; 
            }
            .content p {
              margin: 0 0 16px 0;
              font-size: 16px;
              line-height: 1.6;
            }
            .button-container {
              text-align: center;
              margin: 32px 0;
            }
            .button { 
              display: inline-block; 
              background: #E91E63; 
              color: white; 
              padding: 16px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold;
              font-size: 18px;
              box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
            }
            .button:hover {
              background: #C2185B;
            }
            .link-box {
              background: #f9f9f9;
              padding: 16px;
              border-radius: 8px;
              margin: 24px 0;
              word-break: break-all;
            }
            .link-box p {
              margin: 0 0 8px 0;
              font-size: 14px;
              color: #666;
            }
            .link-box a {
              color: #E91E63;
              text-decoration: none;
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              padding: 24px 30px;
              background: #f9f9f9;
              color: #666; 
              font-size: 14px; 
            }
            .footer p {
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💕 You're Invited!</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p><strong>${inviterName || 'Someone special'}</strong> has invited you to join them on their Couple's Calendar app!</p>
              <p>This app helps couples plan their vacations, dates, trips, life events, and shared goals together. It's a beautiful way to stay connected and organized as a couple.</p>
              
              <div class="button-container">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
              </div>

              <div class="link-box">
                <p>Or copy and paste this link into your browser:</p>
                <a href="${invitationLink}">${invitationLink}</a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 24px;">
                ⏰ This invitation will expire in 7 days.
              </p>
            </div>
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend if API key is available
    let emailSent = false;
    let emailError: any = null;
    let resendResponseData: any = null;

    if (RESEND_API_KEY) {
      try {
        console.log('Attempting to send email via Resend...');
        console.log('Sending to:', inviteeEmail);
        console.log('From name:', inviterName);
        
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Couple\'s Calendar <onboarding@resend.dev>',
            to: [inviteeEmail],
            subject: `${inviterName || 'Someone special'} invited you to Couple's Calendar 💕`,
            html: emailHtml,
          }),
        });

        resendResponseData = await resendResponse.json();
        console.log('Resend API response status:', resendResponse.status);
        console.log('Resend API response:', JSON.stringify(resendResponseData));

        if (resendResponse.ok) {
          emailSent = true;
          console.log('✅ Email sent successfully via Resend!');
          console.log('Email ID:', resendResponseData.id);
        } else {
          emailError = resendResponseData;
          console.error('❌ Failed to send email via Resend');
          console.error('Error details:', JSON.stringify(resendResponseData));
        }
      } catch (error) {
        emailError = error;
        console.error('❌ Exception while sending email via Resend:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured - email will not be sent');
    }

    // If email was not sent, log the invitation details
    if (!emailSent) {
      console.log('=== INVITATION DETAILS ===');
      console.log('To:', inviteeEmail);
      console.log('From:', user.email);
      console.log('Inviter Name:', inviterName);
      console.log('Link:', invitationLink);
      console.log('Token:', invitationToken);
      if (emailError) {
        console.log('Email Error:', JSON.stringify(emailError));
      }
      console.log('Note: Share this link with your partner manually');
      console.log('========================');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent 
          ? 'Invitation sent successfully via email' 
          : 'Invitation created successfully. Share the link with your partner.',
        invitationLink,
        invitationToken,
        emailSent,
        emailError: emailError ? (typeof emailError === 'object' ? emailError : String(emailError)) : null,
        resendResponse: resendResponseData,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-partner-invitation function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
