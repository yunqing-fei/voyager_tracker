export const AU=149597870.7, DAY=86400;
export const toJD=date=>Date.parse(date)/86400000+2440587.5;
export const fromJD=jd=>new Date((jd-2440587.5)*86400000);
export function stateAt(rows,jd){
 let lo=0,hi=rows.length-1;
 jd=Math.max(rows[0][0],Math.min(rows[hi][0],jd));
 while(hi-lo>1){const m=(lo+hi)>>1;if(rows[m][0]<=jd)lo=m;else hi=m;}
 const a=rows[lo],b=rows[hi],dt=(b[0]-a[0])*DAY,t=(jd-a[0])*DAY/dt,t2=t*t,t3=t2*t;
 const p=[],v=[];
 for(let k=0;k<3;k++){p[k]=(2*t3-3*t2+1)*a[k+1]+(t3-2*t2+t)*dt*a[k+4]+(-2*t3+3*t2)*b[k+1]+(t3-t2)*dt*b[k+4];v[k]=((6*t2-6*t)*a[k+1]+(3*t2-4*t+1)*dt*a[k+4]+(-6*t2+6*t)*b[k+1]+(3*t2-2*t)*dt*b[k+4])/dt;}
 return {p,v};
}
