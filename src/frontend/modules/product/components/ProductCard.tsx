import type { Product } from "../types";
import { formatPrice } from "../utils/formatPrice";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {product.name}
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {product.description}
      </p>
      <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {formatPrice(product.priceCents)}
      </p>
    </article>
  );
}
