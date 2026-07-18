import type { Product } from "../types";

const STATIC_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Notebook",
    priceCents: 899,
    description: "Lined pages, static catalog entry.",
  },
  {
    id: "p2",
    name: "Mug",
    priceCents: 1299,
    description: "Ceramic, demo only.",
  },
  {
    id: "p3",
    name: "Sticker pack",
    priceCents: 499,
    description: "Assorted shapes.",
  },
];

export function getStaticProducts(): Product[] {
  return STATIC_PRODUCTS;
}

export function getProductById(id: string): Product | undefined {
  return STATIC_PRODUCTS.find((p) => p.id === id);
}
