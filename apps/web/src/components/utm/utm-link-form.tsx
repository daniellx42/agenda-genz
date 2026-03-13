"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createTrackingLinkAction } from "@/app/admin/utm/actions";
import { UTM_SOURCE_OPTIONS } from "@/lib/utm/constants";
import { buildPublicTrackingUrl } from "@/lib/utm/url";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type UtmLinkFormProps = {
  onCreated: () => void;
};

type FormState = {
  name: string;
  slug: string;
  source: string;
  campaign: string;
  influencer: string;
  platform: string;
  medium: string;
  creativeLabel: string;
  creativeType: string;
  landingPath: string;
  description: string;
};

const initialState: FormState = {
  name: "",
  slug: "",
  source: UTM_SOURCE_OPTIONS[0],
  campaign: "",
  influencer: "",
  platform: "",
  medium: "social",
  creativeLabel: "",
  creativeType: "",
  landingPath: "/",
  description: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function UtmLinkForm({ onCreated }: UtmLinkFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => {
      if (key === "name" && !slugTouched) {
        return {
          ...current,
          name: value as string,
          slug: slugify(value as string),
        };
      }

      return {
        ...current,
        [key]: value,
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await createTrackingLinkAction(form);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(`URL pronta: ${result.data.publicUrl ?? buildPublicTrackingUrl(form.slug, form.landingPath)}`);
      setForm(initialState);
      setSlugTouched(false);
      onCreated();
    });
  }

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>Criar URL personalizada</CardTitle>
        <CardDescription>
          Monte links por campanha, influenciador, rede social e criativo sem depender da API principal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="utm-name">Nome interno</Label>
            <Input
              id="utm-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Lançamento abril - influenciador 01"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="utm-slug">Slug publico</Label>
            <Input
              id="utm-slug"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                updateField("slug", slugify(event.target.value));
              }}
              placeholder="lancamento-abril-influencer-01"
            />
            {form.slug ? (
              <p className="text-[11px] text-muted-foreground">
                {buildPublicTrackingUrl(form.slug, form.landingPath)}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="utm-source">Origem</Label>
            <Select
              id="utm-source"
              value={form.source}
              onChange={(event) => updateField("source", event.target.value)}
            >
              {UTM_SOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="utm-campaign">Campanha</Label>
            <Input
              id="utm-campaign"
              value={form.campaign}
              onChange={(event) => updateField("campaign", event.target.value)}
              placeholder="lancamento-app"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="utm-influencer">Influenciador</Label>
            <Input
              id="utm-influencer"
              value={form.influencer}
              onChange={(event) => updateField("influencer", event.target.value)}
              placeholder="maria.silva"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="utm-platform">Rede social</Label>
            <Input
              id="utm-platform"
              value={form.platform}
              onChange={(event) => updateField("platform", event.target.value)}
              placeholder="instagram reels"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="utm-medium">Medium</Label>
            <Input
              id="utm-medium"
              value={form.medium}
              onChange={(event) => updateField("medium", event.target.value)}
              placeholder="social"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="utm-creative-label">Criativo</Label>
            <Input
              id="utm-creative-label"
              value={form.creativeLabel}
              onChange={(event) => updateField("creativeLabel", event.target.value)}
              placeholder="video-03"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="utm-creative-type">Tipo de criativo</Label>
            <Input
              id="utm-creative-type"
              value={form.creativeType}
              onChange={(event) => updateField("creativeType", event.target.value)}
              placeholder="video"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="utm-landing-path">Destino no site</Label>
            <Input
              id="utm-landing-path"
              value={form.landingPath}
              onChange={(event) => updateField("landingPath", event.target.value)}
              placeholder="/"
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="utm-description">Observacao interna</Label>
            <textarea
              id="utm-description"
              className="border-input bg-background min-h-24 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Diferencie aqui o video, a imagem ou o briefing dessa URL."
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-3 border-t pt-4">
            <p className="text-[11px] text-muted-foreground">
              Esse link vai cair no landing page e a partir dali rastrear visitas e cliques nas lojas.
            </p>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar URL"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
