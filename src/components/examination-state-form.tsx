"use client";
import {startTransition,useActionState} from 'react';
import {changeExaminationState} from '@/app/(admin)/queues/actions';
export function ExaminationStateForm({id,status}:{id:string;status:string}){
 const[state,action,pending]=useActionState(changeExaminationState,{error:''});
 return <form className="examination-state-form" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const submitter=(event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;const next=submitter?.value;if(!next)return;if(next==='cancelled'&&!window.confirm('ยืนยันยกเลิกคิวห้องตรวจนี้?'))return;data.set('status',next);startTransition(()=>action(data));}}><input type="hidden" name="examination-id" value={id}/>{status==='waiting'&&<button type="submit" name="status" value="examining" className="button button-primary" disabled={pending}>เริ่มตรวจ</button>}<button type="submit" name="status" value="cancelled" className="button button-secondary" disabled={pending}>ยกเลิกคิว</button>{state.error&&<p role="alert" className="form-error">{state.error}</p>}</form>;
}
