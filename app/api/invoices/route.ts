import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');

    const supabase = await createServerClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('Auth error in /api/invoices:', authError);
      return NextResponse.json({ error: 'Non authentifié', invoices: [] }, { status: 401 });
    }

    // Check user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin = roleData?.role === 'admin';

    console.log('User:', user.id, 'Is Admin:', isAdmin);

    // Use service role key for admins to bypass RLS
    let queryClient = supabase;
    if (isAdmin) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      queryClient = createClient(supabaseUrl, supabaseServiceKey);
    }

    let query = queryClient.from('order_invoices').select('*');

    if (orderId) {
      query = query.eq('woocommerce_order_id', parseInt(orderId));
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber);
    } else {
      // Return all invoices for admin, or user's own invoices
      if (!isAdmin) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return NextResponse.json({ error: 'Erreur de profil', invoices: [] }, { status: 500 });
        }

        if (profile?.email) {
          query = query.eq('customer_email', profile.email);
        } else {
          // User has no email in profile, return empty array
          return NextResponse.json({ invoices: [] });
        }
      }
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching invoices:', error);
      return NextResponse.json({ error: error.message, invoices: [] }, { status: 500 });
    }

    return NextResponse.json({ invoices: data || [] });
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
