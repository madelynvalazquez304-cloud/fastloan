import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryRequest {
  checkoutRequestId: string;
}

const getAccessToken = async (): Promise<string> => {
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured');
  }

  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  
  const response = await fetch(
    'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get M-Pesa access token');
  }

  const data = await response.json();
  return data.access_token;
};

const generatePassword = (shortcode: string, passkey: string, timestamp: string): string => {
  const str = shortcode + passkey + timestamp;
  return btoa(str);
};

const getTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: QueryRequest = await req.json();
    const { checkoutRequestId } = body;

    console.log('Query status for:', checkoutRequestId);

    if (!checkoutRequestId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing checkoutRequestId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, check if we have a callback result in the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: transaction, error: dbError } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .maybeSingle();

    if (transaction && transaction.result_code !== null) {
      console.log('Found transaction in DB:', transaction);
      return new Response(
        JSON.stringify({
          success: true,
          status: transaction.result_code === '0' ? 'completed' : 'failed',
          resultCode: transaction.result_code,
          resultDesc: transaction.result_desc,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If not in DB, query M-Pesa directly
    const shortcode = Deno.env.get('MPESA_BUSINESS_SHORTCODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');

    if (!shortcode || !passkey) {
      return new Response(
        JSON.stringify({ success: false, message: 'M-Pesa not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);

    const queryPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    console.log('Querying M-Pesa API...');

    const queryResponse = await fetch(
      'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryPayload),
      }
    );

    const queryData = await queryResponse.json();
    console.log('Query response:', JSON.stringify(queryData, null, 2));

    // Check if transaction is still pending
    if (queryData.ResponseCode === '0' && queryData.ResultCode === undefined) {
      return new Response(
        JSON.stringify({ success: true, status: 'pending' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: queryData.ResultCode === '0' ? 'completed' : 'failed',
        resultCode: queryData.ResultCode,
        resultDesc: queryData.ResultDesc,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Query status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, status: 'pending', message: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
