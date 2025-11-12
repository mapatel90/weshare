'use client';

import { createSafeContext } from "@/components/portal/utils/createSafeContext";

export const [BreakpointsContext, useBreakpointsContext] = createSafeContext(
    "useBreakpointsContext must be used within BreakpointsContext"
);
