import type { Order } from "../types";

export const STATIC_ORDERS: Order[] = [
  {
    id: "ord-1001",
    placedAt: "2025-01-10",
    lines: [
      { productId: "p1", label: "Notebook", qty: 1, priceCents: 899 },
      { productId: "p3", label: "Sticker pack", qty: 2, priceCents: 499 },
    ],
  },
  {
    id: "ord-1002",
    placedAt: "2025-02-02",
    lines: [{ productId: "p2", label: "Mug", qty: 1, priceCents: 1299 }],
  },
];

export function getStaticOrders(): Order[] {
  return STATIC_ORDERS;
}
