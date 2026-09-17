import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  className?: string;
}

/**
 * The PNG ships with a solid white background, so it always sits inside a white
 * rounded container — otherwise it reads as a sticker pasted on a tinted surface.
 */
export function BrandLogo({ size = 32, className }: BrandLogoProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo-paulistana.png"
        alt="Assembleia de Deus Paulistana"
        width={size}
        height={size}
        className="h-full w-full object-contain p-0.5"
        priority
      />
    </div>
  );
}
