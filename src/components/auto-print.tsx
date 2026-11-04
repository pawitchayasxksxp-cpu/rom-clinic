"use client";
import { useEffect, useRef } from "react";
export function AutoPrint({ enabled }: { enabled:boolean }) {
  const printed=useRef(false);
  useEffect(()=>{if(!enabled||printed.current)return;let cancelled=false;(async()=>{await document.fonts.ready;await Promise.all(Array.from(document.images).map(image=>image.complete?Promise.resolve():new Promise<void>(resolve=>{image.addEventListener("load",()=>resolve(),{once:true});image.addEventListener("error",()=>resolve(),{once:true});})));if(!cancelled&&!printed.current){printed.current=true;window.print();}})();return()=>{cancelled=true;};},[enabled]);return null;
}
