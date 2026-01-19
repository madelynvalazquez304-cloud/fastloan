import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
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
    const errorText = await response.text();
    console.error('OAuth error:', errorText);
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
    const body: STKPushRequest = await req.json();
    const { phoneNumber, amount, accountReference, transactionDesc } = body;

    console.log('STK Push request:', { phoneNumber, amount, accountReference });

    // Validate inputs
    if (!phoneNumber || !amount || !accountReference) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get environment variables
    const shortcode = Deno.env.get('MPESA_BUSINESS_SHORTCODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');

    if (!shortcode || !passkey) {
      console.error('Missing M-Pesa configuration');
      return new Response(
        JSON.stringify({ success: false, message: 'M-Pesa not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get access token
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);

    // Dynamically get callback URL from request origin
    const origin = req.headers.get('origin') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-callback`;

    console.log('Callback URL:', callbackUrl);

    // Make STK Push request
    // Force a clear, consistent AccountReference and TransactionDesc so the phone shows "Processing fee"
    const stkPushPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: 'Processing fee',
      TransactionDesc: 'Processing fee',
    };

    console.log('STK Push payload:', JSON.stringify(stkPushPayload, null, 2));

    const stkResponse = await fetch(
      'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stkPushPayload),
      }
    );

    const stkData = await stkResponse.json();
    console.log('STK Push response:', JSON.stringify(stkData, null, 2));

    if (stkData.ResponseCode === '0') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK Push sent successfully',
          checkoutRequestId: stkData.CheckoutRequestID,
          merchantRequestId: stkData.MerchantRequestID,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed',
          responseCode: stkData.ResponseCode,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('STK Push error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
