'use client';
import { useState } from 'react';
export default function Pricing(){
  const [loading,setLoading]=useState(false);
  async function checkout(){
    setLoading(true);
    try{
      const r=await fetch('/api/stripe/checkout',{method:'POST',body:JSON.stringify({mode:'subscription'})});
      const {url,error}=await r.json(); if(url) location.href=url; else alert(error||'Checkout failed');
    }finally{setLoading(false);}
  }
  return (<div>
    <h1>SecondChance+ Plus — $7/month</h1>
    <p className="muted">Advanced filters, hotline, ad‑free, adoption kit, vouchers.</p>
    <button className="cta" disabled={loading} onClick={checkout}>{loading?'Redirecting…':'Continue with Stripe'}</button>
  </div>);
}
