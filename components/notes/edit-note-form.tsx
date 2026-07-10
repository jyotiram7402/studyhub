"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NOTE_VISIBILITY_OPTIONS } from "@/lib/constants";
import { finalPrice, formatPrice } from "@/lib/utils";
import { updateNoteSchema } from "@/lib/validations/note";
import type { Note } from "@/lib/types";

export function EditNoteForm({ note }: { note: Note }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [price, setPrice] = useState(note.price);
  const [discount, setDiscount] = useState(note.discount_percent);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = updateNoteSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      price: formData.get("price"),
      discountPercent: formData.get("discountPercent") || 0,
      version: formData.get("version"),
      edition: formData.get("edition"),
      visibility: formData.get("visibility"),
      previewPages: formData.get("previewPages") || 0,
    });

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message])
        )
      );
      toast.error("Fix the highlighted fields and try again.");
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (!response.ok) {
      toast.error("Could not save your changes. Please try again.");
      return;
    }

    toast.success("Product updated");
    router.push("/dashboard/uploads");
    router.refresh();
  }

  const buyerPrice = finalPrice(price, discount);

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">Listing</h2>
        <div className="mt-5 space-y-4">
          <FormField label="Title" htmlFor="title" error={errors.title}>
            <Input id="title" name="title" defaultValue={note.title} required />
          </FormField>
          <FormField label="Description" htmlFor="description" error={errors.description}>
            <Textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={note.description}
              required
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Version"
              htmlFor="version"
              error={errors.version}
              hint="e.g. v2, 2026 syllabus"
            >
              <Input id="version" name="version" defaultValue={note.version ?? ""} />
            </FormField>
            <FormField
              label="Edition"
              htmlFor="edition"
              error={errors.edition}
              hint="e.g. 3rd edition, Revised"
            >
              <Input id="edition" name="edition" defaultValue={note.edition ?? ""} />
            </FormField>
          </div>
          <FormField
            label="Visibility"
            htmlFor="visibility"
            error={errors.visibility}
            hint="Private listings are hidden from search, browse, and your public profile"
          >
            <Select id="visibility" name="visibility" defaultValue={note.visibility}>
              {NOTE_VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">Pricing</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <FormField label="Price (₹)" htmlFor="price" error={errors.price} hint="0 makes it free">
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value) || 0)}
            />
          </FormField>
          <FormField label="Discount (%)" htmlFor="discountPercent" error={errors.discountPercent}>
            <Input
              id="discountPercent"
              name="discountPercent"
              type="number"
              min={0}
              max={90}
              value={discount}
              onChange={(event) => setDiscount(Number(event.target.value) || 0)}
            />
          </FormField>
          <FormField label="Preview pages" htmlFor="previewPages" error={errors.previewPages}>
            <Input
              id="previewPages"
              name="previewPages"
              type="number"
              min={0}
              max={20}
              defaultValue={note.preview_pages}
            />
          </FormField>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {price > 0
            ? `Buyers will pay ${formatPrice(buyerPrice)}${
                discount > 0 ? ` (${discount}% off ${formatPrice(price)})` : ""
              }.`
            : "This resource will be free to download."}
        </p>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
