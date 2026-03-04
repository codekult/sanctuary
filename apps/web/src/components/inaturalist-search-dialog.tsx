"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Leaf, Loader2, Search } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface INaturalistSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function INaturalistSearchDialog({ open, onOpenChange }: INaturalistSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [importingId, setImportingId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: results, isLoading } = trpc.taxon.searchExternal.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
  );

  const importMutation = trpc.taxon.importFromExternal.useMutation({
    onSuccess: () => {
      utils.taxon.list.invalidate();
      toast.success("Taxon imported successfully");
      onOpenChange(false);
      setSearchQuery("");
      setDebouncedQuery("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setImportingId(null);
    },
  });

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedQuery(value), 300);
  }, []);

  function handleImport(externalId: string) {
    setImportingId(externalId);
    importMutation.mutate({ externalId });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from iNaturalist</DialogTitle>
          <DialogDescription>Search for a species to import into Sanctuary.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search species..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && debouncedQuery && results?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No results found for &quot;{debouncedQuery}&quot;
            </p>
          )}

          {!isLoading && !debouncedQuery && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Start typing to search iNaturalist
            </p>
          )}

          {results?.map((result) => (
            <div key={result.externalId} className="flex items-center gap-3 rounded-md border p-3">
              {result.thumbnailUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={result.thumbnailUrl} alt="" className="h-12 w-12 rounded object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                  <Leaf className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium italic">{result.scientificName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {result.commonNameEn ?? "No common name"}
                </p>
                <div className="mt-1 flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {result.taxonRank}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {result.kingdom}
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleImport(result.externalId!)}
                disabled={importingId === result.externalId}
              >
                {importingId === result.externalId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Import"
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
