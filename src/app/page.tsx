import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-3xl text-center">
        <p className="eyebrow mb-6">Stehlen Auto · Now Direct</p>
        <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tight mb-6">
          Built Tough.
          <br />
          <span className="text-primary">Bolt On.</span>
          <br />
          Drive Off.
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto mb-10">
          Heavy-duty truck, SUV, and Jeep accessories engineered from
          cold-rolled steel. No drilling required. Fitment guaranteed for your
          vehicle.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="primary">Find Parts For Your Vehicle</Button>
          <Button variant="secondary">Shop By Category</Button>
        </div>
        <p className="eyebrow mt-16 text-muted-2">
          Phase 0 · Foundation deployed · {new Date().toISOString().slice(0, 10)}
        </p>
      </div>
    </main>
  );
}
