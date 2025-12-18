import { NextResponse } from 'next/server';

const WORDPRESS_URL = process.env.WORDPRESS_URL;
const WC_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

const getAuthHeader = () => {
  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
};

export async function GET() {
  try {
    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'Configuration WooCommerce manquante' },
        { status: 500 }
      );
    }

    const [shippingResponse, paymentResponse, taxResponse] = await Promise.all([
      fetch(`${WORDPRESS_URL}/wp-json/wc/v3/shipping/zones`, {
        headers: { 'Authorization': getAuthHeader() },
      }),
      fetch(`${WORDPRESS_URL}/wp-json/wc/v3/payment_gateways`, {
        headers: { 'Authorization': getAuthHeader() },
      }),
      fetch(`${WORDPRESS_URL}/wp-json/wc/v3/taxes`, {
        headers: { 'Authorization': getAuthHeader() },
      }),
    ]);

    const shippingZones = shippingResponse.ok ? await shippingResponse.json() : [];
    const paymentGateways = paymentResponse.ok ? await paymentResponse.json() : [];
    const taxRates = taxResponse.ok ? await taxResponse.json() : [];

    const shippingMethods: any[] = [];
    for (const zone of shippingZones) {
      const methodsResponse = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/shipping/zones/${zone.id}/methods`,
        {
          headers: { 'Authorization': getAuthHeader() },
        }
      );

      if (methodsResponse.ok) {
        const methods = await methodsResponse.json();
        methods.forEach((method: any) => {
          if (method.enabled) {
            let cost = method.settings?.cost?.value || '0';

            // Force Mondial Relay shipping cost to 3.80€
            const isMondialRelay =
              method.title?.toLowerCase().includes('mondial relay') ||
              method.title?.toLowerCase().includes('relais') ||
              method.title?.toLowerCase().includes('locker') ||
              method.method_description?.toLowerCase().includes('mondial relay') ||
              method.method_description?.toLowerCase().includes('relais') ||
              method.method_description?.toLowerCase().includes('locker');

            if (isMondialRelay && (parseFloat(cost) === 0 || !cost)) {
              cost = '3.80';
            }

            shippingMethods.push({
              id: `${zone.id}_${method.instance_id}`,
              zone_id: zone.id,
              zone_name: zone.name,
              instance_id: method.instance_id,
              method_id: method.method_id,
              title: method.title || method.method_title,
              cost: cost,
              description: method.method_description || '',
            });
          }
        });
      }
    }

    const activePaymentGateways = paymentGateways.filter((gateway: any) => gateway.enabled);

    return NextResponse.json({
      shippingMethods,
      paymentGateways: activePaymentGateways,
      taxRates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
