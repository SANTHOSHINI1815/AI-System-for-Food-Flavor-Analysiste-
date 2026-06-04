import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { analyzeFood, type FoodAnalysis } from "@/lib/api/analyze-food.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, ChefHat, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Palate — AI Food Taste Analyst" },
      { name: "description", content: "Upload a food photo and get a six-axis taste profile in seconds." },
      { property: "og:title", content: "Palate — AI Food Taste Analyst" },
      { property: "og:description", content: "Six-axis taste profiles from a single photo." },
    ],
  }),
  component: Index,
});

const TASTE_KEYS = [
  ["sweetness", "Sweetness"],
  ["sourness", "Sourness"],
  ["saltiness", "Saltiness"],
  ["spiciness", "Spiciness"],
  ["bitterness", "Bitterness"],
  ["astringency", "Astringency"],
] as const;

function Index() {
  const analyze = useServerFn(analyzeFood);
  const [image, setImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (imageDataUrl: string) => analyze({ data: { imageDataUrl } }),
  });

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setImage(url);
      mutation.mutate(url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="font-display text-xl tracking-tight">Palate</span>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" /> AI Taste Analyst
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="mb-12 max-w-3xl">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-primary">The flavor of a photograph</p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Upload a dish. <em className="text-primary">Read its taste.</em>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Palate inspects the photo and returns a six-axis taste profile with integer scores from 0–10.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_1.2fr]">
          <Card
            className="relative overflow-hidden border-dashed border-2 border-border bg-card p-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
          >
            {image ? (
              <div className="relative">
                <img src={image} alt="Uploaded dish" className="aspect-[4/3] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-foreground/80 to-transparent p-4">
                  <span className="text-sm text-background/90">Analyzing your dish…</span>
                  <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                    Replace
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 p-8 text-center transition-colors hover:bg-muted/50"
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground"
                  style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-warm)" }}
                >
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-display text-2xl">Drop a food photo</p>
                  <p className="mt-1 text-sm text-muted-foreground">or click to choose — JPG, PNG, WebP</p>
                </div>
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </Card>

          <div>
            {mutation.isPending && <PendingState />}
            {mutation.isError && (
              <Card className="border-destructive/40 bg-destructive/5 p-6">
                <p className="font-medium text-destructive">Analysis failed</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {(mutation.error as Error)?.message ?? "Something went wrong."}
                </p>
              </Card>
            )}
            {mutation.isSuccess && <Report data={mutation.data} />}
            {mutation.isIdle && <IdleState />}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        Crafted with care · Taste estimates are AI-generated and may vary.
      </footer>
    </div>
  );
}

function IdleState() {
  return (
    <Card className="h-full bg-secondary/40 p-8">
      <h3 className="font-display text-2xl">What you'll get</h3>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        <li>· Food identification</li>
        <li>· Six-axis taste profile (0–10 integer scales)</li>
        <li>· Clean JSON-only output</li>
      </ul>
    </Card>
  );
}

function PendingState() {
  return (
    <Card className="flex h-full flex-col items-center justify-center gap-4 p-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-display text-xl">Tasting the photograph…</p>
      <p className="text-sm text-muted-foreground">Scoring flavors on a six-axis scale.</p>
    </Card>
  );
}

function Report({ data }: { data: FoodAnalysis }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="p-7" style={{ background: "var(--gradient-warm)" }}>
        <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/80">Food name</p>
        <h2 className="mt-1 font-display text-4xl text-primary-foreground">{data.food}</h2>
      </div>

      <div className="space-y-7 p-7">
        <Section title="Taste Profile">
          <div className="grid gap-3">
            {TASTE_KEYS.map(([k, label]) => {
              const v = data.taste[k];
              return (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-foreground">{label}</span>
                    <span className="font-mono text-muted-foreground">{v}/10</span>
                  </div>
                  <Progress value={v * 10} className="h-2" />
                </div>
              );
            })}
          </div>
        </Section>

        <pre className="rounded-lg bg-muted p-4 text-xs text-muted-foreground overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{title}</h3>
      {children}
    </div>
  );
}
