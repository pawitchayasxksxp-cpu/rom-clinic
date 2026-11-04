"use client";
export async function waitForPrintContent(selector = "main .page-heading, main h1") {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    const content = Array.from(document.querySelectorAll(selector)).some(element => element.getClientRects().length > 0);
    const loading = Array.from(document.querySelectorAll(".app-loading, .empty-state[role=status]")).some(element => element.getClientRects().length > 0);
    if (content && !loading) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!Array.from(document.querySelectorAll(selector)).some(element => element.getClientRects().length > 0)) throw new Error("กรุณารอข้อมูลโหลดครบก่อนพิมพ์");
  await document.fonts.ready;
  const urls = Array.from(document.querySelectorAll("svg image")).map(element => element.getAttribute("href")).filter((url): url is string => Boolean(url));
  await Promise.all([
    ...Array.from(document.images).map(image => image.complete ? Promise.resolve() : new Promise<void>(resolve => { image.addEventListener("load",()=>resolve(),{once:true});image.addEventListener("error",()=>resolve(),{once:true}); })),
    ...urls.map(url => new Promise<void>(resolve => { const image=new Image(); image.onload=()=>resolve();image.onerror=()=>resolve();image.src=url; })),
  ]);
}
