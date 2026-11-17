/* ===== Microorganisms ===== */
BUILD.amoeba=function(){seed(11);const g=new T.Group();
  const lobes=[];for(let i=0;i<5;i++){const d=randDir();d.y*=.25;d.normalize();lobes.push({d,a:R(.6,1),f:R(.18,.34),p:R(TAU)})}
  const b=blob(2.3,72,(x,y,z,t)=>{let r=1+.06*noise3(x*1.7+t*.22,y*1.7,z*1.7+t*.17);
    for(const l of lobes){const c=Math.max(0,x*l.d.x+y*l.d.y+z*l.d.z);r+=Math.pow(c,5)*l.a*(.5+.5*Math.sin(t*l.f+l.p))*1.05}return[x*r,y*r*.74,z*r]});
  b.update(0);const body=new T.Mesh(b.geo,mem(0xa9c9da,{min:.1,max:.6,power:2}));tag(body,'membrane',true);body.renderOrder=3;g.add(body);
  const inner=new T.Group();g.add(inner);
  inner.add(points(cloud(650,()=>inEllipsoid(1.7,1.0,1.7)),.07,0xd9ecf2,.7,'cytoplasm'));
  const nuc=new T.Group();nuc.position.set(.1,0,-.1);
  nuc.add(sphere(.72,mem(0xe3b7cf,{min:.35,max:.9,power:1.4}),'nucleus',null,V3(1.1,.8,1)));
  nuc.add(sphere(.24,std(0x7b3f66),'nucleus',V3(.1,0,.05)));
  nuc.add(points(cloud(160,()=>inEllipsoid(.75,.5,.7)),.05,0xb06a98,.8,'nucleus'));inner.add(nuc);
  const cv=sphere(.36,mem(0xbfe8ff,{min:.3,max:.9}),'vacuole',V3(1.2,.15,.95));inner.add(cv);
  const fv=[];[[-1.1,.1,.8],[-.9,-.1,-.9],[.9,.05,-1.2],[1.5,0,.1]].forEach((p,i)=>{const f=new T.Group();f.position.set(...p);
    f.add(sphere(.34,mem(0xd3f0e0,{min:.25,max:.85}),'food'));f.add(sphere(.14,std(0x7a9a45),'food',V3(.03,0,.02)));inner.add(f);fv.push(f)});
  g.userData.anchors={pseudopod:lobes[0].d.clone().multiplyScalar(3.4)};
  return{g,update(t,dt){b.update(t);inner.rotation.y=Math.sin(t*.15)*.2;const k=(t*.12)%1;cv.scale.setScalar(.35+.65*(k<.9?k/.9:1-(k-.9)*10));
    fv.forEach((f,i)=>{f.position.y=Math.sin(t*.3+i*1.7)*.12})}}};

