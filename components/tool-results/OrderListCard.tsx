"use client";

import { formatCurrency, formatDateTime } from "./utils";

type OrderListItem = {
  orderNo?: string;
  customerName?: string;
  status?: string;
  amount?: string | number;
  createdAt?: string;
};

export function OrderListCard({ data }: { data: unknown }) {
  const orders = Array.isArray(data) ? (data as OrderListItem[]) : [];

  return (
    <div className="w-full max-w-[520px] rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            订单列表
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            共 {orders.length} 条订单
          </p>
        </div>
      </div>

      <div className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
        {orders.map((order) => (
          <div
            key={order.orderNo}
            className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-zinc-950 dark:text-zinc-50">
                  {order.orderNo}
                </span>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {order.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {order.customerName} · {formatDateTime(order.createdAt)}
              </p>
            </div>

            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(order.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
