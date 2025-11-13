'use client';

import { createSafeContext } from "@/components/portal/utils/createSafeContext";

export const [ThemeContext, useThemeContext] = createSafeContext(
    "useThemeContext must be used within ThemeProvider",
);
