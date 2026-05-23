"use client";

import { formatDateTime, priorityLabel } from "./utils";

export type TicketResult = {
  ticketNo?: string;
  orderNo?: string;
  reason?: string;
  priority?: string;
  status?: string;
  createdAt?: string;
};

export function TicketResultCard({ data }: { data: unknown }) {
  const ticket = (data ?? {}) as TicketResult;

  return (
    <div className="w-full max-w-[520px] rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-emerald-950 dark:text-emerald-100">
            售后工单已创建
          </h3>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
            {ticket.ticketNo ?? "-"}
          </p>
        </div>
        <span className="rounded bg-white/70 px-2 py-0.5 text-xs text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 dark:ring-emerald-800">
          {ticket.status ?? "-"}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-emerald-900 dark:text-emerald-100">
        <div className="flex justify-between gap-4">
          <dt className="text-emerald-700 dark:text-emerald-300">订单号</dt>
          <dd>{ticket.orderNo ?? "-"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-emerald-700 dark:text-emerald-300">优先级</dt>
          <dd>{priorityLabel(ticket.priority)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-emerald-700 dark:text-emerald-300">创建时间</dt>
          <dd>{formatDateTime(ticket.createdAt)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-sm leading-6 text-emerald-900 dark:text-emerald-100">
        {ticket.reason ?? "-"}
      </p>
    </div>
  );
}
