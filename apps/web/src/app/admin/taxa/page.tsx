"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { MoreHorizontal, Plus, Download, Leaf } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaxonRow {
  id: string;
  scientificName: string;
  commonNameEn: string | null;
  taxonRank: string;
  kingdom: string;
  externalSource: string | null;
  thumbnailUrl: string | null;
}

const PAGE_SIZE = 25;

const kingdoms = ["Animalia", "Plantae", "Fungi", "Chromista", "Protozoa", "Bacteria", "Archaea"];
const ranks = [
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
  "subspecies",
  "variety",
];

export default function TaxaListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kingdomFilter, setKingdomFilter] = useState<string>("");
  const [rankFilter, setRankFilter] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  const { data, isLoading } = trpc.taxon.list.useQuery({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    search: debouncedSearch || undefined,
    kingdom: kingdomFilter || undefined,
    rank: rankFilter || undefined,
  });

  const columns = useMemo<ColumnDef<TaxonRow, unknown>[]>(
    () => [
      {
        accessorKey: "thumbnailUrl",
        header: "",
        size: 50,
        cell: ({ row }) => {
          const url = row.original.thumbnailUrl;
          return url ? (
            <img src={url} alt="" className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        },
      },
      {
        accessorKey: "scientificName",
        header: "Scientific Name",
        cell: ({ row }) => (
          <span className="font-medium italic">{row.original.scientificName}</span>
        ),
      },
      {
        accessorKey: "commonNameEn",
        header: "Common Name",
        cell: ({ row }) => row.original.commonNameEn ?? "—",
      },
      {
        accessorKey: "kingdom",
        header: "Kingdom",
        cell: ({ row }) => <Badge variant="outline">{row.original.kingdom}</Badge>,
      },
      {
        accessorKey: "taxonRank",
        header: "Rank",
        cell: ({ row }) => <Badge variant="secondary">{row.original.taxonRank}</Badge>,
      },
      {
        accessorKey: "externalSource",
        header: "Source",
        cell: ({ row }) => (
          <Badge variant={row.original.externalSource === "inaturalist" ? "default" : "outline"}>
            {row.original.externalSource ?? "manual"}
          </Badge>
        ),
      },
      {
        id: "actions",
        size: 50,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/admin/taxa/${row.original.id}`)}>
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / pagination.pageSize) : -1,
    state: { pagination },
    onPaginationChange: setPagination,
  });

  const isEmpty =
    !isLoading && data?.total === 0 && !debouncedSearch && !kingdomFilter && !rankFilter;

  return (
    <>
      <PageHeader title="Taxa">
        <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
          <Download className="mr-2 h-4 w-4" />
          Import from iNaturalist
        </Button>
        <Button onClick={() => router.push("/admin/taxa/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New taxon
        </Button>
      </PageHeader>

      {isEmpty ? (
        <EmptyState
          icon={Leaf}
          title="No taxa yet"
          description="Get started by creating a taxon manually or importing from iNaturalist."
          actionLabel="Import from iNaturalist"
          onAction={() => setImportDialogOpen(true)}
        />
      ) : (
        <>
          <DataTableToolbar
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by name..."
          >
            <Select
              value={kingdomFilter}
              onValueChange={(v) => {
                setKingdomFilter(v === "all" ? "" : v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Kingdom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All kingdoms</SelectItem>
                {kingdoms.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={rankFilter}
              onValueChange={(v) => {
                setRankFilter(v === "all" ? "" : v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Rank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ranks</SelectItem>
                {ranks.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DataTableToolbar>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <DataTable
                table={table}
                columns={columns}
                onRowClick={(row) => router.push(`/admin/taxa/${row.id}`)}
              />
              {(data?.total ?? 0) > 0 && (
                <DataTablePagination table={table} totalRows={data?.total} />
              )}
            </>
          )}
        </>
      )}

      {importDialogOpen && (
        <INaturalistSearchDialogLazy open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      )}
    </>
  );
}

// Lazy placeholder — will be implemented in Step 10
function INaturalistSearchDialogLazy({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Placeholder until the real dialog is built
  return (
    <div>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => onOpenChange(false)}
        >
          <div className="rounded-lg bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <p>iNaturalist import dialog coming soon...</p>
            <Button className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
