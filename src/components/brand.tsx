import { HeartPulse } from "lucide-react";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-symbol">
        <HeartPulse size={25} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span>
        <strong>
          ROM<span>Clinic</span>
        </strong>
        <small>CARE BEGINS WITH YOU</small>
      </span>
    </div>
  );
}
