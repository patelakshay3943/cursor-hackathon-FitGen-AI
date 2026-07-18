"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { register } from "@/store/slices/authSlice";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { mockRegister } from "../services/mockAuth";

export function RegisterForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = mockRegister({ displayName, email, password });
    if (!result.ok) {
      setError("Fill in all fields.");
      return;
    }
    dispatch(register({ displayName: result.displayName, email: result.email }));
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <Label htmlFor="reg-name">Display name</Label>
        <Input
          id="reg-name"
          name="displayName"
          autoComplete="name"
          value={displayName}
          onChange={(ev) => setDisplayName(ev.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="reg-password">Password</Label>
        <Input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <Button type="submit">Create account (static)</Button>
    </form>
  );
}
