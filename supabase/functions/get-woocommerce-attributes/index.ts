import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WooCommerceAttribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  order_by: string;
  has_archives: boolean;
}

interface WooCommerceAttributeTerm {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const attributeId = url.searchParams.get("attributeId");

    const wcConsumerKey = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
    const wcConsumerSecret = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");
    const wordpressUrl = Deno.env.get("WORDPRESS_URL");

    if (!wcConsumerKey || !wcConsumerSecret || !wordpressUrl) {
      return new Response(
        JSON.stringify({ attributes: [], message: "WooCommerce credentials not configured" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const auth = btoa(`${wcConsumerKey}:${wcConsumerSecret}`);

    if (attributeId) {
      const termsResponse = await fetch(
        `${wordpressUrl}/wp-json/wc/v3/products/attributes/${attributeId}/terms?per_page=100`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!termsResponse.ok) {
        throw new Error(`Failed to fetch attribute terms: ${termsResponse.status}`);
      }

      const terms: WooCommerceAttributeTerm[] = await termsResponse.json();

      return new Response(JSON.stringify({ terms }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const attributesResponse = await fetch(
      `${wordpressUrl}/wp-json/wc/v3/products/attributes`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!attributesResponse.ok) {
      throw new Error(`Failed to fetch attributes: ${attributesResponse.status}`);
    }

    const attributes: WooCommerceAttribute[] = await attributesResponse.json();

    const attributesWithTerms = await Promise.all(
      attributes.map(async (attribute) => {
        const termsResponse = await fetch(
          `${wordpressUrl}/wp-json/wc/v3/products/attributes/${attribute.id}/terms?per_page=100`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          }
        );

        if (!termsResponse.ok) {
          return { ...attribute, terms: [] };
        }

        const terms: WooCommerceAttributeTerm[] = await termsResponse.json();
        return { ...attribute, terms };
      })
    );

    return new Response(JSON.stringify({ attributes: attributesWithTerms }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching WooCommerce attributes:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});