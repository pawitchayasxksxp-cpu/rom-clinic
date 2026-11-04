import type { BodyPoint } from "@/lib/body-chart-validation";
export function BodyChartImage({ points, onAdd }: { points: BodyPoint[]; onAdd?: (x: number, y: number) => void }) {
  return <svg viewBox="0 0 1084 782" className={`body-chart-image${onAdd ? " interactive" : ""}`} role="img" aria-label={onAdd ? "แผนภาพร่างกาย กดเพื่อเพิ่มตำแหน่ง" : "แผนภาพร่างกายพร้อมตำแหน่งที่บันทึก"} onClick={onAdd ? event => {
    const box = event.currentTarget.getBoundingClientRect();
    onAdd((event.clientX - box.left) / box.width * 1084, (event.clientY - box.top) / box.height * 782);
  } : undefined}>
    <image href="/body-chart.png" width="1084" height="782" />
    {points.map((point, index) => <g key={index} className="body-chart-marker"><circle cx={point.x} cy={point.y} r="14" fill="#b43b35" stroke="#fff" strokeWidth="3" /><text x={point.x} y={point.y + 5} textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">{index + 1}</text><title>{`${index + 1}. ${point.note || "ตำแหน่งที่ระบุ"}`}</title></g>)}
  </svg>;
}
