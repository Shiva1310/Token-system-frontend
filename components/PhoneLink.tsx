import { Phone } from "lucide-react";

export function PhoneLink({ phone, withIcon = false }: { phone: string; withIcon?: boolean }) {
  return (
    <a
      href={`tel:${phone}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 text-primary hover:underline"
    >
      {withIcon && <Phone className="size-3.5" />}
      {phone}
    </a>
  );
}
