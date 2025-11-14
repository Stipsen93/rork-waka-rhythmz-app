import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

export const clearPasswordResetRequestProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { userId } = input;

    const { error } = await supabase
      .from("password_reset_requests")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error clearing password reset request:", error);
      throw new Error("Failed to clear password reset request");
    }

    return { success: true };
  });
