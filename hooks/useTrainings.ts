import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import type { Training } from "@/providers/AppState";

const TRAININGS_QUERY_KEY = ["trainings"] as const;

type TrainingRow = Database["public"]["Tables"]["trainings"]["Row"];
type TrainingInsert = Database["public"]["Tables"]["trainings"]["Insert"];
type TrainingUpdate = Database["public"]["Tables"]["trainings"]["Update"];

const trainingsTable = () => supabase.from("trainings") as any;

type TrainingDraft = {
  id?: string;
  name: string;
  dayOfWeek: number;
  time: string;
  location: string;
  isOneTime?: boolean;
  repeatMode?: Training["repeatMode"];
  customDate?: string;
};

const mapTrainingRow = (row: TrainingRow): Training => ({
  id: row.training_id ?? row.id,
  name: row.name,
  dayOfWeek: row.day_of_week,
  time: row.time,
  location: row.location,
  isOneTime: row.is_one_time ?? undefined,
  repeatMode: (row.repeat_mode as Training["repeatMode"]) ?? "none",
  customDate: row.custom_date ?? undefined,
});

const generateTrainingId = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  return `tr_${random}`;
};

const fetchTrainings = async (): Promise<Training[]> => {
  const { data, error } = await trainingsTable()
    .select("*")
    .is("deleted_at", null)
    .order("day_of_week", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error("❌ [useTrainings] Fetch error", error);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as TrainingRow[];
  return rows.map(mapTrainingRow);
};

export function useTrainings() {
  const queryClient = useQueryClient();

  const trainingsQuery = useQuery({
    queryKey: TRAININGS_QUERY_KEY,
    queryFn: fetchTrainings,
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: TRAININGS_QUERY_KEY });

  const addTrainingMutation = useMutation({
    mutationFn: async (draft: TrainingDraft) => {
      const trainingId = draft.id ?? generateTrainingId();
      const payload: TrainingInsert = {
        id: trainingId,
        training_id: trainingId,
        name: draft.name,
        day_of_week: draft.dayOfWeek,
        time: draft.time,
        location: draft.location,
        is_one_time: draft.isOneTime ?? false,
        repeat_mode: draft.repeatMode ?? "none",
        custom_date: draft.customDate ?? null,
      };

      const { data, error } = await trainingsTable()
        .insert(payload as TrainingInsert)
        .select("*")
        .single();

      if (error) {
        console.error("❌ [useTrainings] Insert error", error);
        throw new Error(error.message);
      }

      return mapTrainingRow(data);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const updateTrainingMutation = useMutation({
    mutationFn: async (draft: TrainingDraft & { id: string }) => {
      const payload: TrainingUpdate = {
        name: draft.name,
        day_of_week: draft.dayOfWeek,
        time: draft.time,
        location: draft.location,
        is_one_time: draft.isOneTime ?? false,
        repeat_mode: draft.repeatMode ?? "none",
        custom_date: draft.customDate ?? null,
      };

      const { data, error } = await trainingsTable()
        .update(payload as TrainingUpdate)
        .eq("training_id", draft.id)
        .select("*")
        .single();

      if (error) {
        console.error("❌ [useTrainings] Update error", error);
        throw new Error(error.message);
      }

      return mapTrainingRow(data);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const deleteTrainingMutation = useMutation({
    mutationFn: async (trainingId: string) => {
      const { error } = await trainingsTable()
        .update({ deleted_at: new Date().toISOString() } as Pick<TrainingUpdate, "deleted_at">)
        .eq("training_id", trainingId);

      if (error) {
        console.error("❌ [useTrainings] Delete error", error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      invalidate();
    },
  });

  return {
    trainings: trainingsQuery.data ?? [],
    isLoading: trainingsQuery.isLoading,
    isError: trainingsQuery.isError,
    refetch: trainingsQuery.refetch,
    addTraining: addTrainingMutation.mutateAsync,
    addStatus: addTrainingMutation.status,
    updateTraining: updateTrainingMutation.mutateAsync,
    updateStatus: updateTrainingMutation.status,
    deleteTraining: deleteTrainingMutation.mutateAsync,
    deleteStatus: deleteTrainingMutation.status,
  };
}
