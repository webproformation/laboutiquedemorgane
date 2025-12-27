import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderData {
  id: number;
  number: string;
  status: string;
  date_created: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: string;
    total: string;
    sku: string;
  }>;
  shipping_lines: Array<{
    method_title: string;
    total: string;
  }>;
  total: string;
  total_tax: string;
  shipping_total: string;
  discount_total: string;
  payment_method_title: string;
}

function generateInvoiceHTML(order: OrderData, invoiceNumber: string): string {
  const today = new Date().toLocaleDateString('fr-FR');
  const orderDate = new Date(order.date_created).toLocaleDateString('fr-FR');

  const lineItemsHTML = order.line_items.map(item => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
        ${item.name}<br>
        <small style="color: #6b7280; font-size: 9px;">SKU: ${item.sku || 'N/A'}</small>
      </td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 11px;">${item.quantity}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 11px;">${parseFloat(item.price).toFixed(2)} €</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; font-size: 11px;">${parseFloat(item.total).toFixed(2)} €</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bon de commande ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.4; background: white; font-size: 11px; }
    .container { max-width: 800px; margin: 0 auto; padding: 15px 20px; }
    .logo-header { margin-bottom: 12px; }
    .logo-header img { width: 100%; height: auto; display: block; }
    .header { background: linear-gradient(135deg, #b8933d 0%, #a07c2f 100%); color: white; padding: 15px 20px; border-radius: 6px; margin-bottom: 15px; }
    .header h1 { font-size: 20px; margin-bottom: 8px; text-align: center; }
    .header-info { display: flex; justify-content: space-between; margin-top: 10px; font-size: 10px; }
    .company-info { background: white; padding: 12px 15px; border-radius: 6px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
    .company-info h2 { color: #b8933d; font-size: 14px; margin-bottom: 8px; text-align: center; }
    .company-details { font-size: 9px; line-height: 1.5; }
    .company-details p { margin-bottom: 2px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
    .info-section { background: white; padding: 12px 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; font-size: 10px; }
    .info-section h3 { color: #b8933d; font-size: 12px; margin-bottom: 8px; border-bottom: 1px solid #b8933d; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 15px; border: 1px solid #e5e7eb; }
    thead { background: #f9fafb; }
    th { padding: 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    .totals { background: white; padding: 12px 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 15px; max-width: 350px; margin-left: auto; border: 1px solid #e5e7eb; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
    .totals-row.total { font-size: 14px; font-weight: 700; color: #b8933d; border-bottom: none; padding-top: 8px; border-top: 1px solid #b8933d; }
    .legal { background: #f9fafb; padding: 12px 15px; border-radius: 6px; font-size: 9px; color: #6b7280; margin-top: 15px; border: 1px solid #e5e7eb; line-height: 1.4; }
    .legal h3 { color: #374151; font-size: 11px; margin-bottom: 6px; }
    .footer { text-align: center; margin-top: 15px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 9px; line-height: 1.5; }
    @media print { body { background: white; } .container { padding: 10px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-header">
      <img src="https://wp.laboutiquedemorgane.com/wp-content/uploads/2025/12/Logo-BDC.png" alt="La Boutique de Morgane" />
    </div>

    <div class="header">
      <h1>BON DE COMMANDE</h1>
      <div class="header-info">
        <div>
          <strong>N° de commande:</strong> ${order.number}<br>
          <strong>N° de facture:</strong> ${invoiceNumber}
        </div>
        <div style="text-align: right;">
          <strong>Date de commande:</strong> ${orderDate}<br>
          <strong>Date d'émission:</strong> ${today}
        </div>
      </div>
    </div>

    <div class="company-info">
      <h2>LA BOUTIQUE DE MORGANE</h2>
      <div class="company-details">
        <p><strong>Adresse :</strong> 1062 rue d'Armentières<br>59850 Nieppe<br>France</p>
        <p><strong>SIRET :</strong> 907 889 802 00027</p>
        <p><strong>TVA Intra :</strong> FR16907889802</p>
        <p><strong>Téléphone :</strong> Morgane : +33 6 41 45 66 71 | André : +33 6 03 48 96 62</p>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-section">
        <h3>Facturation</h3>
        <p>
          <strong>${order.billing.first_name} ${order.billing.last_name}</strong><br>
          ${order.billing.company ? order.billing.company + '<br>' : ''}
          ${order.billing.address_1}<br>
          ${order.billing.address_2 ? order.billing.address_2 + '<br>' : ''}
          ${order.billing.postcode} ${order.billing.city}<br>
          ${order.billing.country}<br>
          <strong>Email:</strong> ${order.billing.email}<br>
          <strong>Tél:</strong> ${order.billing.phone}
        </p>
      </div>

      <div class="info-section">
        <h3>Livraison</h3>
        <p>
          <strong>${order.shipping.first_name} ${order.shipping.last_name}</strong><br>
          ${order.shipping.company ? order.shipping.company + '<br>' : ''}
          ${order.shipping.address_1}<br>
          ${order.shipping.address_2 ? order.shipping.address_2 + '<br>' : ''}
          ${order.shipping.postcode} ${order.shipping.city}<br>
          ${order.shipping.country}
        </p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Produit</th>
          <th style="text-align: center; width: 100px;">Quantité</th>
          <th style="text-align: right; width: 120px;">Prix unitaire</th>
          <th style="text-align: right; width: 120px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Sous-total:</span>
        <span>${(parseFloat(order.total) - parseFloat(order.shipping_total || '0') - parseFloat(order.total_tax || '0')).toFixed(2)} €</span>
      </div>
      ${order.discount_total && parseFloat(order.discount_total) > 0 ? `
      <div class="totals-row">
        <span>Réduction:</span>
        <span>-${parseFloat(order.discount_total).toFixed(2)} €</span>
      </div>
      ` : ''}
      ${order.shipping_total && parseFloat(order.shipping_total) > 0 ? `
      <div class="totals-row">
        <span>Frais de port:</span>
        <span>${parseFloat(order.shipping_total).toFixed(2)} €</span>
      </div>
      ` : ''}
      ${order.total_tax && parseFloat(order.total_tax) > 0 ? `
      <div class="totals-row">
        <span>TVA:</span>
        <span>${parseFloat(order.total_tax).toFixed(2)} €</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>TOTAL TTC:</span>
        <span>${parseFloat(order.total).toFixed(2)} €</span>
      </div>
    </div>

    <div class="info-section">
      <h3>Mode de paiement</h3>
      <p>${order.payment_method_title}</p>
    </div>

    <div class="legal">
      <h3>Mentions légales</h3>
      <p>
        <strong>Conditions de vente:</strong> Conformément à nos conditions générales de vente disponibles sur www.laboutiquedemorgane.com<br>
        <strong>Droit de rétractation:</strong> Vous disposez d'un délai de 14 jours pour exercer votre droit de rétractation.<br>
        <strong>Garanties:</strong> Tous nos produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés.<br>
        <strong>Protection des données:</strong> Vos données personnelles sont traitées conformément à notre politique de confidentialité et au RGPD.<br>
        <strong>Règlement des litiges:</strong> En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. Médiation de la consommation disponible.
      </p>
    </div>

    <div class="footer">
      <p><strong>LA BOUTIQUE DE MORGANE</strong> - Votre dose de style et de joie</p>
      <p>www.laboutiquedemorgane.com | contact@laboutiquedemorgane.com</p>
      <p>SIREN : 907 889 802 | SIRET : 907 889 802 00027 | TVA : FR16907889802</p>
      <p>Activité (NAF/APE) : Commerce de gros (commerce interentreprises) de textiles - 4641Z</p>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, orderData } = await req.json();

    if (!orderId || !orderData) {
      return new Response(
        JSON.stringify({ error: 'Order ID and data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabaseClient
      .from('order_invoices')
      .select('*')
      .eq('woocommerce_order_id', orderId)
      .single();

    if (existingInvoice) {
      return new Response(
        JSON.stringify({ 
          success: true,
          invoice: existingInvoice,
          message: 'Invoice already exists'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate invoice number
    const { data: invoiceNumberData, error: invoiceNumberError } = await supabaseClient
      .rpc('generate_invoice_number');

    if (invoiceNumberError) {
      throw new Error(`Failed to generate invoice number: ${invoiceNumberError.message}`);
    }

    const invoiceNumber = invoiceNumberData as string;

    // Generate HTML
    const html = generateInvoiceHTML(orderData, invoiceNumber);

    // Convert HTML to PDF using a simple approach (store HTML, convert client-side)
    // For production, you'd want to use a proper PDF generation service
    const pdfData = {
      html,
      invoiceNumber,
      orderId
    };

    // Store in Supabase Storage
    const fileName = `invoices/${invoiceNumber}.json`;
    const { error: uploadError } = await supabaseClient.storage
      .from('order-documents')
      .upload(fileName, JSON.stringify(pdfData), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload invoice: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('order-documents')
      .getPublicUrl(fileName);

    // Save invoice record
    const { data: invoice, error: insertError } = await supabaseClient
      .from('order_invoices')
      .insert({
        order_number: orderData.number,
        woocommerce_order_id: orderId,
        pdf_url: urlData.publicUrl,
        invoice_number: invoiceNumber,
        customer_email: orderData.billing.email,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save invoice record: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        invoice,
        html
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
