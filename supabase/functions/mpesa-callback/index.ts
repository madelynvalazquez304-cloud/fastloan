import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));

    const stkCallback = body.Body?.stkCallback;

    if (!stkCallback) {
      console.error('Invalid callback structure');
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    console.log('Callback details:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the callback result
    const { error } = await supabase.from('mpesa_transactions').upsert({
      checkout_request_id: CheckoutRequestID,
      merchant_request_id: MerchantRequestID,
      result_code: String(ResultCode),
      result_desc: ResultDesc,
      callback_metadata: CallbackMetadata,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'checkout_request_id',
    });

    if (error) {
      console.error('Database error:', error);
    } else {
      console.log('Transaction saved successfully');
    }

    // Always respond with success to Safaricom
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
