import Link from "next/link";
import { RegisterForm } from "@/modules/auth";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Register
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Static mock — fills Redux state only.
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
