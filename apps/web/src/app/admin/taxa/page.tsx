"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { MoreHorizontal, Plus, Download, Leaf } from "lucide-react";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { INaturalistSearchDialog } from "@/components/inaturalist-search-dialog";
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
import { KINGDOMS, TAXON_RANKS } from "@sanctuary/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type TaxonRow = RouterOutputs["taxon"]["list"]["items"][number];

const PAGE_SIZE = 25;

export default function TaxaListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [kingdomFilter, setKingdomFilter] = useState<string>("");
  const [rankFilter, setRankFilter] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Reset to first page when search changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

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
            /* eslint-disable-next-line @next/next/no-img-element */
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
              <Button
                variant="ghost"
                size="icon"
                aria-label="Row actions"
                onClick={(e) => e.stopPropagation()}
              >
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
            onSearchChange={setSearch}
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
                {KINGDOMS.map((k) => (
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
                {TAXON_RANKS.map((r) => (
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
        <INaturalistSearchDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      )}
    </>
  );
}
