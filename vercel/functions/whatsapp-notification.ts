/**
 * Vercel Serverless Function: WhatsApp Notification
 * 
 * This function sends WhatsApp notifications via Twilio API
 * 
 * Environment Variables Required:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_FROM (e.g., whatsapp:+14155238886)
 * 
 * Usage:
 * POST /api/whatsapp-notification
 * Body: { orderId, phoneNumber, message }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, phoneNumber, message } = request.body;

    // Validate input
    if (!orderId || !phoneNumber || !message) {
      return response.status(400).json({
        error: 'Missing required fields: orderId, phoneNumber, message',
      });
    }

    // Get Twilio credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !fromNumber) {
      return response.status(500).json({
        error: 'Twilio credentials not configured',
      });
    }

    // Format phone number (ensure it starts with whatsapp:)
    const toNumber = phoneNumber.startsWith('whatsapp:')
      ? phoneNumber
      : `whatsapp:${phoneNumber}`;

    // Send WhatsApp message via Twilio
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          Body: message,
        }),
      }
    );

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      return response.status(500).json({
        error: 'Failed to send WhatsApp message',
        details: twilioData,
      });
    }

    // Return success
    return response.status(200).json({
      success: true,
      messageSid: twilioData.sid,
      status: twilioData.status,
    });
  } catch (error: any) {
    console.error('WhatsApp notification error:', error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

