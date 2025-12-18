"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useHouse } from "@/lib/house-context";

export function HouseRedirect() {
  const { houses, isLoading } = useHouse();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!houses || houses.length === 0)) {
      // Prevent redirect loop if already on join-house page
      if (pathname !== "/join-house") {
        router.push("/join-house");
      }
    }
  }, [houses, isLoading, router, pathname]);

  return null;
}
