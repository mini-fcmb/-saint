import {
  useRef,
  useEffect,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactElement,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words" | "lines" | "words,chars" | "lines,words,chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: CSSProperties["textAlign"];
  tag?: ElementType;
  onLetterAnimationComplete?: () => void;
}

type SplitElement = HTMLElement & {
  _rbsplitInstance?: GSAPSplitText;
};

const SplitText = ({
  text,
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete,
}: SplitTextProps): ReactElement => {
  const ref = useRef<SplitElement | null>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef<(() => void) | undefined>(
    onLetterAnimationComplete,
  );

  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (!("fonts" in document)) {
      setFontsLoaded(true);
      return;
    }

    const fonts = document.fonts;

    if (fonts.status === "loaded") {
      setFontsLoaded(true);
    } else {
      fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !fontsLoaded || !text) return;
      if (animationCompletedRef.current) return;

      const el = ref.current;

      if (el._rbsplitInstance) {
        try {
          el._rbsplitInstance.revert();
        } catch {
          // ignore
        }
        el._rbsplitInstance = undefined;
      }

      const startPct = (1 - threshold) * 100;

      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);

      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch?.[2] ?? "px";

      const sign =
        marginValue === 0
          ? ""
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;

      const start = `top ${startPct}%${sign}`;

      let targets: Element[] = [];

      const assignTargets = (self: any) => {
        if (splitType.includes("chars") && self.chars?.length) {
          targets = self.chars;
        } else if (splitType.includes("words") && self.words?.length) {
          targets = self.words;
        } else if (splitType.includes("lines") && self.lines?.length) {
          targets = self.lines;
        } else {
          targets = self.chars || self.words || self.lines || [];
        }
      };

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === "lines",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        reduceWhiteSpace: false,

        onSplit: (self: any) => {
          assignTargets(self);

          return gsap.fromTo(
            targets,
            {
              ...from,
            },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,

              scrollTrigger: {
                trigger: el,
                start,
                once: true,
                fastScrollEnd: true,
                anticipatePin: 0.4,
              },

              willChange: "transform, opacity",
              force3D: true,

              onComplete: () => {
                animationCompletedRef.current = true;
                onCompleteRef.current?.();
              },
            },
          );
        },
      } as any);

      el._rbsplitInstance = splitInstance;

      return () => {
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.trigger === el) {
            trigger.kill();
          }
        });

        try {
          splitInstance.revert();
        } catch {
          // ignore
        }

        el._rbsplitInstance = undefined;
      };
    },
    {
      scope: ref,
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        threshold,
        rootMargin,
        fontsLoaded,
        JSON.stringify(from),
        JSON.stringify(to),
      ],
    },
  );

  const Tag: ElementType = tag;

  const style: CSSProperties = {
    textAlign,
    overflow: "hidden",
    display: "inline-block",
    whiteSpace: "normal",
    wordBreak: "break-word",
    willChange: "transform, opacity",
  };

  return (
    <Tag ref={ref} style={style} className={`split-parent ${className}`}>
      {text}
    </Tag>
  );
};

export default SplitText;
