import { readFile, writeFile } from "node:fs/promises";
import * as canvas from "@napi-rs/canvas";
Object.assign(globalThis, { DOMMatrix: canvas.DOMMatrix, ImageData: canvas.ImageData, Path2D: canvas.Path2D });
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
for (const name of ["certificate", "body-chart", "calendar"]) {
  const loading = pdfjs.getDocument({ data: new Uint8Array(await readFile(`test-results/${name}.pdf`)), disableFontFace: true, useSystemFonts: false, standardFontDataUrl: `${process.cwd()}/node_modules/pdfjs-dist/standard_fonts/` });
  const doc = await loading.promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.3 });
  const target = canvas.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvas: target, canvasContext: target.getContext("2d"), viewport }).promise;
  await writeFile(`test-results/${name}-rendered.png`, target.toBuffer("image/png"));
  const text = (await page.getTextContent()).items.filter(item => "str" in item).map(item => item.str).join(" ");
  const expected = { certificate: "ใบรับรองแพทย์", "body-chart": "Body Chart", calendar: "ปฏิทินการจอง" }[name];
  if (!text.replace(/\s/g, "").includes(expected.replace(/\s/g, ""))) throw new Error(`Wrong or loading-only content in ${name}`);
  if (text.length < 20) throw new Error(`Missing text in ${name}`);
  console.log(`${name}: ${doc.numPages} page(s), rendered and text checked`);
  if (name === "certificate" && doc.numPages !== 1) throw new Error("Certificate should fit on one page for the test content");
  await loading.destroy();
}
