import Image from "next/image";
export function ClinicLogo({ size = 56 }: { size?: number }) {
  return <Image src="/clinic-logo.jpg" width={size} height={size} alt="โลโก้ ROM Clinic" className="clinic-logo" />;
}
