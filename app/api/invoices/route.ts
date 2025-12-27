import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ error: 'Configuration serveur manquante', invoices: [] }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const authHeader = request.headers.get('authorization');
    const cookies = request.headers.get('cookie');

    console.log('API /invoices - Request info:', {
      hasAuthHeader: !!authHeader,
      hasCookies: !!cookies,
      orderId,
      orderNumber
    });

    let userId: string | null = null;
    let isAdmin = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);

      if (user && !tokenError) {
        userId = user.id;
      }
    }

    if (cookies) {
      const accessTokenMatch = cookies.match(/sb-[^-]+-auth-token=([^;]+)/);
      if (accessTokenMatch) {
        try {
          const tokenData = JSON.parse(decodeURIComponent(accessTokenMatch[1]));
          const accessToken = tokenData?.[0];

          if (accessToken) {
            const { data: { user }, error: cookieError } = await supabase.auth.getUser(accessToken);

            if (user && !cookieError) {
              userId = user.id;
            }
          }
        } catch (e) {
          console.error('Error parsing cookie token:', e);
        }
      }
    }

    if (userId) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      isAdmin = roleData?.role === 'admin';
    }

    console.log('User ID:', userId, 'Is Admin:', isAdmin);

    let query = supabase.from('order_invoices').select('*');

    if (orderId) {
      query = query.eq('woocommerce_order_id', parseInt(orderId));
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber);
    } else {
      if (!isAdmin) {
        if (!userId) {
          return NextResponse.json({ error: 'Non authentifié', invoices: [] }, { status: 401 });
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.email) {
          query = query.eq('customer_email', profile.email);
        } else {
          return NextResponse.json({ invoices: [] });
        }
      }
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching invoices:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({
        error: `Erreur de base de données: ${error.message}`,
        details: error.details,
        code: error.code,
        invoices: []
      }, { status: 500 });
    }

    console.log('Successfully fetched invoices:', data?.length || 0);
    return NextResponse.json({ invoices: data || [] });
  } catch (error: any) {
    console.error('API route error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      error: `Erreur serveur: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      invoices: []
    }, { status: 500 });
  }
}
