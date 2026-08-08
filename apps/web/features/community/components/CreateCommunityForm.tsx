"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { createCommunity } from "../api/communityClient";
import {
  createCommunitySchema,
  type CreateCommunityFormValues,
} from "../validation/createCommunitySchema";

type Outcome = { status: "idle" } | { status: "error"; message: string };

export function CreateCommunityForm() {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateCommunityFormValues>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: { name: "", slug: "", description: "" },
  });

  const nameValue = watch("name");

  function autoSlug() {
    const slug = nameValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("slug", slug, { shouldValidate: true });
  }

  async function onSubmit(values: CreateCommunityFormValues) {
    setOutcome({ status: "idle" });
    const result = await createCommunity(values);
    if (result.ok) {
      toast.success("Community created!");
      router.push(`/communities/${result.data.slug}`);
    } else {
      setOutcome({ status: "error", message: getErrorMessage(result.error) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="community-name">Community Name</Label>
        <Input
          id="community-name"
          {...register("name")}
          onBlur={autoSlug}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="community-slug">URL Slug</Label>
        <Input id="community-slug" {...register("slug")} />
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="community-description">Description (optional)</Label>
        <Textarea id="community-description" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {outcome.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {outcome.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create Community"}
      </Button>
    </form>
  );
}
