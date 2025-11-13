'use client';

import { createSafeContext } from "@/components/portal/utils/createSafeContext";

export const [SidebarContext, useSidebarContext] = createSafeContext(
    "useSidebarContext must be used within SidebarProvider"
);
