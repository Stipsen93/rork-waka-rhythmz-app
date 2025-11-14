import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

export const requestPasswordResetProcedure = publicProcedure
  .input(
    z.object({
      username: z.string(),
      deviceLastLogin: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { username, deviceLastLogin } = input;

    const { data: users, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username.trim())
      .single();

    if (userError || !users) {
      return { success: false, message: "User not found" };
    }

    const { error } = await supabase.from("password_reset_requests").insert({
      user_id: users.id,
      requested_username: username.trim(),
      device_last_login: deviceLastLogin || null,
    });

    if (error) {
      console.error("Error creating password reset request:", error);
      return { success: false, message: "Failed to create reset request" };
    }

    return { success: true };
  });
