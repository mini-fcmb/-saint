import { motion } from "motion/react";
import type { TargetAndTransition, Transition } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

type MotionValue = string | number;
type AnimationState = Record<string, MotionValue>;

interface BlurTextProps {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  animationFrom?: AnimationState;
  animationTo?: AnimationState[];
  easing?: (t: number) => number;
  onAnimationComplete?: () => void;
  stepDuration?: number;
}

const buildKeyframes = (
  from: AnimationState,
  steps: AnimationState[],
): TargetAndTransition => {
  const keys = new Set<string>([
    ...Object.keys(from),
    ...steps.flatMap((step) => Object.keys(step)),
  ]);

  const keyframes: Record<string, MotionValue[]> = {};

  keys.forEach((key) => {
    keyframes[key] = [
      from[key],
      ...steps.map((step) => step[key] ?? from[key]),
    ];
  });

  return keyframes as TargetAndTransition;
};

const BlurText = ({
  text = "",
  delay = 200,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = (t: number) => t,
  onAnimationComplete,
  stepDuration = 0.35,
}: BlurTextProps) => {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");

  const [inView, setInView] = useState(false);

  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo<AnimationState>(
    () =>
      direction === "top"
        ? {
            filter: "blur(10px)",
            opacity: 0,
            y: -50,
          }
        : {
            filter: "blur(10px)",
            opacity: 0,
            y: 50,
          },
    [direction],
  );

  const defaultTo = useMemo<AnimationState[]>(
    () => [
      {
        filter: "blur(5px)",
        opacity: 0.5,
        y: direction === "top" ? 5 : -5,
      },
      {
        filter: "blur(0px)",
        opacity: 1,
        y: 0,
      },
    ],
    [direction],
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;

  const animateKeyframes = useMemo(
    () => buildKeyframes(fromSnapshot, toSnapshots),
    [fromSnapshot, toSnapshots],
  );

  const stepCount = toSnapshots.length + 1;

  const totalDuration = stepDuration * (stepCount - 1);

  const times = Array.from({ length: stepCount }, (_, i) =>
    stepCount === 1 ? 0 : i / (stepCount - 1),
  );

  return (
    <p
      ref={ref}
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
      }}
    >
      {elements.map((segment, index) => {
        const transition: Transition = {
          duration: totalDuration,
          delay: (index * delay) / 1000,
          ease: easing,
          times,
        };

        return (
          <motion.span
            key={index}
            className="inline-block will-change-[transform,filter,opacity]"
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={transition}
            onAnimationComplete={
              index === elements.length - 1 ? onAnimationComplete : undefined
            }
          >
            {segment === " " ? "\u00A0" : segment}
            {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
          </motion.span>
        );
      })}
    </p>
  );
};

export default BlurText;
