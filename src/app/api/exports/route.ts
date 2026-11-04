import ExcelJS from "exceljs";
import { getAdminSession } from "@/lib/session";
import { exportData } from "@/lib/export-data";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!await getAdminSession()) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status:401, headers });
  const query = new URL(request.url).searchParams; const resource = query.get("resource") || "patients";
  try {
    const datasets = await exportData(resource,query); const book = new ExcelJS.Workbook(); book.creator="ROM Clinic"; book.created=new Date();
    datasets.forEach((dataset,index)=>{
      const sheet=book.addWorksheet(`${dataset.title.slice(0,26)}${index ? ` ${index+1}` : ""}`,{views:[{state:"frozen",ySplit:4}],pageSetup:{orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0}});
      sheet.columns=dataset.columns.map(([key,label])=>({key,width:Math.min(55,Math.max(20,label.length*1.4))}));
      sheet.mergeCells(1,1,1,dataset.columns.length); sheet.getCell(1,1).value=dataset.title; sheet.getCell(1,1).font={name:"Tahoma",size:18,bold:true,color:{argb:"FF14532D"}};
      sheet.mergeCells(2,1,2,dataset.columns.length); sheet.getCell(2,1).value=`ROM Clinic · ${new Intl.DateTimeFormat("th-TH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Bangkok"}).format(new Date())}`;
      const header=sheet.getRow(4); header.values=dataset.columns.map(([,label])=>label); header.height=30; header.eachCell(cell=>{cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF14532D"}};cell.font={name:"Tahoma",bold:true,color:{argb:"FFFFFFFF"}};cell.alignment={vertical:"middle",wrapText:true};});
      dataset.rows.forEach(record=>{const row=sheet.addRow(dataset.columns.map(([key])=>record[key] ?? "")); row.font={name:"Tahoma",size:11};row.alignment={vertical:"top",wrapText:true};row.height=Math.min(409,Math.max(32,...dataset.columns.map(([key],index)=>Math.ceil(String(record[key]??"").length/(sheet.columns[index].width||20))*16)));dataset.columns.forEach(([key],column)=>{if(key==="price")row.getCell(column+1).numFmt="#,##0.00";});});
      sheet.autoFilter={from:{row:4,column:1},to:{row:Math.max(4,4+dataset.rows.length),column:dataset.columns.length}};sheet.pageSetup.printTitlesRow="1:4";
    });
    const buffer=await book.xlsx.writeBuffer();
    return new Response(new Uint8Array(buffer),{headers:{...headers,"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":"attachment; filename=rom-clinic-export.xlsx"}});
  } catch(error) { return Response.json({error:error instanceof Error ? error.message : "ส่งออกไม่สำเร็จ"},{status:400,headers}); }
}
