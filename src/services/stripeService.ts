/**
 * Stripe Payment Service
 * Handles payment intent creation and payment processing
 */

import { ENV } from '../config/env';

// Vercel API URL - should be set in environment variables
// For development, you can use ngrok or Vercel dev server
// For production, use your deployed Vercel app URL
const VERCEL_API_URL = process.env.EXPO_PUBLIC_VERCEL_API_URL || 
  (__DEV__ ? 'http://localhost:3000' : 'https://your-vercel-app.vercel.app');

export interface CreatePaymentIntentParams {
  orderId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export const stripeService = {
  /**
   * Create a payment intent via Vercel function
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${VERCEL_API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: params.orderId,
          amount: params.amount,
          currency: params.currency || 'eur',
          metadata: params.metadata || {},
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
      };
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      throw new Error(error.message || 'Failed to create payment intent');
    }
  },
};

