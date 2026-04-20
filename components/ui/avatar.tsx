import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  className?: string;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl border border-border bg-muted/40 text-xs font-semibold text-foreground",
        className,
      )}
      aria-label={name}
    >
      {initialsFromName(name)}
    </div>
  );
}
