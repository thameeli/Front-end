/**
 * Stripe Mock for Web Platform
 * Stripe React Native doesn't work on web, so we provide a mock
 */

module.exports = {
  StripeProvider: ({ children, publishableKey }) => {
    // On web, just return children without StripeProvider
    return children;
  },
  useStripe: () => {
    // Return null on web - payment button will handle this
    return null;
  },
  usePaymentSheet: () => {
    return {
      initPaymentSheet: async () => ({ error: null }),
      presentPaymentSheet: async () => ({ error: { code: 'NotSupported', message: 'Stripe not available on web' } }),
    };
  },
};

