"use client";

import { useEffect } from "react";

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

export default function NotFound() {
  useEffect(() => {
    window.location.replace(`${basePath}/`);
  }, []);

  return null;
}
