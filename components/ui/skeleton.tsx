import { cn } from "cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-3xl bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
