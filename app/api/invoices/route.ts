import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');

    const supabase = await createServerClient();

    let query = supabase.from('order_invoices').select('*');

    if (orderId) {
      query = query.eq('woocommerce_order_id', parseInt(orderId));
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber);
    } else {
      // Return all invoices for current user (admin can see all)
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
