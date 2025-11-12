// src/components/LoadingOverlay.tsx
import React from "react";
import Loader from "./Loader";
import { useLoading } from "../hooks/useLoading";

export default function LoadingOverlay() {
  const { isLoading } = useLoading();
  if (!isLoading) return null;
  return <Loader fullscreen />;
}
