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
  animationDuration = 150,
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
      }, animationDuration);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const blurClass =
    backdropBlur !== "none" ? `backdrop-blur-${backdropBlur}` : "";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${blurClass}
        transition-all duration-${animationDuration} ease-in-out
        ${isAnimatingIn ? "bg-black/50" : "bg-black/0"}
        ${isAnimatingOut ? "bg-black/0" : ""}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-lg shadow-xl  max-w-md mx-auto overflow-x-auto max-h-[90vh] w-11/12
    transform transition-all duration-${animationDuration} ease-out
    ${isAnimatingIn ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"}
    ${isAnimatingOut ? "translate-y-8 opacity-0 scale-95" : ""}
    md:translate-x-10`}
      >
        {children}
      </div>
    </div>
  );
};

export default AnimatedModal;
