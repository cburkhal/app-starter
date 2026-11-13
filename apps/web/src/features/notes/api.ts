// Data hooks for the notes feature. Pattern: one file per feature, query keys namespaced by feature.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";

const keys = { all: ["notes"] as const, stats: ["notes", "stats"] as const };

export const useNotes = () =>
  useQuery({ queryKey: keys.all, queryFn: () => unwrap(api.GET("/api/notes")) });

export const useNoteStats = () =>
  useQuery({ queryKey: keys.stats, queryFn: () => unwrap(api.GET("/api/notes/stats")) });

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; body?: string }) =>
      unwrap(api.POST("/api/notes", { body: { body: "", ...body } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { response } = await api.DELETE("/api/notes/{id}", { params: { path: { id } } });
      if (!response.ok) throw new Error(`delete failed: ${response.status}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
