import { getStaticOrders, OrderSummary } from "@/modules/order";

export default function OrdersPage() {
  const orders = getStaticOrders();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Orders
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Static list from{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            modules/order
          </code>
          .
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {orders.map((order) => (
          <li key={order.id}>
            <OrderSummary order={order} />
          </li>
        ))}
      </ul>
    </main>
  );
}
