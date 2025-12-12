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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting automated backup...");

    // Get the first admin user to attribute the backup to
    const { data: adminUser } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    // Create backup record
    const { data: backup, error: createError } = await supabaseClient
      .from("backups")
      .insert({
        backup_type: "database",
        status: "processing",
        description: "Sauvegarde automatique quotidienne",
        created_by: adminUser?.user_id || null,
      })
      .select()
      .single();

    if (createError || !backup) {
      console.error("Error creating backup record:", createError);
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
      // Export all database tables
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
        "product_availability_notifications",
        "user_roles"
      ];

      console.log(`Backing up ${tables.length} tables...`);

      for (const table of tables) {
        try {
          const { data, error } = await supabaseClient
            .from(table)
            .select("*");

          if (!error && data) {
            backupData[table] = data;
            metadata[`${table}_count`] = data.length;
            console.log(`Backed up ${table}: ${data.length} rows`);
          } else if (error) {
            console.error(`Error backing up ${table}:`, error);
          }
        } catch (err) {
          console.error(`Exception backing up ${table}:`, err);
        }
      }

      // Add backup metadata
      backupData.backup_info = {
        backup_id: backup.id,
        backup_type: "database",
        created_at: backup.created_at,
        description: "Sauvegarde automatique quotidienne",
        automated: true,
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(backupData, null, 2);
      const fileSize = new Blob([jsonString]).size;

      console.log(`Backup size: ${fileSize} bytes`);

      // Upload to storage
      const fileName = `backup_automated_${backup.id}_${Date.now()}.json`;
      const { error: uploadError } = await supabaseClient.storage
        .from("backups")
        .upload(fileName, jsonString, {
          contentType: "application/json",
        });

      if (uploadError) {
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

      console.log(`Uploaded backup to storage: ${fileName}`);

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

      console.log("Automated backup completed successfully");

      // Clean up old automated backups (keep only last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: oldBackups } = await supabaseClient
        .from("backups")
        .select("id, file_path")
        .eq("status", "completed")
        .ilike("description", "%automatique%")
        .lt("created_at", sevenDaysAgo.toISOString());

      if (oldBackups && oldBackups.length > 0) {
        console.log(`Cleaning up ${oldBackups.length} old backups...`);
        
        for (const oldBackup of oldBackups) {
          // Delete from storage
          if (oldBackup.file_path) {
            await supabaseClient.storage
              .from("backups")
              .remove([oldBackup.file_path]);
          }
          
          // Delete from database
          await supabaseClient
            .from("backups")
            .delete()
            .eq("id", oldBackup.id);
        }
        
        console.log(`Cleaned up ${oldBackups.length} old backups`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Sauvegarde automatique créée avec succès",
          backup: {
            id: backup.id,
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
      console.error("Error during backup process:", error);
      
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
    console.error("Error in automated backup:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la sauvegarde automatique",
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