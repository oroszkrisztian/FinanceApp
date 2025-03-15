import React, { useState, useEffect, ReactNode } from "react";

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  closeOnBackdropClick?: boolean;
  backdropBlur?: "sm" | "md" | "lg" | "xl" | "none";
  animationDuration?: number;
}

const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  closeOnBackdropClick = true,
  backdropBlur = "sm",
  animationDuration = 300,
}) => {
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimatingIn(true), 10);
    } else if (!isOpen && shouldRender) {
      setIsAnimatingIn(false);
      setIsAnimatingOut(true);
      setTimeout(() => {
        setIsAnimatingOut(false);
        setShouldRender(false);
      }, 150);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const blurClass = backdropBlur !== "none" ? `backdrop-blur-${backdropBlur}` : "";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${blurClass}
        ${isAnimatingIn ? "bg-black bg-opacity-50" : ""}
        ${isAnimatingOut ? "bg-black bg-opacity-0" : "bg-black bg-opacity-50"}
        transition-all duration-${animationDuration} ease-in-out`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden
          transform transition-all duration-${animationDuration} ease-out
          ${isAnimatingIn ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"}
          ${isAnimatingOut ? "translate-y-8 opacity-0 scale-95" : ""}`}
      >
        {children}
      </div>
    </div>
  );
};

export default AnimatedModal;