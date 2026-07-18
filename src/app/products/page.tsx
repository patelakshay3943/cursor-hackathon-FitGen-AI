import { getStaticProducts, ProductGrid } from "@/modules/product";

export default function ProductsPage() {
  const products = getStaticProducts();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Products
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Loaded from{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            modules/product/api/catalog
          </code>
          .
        </p>
      </div>
      <ProductGrid products={products} />
    </main>
  );
}
