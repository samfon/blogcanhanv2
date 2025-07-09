import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryTagProps {
  name: string;
  color?: string;
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

export function CategoryTag({
  name,
  color,
  variant = "default",
  className,
}: CategoryTagProps) {
  return (
    <Badge variant={variant} className={cn("text-xs font-medium", className)}>
      {name}
    </Badge>
  );
}