BUILD.paramecium=function(){seed(23);const g=new T.Group(),A=3.5,B=1.15;
  const slip=d=>{let s=1;if(d.x<0)s=1-.5*Math.pow(-d.x,1.6);return{p:V3(d.x*A,d.y*B*s*.92,d.z*B*s),n:V3(d.x/A,d.y/B,d.z/B).normalize()}};
  const geo=new T.SphereGeometry(1,64,44),P=geo.attributes.position;for(let i=0;i<P.count;i++){const d=V3(P.getX(i),P.getY(i),P.getZ(i)),o=slip(d).p;P.setXYZ(i,o.x,o.y,o.z)}geo.computeVertexNormals();
  g.add(tag(new T.Mesh(geo,mem(0xd5d8c3,{min:.1,max:.62,power:2})),'pellicle',true));
  const N=2300,dirs=fib(N),base=[],nor=[],tan=[];dirs.forEach(d=>{const o=slip(d);base.push(o.p);nor.push(o.n);tan.push(V3(1,0,0).addScaledVector(o.n,-o.n.x).normalize())});
  const arr=new Float32Array(N*18),cil=lineSegs(arr,0xe6f4f2,.5,'cilia');g.add(cil);
  const oral=curvePts(u=>{const d=V3(.82,.12,.56).lerp(V3(.02,-.2,.98),u).normalize();const o=slip(d).p;return o.multiplyScalar(.985)},30);
  const og=staticTube(oral,.075,std(0x5c6b62),'oral');g.add(og);
  const last=oral[30],gul=curvePts(u=>last.clone().lerp(V3(-.3,-.1,.1),u),12);g.add(staticTube(gul,u=>.13*(1-.6*u),std(0x6f7c70),'oral'));
  const mac=sphere(.62,std(0xe0b9c8,{roughness:.8}),'macronucleus',V3(.15,.05,-.1),V3(1.2,.8,.8));g.add(mac);
  g.add(points(cloud(120,()=>inEllipsoid(.7,.5,.5).add(V3(.15,.05,-.1))),.05,0xa56f87,.8,'macronucleus'));
  g.add(sphere(.16,std(0xb3426e),'micronucleus',V3(.35,.0,.4)));
  const cvs=[];[-1,1].forEach((s,i)=>{const v=sphere(.34,mem(0xcdeeff,{min:.3,max:.9}),'cvac',V3(s*2.2,.15,-.5));g.add(v);cvs.push(v);
    const arr2=new Float32Array(7*6);for(let k=0;k<7;k++){const a=k/7*TAU,c=v.position;arr2.set([c.x,c.y,c.z,c.x+Math.cos(a)*.1*0+Math.sin(a)*.0+(Math.cos(a)*.6),c.y+Math.sin(a)*.5,c.z+(k%2?.1:-.1)],k*6)}g.add(lineSegs(arr2,0xcdeeff,.6,'cvac'))});
  const fv=[];for(let i=0;i<8;i++){const f=new T.Group();f.add(sphere(.26,mem(0xd9f0d4,{min:.25,max:.85}),'food'));f.add(sphere(.11,std(0x86a050),'food',V3(.02,0,0)));g.add(f);fv.push({f,a:i/8*TAU})}
  const tr=[];for(let i=0;i<110;i++){const o=slip(dirs[(i*21)%N]);tr.push(orient(o.p.clone().addScaledVector(o.n,-.12),o.n,V3(1,1,1)))}
  g.add(inst(new T.CylinderGeometry(.015,.015,.22,5),std(0x8c9a85),tr,'trichocyst'));
  g.add(points(cloud(700,()=>inEllipsoid(3.1,.85,.85)),.05,0xe8efdf,.55,'cytoplasm'));
  g.userData.anchors={};
  return{g,update(t,dt){const a=cil.geometry.attributes.position.array;let k=0;
    for(let i=0;i<N;i++){const b=base[i],n=nor[i],tg=tan[i],ph=t*9-b.x*2.6,L=.26;let px=b.x,py=b.y,pz=b.z;
      for(let s=1;s<=3;s++){const f=s/3,w=Math.sin(ph)*.55*L*f*f,qx=b.x+n.x*L*f+tg.x*w,qy=b.y+n.y*L*f+tg.y*w,qz=b.z+n.z*L*f+tg.z*w;
        a[k++]=px;a[k++]=py;a[k++]=pz;a[k++]=qx;a[k++]=qy;a[k++]=qz;px=qx;py=qy;pz=qz}}
    cil.geometry.attributes.position.needsUpdate=true;
    cvs.forEach((v,i)=>{const k2=(t*.3+i*.5)%1;v.scale.setScalar(.3+.7*(k2<.85?k2/.85:1-(k2-.85)*6.6))});
    fv.forEach((o,i)=>{const a2=o.a+t*.08;o.f.position.set(Math.cos(a2)*2.1,Math.sin(a2)*.38,Math.sin(a2*1.0+1)*.3-.15+(Math.cos(a2)<0?-.1:0))});
    g.rotation.x=t*.35}}};

BUILD.euglena=function(){seed(37);const g=new T.Group(),L=6;
  const prof=[];for(let i=0;i<=48;i++){const s=i/48,r=.86*Math.pow(Math.sin(Math.PI*Math.pow(s,.7)),.72);prof.push(new T.Vector2(Math.max(.002,r),(s-.45)*L))}
  const geo=new T.LatheGeometry(prof,40);geo.rotateZ(-Math.PI/2);
  const cv=document.createElement('canvas');cv.width=128;cv.height=256;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,128,256);x.strokeStyle='#8aa';x.lineWidth=2;
  for(let i=-8;i<30;i++){x.beginPath();x.moveTo(0,i*16);x.lineTo(128,i*16+64);x.stroke()}
  const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;
  const bodyM=std(0x62b24f,{transparent:true,opacity:.88,roughness:.4,map:tex,clearcoat:.8});
  const body=new T.Mesh(geo,bodyM);tag(body,'pellicle',true);g.add(body);
  const rAt=s=>.86*Math.pow(Math.sin(Math.PI*Math.pow(clamp(s,.02,.98),.7)),.72);
  const X=s=>(s-.45)*L;
  for(let i=0;i<24;i++){const s=R(.15,.85),a=R(TAU),r=rAt(s)*.72,c=sphere(.3,std(0x2d8a37,{roughness:.5}),'chloroplast',V3(X(s),Math.cos(a)*r,Math.sin(a)*r),V3(1.1,.35,.8),16);
    c.lookAt(c.position.clone().add(V3(0,Math.cos(a),Math.sin(a))));c.rotateY(0);g.add(c)}
  g.add(sphere(.62,std(0xbfd9ae,{roughness:.8}),'nucleus',V3(X(.3),0,0)));g.add(sphere(.2,std(0x4a6b3c),'nucleus',V3(X(.3)+.05,0,.05)));
  for(let i=0;i<8;i++){const s=R(.35,.8),a=R(TAU),r=rAt(s)*.4;g.add(sphere(.16,std(0xf4f1e4),'paramylon',V3(X(s),Math.cos(a)*r,Math.sin(a)*r),V3(1.4,.55,1),12))}
  g.add(sphere(.13,std(0xe5421e,{emissive:0x401006}),'eyespot',V3(X(.84),.1,rAt(.84)*.78),1,14));
  g.add(sphere(.2,mem(0xe6f5ff,{min:.3,max:.9}),'vacuole',V3(X(.88),-.15,-.15)));
  g.add(mesh(new T.TorusGeometry(.2,.06,8,16),std(0x364d35),'flagellum',V3(X(1)-.05,0,0)).rotateY(Math.PI/2));
  const fl=flagellum({start:V3(X(1),0,0),dir:V3(1,.1,0),len:4.6,amp:.55,freq:1.7,speed:11,rad:.07,mat:std(0xcfe8c8,{roughness:.3}),key:'flagellum',helix:true});g.add(fl);
  g.userData.anchors={};
  return{g,update(t,dt){fl.tick(t);g.rotation.x=t*.9;const s=1+.035*Math.sin(t*.9);body.scale.set(s,1/Math.sqrt(s),1/Math.sqrt(s));g.position.y=0}}};

