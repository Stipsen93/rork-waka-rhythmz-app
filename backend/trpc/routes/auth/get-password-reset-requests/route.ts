import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const getPasswordResetRequestsProcedure = publicProcedure.query(
  async () => {
    const { data, error } = await supabase
      .from("password_reset_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching password reset requests:", error);
      throw new Error("Failed to fetch password reset requests");
    }

    return data || [];
  }
);
