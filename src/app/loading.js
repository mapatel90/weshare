"use client";

import GlobalLoader from "@/components/shared/GlobalLoader";
// import { startLoading, stopLoading } from "@/contexts/LoadingStore";
// import { useEffect } from "react";

export default function RootLoading() {
  // This file becomes the suspense fallback for route segment loading in app router
  // Ensure global loader is visible during SSR suspense
  // useEffect(() => {
  //   startLoading();
  //   return () => stopLoading();
  // }, []);

  return <GlobalLoader />;
}


