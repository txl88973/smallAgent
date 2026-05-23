"use client";

import { formatCurrency, formatDateTime } from "./utils";

type OrderDetail = {
  orderNo?: string;
  customerName?: string;
  status?: string;
  amount?: string | number;
  paidAt?: string | null;
  signedAt?: string | null;
  createdAt?: string;
};

const rows = [
  ["客户", "customerName"],
  ["状态", "status"],
  ["金额", "amount"],
  ["支付时间", "paidAt"],
  ["签收时间", "signedAt"],
  ["创建时间", "createdAt"],
] as const;

export function OrderDetailCard({ data }: { data: unknown }) {
  const order = (data ?? {}) as OrderDetail;

  const renderValue = (key: (typeof rows)[number][1]) => {
    if (key === "amount") {
      return formatCurrency(order.amount);
    }

    if (key === "paidAt" || key === "signedAt" || key === "createdAt") {
      return formatDateTime(order[key]);
    }

    return order[key] ?? "-";
  };

  return (
    <div className="w-full max-w-[520px] rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
        订单详情 · {order.orderNo ?? "-"}
      </h3>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
        {rows.map(([label, key]) => (
          <div key={key} className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
            <dd className="text-right text-zinc-900 dark:text-zinc-100">
              {renderValue(key)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
