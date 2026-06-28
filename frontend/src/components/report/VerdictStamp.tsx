import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import type { Verdict } from "@/types";

interface VerdictStampProps {
  verdict: Verdict;
  size?: "sm" | "lg";
  className?: string;
}

/**
 * The signature visual element of the product. Investment research reports
 * get stamped APPROVED or REJECTED in the real world — this renders the
 * agent's verdict the same way: a rotated, ink-textured stamp rather than a
 * soft badge, with a cinematic hand stamp animation when it first appears.
 */
export function VerdictStamp({ verdict, size = "lg", className }: VerdictStampProps) {
  const isInvest = verdict === "INVEST";
  const [animationStep, setAnimationStep] = useState<"idle" | "hand-in" | "impact" | "hand-out" | "done">("idle");
  const [triggerShake, setTriggerShake] = useState(false);

  useEffect(() => {
    if (size === "sm") {
      setAnimationStep("done");
      return;
    }

    setAnimationStep("hand-in");

    // Impact timing
    const impactTimer = setTimeout(() => {
      setAnimationStep("impact");
      setTriggerShake(true);
    }, 700);

    const stopShakeTimer = setTimeout(() => {
      setTriggerShake(false);
    }, 1100);

    // Lift and exit timing
    const liftTimer = setTimeout(() => {
      setAnimationStep("hand-out");
    }, 1800);

    const doneTimer = setTimeout(() => {
      setAnimationStep("done");
    }, 2500);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(stopShakeTimer);
      clearTimeout(liftTimer);
      clearTimeout(doneTimer);
    };
  }, [size]);

  // CSS for screen shake
  const styles = `
    @keyframes stamp-shake {
      0% { transform: translate(0, 0) rotate(0deg); }
      10% { transform: translate(-3px, 2px) rotate(-1deg); }
      20% { transform: translate(2px, -2px) rotate(1deg); }
      30% { transform: translate(-1px, -1px) rotate(0deg); }
      40% { transform: translate(3px, 1px) rotate(1deg); }
      50% { transform: translate(-1px, 2px) rotate(-1deg); }
      60% { transform: translate(1px, -1px) rotate(0deg); }
      70% { transform: translate(-2px, 1px) rotate(1deg); }
      80% { transform: translate(2px, 1px) rotate(-1deg); }
      90% { transform: translate(-1px, -1px) rotate(0deg); }
      100% { transform: translate(0, 0) rotate(0deg); }
    }
    .shake-impact {
      animation: stamp-shake 0.35s ease-in-out;
    }
  `;

  const stampShadow = isInvest ? "rgba(27,122,92,0.35)" : "rgba(168,67,47,0.35)";

  return (
    <>
      <style>{styles}</style>
      <div className={cn("relative inline-block", triggerShake && "shake-impact")}>
        
        {/* Cinematic Hand & Stamp Overlay */}
        <AnimatePresence>
          {animationStep !== "done" && size === "lg" && (
            <motion.div
              initial={{ 
                x: 180, 
                y: -180, 
                scale: 1.6, 
                rotate: 20, 
                opacity: 0,
                filter: "blur(4px)"
              }}
              animate={
                animationStep === "hand-in"
                  ? { 
                      x: 30, 
                      y: -30, 
                      scale: 1.15, 
                      rotate: 10, 
                      opacity: 0.95,
                      filter: "blur(2px)",
                      transition: { duration: 0.6, ease: "easeOut" } 
                    }
                  : animationStep === "impact"
                  ? { 
                      x: 0, 
                      y: 0, 
                      scale: 1.0, 
                      rotate: 0, 
                      opacity: 1.0,
                      filter: "blur(0px)",
                      transition: { duration: 0.1, ease: "easeIn" } 
                    }
                  : { 
                      x: -120, 
                      y: -150, 
                      scale: 1.4, 
                      rotate: -15, 
                      opacity: 0,
                      filter: "blur(5px)",
                      transition: { duration: 0.6, ease: "easeInOut" } 
                    }
              }
              exit={{ opacity: 0 }}
              className="absolute z-50 pointer-events-none origin-bottom-left"
              style={{
                width: "450px",
                height: "450px",
                left: "-120px",
                top: "-210px",
              }}
            >
              <img
                src={isInvest ? "/stamp_invest.png" : "/stamp_pass.png"}
                alt="Stamp Action"
                className="w-full h-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stamped Verdict Text */}
        <motion.div
          initial={size === "lg" ? { scale: 3.5, opacity: 0, filter: "blur(10px)" } : { scale: 1 }}
          animate={
            size === "lg"
              ? animationStep === "idle" || animationStep === "hand-in"
                ? { scale: 3.5, opacity: 0, filter: "blur(10px)" }
                : { 
                    scale: [1.3, 0.95, 1], 
                    opacity: 1, 
                    rotate: isInvest ? -6 : 6,
                    filter: "blur(0px)",
                    transition: { duration: 0.25, ease: "easeOut" } 
                  }
              : { opacity: 1, rotate: isInvest ? -6 : 6 }
          }
          className={cn(
            "inline-flex select-none items-center justify-center border-[3px] font-display font-bold uppercase tracking-[0.15em] relative bg-transparent",
            isInvest ? "border-invest text-invest" : "border-pass text-pass",
            size === "lg" ? "pl-8 pr-10 pt-3 pb-4.5 text-3xl rounded-[10px]" : "pl-4 pr-5 pt-1.5 pb-2 text-sm rounded-md",
            className
          )}
          style={{
            textShadow: `0 0 14px ${stampShadow}`,
            boxShadow: `0 0 0 1px ${isInvest ? "rgba(27,122,92,0.15)" : "rgba(168,67,47,0.15)"} inset`,
            backgroundImage: `radial-gradient(circle, ${isInvest ? "rgba(27,122,92,0.08)" : "rgba(168,67,47,0.08)"} 0%, transparent 100%)`,
          }}
        >
          <span>{verdict}</span>
          <span
            className={cn(
              "absolute uppercase tracking-[0.25em] font-sans font-black opacity-70",
              size === "lg" ? "text-[8px] right-2.5 bottom-1" : "text-[5px] right-1.5 bottom-0.5"
            )}
          >
            verdict
          </span>

          {/* Grungy Ink Stamp Effect Overlay */}
          {size === "lg" && (
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none rounded-[8px]" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                mixBlendMode: "color-burn",
              }}
            />
          )}
        </motion.div>
      </div>
    </>
  );
}
