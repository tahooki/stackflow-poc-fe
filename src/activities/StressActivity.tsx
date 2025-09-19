import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useEffect, useMemo, useState } from "react";

type StressActivityParams = {
  size?: string;
};

type StressCard = {
  id: string;
  title: string;
  blurb: string;
};

const lorem =
  "Stackflow stress surface. Tweak list density to observe render cost, transitions, and scroll retention under load.";

const buildCards = (count: number): StressCard[] =>
  Array.from({ length: count }, (_, index) => {
    const base = index + 1;
    return {
      id: `stress-${base}`,
      title: `Synthetic Panel ${base}`,
      blurb: `${lorem} Fragment #${base}.`,
    };
  });

const StressActivity: ActivityComponentType<StressActivityParams> = ({
  params,
}: {
  params: StressActivityParams;
}) => {
  const desiredSize = Number(params.size ?? "300");
  const cardCount = Number.isFinite(desiredSize) ? Math.min(Math.max(desiredSize, 120), 600) : 320;
  const cards = useMemo(() => buildCards(cardCount), [cardCount]);
  const [mountDuration, setMountDuration] = useState<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const id = requestAnimationFrame(() => {
      setMountDuration(performance.now() - start);
    });

    return () => cancelAnimationFrame(id);
  }, [cardCount]);

  return (
    <AppScreen appBar={{ title: "Stress Suite" }}>
      <section className="activity__header">
        <h1>Stress Scenario</h1>
        <p>
          Heavy synthetic panels render eagerly to expose slow frames. Adjust list size via params to scale the load.
        </p>
      </section>

      <div className="activity__content">
        <section className="activity__card">
          <h2>Metrics</h2>
          <p>
            {mountDuration === null
              ? "Capturing mount duration…"
              : `Initial render completed in ${mountDuration.toFixed(1)}ms.`}
          </p>
        </section>

        <section className="stress-grid">
          {cards.map((card) => (
            <article key={card.id} className="stress-card">
              <h3>{card.title}</h3>
              <p>{card.blurb}</p>
            </article>
          ))}
        </section>
      </div>
    </AppScreen>
  );
};

export default StressActivity;
