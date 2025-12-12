import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { backupType, description, wpUrl, wpUsername, wpPassword } = await req.json();

    if (!backupType || !['database', 'media', 'full'].includes(backupType)) {
      return new Response(
        JSON.stringify({ error: "Type de sauvegarde invalide" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if user is admin
    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userRole || userRole.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Accès refusé - admin requis" }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create backup record
    const { data: backup, error: createError } = await supabaseClient
      .from("backups")
      .insert({
        backup_type: backupType,
        status: "processing",
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError || !backup) {
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de la sauvegarde" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let backupData: any = {};
    let metadata: any = {};

    try {
      // Export database tables
      if (backupType === "database" || backupType === "full") {
        const tables = [
          "user_profiles",
          "addresses",
          "orders",
          "order_items",
          "delivery_batches",
          "wishlist",
          "loyalty_points",
          "loyalty_rewards",
          "user_rewards",
          "coupons",
          "user_coupons",
          "home_slides",
          "scratch_game_settings",
          "pending_prizes",
          "newsletter_subscriptions",
          "featured_products",
          "product_availability_notifications"
        ];

        for (const table of tables) {
          const { data, error } = await supabaseClient
            .from(table)
            .select("*");

          if (!error && data) {
            backupData[table] = data;
            metadata[`${table}_count`] = data.length;
          }
        }
      }

      // Export WordPress media list
      if ((backupType === "media" || backupType === "full") && wpUrl && wpUsername && wpPassword) {
        const authString = `${wpUsername}:${wpPassword}`;
        const encodedAuth = btoa(authString);

        const mediaResponse = await fetch(
          `${wpUrl}/wp-json/wp/v2/media?per_page=100`,
          {
            headers: {
              "Authorization": `Basic ${encodedAuth}`,
            },
          }
        );

        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          backupData.wordpress_media = mediaData;
          metadata.media_count = mediaData.length;
        }
      }

      // Add backup metadata
      backupData.backup_info = {
        backup_id: backup.id,
        backup_type: backupType,
        created_at: backup.created_at,
        created_by: user.id,
        description: description,
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(backupData, null, 2);
      const fileSize = new Blob([jsonString]).size;

      // Upload to storage
      const fileName = `backup_${backupType}_${backup.id}_${Date.now()}.json`;
      const { error: uploadError } = await supabaseClient.storage
        .from("backups")
        .upload(fileName, jsonString, {
          contentType: "application/json",
        });

      if (uploadError) {
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

      // Update backup record
      const { error: updateError } = await supabaseClient
        .from("backups")
        .update({
          status: "completed",
          file_path: fileName,
          file_size: fileSize,
          completed_at: new Date().toISOString(),
          metadata: metadata,
        })
        .eq("id", backup.id);

      if (updateError) {
        throw new Error(`Erreur de mise à jour: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          backup: {
            ...backup,
            status: "completed",
            file_path: fileName,
            file_size: fileSize,
            metadata: metadata,
          },
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      // Update backup record as failed
      await supabaseClient
        .from("backups")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", backup.id);

      throw error;
    }
  } catch (error) {
    console.error("Error creating backup:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la création de la sauvegarde",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
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