export function bodyMeasurements(weight:string,height:string){
 const valid=(value:string,max:number)=>value===''||(/^\d{1,3}(\.\d{1,2})?$/.test(value)&&Number(value)>0&&Number(value)<=max);
 if(!valid(weight,500)||!valid(height,300))throw new Error('น้ำหนักต้องมากกว่า 0–500 กก. และส่วนสูงมากกว่า 0–300 ซม. ทศนิยมไม่เกิน 2 ตำแหน่ง หรือเว้นว่าง');
 return {weight,height,bmi:weight&&height?(Number(weight)/(Number(height)/100)**2).toFixed(2):''};
}
