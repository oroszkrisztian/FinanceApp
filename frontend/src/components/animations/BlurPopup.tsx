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
      // Delay animation to next frame to ensure DOM is ready
      const timer = setTimeout(() => setIsAnimatingIn(true), 10);
      return () => clearTimeout(timer);
    } else if (!isOpen && shouldRender) {
      setIsAnimatingIn(false);
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsAnimatingOut(false);
        setShouldRender(false);
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, animationDuration]);

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
          transition-all ease-in-out
          ${isAnimatingIn ? "bg-black/50" : "bg-black/0"}
          ${isAnimatingOut ? "bg-black/0" : ""}`}
      onClick={handleBackdropClick}
      style={{
        pointerEvents: "auto",
        transitionDuration: `${animationDuration}ms`,
      }}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`rounded-2xl shadow-xl max-w-max mx-auto w-11/12
              transform transition-all ease-out
              ${isAnimatingIn ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"}
              ${isAnimatingOut ? "translate-y-8 opacity-0 scale-95" : ""}
              md:translate-x-10`}
          style={{
            marginTop: "7vh",
            maxHeight: "90vh",
            overflow: "hidden",
            pointerEvents: "auto",
            position: "relative",
            zIndex: 60,
            transitionDuration: `${animationDuration}ms`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AnimatedModal;
