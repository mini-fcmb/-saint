// src/components/LoadingButton.tsx
import React from "react";
import Loader from "./Loader";
import { useLoading } from "../hooks/useLoading";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function LoadingButton({ children, onClick, ...props }: Props) {
  const { isLoading, increment, decrement } = useLoading();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    increment();
    try {
      await onClick?.(e);
    } finally {
      decrement();
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={props.disabled || isLoading}
    >
      {isLoading ? <Loader size={36} /> : children}
    </button>
  );
}
