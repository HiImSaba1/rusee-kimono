"use client";

import { useRef, type ComponentProps, type ReactNode } from "react";
import { useMenuLetterHoverAnimation } from "@/hooks/useMenuLetterHoverAnimation";
import { cn } from "@/lib/utils/cn";
import { TransitionLink } from "./TransitionLink";

type Props = Omit<ComponentProps<typeof TransitionLink>, "children"> & {
  children: string;
  trailingVisual?: ReactNode;
};
export function LetterHoverLink({ children, className, trailingVisual, ...props }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMenuLetterHoverAnimation(ref, children);
  return <TransitionLink ref={ref} className={cn("inline-flex items-center", className)} {...props}><span className="relative inline-grid overflow-hidden leading-[1.15]"><span data-hover-text-base className="col-start-1 row-start-1">{children}</span><span data-hover-text-active aria-hidden="true" className="pointer-events-none absolute inset-0">{children}</span></span>{trailingVisual}</TransitionLink>;
}
