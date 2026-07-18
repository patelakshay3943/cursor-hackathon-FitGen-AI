export type OrderLine = {
  productId: string;
  label: string;
  qty: number;
  priceCents: number;
};

export type Order = {
  id: string;
  placedAt: string;
  lines: OrderLine[];
};
