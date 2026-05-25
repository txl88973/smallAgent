"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { refreshClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/auth-store";
import type { AuthUser } from "@/lib/auth/tokens";

type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const { isAuthenticated, hydrateFromStorage, setAuth } = useAuthStore();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, nextPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await refreshClient.post<LoginResponse>("/api/auth/login", {
        username,
        password,
      });

      setAuth(response.data.accessToken, response.data.user);
      router.replace(nextPath);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.error ?? "登录失败，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 dark:bg-zinc-900">
      <section className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            AgentHub Skill Console
          </p>
          <h1 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            登录调试台
          </h1>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            使用测试账号进入对应角色视角。
          </p>
        </div>

        <form className="mt-5 flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-xs font-medium text-zinc-700 dark:text-zinc-200"
            >
              用户名
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-zinc-700 dark:text-zinc-200"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              autoComplete="current-password"
            />
          </div>

          {errorMessage && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 h-10 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? "登录中..." : "登录"}
          </button>
        </form>

        <div className="mt-5 rounded-md bg-zinc-50 p-3 text-xs leading-5 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
          <p>测试账号：</p>
          <p>admin / admin123</p>
          <p>user / user123</p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-white text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          正在加载登录页...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
