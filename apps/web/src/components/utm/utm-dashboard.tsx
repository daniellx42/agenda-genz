"use client";

import {
  Activity,
  Apple,
  Link2,
  Megaphone,
  RadioTower,
  RefreshCcw,
  Smartphone,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import UtmUrlTable from "@/features/utm/components/utm-url-table";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import {
  exportDashboardAction,
  loadDashboardAction,
  refreshAggregateAction,
} from "@/app/admin/utm/actions";
import { DASHBOARD_RANGE_OPTIONS } from "@/lib/utm/constants";
import type { DashboardGroupRow, DashboardMode, UtmDashboardData } from "@/lib/utm/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UtmLinkForm from "@/components/utm/utm-link-form";

const chartConfig = {
  visits: {
    label: "Visitas",
    color: "var(--chart-1)",
  },
  appleStoreClicks: {
    label: "Apple Store",
    color: "var(--chart-2)",
  },
  playStoreClicks: {
    label: "Play Store",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

type UtmDashboardProps = {
  initialData: UtmDashboardData;
  userName?: string;
};

function formatCompactNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

function formatTrackingPath(publicUrl: string) {
  try {
    const url = new URL(publicUrl);
    return `${url.pathname}${url.search}`;
  } catch {
    return publicUrl;
  }
}

function GroupTable({ rows, emptyMessage }: { rows: DashboardGroupRow[]; emptyMessage: string }) {
  if (!rows.length) {
    return <p className="px-1 py-8 text-xs text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Nome</TableHead>
            <TableHead>Visitas</TableHead>
            <TableHead>Apple</TableHead>
            <TableHead>Play</TableHead>
            <TableHead>Conversao</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{formatCompactNumber(row.totalVisits)}</TableCell>
              <TableCell>{formatCompactNumber(row.appleStoreClicks)}</TableCell>
              <TableCell>{formatCompactNumber(row.playStoreClicks)}</TableCell>
              <TableCell>{row.conversionRate.toFixed(1)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function UtmDashboard({ initialData, userName }: UtmDashboardProps) {
  const [dashboard, setDashboard] = useState(initialData);
  const [rangeDays, setRangeDays] = useState(String(initialData.rangeDays));
  const [mode, setMode] = useState<DashboardMode>(initialData.mode);
  const [isFetching, startFetching] = useTransition();
  const [isAggregating, startAggregating] = useTransition();
  const [isExporting, startExporting] = useTransition();
  const [urlTableRefreshKey, setUrlTableRefreshKey] = useState(0);

  const realtimeEnabled = mode === "realtime";

  useEffect(() => {
    setDashboard(initialData);
    setRangeDays(String(initialData.rangeDays));
    setMode(initialData.mode);
  }, [initialData]);

  const lastUpdatedLabel = useMemo(() => {
    if (!dashboard.overview.lastUpdatedAt) {
      return "Sem aggregate ainda";
    }

    return new Date(dashboard.overview.lastUpdatedAt).toLocaleString("pt-BR");
  }, [dashboard.overview.lastUpdatedAt]);

  function downloadExcelDocument(payload: { content: string; fileName: string; mimeType: string }) {
    const blob = new Blob([payload.content], { type: payload.mimeType });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = payload.fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }

  function reload(nextMode: DashboardMode, nextRangeDays: string) {
    startFetching(async () => {
      const result = await loadDashboardAction({
        mode: nextMode,
        rangeDays: nextRangeDays,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      const nextDashboard = result.data;
      setDashboard(nextDashboard);
      setMode(nextMode);
      setRangeDays(String(nextDashboard.rangeDays));
    });
  }

  function handleRealtimeChange(checked: boolean) {
    reload(checked ? "realtime" : "aggregate", rangeDays);
  }

  function handleRangeChange(nextRangeDays: string) {
    setRangeDays(nextRangeDays);
    reload(mode, nextRangeDays);
  }

  function handleAggregateRefresh() {
    startAggregating(async () => {
      const result = await refreshAggregateAction();

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(
        `Aggregate atualizado com ${result.data.processedVisits} visitas e ${result.data.processedEvents} eventos novos.`,
      );
      reload(mode === "aggregate" ? "aggregate" : "realtime", rangeDays);
    });
  }

  function handleExport() {
    startExporting(async () => {
      const result = await exportDashboardAction({
        mode,
        rangeDays,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      downloadExcelDocument(result.data);
    });
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-2">
                <Badge variant="outline">Admin UTM</Badge>
                <CardTitle className="text-xl sm:text-2xl">Painel de atribuicao e downloads</CardTitle>
                <CardDescription>
                  Bem-vindo, {userName ?? "admin"}. Por padrao exibimos aggregate; quando o switch
                  realtime estiver ativo lemos direto da base bruta.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                  {isExporting ? "Exportando..." : "Exportar Excel"}
                </Button>
                {realtimeEnabled ? (
                  <Button variant="outline" onClick={() => reload("realtime", rangeDays)} disabled={isFetching}>
                    <RefreshCcw className={isFetching ? "animate-spin" : ""} />
                    {isFetching ? "Atualizando..." : "Atualizar dados"}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleAggregateRefresh} disabled={isAggregating}>
                    <RefreshCcw className={isAggregating ? "animate-spin" : ""} />
                    {isAggregating ? "Agregando..." : "Atualizar aggregate"}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t pt-4">
              <div className="flex items-center gap-3">
                <Switch checked={realtimeEnabled} onCheckedChange={handleRealtimeChange} />
                <div className="grid gap-0.5">
                  <Label>Realtime</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Aggregate {dashboard.mode === "aggregate" ? "ativo" : "desativado"}
                  </p>
                </div>
              </div>

              <Separator orientation="vertical" className="hidden h-8 md:block" />

              <div className="grid gap-1">
                <Label htmlFor="range">Janela</Label>
                <Select id="range" value={rangeDays} onChange={(event) => handleRangeChange(event.target.value)}>
                  {DASHBOARD_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <p className="text-[11px] text-muted-foreground md:ml-auto">
                Ultima atualizacao visivel: {lastUpdatedLabel}
              </p>
            </div>
          </CardHeader>
        </Card>

        <UtmLinkForm
          onCreated={() => {
            reload(mode, rangeDays);
            setUrlTableRefreshKey((k) => k + 1);
          }}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-linear-to-br from-chart-1/15 to-transparent">
          <CardHeader>
            <CardDescription>Visitas rastreadas</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="size-5" />
              {formatCompactNumber(dashboard.overview.totalVisits)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-linear-to-br from-chart-2/15 to-transparent">
          <CardHeader>
            <CardDescription>Cliques na Apple Store</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Apple className="size-5" />
              {formatCompactNumber(dashboard.overview.appleStoreClicks)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-linear-to-br from-chart-3/15 to-transparent">
          <CardHeader>
            <CardDescription>Cliques na Play Store</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Smartphone className="size-5" />
              {formatCompactNumber(dashboard.overview.playStoreClicks)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-linear-to-br from-chart-4/15 to-transparent">
          <CardHeader>
            <CardDescription>Conversao para loja</CardDescription>
            <CardTitle className="text-2xl">{dashboard.overview.conversionRate.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Performance diaria</CardTitle>
            <CardDescription>
              Usando area chart com visitas, cliques na Apple Store e cliques na Play Store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.series} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) =>
                      new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    }
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="var(--color-visits)"
                    fill="var(--color-visits)"
                    fillOpacity={0.22}
                    stackId="a"
                  />
                  <Area
                    type="monotone"
                    dataKey="appleStoreClicks"
                    stroke="var(--color-appleStoreClicks)"
                    fill="var(--color-appleStoreClicks)"
                    fillOpacity={0.28}
                  />
                  <Area
                    type="monotone"
                    dataKey="playStoreClicks"
                    stroke="var(--color-playStoreClicks)"
                    fill="var(--color-playStoreClicks)"
                    fillOpacity={0.18}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Dimensoes monitoradas</CardTitle>
            <CardDescription>Leitura rapida para entender a saude do funil atual.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <Link2 className="size-4" />
                <span>Links ativos</span>
              </div>
              <strong>{dashboard.overview.totalLinks}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <Users className="size-4" />
                <span>Influenciadores</span>
              </div>
              <strong>{dashboard.overview.totalInfluencers}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4" />
                <span>Campanhas</span>
              </div>
              <strong>{dashboard.overview.totalCampaigns}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <RadioTower className="size-4" />
                <span>Modo atual</span>
              </div>
              <Badge variant={realtimeEnabled ? "success" : "outline"}>
                {realtimeEnabled ? "Realtime" : "Aggregate"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      <UtmUrlTable refreshKey={urlTableRefreshKey} />

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Listagens operacionais</CardTitle>
          <CardDescription>
            Tabelas em shadcn para links, influenciadores, campanhas e fontes. O botao de exportacao no topo leva o
            mesmo recorte para o Excel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Tabs defaultValue="links">
            <TabsList>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="influencers">Influenciadores</TabsTrigger>
              <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
              <TabsTrigger value="sources">Fontes</TabsTrigger>
            </TabsList>

            <TabsContent value="links">
              <div className="rounded-xl overflow-hidden border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Nome</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Influenciador</TableHead>
                      <TableHead>Visitas</TableHead>
                      <TableHead>Apple</TableHead>
                      <TableHead>Play</TableHead>
                      <TableHead>Conversao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.topLinks.length ? (
                      dashboard.topLinks.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>
                            <a className="text-primary underline-offset-4 hover:underline" href={row.publicUrl}>
                              {formatTrackingPath(row.publicUrl)}
                            </a>
                          </TableCell>
                          <TableCell>{row.source}</TableCell>
                          <TableCell>{row.campaign ?? "-"}</TableCell>
                          <TableCell>{row.influencer ?? "-"}</TableCell>
                          <TableCell>{formatCompactNumber(row.totalVisits)}</TableCell>
                          <TableCell>{formatCompactNumber(row.appleStoreClicks)}</TableCell>
                          <TableCell>{formatCompactNumber(row.playStoreClicks)}</TableCell>
                          <TableCell>{row.conversionRate.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                          Nenhum link rastreado ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="influencers">
              <GroupTable
                rows={dashboard.topInfluencers}
                emptyMessage="Nenhum influenciador com eventos agregados ainda."
              />
            </TabsContent>

            <TabsContent value="campaigns">
              <GroupTable rows={dashboard.topCampaigns} emptyMessage="Nenhuma campanha agregada ainda." />
            </TabsContent>

            <TabsContent value="sources">
              <GroupTable rows={dashboard.topSources} emptyMessage="Nenhuma fonte agregada ainda." />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {(isFetching || isAggregating || isExporting) && (
        <p className="text-xs text-muted-foreground">
          {isAggregating
            ? "Atualizando aggregate..."
            : isExporting
              ? "Preparando exportacao..."
              : "Atualizando painel..."}
        </p>
      )}
    </div>
  );
}
