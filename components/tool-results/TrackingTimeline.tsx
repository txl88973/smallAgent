"use client";

import { formatDateTime } from "./utils";

type TrackingStep = {
  status?: string;
  location?: string;
  time?: string;
};

type TrackingInfo = {
  carrier?: string;
  trackingNo?: string;
  currentStatus?: string;
  steps?: TrackingStep[];
};

export function TrackingTimeline({ data }: { data: unknown }) {
  const tracking = (data ?? {}) as TrackingInfo;
  const steps = Array.isArray(tracking.steps) ? tracking.steps : [];

  return (
    <div className="w-full max-w-[520px] rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            物流追踪
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {tracking.carrier ?? "-"} · {tracking.trackingNo ?? "-"}
          </p>
        </div>
        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900">
          {tracking.currentStatus ?? "-"}
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={`${step.time}-${index}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 size-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              {index < steps.length - 1 && (
                <span className="mt-1 h-full min-h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
              )}
            </div>

            <div className="min-w-0 pb-2 text-sm">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {step.status ?? "-"}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {step.location ?? "-"} · {formatDateTime(step.time)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
