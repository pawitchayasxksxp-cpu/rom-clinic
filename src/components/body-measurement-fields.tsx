"use client";
import {useState} from 'react';
import {bodyMeasurements} from '@/lib/body-measurements';
export function BodyMeasurementFields({initialWeight='',initialHeight=''}:{initialWeight?:string;initialHeight?:string}){
 const[weight,setWeight]=useState(initialWeight),[height,setHeight]=useState(initialHeight);let bmi='';try{bmi=bodyMeasurements(weight,height).bmi;}catch{}
 return <div className="field-grid"><div className="field"><label htmlFor="weight">น้ำหนัก (กก.)</label><input id="weight" name="weight" type="number" min="0.01" max="500" step="0.01" value={weight} onChange={event=>setWeight(event.target.value)}/></div><div className="field"><label htmlFor="height">ส่วนสูง (ซม.)</label><input id="height" name="height" type="number" min="0.01" max="300" step="0.01" value={height} onChange={event=>setHeight(event.target.value)}/></div><div className="field"><label htmlFor="bmi">BMI (กก./ม²)</label><input id="bmi" name="bmi" readOnly value={bmi} placeholder="คำนวณอัตโนมัติ"/><p className="form-note">คำนวณจากน้ำหนักและส่วนสูงที่กรอกครั้งนี้</p></div></div>;
}
