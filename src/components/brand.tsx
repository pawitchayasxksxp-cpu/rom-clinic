import { ClinicLogo } from "./clinic-logo";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <ClinicLogo />
      <span>
        <strong>
          ROM<span>Clinic</span>
        </strong>
        <small>CARE BEGINS WITH YOU</small>
      </span>
    </div>
  );
}
