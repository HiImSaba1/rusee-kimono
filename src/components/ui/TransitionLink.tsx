"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { usePageTransition } from "@/providers/PageTransitionProvider";

type Props = LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & { href: string };

export const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink({ href, onClick, target, children, ...props }, ref) {
  const { navigateTo } = usePageTransition();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target === "_blank" || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return;
    event.preventDefault();
    navigateTo(href);
  };
  return <Link ref={ref} href={href} target={target} onClick={handleClick} {...props}>{children}</Link>;
});
