"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/auth-store";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrateFromStorage, setAuth, clearAuth, isHydrated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function checkSession() {
      hydrateFromStorage();

      try {
        const response = await apiClient.get("/api/auth/me");

        if (!isActive) {
          return;
        }

        const accessToken = useAuthStore.getState().accessToken;

        if (accessToken) {
          setAuth(accessToken, response.data.user);
        }

        setIsChecking(false);
      } catch {
        if (!isActive) {
          return;
        }

        clearAuth();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }

    void checkSession();

    return () => {
      isActive = false;
    };
  }, [clearAuth, hydrateFromStorage, pathname, router, setAuth]);

  if (!isHydrated || isChecking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        正在校验登录状态...
      </div>
    );
  }

  return <>{children}</>;
}
