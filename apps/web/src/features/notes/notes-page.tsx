import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateNote, useDeleteNote, useNotes } from "./api";
import { NotesChart } from "./notes-chart";

// Example feature: delete the `notes` folder (and the API route) when starting a real app.
export function NotesPage() {
  const { data: notes = [], isLoading } = useNotes();
  const create = useCreateNote();
  const remove = useDeleteNote();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = String(new FormData(form).get("title")).trim();
    if (!title) return;
    create.mutate({ title }, { onSuccess: () => form.reset() });
  }

  return (
    <div className="grid gap-6">
      <NotesChart />
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input name="title" placeholder="New note" aria-label="New note" maxLength={200} />
            <Button type="submit" disabled={create.isPending}>
              Add
            </Button>
          </form>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notes yet.</p>
          ) : (
            <ul className="divide-y">
              {notes.map((n) => (
                <li key={n.id} className="flex items-center justify-between py-2">
                  <span>{n.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${n.title}`}
                    onClick={() => remove.mutate(n.id)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
