import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');

    const supabase = await createServerClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = roleData?.role === 'admin';

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
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (profile?.email) {
          query = query.eq('customer_email', profile.email);
        }
      }
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoices: data });
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
