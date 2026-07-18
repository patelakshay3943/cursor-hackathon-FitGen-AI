import Link from "next/link";
import { LoginForm } from "@/modules/auth";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Log in
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Static mock — any non-empty email/password works.
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link
          href="/register"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
