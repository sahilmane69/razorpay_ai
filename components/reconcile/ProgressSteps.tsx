import { CheckCircle, Circle } from "@phosphor-icons/react";

type ProgressStepsProps = {
  stages: readonly string[];
  currentIndex: number;
};

export function ProgressSteps({ stages, currentIndex }: ProgressStepsProps) {
  return (
    <ol className="space-y-3">
      {stages.map((stage, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;

        return (
          <li key={stage} className="flex items-center gap-3 text-sm">
            {done ? (
              <CheckCircle size={18} weight="fill" className="text-match" />
            ) : (
              <Circle
                size={18}
                weight={current ? "fill" : "regular"}
                className={current ? "text-primary" : "text-line"}
              />
            )}
            <span className={current || done ? "text-ink" : "text-muted"}>
              {stage}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
