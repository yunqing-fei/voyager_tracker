import * as T from 'three';
export function makeVoyager(){
 const g=new T.Group();
 const metal=new T.MeshStandardMaterial({color:0xa9aeb0,metalness:.78,roughness:.35});
 const white=new T.MeshStandardMaterial({color:0xe2e1d8,metalness:.18,roughness:.6,side:T.DoubleSide});
 const black=new T.MeshStandardMaterial({color:0x242829,metalness:.45,roughness:.48});
 const gold=new T.MeshStandardMaterial({color:0xc6a25b,metalness:.75,roughness:.43});
 function mesh(geo,mat,pos=[0,0,0]){const m=new T.Mesh(geo,mat);m.position.set(...pos);g.add(m);return m;}
 function rod(a,b,r=.016,mat=metal){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const m=mesh(new T.CylinderGeometry(r,r,d.length(),7),mat,av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 mesh(new T.CylinderGeometry(.88,.88,.58,10),black,[0,-.52,0]);
 for(let i=0;i<10;i++){const a=i*Math.PI/5;const panel=mesh(new T.BoxGeometry(.5,.49,.035),i%3?gold:metal,[Math.sin(a)*.84,-.52,Math.cos(a)*.84]);panel.rotation.y=a;for(let j=0;j<7;j++){const l=mesh(new T.BoxGeometry(.4,.014,.05),black,[Math.sin(a)*.87,-.7+j*.054,Math.cos(a)*.87]);l.rotation.y=a;}}
 const pts=[];for(let i=0;i<=60;i++){const r=i/60*1.85;pts.push(new T.Vector2(r,.23*r*r));}
 mesh(new T.LatheGeometry(pts,128),white);
 const rim=mesh(new T.TorusGeometry(1.85,.023,8,128),metal,[0,.23*1.85**2,0]);rim.rotation.x=Math.PI/2;
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const p=[];for(let j=0;j<=20;j++){const r=.12+j/20*1.73;p.push(new T.Vector3(Math.cos(a)*r,.23*r*r-.018,Math.sin(a)*r));}g.add(new T.Line(new T.BufferGeometry().setFromPoints(p),new T.LineBasicMaterial({color:0x9d9b8f})));}
 for(let i=0;i<3;i++){const a=i/3*Math.PI*2;rod([Math.cos(a)*1.6,.6,Math.sin(a)*1.6],[0,1.76,0],.025,white);}
 mesh(new T.CylinderGeometry(.23,.12,.12,32),white,[0,1.77,0]);rod([0,1.8,0],[0,2.12,0],.04);
 // Deployable triangular magnetometer truss, 13 m long.
 const start=new T.Vector3(-.5,-.75,0),end=new T.Vector3(-12.9,-2.5,1.6);const axis=end.clone().sub(start),u=new T.Vector3(0,0,.14),v=new T.Vector3(0,.15,-.07);
 const corners=[u,v,new T.Vector3(0,-.15,-.07)];
 for(let n=0;n<32;n++){const a=start.clone().addScaledVector(axis,n/32),b=start.clone().addScaledVector(axis,(n+1)/32);for(let j=0;j<3;j++){rod(a.clone().add(corners[j]).toArray(),b.clone().add(corners[j]).toArray(),.008);rod(a.clone().add(corners[j]).toArray(),b.clone().add(corners[(j+1)%3]).toArray(),.005,gold);}}
 mesh(new T.BoxGeometry(.2,.22,.23),black,end.toArray());mesh(new T.BoxGeometry(.16,.2,.2),black,start.clone().addScaledVector(axis,.55).toArray());
 // Three finned radioisotope thermoelectric generators.
 rod([.6,-.7,0],[3.7,-1.15,0],.065);for(let i=0;i<3;i++){const x=2.05+i*.65;const c=mesh(new T.CylinderGeometry(.23,.23,.55,24),black,[x,-1.15,0]);c.rotation.z=Math.PI/2;for(let j=0;j<12;j++){const a=j*Math.PI/6;const f=mesh(new T.BoxGeometry(.52,.2,.025),metal,[x,-1.15+Math.cos(a)*.26,Math.sin(a)*.26]);f.rotation.x=a;}for(const offset of [-.24,.24]){const c=mesh(new T.CylinderGeometry(.26,.26,.035,24),metal,[x+offset,-1.15,0]);c.rotation.z=Math.PI/2;}}
 rod([.3,-.6,-.5],[1.5,-.7,-2.4],.055);rod([-.3,-.7,-.5],[1.5,-.7,-2.4],.025);
 mesh(new T.BoxGeometry(.85,.15,.75),metal,[1.5,-.7,-2.4]);
 for(let i=0;i<3;i++){const lens=mesh(new T.CylinderGeometry(.12+i*.025,.12+i*.025,.5,24),black,[1.18+i*.3,-.52,-2.5]);lens.rotation.x=Math.PI/2;const glass=mesh(new T.CircleGeometry(.1+i*.025,24),new T.MeshStandardMaterial({color:0x29475b,metalness:1,roughness:.1}),[1.18+i*.3,-.52,-2.755]);glass.rotation.y=Math.PI;}
 const record=mesh(new T.CylinderGeometry(.15,.15,.018,64),gold,[0,-.54,.897]);record.rotation.x=Math.PI/2;
 for(let r=.025;r<.15;r+=.007){const ring=mesh(new T.TorusGeometry(r,.001,3,64),metal,[0,-.54,.91]);}
 rod([-.5,-.8,.4],[-5,-5,3],.012);rod([.5,-.8,.4],[5,-5,3],.012);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;const x=Math.cos(a)*.76,z=Math.sin(a)*.76;mesh(new T.ConeGeometry(.075,.18,12),metal,[x,-.98,z]);}
 return g;
}
