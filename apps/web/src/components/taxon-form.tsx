"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { KINGDOMS, TAXON_RANKS } from "@sanctuary/types";

const taxonFormSchema = z.object({
  scientificName: z.string().min(1),
  commonNameEn: z.string().nullable(),
  commonNameEs: z.string().nullable(),
  taxonRank: z.enum(TAXON_RANKS),
  kingdom: z.string().min(1),
  phylum: z.string().nullable(),
  class: z.string().nullable(),
  order: z.string().nullable(),
  family: z.string().nullable(),
  genus: z.string().nullable(),
  specificEpithet: z.string().nullable(),
  externalId: z.string().nullable(),
  externalSource: z.string().nullable(),
  descriptionEn: z.string().nullable(),
  descriptionEs: z.string().nullable(),
  conservationStatus: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
});

type TaxonFormValues = z.infer<typeof taxonFormSchema>;

interface TaxonFormProps {
  defaultValues?: Partial<TaxonFormValues>;
  onSubmit: (values: TaxonFormValues) => void;
  loading?: boolean;
  submitLabel?: string;
  externalId?: string | null;
  externalSource?: string | null;
}

export function TaxonForm({
  defaultValues,
  onSubmit,
  loading = false,
  submitLabel = "Save",
  externalId,
  externalSource,
}: TaxonFormProps) {
  const [showTaxonomyDetails, setShowTaxonomyDetails] = useState(false);

  const form = useForm<TaxonFormValues>({
    // Type instantiation too deep with nullable fields — known @hookform/resolvers + zod issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(taxonFormSchema as any) as any,
    defaultValues: {
      scientificName: "",
      commonNameEn: null,
      commonNameEs: null,
      taxonRank: "species",
      kingdom: "Animalia",
      phylum: null,
      class: null,
      order: null,
      family: null,
      genus: null,
      specificEpithet: null,
      externalId: null,
      externalSource: null,
      descriptionEn: null,
      descriptionEs: null,
      conservationStatus: null,
      thumbnailUrl: null,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="scientificName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scientific Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Quercus robur" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="commonNameEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Common Name (EN)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder="English oak"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="commonNameEs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Common Name (ES)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder="Roble común"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kingdom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kingdom *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select kingdom" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KINGDOMS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="taxonRank"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rank *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TAXON_RANKS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="conservationStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conservation Status</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder="LC, EN, VU..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="thumbnailUrl"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Thumbnail URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder="https://..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (EN)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descriptionEs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (ES)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTaxonomyDetails(!showTaxonomyDetails)}
          >
            {showTaxonomyDetails ? "Hide" : "Show"} taxonomy details
          </Button>
          {showTaxonomyDetails && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {(["phylum", "class", "order", "family", "genus", "specificEpithet"] as const).map(
                (fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="capitalize">
                          {fieldName === "specificEpithet" ? "Specific Epithet" : fieldName}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ),
              )}
            </div>
          )}
        </div>

        {externalId && externalSource && (
          <>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium">External ID</p>
                <p className="text-sm text-muted-foreground">{externalId}</p>
              </div>
              <div>
                <p className="text-sm font-medium">External Source</p>
                <p className="text-sm text-muted-foreground">{externalSource}</p>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
