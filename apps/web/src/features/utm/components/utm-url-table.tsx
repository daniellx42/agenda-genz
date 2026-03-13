"use client";

import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { listTrackingLinksAction } from "@/app/admin/utm/actions";
import type { ListTrackingLinksResult, TrackingLinkListItem } from "@/lib/utm/service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("URL copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 shrink-0"
      onClick={handleCopy}
      title="Copiar URL"
    >
      {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

type UtmUrlTableProps = {
  refreshKey?: number;
};

export default function UtmUrlTable({ refreshKey }: UtmUrlTableProps) {
  const [result, setResult] = useState<ListTrackingLinksResult | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, startLoading] = useTransition();

  const load = useCallback(
    (nextPage: number) => {
      startLoading(async () => {
        const res = await listTrackingLinksAction({ page: nextPage, pageSize: PAGE_SIZE });
        if (res.ok) {
          setResult(res.data);
          setPage(nextPage);
        } else {
          toast.error(res.message);
        }
      });
    },
    [],
  );

  useEffect(() => {
    load(1);
  }, [load, refreshKey]);

  const items: TrackingLinkListItem[] = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>URLs criadas</CardTitle>
            <CardDescription>
              {total > 0 ? `${total} links de rastreamento` : "Nenhuma URL criada ainda."}
            </CardDescription>
          </div>
          {total > 0 && (
            <p className="text-xs text-muted-foreground">
              Página {page}/{totalPages}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !result ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Crie sua primeira URL personalizada usando o formulário ao lado.
          </p>
        ) : (
          <>
            <div className="rounded-xl overflow-hidden border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Nome</TableHead>
                    <TableHead>URL pública</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Influenciador</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="group">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 max-w-[220px]">
                          <span className="truncate text-xs text-muted-foreground font-mono">
                            {item.publicUrl}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton value={item.publicUrl} />
                            <a
                              href={item.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir link"
                            >
                              <Button variant="ghost" size="icon" className="size-7">
                                <ExternalLink className="size-3.5" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.campaign ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.influencer ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? "success" : "outline"} className="text-xs">
                          {item.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page <= 1 || isLoading}
                    onClick={() => load(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-[3rem] text-center text-xs font-medium">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => load(page + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
