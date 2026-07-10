"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      fullName: formData.get("fullName"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message])
        )
      );
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", parsed.data.username)
      .maybeSingle();

    if (existing) {
      setLoading(false);
      setErrors({ username: "This username is already taken" });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username: parsed.data.username,
          full_name: parsed.data.fullName,
        },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Account created", {
      description: "Check your inbox to confirm your email, then log in.",
    });
    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField label="Full name" htmlFor="fullName" error={errors.fullName}>
        <Input
          id="fullName"
          name="fullName"
          placeholder="Priya Sharma"
          autoComplete="name"
          required
        />
      </FormField>
      <FormField
        label="Username"
        htmlFor="username"
        error={errors.username}
        hint="Lowercase letters, numbers, and underscores"
      >
        <Input
          id="username"
          name="username"
          placeholder="priya_sharma"
          autoComplete="username"
          required
        />
      </FormField>
      <FormField label="Email" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@university.edu"
          autoComplete="email"
          required
        />
      </FormField>
      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password}
        hint="At least 8 characters"
      >
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}