BUILD.giardia=function(){seed(41);const g=new T.Group();
  const geo=new T.SphereGeometry(1,56,44),P=geo.attributes.position;
  const sh=(x,y,z)=>{const a=y<0?1+y*.82:1;return[x*1.8*a,y*(y<0?3.4:2.9),z*.82*(.55+.45*a)]};
  for(let i=0;i<P.count;i++){const o=sh(P.getX(i),P.getY(i),P.getZ(i));P.setXYZ(i,o[0],o[1],o[2])}geo.computeVertexNormals();
  g.add(tag(new T.Mesh(geo,mem(0xb6cfdc,{min:.14,max:.68,power:2})),'body',true));
  const bowl=[];for(let i=0;i<=12;i++){const r=1.3*i/12;bowl.push(new T.Vector2(Math.max(.001,r),-.14*(1-(r/1.3)*(r/1.3))))}
  const disc=mesh(new T.LatheGeometry(bowl.concat([new T.Vector2(1.34,.0)]),40),std(0xdceaf2,{side:T.DoubleSide,roughness:.5}),'disc',V3(0,.85,.78));disc.rotation.x=Math.PI/2;g.add(disc);
  g.add(mesh(new T.TorusGeometry(1.3,.06,8,40),std(0xc9dde8),'disc',V3(0,.85,.76)));
  [-1,1].forEach(s=>{g.add(sphere(.46,std(0xcf9fb8,{roughness:.7}),'nuclei',V3(s*.58,1.35,.45),V3(.8,1.1,.7)));
    g.add(sphere(.12,std(0x5e2a48),'nuclei',V3(s*.58,1.4,.72),1,12));
    const rod=mesh(capsuleGeo(.07,1.0,8),std(0x384e5c),'median',V3(s*.3,-.7,.4));rod.rotation.z=s*.9;g.add(rod)});
  const fls=[],defs=[[.3,2.4,.2,0,1,0,3.2],[.9,-.1,.3,.7,-.3,.1,3.4],[.3,-.5,.5,.2,-1,.1,3.2],[.08,-3.2,0,0,-1,0,3.0]];
  defs.forEach(d=>[-1,1].forEach(s=>{const dir=V3(d[3]*s+(d[3]==0?s*.2:0),d[4],d[5]);
    const f=flagellum({start:V3(d[0]*s,d[1],d[2]),dir,len:d[6],amp:.38,freq:1.6,speed:10+R(3),rad:.06,mat:std(0xdfeef5),key:'flagella'});g.add(f);fls.push(f)}));
  g.userData.anchors={};
  return{g,update(t,dt){fls.forEach(f=>f.tick(t));g.position.y=Math.sin(t*.7)*.1}}};

