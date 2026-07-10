import { Badge } from "@/components/ui/badge";
import { cn, finalPrice, formatPrice } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  discountPercent: number;
  size?: "sm" | "lg";
  className?: string;
}

export function PriceTag({ price, discountPercent, size = "sm", className }: PriceTagProps) {
  if (price <= 0) {
    return (
      <Badge variant="success" className={cn(size === "lg" && "text-sm", className)}>
        Free
      </Badge>
    );
  }

  const discounted = finalPrice(price, discountPercent);
  const hasDiscount = discountPercent > 0;

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className={cn("font-bold", size === "lg" ? "text-2xl" : "text-sm")}>
        {formatPrice(discounted)}
      </span>
      {hasDiscount && (
        <>
          <span
            className={cn(
              "text-muted-foreground line-through",
              size === "lg" ? "text-sm" : "text-xs"
            )}
          >
            {formatPrice(price)}
          </span>
          <Badge variant="success" className="text-[10px]">
            {discountPercent}% off
          </Badge>
        </>
      )}
    </span>
  );
}
