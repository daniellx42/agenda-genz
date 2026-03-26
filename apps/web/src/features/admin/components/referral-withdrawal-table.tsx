"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  listReferralWithdrawalsAction,
  updateReferralWithdrawalStatusAction,
  type ReferralPixKeyType,
  type ReferralWithdrawalListItem,
  type ReferralWithdrawalListResponse,
  type ReferralWithdrawalStatus,
} from "@/app/admin/referral-withdrawal/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const ALL_STATUSES = "ALL";

const statusOptions = [
  { value: ALL_STATUSES, label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "PAID", label: "Pagos" },
  { value: "REJECTED", label: "Rejeitados" },
  { value: "CANCELLED", label: "Cancelados" },
] as const;

const rowStatusOptions: ReadonlyArray<{
  value: ReferralWithdrawalStatus;
  label: string;
}> = [
  { value: "PENDING", label: "Pendentes" },
  { value: "PAID", label: "Pagos" },
  { value: "REJECTED", label: "Rejeitados" },
  { value: "CANCELLED", label: "Cancelados" },
];

function formatCurrency(valueInCents: number) {
  return (valueInCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function formatStatusLabel(status: ReferralWithdrawalStatus) {
  switch (status) {
    case "PAID":
      return "Pago";
    case "REJECTED":
      return "Rejeitado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Pendente";
  }
}

function formatPixTypeLabel(pixKeyType: ReferralPixKeyType) {
  switch (pixKeyType) {
    case "PHONE":
      return "Telefone";
    case "EMAIL":
      return "E-mail";
    case "RANDOM":
      return "Aleatória";
    default:
      return "CPF";
  }
}

function getStatusBadgeClassName(status: ReferralWithdrawalStatus) {
  switch (status) {
    case "PAID":
      return "";
    case "REJECTED":
      return "border-red-500/30 bg-red-500/10 text-red-600";
    case "CANCELLED":
      return "border-slate-500/30 bg-slate-500/10 text-slate-600";
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-600";
  }
}

function buildVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages] as const;
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

function CopyPixButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Chave Pix copiada!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar a chave Pix.");
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="shrink-0"
      onClick={handleCopy}
      title="Copiar chave Pix"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

export default function ReferralWithdrawalTable() {
  const [result, setResult] = useState<ReferralWithdrawalListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]["value"]>(ALL_STATUSES);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number, nextStatus: (typeof statusOptions)[number]["value"]) => {
      setIsLoading(true);

      const response = await listReferralWithdrawalsAction({
        page: nextPage,
        pageSize: PAGE_SIZE,
        status: nextStatus === ALL_STATUSES ? undefined : nextStatus,
      });

      if (!response.ok) {
        toast.error(response.message);
        setIsLoading(false);
        return;
      }

      setResult(response.data);
      setStatusFilter(nextStatus);
      setIsLoading(false);
    },
    [],
  );

  useEffect(() => {
    void load(1, ALL_STATUSES);
  }, [load]);

  const items = result?.items ?? [];
  const page = result?.page ?? 1;
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;
  const visiblePages = useMemo(
    () => buildVisiblePages(page, totalPages),
    [page, totalPages],
  );

  async function handleStatusChange(
    item: ReferralWithdrawalListItem,
    nextStatus: ReferralWithdrawalStatus,
  ) {
    if (item.status === nextStatus) {
      return;
    }

    setUpdatingId(item.id);
    const response = await updateReferralWithdrawalStatusAction({
      id: item.id,
      status: nextStatus,
    });
    setUpdatingId(null);

    if (!response.ok) {
      toast.error(response.message);
      return;
    }

    toast.success(`Status alterado para ${formatStatusLabel(nextStatus).toLowerCase()}.`);
    await load(page, statusFilter);
  }

  function handleFilterChange(nextValue: string) {
    const nextStatus = nextValue as (typeof statusOptions)[number]["value"];
    void load(1, nextStatus);
  }

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Saques de código de convite</CardTitle>
            <CardDescription>
              Acompanhe os pedidos Pix, copie a chave e atualize o status do pagamento.
            </CardDescription>
          </div>
          <div className="flex min-w-[180px] items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select value={statusFilter} onChange={(event) => handleFilterChange(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            {total > 0
              ? `${total} solicitação${total > 1 ? "ões" : ""} encontrada${total > 1 ? "s" : ""}`
              : "Nenhuma solicitação encontrada"}
          </p>
          {total > 0 && (
            <p>
              Página {page} de {totalPages}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && !result ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-12 text-center">
            <p className="text-sm font-medium">Nenhum pedido para esse filtro.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tente selecionar outro status ou aguarde novas solicitações de saque.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Solicitado em</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Tipo Pix</TableHead>
                    <TableHead>Chave Pix</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-0.5">
                          <span className="font-medium">{item.user?.name ?? "Usuário removido"}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.user?.email ?? "Sem e-mail disponível"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(item.amountInCents)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatPixTypeLabel(item.pixKeyType)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[280px] items-center gap-2">
                          <span className="truncate font-mono text-[11px]" title={item.pixKey}>
                            {item.pixKey}
                          </span>
                          <CopyPixButton value={item.pixKey} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-2">
                          <Badge
                            variant={item.status === "PAID" ? "success" : "outline"}
                            className={cn("w-fit", getStatusBadgeClassName(item.status))}
                          >
                            {formatStatusLabel(item.status)}
                          </Badge>
                          <Select
                            value={item.status}
                            disabled={updatingId === item.id}
                            onChange={(event) =>
                              void handleStatusChange(
                                item,
                                event.target.value as ReferralWithdrawalStatus,
                              )
                            }
                          >
                            {rowStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label.replace(/s$/, "")}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} de {total}
                </p>

                <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        disabled={page <= 1 || isLoading}
                        onClick={() => void load(page - 1, statusFilter)}
                      />
                    </PaginationItem>

                    {visiblePages.map((entry, index) => (
                      <PaginationItem key={`${entry}-${index}`}>
                        {entry === "..." ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={entry === page}
                            disabled={isLoading}
                            onClick={() => void load(entry, statusFilter)}
                          >
                            {entry}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        disabled={page >= totalPages || isLoading}
                        onClick={() => void load(page + 1, statusFilter)}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
