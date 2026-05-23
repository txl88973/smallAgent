"use client";

import { OrderDetailCard } from "./OrderDetailCard";
import { OrderListCard } from "./OrderListCard";
import { RefundPolicyCard } from "./RefundPolicyCard";
import { TicketConfirmCard } from "./TicketConfirmCard";
import { TicketResultCard } from "./TicketResultCard";
import { TrackingTimeline } from "./TrackingTimeline";
import { stringifyJson } from "./utils";
import type { Role } from "../role-selector";

export function ToolResultRenderer({
  renderType,
  data,
  role,
  onConfirmed,
}: {
  renderType: string;
  data: unknown;
  role?: Role;
  onConfirmed?: () => void;
}) {
  switch (renderType) {
    case "order-list":
      return <OrderListCard data={data} />;
    case "order-card":
      return <OrderDetailCard data={data} />;
    case "tracking-timeline":
      return <TrackingTimeline data={data} />;
    case "refund-policy-card":
      return <RefundPolicyCard data={data} />;
    case "ticket-confirm-card":
      return (
        <TicketConfirmCard
          data={data}
          role={role}
          onConfirmed={onConfirmed}
        />
      );
    case "ticket-result-card":
      return <TicketResultCard data={data} />;
    default:
      return (
        <pre className="max-h-64 w-full max-w-[520px] overflow-auto rounded-md bg-zinc-50 p-3 text-xs leading-5 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          {stringifyJson(data)}
        </pre>
      );
  }
}
