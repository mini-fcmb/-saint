// src/components/Loader.tsx
import React from "react";
import "./Loader.css";

interface LoaderProps {
  size?: number;
  fullscreen?: boolean;
}

export default function Loader({ size = 60, fullscreen = false }: LoaderProps) {
  const style = { "--loader-size": `${size}px` } as React.CSSProperties;

  return (
    <div
      className={fullscreen ? "loader-fullscreen" : "loader-inline"}
      style={style}
    >
      <div className="loader">
        <span className="dot dot-1"></span>
        <span className="dot dot-2"></span>
        <span className="dot dot-3"></span>
        <span className="dot dot-4"></span>
        <span className="dot dot-5"></span>
      </div>
    </div>
  );
}
