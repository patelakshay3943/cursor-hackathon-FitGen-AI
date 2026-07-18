"use client";

import { useMemo } from "react";
import { getStaticProducts } from "../api/catalog";

export function useProducts() {
  return useMemo(() => getStaticProducts(), []);
}
