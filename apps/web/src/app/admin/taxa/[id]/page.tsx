"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { taxonRankEnum, kingdomEnum } from "@sanctuary/types";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/page-header";
import { TaxonForm } from "@/components/taxon-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";

export default function EditTaxonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: taxon, isLoading } = trpc.taxon.getById.useQuery({ id: params.id });

  const updateMutation = trpc.taxon.update.useMutation({
    onSuccess: () => {
      utils.taxon.list.invalidate();
      utils.taxon.getById.invalidate({ id: params.id });
      toast.success("Taxon updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.taxon.delete.useMutation({
    onSuccess: () => {
      utils.taxon.list.invalidate();
      toast.success("Taxon deleted");
      router.push("/admin/taxa");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (!taxon) {
    return (
      <div>
        <PageHeader title="Taxon not found" />
        <p className="text-muted-foreground">This taxon does not exist.</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title={taxon.scientificName}>
        <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </PageHeader>

      <div className="max-w-2xl">
        <TaxonForm
          defaultValues={{
            scientificName: taxon.scientificName,
            commonNameEn: taxon.commonNameEn,
            commonNameEs: taxon.commonNameEs,
            taxonRank: taxonRankEnum.parse(taxon.taxonRank),
            kingdom: kingdomEnum.parse(taxon.kingdom),
            phylum: taxon.phylum,
            class: taxon.class,
            order: taxon.order,
            family: taxon.family,
            genus: taxon.genus,
            specificEpithet: taxon.specificEpithet,
            externalId: taxon.externalId,
            externalSource: taxon.externalSource,
            descriptionEn: taxon.descriptionEn,
            descriptionEs: taxon.descriptionEs,
            conservationStatus: taxon.conservationStatus,
            thumbnailUrl: taxon.thumbnailUrl,
          }}
          onSubmit={(values) => updateMutation.mutate({ id: params.id, data: values })}
          loading={updateMutation.isPending}
          submitLabel="Update taxon"
          externalId={taxon.externalId}
          externalSource={taxon.externalSource}
        />
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete taxon"
        description={`Are you sure you want to delete "${taxon.scientificName}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate({ id: params.id })}
        loading={deleteMutation.isPending}
      />
    </>
  );
}
