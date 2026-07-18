import { formatPrice } from "@/modules/product/utils/formatPrice";
import type { Order } from "../types";

function orderTotalCents(order: Order): number {
  return order.lines.reduce((sum, line) => sum + line.qty * line.priceCents, 0);
}

export function OrderSummary({ order }: { order: Order }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {order.id}
        </h3>
        <time className="text-xs text-zinc-500 dark:text-zinc-400">
          {order.placedAt}
        </time>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
        {order.lines.map((line) => (
          <li
            key={`${order.id}-${line.productId}`}
            className="flex justify-between gap-4"
          >
            <span>
              {line.label} × {line.qty}
            </span>
            <span>{formatPrice(line.qty * line.priceCents)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-zinc-100 pt-3 text-sm font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
        Total {formatPrice(orderTotalCents(order))}
      </p>
    </article>
  );
}