BUILD.rotifer=function(){seed(53);const g=new T.Group(),k=new T.Group();g.add(k);
  const pr=[[.05,-4],[.3,-3.8],[.34,-3.0],[.4,-2.5],[.62,-2.0],[.85,-1.2],[.98,-.2],[1.0,.8],[.9,1.8],[.68,2.4],[.62,2.8],[.78,3.2],[.82,3.6],[.7,3.95],[.02,4.05]];
  const sp=new T.SplineCurve(pr.map(p=>new T.Vector2(p[0],p[1]))).getPoints(70).map(p=>new T.Vector2(Math.max(.002,p.x),p.y));
  const rAt=y=>{let r=.5;for(let i=1;i<sp.length;i++){if(sp[i].y>=y){r=sp[i-1].x+(sp[i].x-sp[i-1].x)*(y-sp[i-1].y)/(sp[i].y-sp[i-1].y);break}}return r};
  k.add(tag(new T.Mesh(new T.LatheGeometry(sp,40),mem(0xc9e6df,{min:.1,max:.6,power:2})),'cuticle',true));
  [-1.5,-.9,-.3,.3,.9,1.5].forEach(y=>k.add(mesh(new T.TorusGeometry(rAt(y)*1.005,.012,6,40),std(0xe3f4ef,{transparent:true,opacity:.5}),'cuticle',V3(0,y,0)).rotateX(Math.PI/2)));
  const ringN=70,cil=[],coronas=[];[-1,1].forEach(s=>{const c=V3(s*.44,3.85,0);k.add(sphere(.5,mem(0xe7f6ee,{min:.3,max:.85}),'corona',c,V3(1,.22,1),24));
    const arr=new Float32Array(ringN*12),l=lineSegs(arr,0xf2fbf8,.65,'corona');k.add(l);coronas.push({c,s,l,arr})});
  const mast=new T.Group();mast.position.set(0,2.4,.05);mast.add(sphere(.55,std(0xc9b184,{transparent:true,opacity:.85}),'mastax',null,V3(1,.9,.9)));
  const tr=new T.Group();[-1,1].forEach(s=>{const a=mesh(new T.TorusGeometry(.24,.04,6,14,Math.PI),std(0x4a3d2b),'mastax',V3(s*.05,0,.25));a.rotation.z=s>0?Math.PI/2:-Math.PI/2;tr.add(a)});mast.add(tr);k.add(mast);
  k.add(sphere(.62,std(0x9eae4c,{transparent:true,opacity:.88,roughness:.7}),'stomach',V3(0,.5,0),V3(1,1.45,.9)));
  k.add(points(cloud(180,()=>inEllipsoid(.55,.9,.5).add(V3(0,.5,0))),.06,0xd5dd9d,.6,'stomach'));
  k.add(staticTube([V3(0,-.35,0),V3(.0,-1.0,-.2),V3(0,-1.8,-.1)],.12,std(0x8a9a4a),'stomach'));
  k.add(sphere(.4,std(0xe4cfa4,{roughness:.7}),'ovary',V3(.5,-.95,.25),V3(1,1.3,.9)));k.add(sphere(.3,std(0xfff0b8,{roughness:.4,emissive:0x2a2208}),'ovary',V3(.52,-1.05,.45)));
  const bl=sphere(.3,mem(0xcdeeff,{min:.3,max:.9}),'bladder',V3(-.45,-1.55,.1));k.add(bl);
  [-1,1].forEach(s=>k.add(sphere(.07,std(0xc4301a,{emissive:0x501208}),'eyespot',V3(s*.3,3.3,.62),1,10)));
  [-1,1].forEach(s=>{const t2=mesh(new T.ConeGeometry(.1,.55,10),std(0xdbe9e4),'foot',V3(s*.14,-4.1,0));t2.rotation.z=s*.3;t2.rotation.x=Math.PI;k.add(t2)});
  k.rotation.z=.25;g.userData.anchors={};
  return{g,update(t,dt){coronas.forEach(o=>{for(let i=0;i<ringN;i++){const a=i/ringN*TAU,cx=o.c.x+Math.cos(a)*.5,cz=Math.sin(a)*.5,w=Math.sin(t*10-a*3)*.25,
        k0=i*12,o2=o.arr;const ox=Math.cos(a),oz=Math.sin(a);let px=cx,py=o.c.y+.05,pz=cz;
        for(let s=1;s<=2;s++){const f=s/2,qx=cx+ox*.12*f+(-oz)*w*f*o.s*.5,qy=o.c.y+.05+.28*f,qz=cz+oz*.12*f+ox*w*f*o.s*.5;
          o2[k0+(s-1)*6]=px;o2[k0+(s-1)*6+1]=py;o2[k0+(s-1)*6+2]=pz;o2[k0+(s-1)*6+3]=qx;o2[k0+(s-1)*6+4]=qy;o2[k0+(s-1)*6+5]=qz;px=qx;py=qy;pz=qz}}
      o.l.geometry.attributes.position.needsUpdate=true});
    k.scale.y=1+.025*Math.sin(t*.8);tr.rotation.y=Math.sin(t*3)*.25;mast.scale.setScalar(1+.04*Math.sin(t*6));
    const q=(t*.35)%1;bl.scale.setScalar(.35+.65*(q<.85?q/.85:1-(q-.85)*6.6));g.position.y=Math.sin(t*.5)*.1}}};
