"use client";
import {useLayoutEffect,useRef} from 'react';
export function PatientReportSheet({children,autoPrint=false}:{children:React.ReactNode;autoPrint?:boolean}){
 const content=useRef<HTMLDivElement>(null),sheet=useRef<HTMLDivElement>(null),printed=useRef(false);
 useLayoutEffect(()=>{
  let active=true;
  const fit=()=>{
   const body=content.current,page=sheet.current;if(!body||!page)return;
   const width=page.clientWidth,height=page.clientHeight-3;let ratio=1;
   for(let i=0;i<16;i++) {body.style.width=`${width/ratio}px`;const next=Math.min(1,height/Math.max(1,body.offsetHeight));if(Math.abs(next-ratio)<0.0005){ratio=next;break;}ratio=(ratio+next)/2;}
   body.style.width=`${width/ratio}px`;ratio=Math.min(ratio,height/Math.max(1,body.offsetHeight));body.style.transform=`scale(${ratio})`;page.dataset.fitReady='true';
  };
  const observer=new ResizeObserver(fit);if(content.current)observer.observe(content.current);fit();
  void(async()=>{await document.fonts.ready;await Promise.all(Array.from(content.current?.querySelectorAll('img')||[]).map(img=>img.complete?Promise.resolve():new Promise<void>(resolve=>{img.addEventListener('load',()=>resolve(),{once:true});img.addEventListener('error',()=>resolve(),{once:true});})));if(!active)return;fit();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);if(active&&autoPrint&&!printed.current){printed.current=true;window.print();}})();
  return()=>{active=false;observer.disconnect();};
 },[autoPrint]);
 return <div className="patient-summary-scroll"><div className="patient-onepage-sheet" ref={sheet}><div className="patient-summary-content" ref={content}>{children}</div></div></div>;
}
