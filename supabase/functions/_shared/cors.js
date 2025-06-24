// _shared/cors.js
// This file defines CORS headers to be used across your Supabase Edge Functions.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // IMPORTANT: For production, change this to your React Native app's origin (e.g., 'https://your-app-domain.com')
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
