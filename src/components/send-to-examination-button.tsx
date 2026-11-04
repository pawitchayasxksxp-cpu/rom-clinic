"use client";
import {useState,useTransition} from 'react';
import {Stethoscope} from 'lucide-react';
import {sendPatientToRoom} from '@/app/(admin)/queues/actions';
export function SendToExaminationButton({patientId,cn,compact=false}:{patientId:string;cn:string;compact?:boolean}){
 const[pending,start]=useTransition(),[error,setError]=useState('');
 return <div className="patient-delete-control"><button type="button" className={compact?'icon-button':'button button-primary'} aria-label={`ส่งห้องตรวจ ${cn}`} title="ส่งห้องตรวจ" disabled={pending} onClick={()=>{setError('');start(async()=>{const result=await sendPatientToRoom(patientId);if(result.error)setError(result.error);});}}><Stethoscope size={18} aria-hidden="true"/>{!compact&&(pending?'กำลังส่ง…':'ส่งห้องตรวจ')}</button>{error&&<p role="alert" className="form-error">{error}</p>}</div>;
}
