import Link from "next/link";
import { APP_NAME } from "@/config/app";
import { WelcomeBanner } from "@/frontend";
import { getStaticOrders, OrderSummary } from "@/modules/order";
import { getStaticProducts, ProductGrid } from "@/modules/product";
import { UserBadge } from "@/modules/user";
import { ROUTES } from "@/shared/constants";

export default function HomePage() {
  const products = getStaticProducts().slice(0, 3);
  const sampleOrder = getStaticOrders()[0];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {APP_NAME}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Full-stack Next.js app with a clear split:{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">src/frontend</code>{" "}
          for UI and state,{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">src/backend</code>{" "}
          for API logic, and{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">src/app/api</code>{" "}
          as route handlers.
        </p>
        <WelcomeBanner />
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={ROUTES.products}
            className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
          >
            Browse products
          </Link>
          <Link
            href={ROUTES.orders}
            className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
          >
            View orders
          </Link>
          <Link
            href={ROUTES.login}
            className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Session
          </h2>
          <div className="mt-2">
            <UserBadge />
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Sample order
          </h2>
          <div className="mt-2">
            <OrderSummary order={sampleOrder} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Featured products
        </h2>
        <div className="mt-4">
          <ProductGrid products={products} />
        </div>
      </section>
    </main>
  );
}
