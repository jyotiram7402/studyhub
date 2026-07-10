"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaxonomyItem {
  id: string;
  name: string;
}

interface TaxonomyManagerProps {
  table: string;
  items: TaxonomyItem[];
  itemLabel: string;
}

export function TaxonomyManager({ table, items, itemLabel }: TaxonomyManagerProps) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return;

    setPending("create");
    const response = await fetch(`/api/admin/taxonomy/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setPending(null);

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(body?.error ?? `Could not add ${itemLabel}.`);
      return;
    }

    setNewName("");
    toast.success(`${itemLabel} added`);
    router.refresh();
  }

  async function renameItem(id: string) {
    if (!editingName.trim()) return;

    setPending(id);
    const response = await fetch(`/api/admin/taxonomy/${table}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editingName.trim() }),
    });
    setPending(null);

    if (!response.ok) {
      toast.error(`Could not rename ${itemLabel}.`);
      return;
    }

    setEditingId(null);
    toast.success(`${itemLabel} renamed`);
    router.refresh();
  }

  async function deleteItem(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This fails if any notes still reference it.`)) {
      return;
    }

    setPending(id);
    const response = await fetch(`/api/admin/taxonomy/${table}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPending(null);

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(body?.error ?? `Could not delete ${itemLabel}.`);
      return;
    }

    toast.success(`${itemLabel} deleted`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createItem} className="flex gap-2">
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder={`Add a new ${itemLabel.toLowerCase()}`}
          className="max-w-sm"
        />
        <Button type="submit" disabled={pending === "create" || !newName.trim()}>
          {pending === "create" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add
        </Button>
      </form>

      <ul className="divide-y rounded-xl border bg-card shadow-sm">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 p-3">
            {editingId === item.id ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  className="h-8 max-w-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => renameItem(item.id)}
                  disabled={pending === item.id}
                  aria-label="Save name"
                >
                  {pending === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                  aria-label="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm">{item.name}</span>
                <span className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Rename ${item.name}`}
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingName(item.name);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete ${item.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteItem(item.id, item.name)}
                    disabled={pending === item.id}
                  >
                    {pending === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </span>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </li>
        )}
      </ul>
    </div>
  );
}
