import"./CWj6FrbW.js";import{aG as C,p as N,g as s,i as z,y as I,f as A,b as m,s as L,x as P,r as j,a as B,au as f,aH as G,aI as H}from"./1SfN1bp7.js";import{s as q}from"./BSNoeeGl.js";import{e as D,i as E}from"./BL1VTTHS.js";import{e as F}from"./PRvFRkyg.js";import{b as g}from"./Tpcx6bTi.js";import{p as o,r as J}from"./BP0goHUE.js";/**
 * @file
 * @license @lucide/svelte v1.16.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @file
 * @license @lucide/svelte v1.16.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=a=>{for(const t in a)if(t.startsWith("aria-")||t==="role"||t==="title")return!0;return!1};/**
 * @file
 * @license @lucide/svelte v1.16.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=Symbol("lucide-context"),Q=()=>C(O);var R=G("<svg><!><!></svg>");function et(a,t){N(t,!0);const e=Q()??{},k=o(t,"color",19,()=>e.color??"currentColor"),i=o(t,"size",19,()=>e.size??24),c=o(t,"strokeWidth",19,()=>e.strokeWidth??2),v=o(t,"absoluteStrokeWidth",19,()=>e.absoluteStrokeWidth??!1),b=o(t,"iconNode",19,()=>[]),l=J(t,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]),W=f(()=>v()?Number(c())*24/Number(i()):c());var r=R();g(r,n=>({...K,...n,...l,width:i(),height:i(),stroke:k(),"stroke-width":s(W),class:["lucide-icon lucide",e.class,t.name&&`lucide-${t.name}`,t.class]}),[()=>!t.children&&!M(l)&&{"aria-hidden":"true"}]);var d=z(r);D(d,17,b,E,(n,x)=>{var u=f(()=>H(s(x),2));let p=()=>s(u)[0],_=()=>s(u)[1];var h=I(),y=A(h);F(y,p,!0,(S,T)=>{g(S,()=>({..._()}))}),m(n,h)});var w=L(d);q(w,()=>t.children??P),j(r),m(a,r),B()}export{et as I};
