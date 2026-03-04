"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/page-header";
import { TaxonForm } from "@/components/taxon-form";

export default function NewTaxonPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const createMutation = trpc.taxon.create.useMutation({
    onSuccess: () => {
      utils.taxon.list.invalidate();
      toast.success("Taxon created successfully");
      router.push("/admin/taxa");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <>
      <PageHeader title="New Taxon" />
      <div className="max-w-2xl">
        <TaxonForm
          onSubmit={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          submitLabel="Create taxon"
        />
      </div>
    </>
  );
}
