import Link from "next/link";
import { Plus } from "lucide-react";

const FAB_CLASSES =
  "fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden";

interface FabProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

export function Fab({ href, onClick, label }: FabProps) {
  if (href) {
    return (
      <Link href={href} aria-label={label} className={FAB_CLASSES}>
        <Plus className="size-6" />
      </Link>
    );
  }

  return (
    <button type="button" aria-label={label} onClick={onClick} className={FAB_CLASSES}>
      <Plus className="size-6" />
    </button>
  );
}
