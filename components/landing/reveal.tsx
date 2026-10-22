"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "cn";
import { MOTION_DURATION, motionTransition } from "@/lib/motion";

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    /** Задержка в секундах — для каскада внутри одной секции */
    delay?: number;
    /** Смещение по вертикали в пикселях */
    y?: number;
}

/**
 * Появление секции при прокрутке. Уважает prefers-reduced-motion:
 * при включённом reduced motion контент виден сразу.
 */
export function Reveal({ children, className, delay = 0, y = 14 }: RevealProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            className={cn(className)}
            initial={reduceMotion ? false : { opacity: 0, y }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={motionTransition(reduceMotion, { duration: MOTION_DURATION.slow, delay })}
        >
            {children}
        </motion.div>
    );
}
