'use client';
import { useState } from 'react';
export default function Donate(){
  const [amount,setAmount]=useState(25);
  async function donate(){
    const r=await fetch('/api/stripe/checkout',{method:'POST',body:JSON.stringify({mode:'payment',amount})});
    const {url,error}=await r.json(); if(url) location.href=url; else alert(error||'Donation failed');
  }
  return (<div>
    <h1>Support sponsored training</h1>
    <div style={{display:'flex',gap:8,margin:'12px 0'}}>
      {[5,10,25,50].map(v=>(<button key={v} className="card" onClick={()=>setAmount(v)}>${"{v}"}</button>))}
      <input className="card" style={{width:120,color:'white',background:'transparent',border:'1px solid #1e1f22'}} type="number" min={1} value={amount} onChange={e=>setAmount(parseInt(e.target.value||'0',10))}/>
    </div>
    <button className="cta" onClick={donate}>Donate ${"{amount}"}</button>
  </div>);
}
