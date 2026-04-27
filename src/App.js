import { useState, useEffect, useCallback, useRef } from "react";

const CATS = [
  { id:'computer', name:'Компьютер', icon:'💻', color:'#0ea5e9' },
  { id:'language', name:'Гадаад хэл', icon:'🌍', color:'#f59e0b' },
  { id:'education', name:'Ерөнхий боловсрол', icon:'🎓', color:'#10b981' },
];
const ADMIN = { username:'Admin', password:'99033062' };
const defCourses = [
  { id:'c1', title:'Excel програмын анхан шат', cat:'computer', teacherId:'admin', teacherName:'Админ', price:18000, isFree:false, students:142, rating:4.7, desc:'Excel програмын бүрэн сургалт.', lessons:[{title:'Excel-ийн бүтэц',videoUrl:''},{title:'Формула бичих',videoUrl:''},{title:'SUM, AVERAGE функц',videoUrl:''},{title:'Диаграмм үүсгэх',videoUrl:''}], color:'#1e40af', createdAt:Date.now()-86400000*30 },
  { id:'c2', title:'Microsoft Word дунд шат', cat:'computer', teacherId:'admin', teacherName:'Админ', price:0, isFree:true, students:89, rating:4.5, desc:'Word програмын дунд шатны сургалт.', lessons:[{title:'Breaks ашиглах',videoUrl:''},{title:'Headers & Footers',videoUrl:''},{title:'Table of Contents',videoUrl:''}], color:'#2563eb', createdAt:Date.now()-86400000*20 },
  { id:'c3', title:'Англи хэл | Анхан шат', cat:'language', teacherId:'admin', teacherName:'Админ', price:25000, isFree:false, students:320, rating:4.8, desc:'Англи хэлний анхан шатны цогц сургалт.', lessons:[{title:'Alphabet',videoUrl:''},{title:'Grammar',videoUrl:''},{title:'Conversation',videoUrl:''}], color:'#dc2626', createdAt:Date.now()-86400000*15 },
  { id:'c4', title:'Монгол бичиг | Анхан шат', cat:'education', teacherId:'admin', teacherName:'Админ', price:9900, isFree:false, students:450, rating:4.9, desc:'Монгол бичгийн үсэг, дүрэм.', lessons:[{title:'Үсгийн бүтэц',videoUrl:''},{title:'Үндсэн дүрэм',videoUrl:''},{title:'Өгүүлбэр бичих',videoUrl:''}], color:'#b91c1c', createdAt:Date.now()-86400000*10 },
  { id:'c5', title:'Физик | 12-р анги ЭЕШ', cat:'education', teacherId:'admin', teacherName:'Админ', price:0, isFree:true, students:567, rating:4.6, desc:'ЭЕШ бэлтгэл.', lessons:[{title:'Кинематик',videoUrl:''},{title:'Динамик',videoUrl:''},{title:'Энерги',videoUrl:''}], color:'#7c3aed', createdAt:Date.now()-86400000*5 },
  { id:'c6', title:'Python програмчлал', cat:'computer', teacherId:'admin', teacherName:'Админ', price:35000, isFree:false, students:210, rating:4.7, desc:'Python хэлний үндэс.', lessons:[{title:'Variables',videoUrl:''},{title:'Functions',videoUrl:''},{title:'OOP',videoUrl:''}], color:'#059669', createdAt:Date.now()-86400000*3 },
];
const defNews = [
  { id:'n1', title:'EduMN платформ нээгдлээ!', content:'Манай платформ албан ёсоор нээгдлээ.', date:Date.now()-86400000*30 },
  { id:'n2', title:'Шинэ багш нар элслээ', content:'Энэ сард 5 шинэ багш нэгдлээ.', date:Date.now()-86400000*7 },
];
const fmt=p=>p===0?'ҮНЭГҮЙ':p.toLocaleString()+'₮';
const gid=()=>Math.random().toString(36).substr(2,9);
const ago=ts=>{const d=Math.floor((Date.now()-ts)/86400000);return d===0?'Өнөөдөр':d===1?'Өчигдөр':d<30?d+' өдрийн өмнө':Math.floor(d/30)+' сарын өмнө';};
const ytId=url=>{if(!url)return null;const m=url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|.*&v=))([^&?\s]{11})/);return m?m[1]:null;};
const S={primary:'#0d9488',primaryDark:'#0f766e',primaryLight:'#ccfbf1',accent:'#f59e0b',danger:'#ef4444',success:'#10b981',bg:'#f0fdf4',text:'#1e293b',muted:'#94a3b8',border:'#e2e8f0',shadow:'0 1px 3px rgba(0,0,0,0.06)',shadowLg:'0 10px 25px rgba(0,0,0,0.08)',font:"'Noto Sans',-apple-system,sans-serif"};

export default function App(){
  const [user,setUser]=useState(null);
  const [page,setPage]=useState('home');
  const [courses,setCourses]=useState(defCourses);
  const [news,setNews]=useState(defNews);
  const [teachers,setTeachers]=useState([]);
  const [pending,setPending]=useState([]);
  const [users,setUsers]=useState([]);
  const [enrolls,setEnrolls]=useState([]);
  const [sel,setSel]=useState(null);
  const [cat,setCat]=useState('all');
  const [q,setQ]=useState('');
  const [payModal,setPayModal]=useState(false);
  const [avatars,setAvatars]=useState({});
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{(async()=>{try{
    const ks=['edumn-c3','edumn-n','edumn-t3','edumn-p3','edumn-u2','edumn-e','edumn-av2'];
    const ss=[setCourses,setNews,setTeachers,setPending,setUsers,setEnrolls,setAvatars];
    const rs=await Promise.all(ks.map(k=>Promise.resolve(localStorage.getItem(k)?{value:localStorage.getItem(k)}:null)));
    rs.forEach((r,i)=>{if(r?.value)ss[i](JSON.parse(r.value));});
  }catch(e){}setLoaded(true);})();},[]);

  const sv=useCallback(async(k,d)=>{try{localStorage.setItem(k,JSON.stringify(d));}catch(e){}},[]);
  useEffect(()=>{if(loaded)sv('edumn-c3',courses);},[courses,loaded,sv]);
  useEffect(()=>{if(loaded)sv('edumn-n',news);},[news,loaded,sv]);
  useEffect(()=>{if(loaded)sv('edumn-t3',teachers);},[teachers,loaded,sv]);
  useEffect(()=>{if(loaded)sv('edumn-p3',pending);},[pending,loaded,sv]);
  useEffect(()=>{if(loaded)sv('edumn-u2',users);},[users,loaded,sv]);
  useEffect(()=>{if(loaded)sv('edumn-e',enrolls);},[enrolls,loaded,sv]);
  useEffect(()=>{if(loaded)sv('edumn-av2',avatars);},[avatars,loaded,sv]);

  const login=(un,pw)=>{
    if(un===ADMIN.username&&pw===ADMIN.password){setUser({id:'admin',name:'Админ',role:'admin'});setPage('admin');return true;}
    const t=teachers.find(x=>x.username===un&&x.password===pw);
    if(t){setUser({...t,role:'teacher'});setPage('teacher');return true;}
    const u=users.find(x=>x.username===un&&x.password===pw);
    if(u){setUser({...u,role:'user'});setPage('home');return true;}
    return false;
  };
  const register=(d)=>{
    if([...users,...teachers,...pending].find(x=>x.username===d.username)||d.username===ADMIN.username)return'Энэ нэр бүртгэлтэй байна';
    if([...users,...teachers,...pending].find(x=>x.email===d.email))return'Энэ имэйл бүртгэлтэй байна';
    const nu={id:gid(),...d,createdAt:Date.now()};
    if(d.role==='teacher'){setPending(p=>[...p,{...nu,status:'pending'}]);return'ok-teacher';}
    setUsers(u=>[...u,nu]);setUser({...nu,role:'user'});setPage('home');return'ok';
  };
  const approve=id=>{const t=pending.find(p=>p.id===id);if(t){setTeachers(p=>[...p,{...t,status:'approved'}]);setPending(p=>p.filter(x=>x.id!==id));}};
  const reject=id=>setPending(p=>p.filter(x=>x.id!==id));
  const rmTeacher=id=>{setTeachers(p=>p.filter(t=>t.id!==id));setCourses(p=>p.filter(c=>c.teacherId!==id));};
  const addCourse=d=>setCourses(p=>[{id:gid(),...d,students:0,rating:0,createdAt:Date.now()},...p]);
  const updCourse=(id,d)=>setCourses(p=>p.map(c=>c.id===id?{...c,...d}:c));
  const delCourse=id=>setCourses(p=>p.filter(c=>c.id!==id));
  const enroll=cid=>{if(!user){setPage('login');return;}if(!enrolls.find(e=>e.cid===cid&&e.uid===user.id)){setEnrolls(p=>[...p,{cid,uid:user.id}]);setCourses(p=>p.map(c=>c.id===cid?{...c,students:(c.students||0)+1}:c));}};
  const addNews=d=>setNews(p=>[{id:gid(),...d,date:Date.now()},...p]);
  const delNews=id=>setNews(p=>p.filter(n=>n.id!==id));
  const setAvatar=(uid,src)=>setAvatars(p=>({...p,[uid]:src}));
  const getAv=uid=>avatars[uid]||null;

  const logout=()=>{setUser(null);setPage('home');};
  const goHome=()=>{setPage('home');setSel(null);setQ('');setCat('all');};
  const openC=c=>{setSel(c);setPage('detail');};
  const filt=cat==='all'?courses:courses.filter(c=>c.cat===cat);
  const sres=q?courses.filter(c=>c.title.toLowerCase().includes(q.toLowerCase())):[];
  const isEnr=cid=>enrolls.some(e=>e.cid===cid&&e.uid===user?.id);

  if(!loaded)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:S.font,color:S.primary}}><div style={{textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>🎓</div>Ачааллаж байна...</div></div>;

  return(<div style={{minHeight:'100vh',background:S.bg,fontFamily:S.font,color:S.text}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}input,select,textarea{font-family:${S.font};font-size:14px}button{font-family:${S.font};cursor:pointer}::placeholder{color:${S.muted}}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.ch:hover{transform:translateY(-4px);box-shadow:${S.shadowLg}}.bh:hover{filter:brightness(0.92)}`}</style>

    {/* HEADER */}
    <header style={{background:`linear-gradient(135deg,${S.primary},${S.primaryDark})`,position:'sticky',top:0,zIndex:1000,boxShadow:'0 4px 20px rgba(13,148,136,0.3)'}}>
      <div style={{maxWidth:1140,margin:'0 auto',padding:'0 24px',height:60,display:'flex',alignItems:'center',gap:16}}>
        <div onClick={goHome} style={{display:'flex',alignItems:'center',gap:10,color:'#fff',cursor:'pointer',flexShrink:0}}>
          <div style={{width:38,height:38,background:'rgba(255,255,255,0.2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🎓</div>
          <div style={{lineHeight:1.15}}><div style={{fontSize:20,fontWeight:800}}>EduMN</div><div style={{fontSize:10,opacity:0.8}}>Мэдлэг бол хөрөнгө</div></div>
        </div>
        <div style={{flex:1,maxWidth:400,position:'relative'}}>
          <input value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPage('search');else if(page==='search')setPage('home');}} placeholder="Сургалт хайх..." style={{width:'100%',padding:'9px 38px 9px 14px',border:'2px solid rgba(255,255,255,0.25)',borderRadius:10,fontSize:13,background:'rgba(255,255,255,0.95)',outline:'none'}}/>
          <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:14,opacity:0.5}}>🔍</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto',flexShrink:0,flexWrap:'wrap'}}>
          {user?<>
            {user.role==='admin'&&<HBtn onClick={()=>setPage('admin')}>⚙️ Админ</HBtn>}
            {user.role==='teacher'&&<HBtn onClick={()=>setPage('teacher')}>📋 Хичээлүүд</HBtn>}
            <HBtn onClick={()=>setPage('my')}>📚 Миний</HBtn>
            <div style={{display:'flex',alignItems:'center',gap:6,color:'#fff',fontSize:13}}>
              <Av uid={user.id} name={user.name} src={getAv(user.id)} sz={28}/>
              <span style={{fontWeight:600,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</span>
              <span style={{fontSize:9,background:'rgba(255,255,255,0.2)',padding:'2px 7px',borderRadius:20}}>{user.role==='admin'?'Админ':user.role==='teacher'?'Багш':'Суралцагч'}</span>
            </div>
            <HBtn onClick={logout}>Гарах</HBtn>
          </>:<>
            <button onClick={()=>setPage('login')} className="bh" style={{padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:600,border:'none',background:'#fff',color:S.primary}}>Нэвтрэх</button>
            <HBtn onClick={()=>setPage('register')}>Бүртгүүлэх</HBtn>
          </>}
        </div>
      </div>
    </header>

    {/* NAV */}
    {!['login','register','admin','teacher'].includes(page)&&<nav style={{background:'#fff',borderBottom:`1px solid ${S.border}`,boxShadow:S.shadow}}>
      <div style={{maxWidth:1140,margin:'0 auto',padding:'0 24px',display:'flex',gap:2,overflowX:'auto'}}>
        {[{id:'home',name:'Нүүр',icon:'🏠'},...CATS.map(c=>({id:c.id,name:c.name,icon:c.icon}))].map(it=>{
          const a=(it.id==='home'&&page==='home'&&cat==='all')||(page==='cat'&&cat===it.id);
          return<button key={it.id} onClick={()=>{if(it.id==='home')goHome();else{setCat(it.id);setPage('cat');setSel(null);}}} style={{display:'flex',alignItems:'center',gap:6,padding:'13px 16px',fontSize:13,fontWeight:a?700:500,color:a?S.primary:S.muted,borderBottom:a?`3px solid ${S.primary}`:'3px solid transparent',background:'none',border:'none',whiteSpace:'nowrap',cursor:'pointer',transition:'all 0.2s'}}>{it.icon} {it.name}</button>;
        })}
      </div>
    </nav>}

    <main style={{maxWidth:1140,margin:'0 auto',padding:'0 24px',minHeight:'60vh'}}>
      {page==='login'&&<LoginP onLogin={login} goR={()=>setPage('register')} goH={goHome}/>}
      {page==='register'&&<RegisterP onReg={register} goL={()=>setPage('login')} goH={goHome}/>}
      {page==='admin'&&user?.role==='admin'&&<AdminP teachers={teachers} pending={pending} courses={courses} news={news} onApprove={approve} onReject={reject} onRm={rmTeacher} onDelC={delCourse} onAddN={addNews} onDelN={delNews} getAv={getAv}/>}
      {page==='teacher'&&user?.role==='teacher'&&<TeacherP user={user} setUser={setUser} courses={courses.filter(c=>c.teacherId===user.id)} onAdd={d=>addCourse({...d,teacherId:user.id,teacherName:user.name})} onDel={delCourse} onUpd={updCourse} av={getAv(user.id)} onAv={d=>setAvatar(user.id,d)}/>}

      {page==='home'&&<div style={{animation:'fadeUp 0.4s'}}>
        <div style={{background:`linear-gradient(135deg,#134e4a,${S.primaryDark},${S.primary})`,borderRadius:16,padding:'40px 36px',margin:'24px 0',color:'#fff',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',right:-40,top:-40,width:200,height:200,background:'rgba(255,255,255,0.05)',borderRadius:'50%'}}/>
          <h1 style={{fontSize:28,fontWeight:800,marginBottom:12}}>Мэдлэг бол хөрөнгө 📖</h1>
          <p style={{fontSize:15,opacity:0.85,marginBottom:24,lineHeight:1.7,maxWidth:520}}>Мэргэжлийн багш нараас видео хичээлүүдийг үзэж суралцаарай.</p>
          <button onClick={()=>{setCat('all');setPage('cat');}} className="bh" style={{background:'#fff',color:S.primaryDark,padding:'11px 26px',borderRadius:10,fontSize:14,fontWeight:700,border:'none'}}>Бүх сургалт →</button>
        </div>
        {news.length>0&&<div style={{marginBottom:28}}><h2 style={{fontSize:18,fontWeight:700,marginBottom:14}}>📢 Мэдээ</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>{news.slice(0,3).map(n=><div key={n.id} style={{background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:S.shadow,borderLeft:`4px solid ${S.primary}`}}><h3 style={{fontSize:14,fontWeight:700,marginBottom:4}}>{n.title}</h3><p style={{fontSize:12,color:S.muted,lineHeight:1.6}}>{n.content.substring(0,80)}</p><span style={{fontSize:11,color:S.muted}}>{ago(n.date)}</span></div>)}</div></div>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:28}}>
          {CATS.map(c=><button key={c.id} onClick={()=>{setCat(c.id);setPage('cat');}} className="ch" style={{background:'#fff',borderRadius:14,padding:'22px 18px',boxShadow:S.shadow,border:'none',textAlign:'left',cursor:'pointer',transition:'all 0.3s',display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:48,height:48,borderRadius:12,background:`${c.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{c.icon}</div>
            <div><div style={{fontSize:15,fontWeight:700}}>{c.name}</div><div style={{fontSize:12,color:S.muted}}>{courses.filter(x=>x.cat===c.id).length} сургалт</div></div>
          </button>)}
        </div>
        <Grid t="Шинэ сургалтууд" l={courses.slice(0,4)} onO={openC} gA={getAv} onM={()=>{setCat('all');setPage('cat');}}/>
        <Grid t="Их суралцсан" l={[...courses].sort((a,b)=>(b.students||0)-(a.students||0)).slice(0,4)} onO={openC} gA={getAv}/>
        <Grid t="Үнэгүй" l={courses.filter(c=>c.isFree).slice(0,4)} onO={openC} gA={getAv}/>
      </div>}

      {page==='cat'&&<div style={{animation:'fadeUp 0.3s',paddingTop:24}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>{CATS.find(c=>c.id===cat)?.name||'Бүх'} сургалтууд</h2>
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {['all',...CATS.map(c=>c.id)].map(id=><button key={id} onClick={()=>setCat(id)} className="bh" style={{padding:'8px 18px',borderRadius:30,fontSize:12,fontWeight:600,border:'none',background:cat===id?S.primary:'#fff',color:cat===id?'#fff':S.muted,boxShadow:S.shadow}}>{id==='all'?'Бүгд':CATS.find(c=>c.id===id)?.name}</button>)}
        </div>
        {filt.length>0?<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:36}}>{filt.map(c=><CC key={c.id} c={c} onClick={openC} av={getAv(c.teacherId)}/>)}</div>:<MT i="📭" t="Олдсонгүй"/>}
      </div>}

      {page==='search'&&<div style={{paddingTop:24}}><h2 style={{fontSize:18,fontWeight:600,marginBottom:16}}>"{q}" — <span style={{color:S.muted,fontWeight:400}}>{sres.length} үр дүн</span></h2>
        {sres.length>0?<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:36}}>{sres.map(c=><CC key={c.id} c={c} onClick={openC} av={getAv(c.teacherId)}/>)}</div>:<MT i="🔍" t="Олдсонгүй"/>}
      </div>}

      {page==='detail'&&sel&&<Detail c={sel} enr={isEnr(sel.id)} user={user} av={getAv(sel.teacherId)}
        onEnroll={()=>{if(!user){setPage('login');return;}if(sel.isFree||sel.price===0)enroll(sel.id);else setPayModal(true);}}
        onBuy={()=>{enroll(sel.id);setPayModal(false);}} showPay={payModal} setPay={setPayModal}/>}

      {page==='my'&&user&&<div style={{paddingTop:24,animation:'fadeUp 0.3s'}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>📚 Миний сургалтууд</h2>
        {enrolls.filter(e=>e.uid===user.id).length>0?enrolls.filter(e=>e.uid===user.id).map(e=>{
          const c=courses.find(x=>x.id===e.cid);if(!c)return null;
          return<div key={e.cid} onClick={()=>openC(c)} className="ch" style={{display:'flex',background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:S.shadow,marginBottom:14,cursor:'pointer',transition:'all 0.3s'}}>
            <div style={{width:180,minHeight:100,background:`linear-gradient(135deg,${c.color},${c.color}cc)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:12,textAlign:'center',padding:12}}>{c.title}</div>
            <div style={{padding:'14px 18px',flex:1}}><h3 style={{fontSize:15,fontWeight:700,marginBottom:4}}>{c.title}</h3><div style={{fontSize:12,color:S.muted}}>👤 {c.teacherName}</div></div>
          </div>;
        }):<MT i="📚" t="Бүртгүүлсэн сургалт байхгүй"/>}
      </div>}
    </main>

    <footer style={{background:'#134e4a',color:'rgba(255,255,255,0.7)',padding:'36px 0 16px',marginTop:50}}>
      <div style={{maxWidth:1140,margin:'0 auto',padding:'0 24px',display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:32,marginBottom:24}}>
        <div><h3 style={{color:'#fff',fontSize:18,fontWeight:800,marginBottom:10}}>🎓 EduMN</h3><p style={{fontSize:12,lineHeight:1.8}}>Монголын чанартай онлайн сургалтын платформ.</p></div>
        <div><h4 style={{color:'#fff',fontSize:13,fontWeight:600,marginBottom:10}}>Ангилал</h4><div style={{fontSize:12,lineHeight:2.4}}>{CATS.map(c=><div key={c.id}>{c.icon} {c.name}</div>)}</div></div>
        <div><h4 style={{color:'#fff',fontSize:13,fontWeight:600,marginBottom:10}}>Мэдээлэл</h4><div style={{fontSize:12,lineHeight:2.4}}>Бидний тухай<br/>Үйлчилгээний нөхцөл</div></div>
        <div><h4 style={{color:'#fff',fontSize:13,fontWeight:600,marginBottom:10}}>Холбоо барих</h4><div style={{fontSize:12,lineHeight:2.4}}>📞 9903-3062<br/>📧 contact@edumn.mn<br/>📍 Улаанбаатар</div></div>
      </div>
      <div style={{maxWidth:1140,margin:'0 auto',padding:'14px 24px 0',borderTop:'1px solid rgba(255,255,255,0.1)',textAlign:'center',fontSize:11}}>© 2024 EduMN</div>
    </footer>
  </div>);
}

// === HELPERS ===
function HBtn({children,onClick}){return<button onClick={onClick} className="bh" style={{padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:600,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.15)',color:'#fff'}}>{children}</button>;}
function MT({i,t,s}){return<div style={{textAlign:'center',padding:'48px 20px',color:S.muted}}><div style={{fontSize:44,marginBottom:10}}>{i}</div><h3 style={{fontSize:16,fontWeight:600,color:S.text,marginBottom:4}}>{t}</h3>{s&&<p style={{fontSize:13}}>{s}</p>}</div>;}
function Av({uid,name,src,sz=28}){return src?<img src={src} alt="" style={{width:sz,height:sz,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>:<div style={{width:sz,height:sz,borderRadius:'50%',background:S.accent,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:sz*0.4,color:'#fff',flexShrink:0}}>{name?.[0]||'?'}</div>;}

function ImgPick({src,onPick,sz=80}){
  const ref=useRef();
  const go=e=>{const f=e.target.files[0];if(!f)return;if(f.size>500000){alert('500KB-аас бага зураг оруулна уу');return;}const r=new FileReader();r.onload=ev=>onPick(ev.target.result);r.readAsDataURL(f);};
  return<div style={{textAlign:'center'}}><div onClick={()=>ref.current.click()} style={{width:sz,height:sz,borderRadius:'50%',margin:'0 auto',cursor:'pointer',overflow:'hidden',border:`3px dashed ${S.border}`,display:'flex',alignItems:'center',justifyContent:'center',background:'#f8fafc',position:'relative'}}>
    {src?<img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{textAlign:'center',color:S.muted,fontSize:11}}><div style={{fontSize:24}}>📷</div>Зураг</div>}
    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:10,padding:'3px 0',textAlign:'center'}}>Солих</div>
  </div><input ref={ref} type="file" accept="image/*" onChange={go} style={{display:'none'}}/></div>;
}

function CC({c,onClick,av}){return<div onClick={()=>onClick(c)} className="ch" style={{background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:S.shadow,cursor:'pointer',transition:'all 0.3s',display:'flex',flexDirection:'column'}}>
  <div style={{height:120,background:`linear-gradient(135deg,${c.color||S.primary},${c.color||S.primary}bb)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,padding:16,textAlign:'center',lineHeight:1.4,position:'relative'}}>
    {c.title}{c.isFree&&<span style={{position:'absolute',top:8,right:8,background:S.success,color:'#fff',padding:'2px 10px',borderRadius:20,fontSize:10,fontWeight:700}}>ҮНЭГҮЙ</span>}
  </div>
  <div style={{padding:'12px 14px',flex:1,display:'flex',flexDirection:'column'}}>
    <div style={{fontSize:11,color:S.muted,marginBottom:6,display:'flex',alignItems:'center',gap:6}}><Av uid={c.teacherId} name={c.teacherName} src={av} sz={20}/>{c.teacherName}</div>
    <div style={{fontSize:13,fontWeight:600,lineHeight:1.4,marginBottom:8,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{c.title}</div>
    <div style={{marginTop:'auto',display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:`1px solid ${S.border}`}}>
      <span style={{fontSize:11,color:S.muted}}>👤 {(c.students||0).toLocaleString()}</span>
      <span style={{fontSize:14,fontWeight:700,color:c.isFree?S.success:S.text}}>{c.isFree?'ҮНЭГҮЙ':fmt(c.price)}</span>
    </div>
  </div>
</div>;}

function Grid({t,l,onO,gA,onM}){if(!l.length)return null;return<div style={{marginBottom:30}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><h2 style={{fontSize:18,fontWeight:700}}>{t}</h2>{onM&&<button onClick={onM} style={{color:S.primary,fontSize:13,fontWeight:500,background:'none',border:'none',cursor:'pointer'}}>Бүгдийг үзэх →</button>}</div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>{l.map(c=><CC key={c.id} c={c} onClick={onO} av={gA(c.teacherId)}/>)}</div>
</div>;}

// === DETAIL ===
function Detail({c,enr,user,av,onEnroll,onBuy,showPay,setPay}){
  const [tab,setTab]=useState('intro');
  const [playing,setPlaying]=useState(null);
  const stars=r=>Array.from({length:5},(_,i)=><span key={i} style={{color:i<Math.round(r||0)?'#f59e0b':'#ddd'}}>★</span>);

  return<div style={{paddingTop:24,animation:'fadeUp 0.3s'}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:24,alignItems:'start'}}>
      <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:S.shadow}}>
        {/* VIDEO or BANNER */}
        {playing!==null&&c.lessons?.[playing]?<div style={{padding:16,background:'#0f172a'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <h3 style={{color:'#fff',fontSize:14,fontWeight:600}}>▶ {c.lessons[playing].title}</h3>
            <button onClick={()=>setPlaying(null)} style={{background:'rgba(255,255,255,0.1)',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontSize:12,cursor:'pointer'}}>✕ Хаах</button>
          </div>
          {(()=>{const l=c.lessons[playing];const yt=ytId(l.videoUrl);
            if(yt)return<div style={{position:'relative',paddingBottom:'56.25%',height:0,borderRadius:8,overflow:'hidden'}}><iframe src={`https://www.youtube.com/embed/${yt}?autoplay=1`} title="v" frameBorder="0" allow="autoplay;encrypted-media" allowFullScreen style={{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}/></div>;
            if(l.videoUrl)return<video controls autoPlay style={{width:'100%',borderRadius:8}} src={l.videoUrl}/>;
            return<div style={{background:'#1e293b',borderRadius:8,padding:40,textAlign:'center',color:S.muted}}><div style={{fontSize:48}}>🎬</div>Видео оруулаагүй</div>;
          })()}
        </div>
        :<div style={{height:180,background:`linear-gradient(135deg,${c.color||S.primary},${c.color||S.primary}bb)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <h1 style={{color:'#fff',fontSize:22,fontWeight:800,textAlign:'center',padding:20}}>{c.title}</h1>
        </div>}

        <div style={{display:'flex',borderBottom:`1px solid ${S.border}`,padding:'0 20px'}}>
          {['intro','lessons'].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'12px 16px',fontSize:13,fontWeight:tab===t?700:500,color:tab===t?S.primary:S.muted,borderBottom:tab===t?`3px solid ${S.primary}`:'3px solid transparent',background:'none',border:'none',cursor:'pointer'}}>{t==='intro'?'Танилцуулга':`Хичээл (${c.lessons?.length||0})`}</button>)}
        </div>
        <div style={{padding:22}}>
          <div style={{display:'flex',gap:16,marginBottom:20,fontSize:13,color:S.muted,flexWrap:'wrap'}}><span>{stars(c.rating)} ({c.rating||0})</span><span>👤 {(c.students||0).toLocaleString()}</span><span>📖 {c.lessons?.length||0} хичээл</span></div>
          {tab==='intro'&&<><p style={{fontSize:14,color:'#475569',lineHeight:1.8,marginBottom:20}}>{c.desc}</p>{c.lessons&&<><h3 style={{fontSize:16,fontWeight:700,marginBottom:12}}>📚 Юу сурах вэ?</h3><ul style={{listStyle:'none',padding:0}}>{c.lessons.map((l,i)=><li key={i} style={{display:'flex',gap:8,padding:'7px 0',fontSize:13}}><span style={{color:S.primary,fontWeight:700}}>✓</span>{l.title||l}</li>)}</ul></>}</>}
          {tab==='lessons'&&(c.lessons?<div>{c.lessons.map((l,i)=>{
            const has=l.videoUrl&&l.videoUrl.length>0;
            return<div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'14px 0',borderBottom:`1px solid ${S.border}`,fontSize:14}}>
              <button onClick={()=>{if(has&&enr)setPlaying(i);}} style={{width:36,height:36,borderRadius:'50%',background:has?(enr?S.primary:'#e2e8f0'):S.border,display:'flex',alignItems:'center',justifyContent:'center',color:has&&enr?'#fff':S.muted,fontSize:12,fontWeight:700,border:'none',cursor:has&&enr?'pointer':'default',flexShrink:0}}>▶</button>
              <span style={{flex:1,fontWeight:500}}>{i+1}. {l.title}</span>
              {has?<span style={{fontSize:11,color:S.success,fontWeight:600,background:`${S.success}15`,padding:'3px 10px',borderRadius:20}}>🎬 Видео</span>
                :<span style={{fontSize:11,color:S.muted}}>Удахгүй</span>}
              {has&&!enr&&<span style={{fontSize:11,color:S.muted}}>🔒</span>}
            </div>;
          })}</div>:<MT i="📹" t="Удахгүй"/>)}
        </div>
      </div>
      {/* SIDEBAR */}
      <div style={{background:'#fff',borderRadius:14,boxShadow:S.shadowLg,overflow:'hidden',position:'sticky',top:80}}>
        <div style={{padding:22,textAlign:'center',borderBottom:`1px solid ${S.border}`}}><Av uid={c.teacherId} name={c.teacherName} src={av} sz={60}/><div style={{fontSize:11,color:S.muted,marginTop:8}}>Багш</div><div style={{fontSize:15,fontWeight:700}}>{c.teacherName}</div></div>
        <div style={{padding:22}}>
          <div style={{fontSize:24,fontWeight:800,color:c.isFree?S.success:S.primary,marginBottom:14}}>{c.isFree?'ҮНЭГҮЙ':fmt(c.price)}</div>
          {enr?<button style={{background:S.success,color:'#fff',padding:'12px 0',borderRadius:10,fontSize:14,fontWeight:700,width:'100%',border:'none'}}>▶ Үргэлжлүүлэх</button>
          :<button onClick={onEnroll} className="bh" style={{background:S.primary,color:'#fff',padding:'12px 0',borderRadius:10,fontSize:14,fontWeight:700,width:'100%',border:'none'}}>{c.isFree?'✓ Бүртгүүлэх':'🛒 Худалдаж авах'}</button>}
        </div>
      </div>
    </div>
    {showPay&&<div onClick={()=>setPay(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:20,width:400,maxWidth:'95vw',overflow:'hidden'}}>
        <div style={{padding:'18px 22px',borderBottom:`1px solid ${S.border}`,display:'flex',justifyContent:'space-between'}}><h3 style={{fontSize:16,fontWeight:700}}>💳 Төлбөр</h3><button onClick={()=>setPay(false)} style={{width:28,height:28,borderRadius:'50%',background:'#f1f5f9',border:'none',fontSize:14}}>✕</button></div>
        <div style={{padding:28,textAlign:'center'}}><div style={{width:140,height:140,margin:'0 auto 16px',background:'#f8fafc',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',border:`2px dashed ${S.border}`}}><div style={{color:S.muted}}><div style={{fontSize:32,marginBottom:6}}>📱</div>QR код</div></div>
          <button onClick={onBuy} className="bh" style={{padding:'10px 24px',background:S.primary,color:'#fff',borderRadius:10,fontSize:13,fontWeight:600,border:'none'}}>Баталгаажуулах</button></div>
        <div style={{background:S.primary,color:'#fff',textAlign:'center',padding:14,fontWeight:600}}>Дүн: <span style={{fontSize:18,fontWeight:800,marginLeft:6}}>{fmt(c.price)}</span></div>
      </div>
    </div>}
  </div>;
}

// === LOGIN ===
function LoginP({onLogin,goR,goH}){
  const [u,setU]=useState('');const [p,setP]=useState('');const [e,setE]=useState('');
  const go=ev=>{ev.preventDefault();if(!onLogin(u,p))setE('Нэвтрэх нэр эсвэл нууц үг буруу');};
  return<div style={{maxWidth:380,margin:'60px auto',animation:'fadeUp 0.4s'}}><div style={{background:'#fff',borderRadius:16,padding:'36px 30px',boxShadow:S.shadowLg}}>
    <div style={{textAlign:'center',marginBottom:24}}><div style={{fontSize:44,marginBottom:8}}>🎓</div><h1 style={{fontSize:22,fontWeight:800}}>EduMN нэвтрэх</h1></div>
    <form onSubmit={go}>
      {e&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:S.danger}}>{e}</div>}
      <Lbl>Нэвтрэх нэр</Lbl><Inp v={u} set={v=>{setU(v);setE('');}} ph="Нэвтрэх нэр"/>
      <Lbl>Нууц үг</Lbl><Inp v={p} set={v=>{setP(v);setE('');}} ph="Нууц үг" tp="password"/>
      <button type="submit" className="bh" style={{width:'100%',padding:'12px',background:S.primary,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700,marginTop:6}}>Нэвтрэх</button>
    </form>
    <div style={{textAlign:'center',marginTop:16,fontSize:13}}>Бүртгэл байхгүй? <button onClick={goR} style={{color:S.primary,fontWeight:600,background:'none',border:'none',cursor:'pointer',fontSize:13}}>Бүртгүүлэх</button></div>
    <button onClick={goH} style={{display:'block',margin:'10px auto 0',color:S.muted,background:'none',border:'none',cursor:'pointer',fontSize:12}}>← Нүүр</button>
  </div></div>;
}

// === REGISTER ===
function RegisterP({onReg,goL,goH}){
  const [f,setF]=useState({name:'',username:'',email:'',password:'',password2:'',role:'user'});
  const [e,setE]=useState('');const [ok,setOk]=useState('');
  const go=ev=>{ev.preventDefault();
    if(!f.name||!f.username||!f.email||!f.password){setE('Бүх талбарыг бөглөнө үү');return;}
    if(!f.email.includes('@')){setE('Имэйл хаяг буруу байна');return;}
    if(f.password.length<4){setE('Нууц үг 4+ тэмдэгт');return;}
    if(f.password!==f.password2){setE('Нууц үг таарахгүй байна');return;}
    const r=onReg(f);if(r==='ok')return;if(r==='ok-teacher'){setOk('Хүсэлт илгээгдлээ! Админ зөвшөөрсний дараа нэвтэрнэ.');return;}setE(r);
  };
  return<div style={{maxWidth:420,margin:'60px auto',animation:'fadeUp 0.4s'}}><div style={{background:'#fff',borderRadius:16,padding:'36px 30px',boxShadow:S.shadowLg}}>
    <div style={{textAlign:'center',marginBottom:24}}><div style={{fontSize:44,marginBottom:8}}>📝</div><h1 style={{fontSize:22,fontWeight:800}}>Бүртгүүлэх</h1></div>
    {ok?<div style={{textAlign:'center'}}><div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:18,marginBottom:14,fontSize:13,color:'#166534',lineHeight:1.7}}>✅ {ok}</div><button onClick={goL} className="bh" style={{padding:'10px 22px',background:S.primary,color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:600}}>Нэвтрэх</button></div>
    :<form onSubmit={go}>
      {e&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:S.danger}}>{e}</div>}
      <Lbl>Эрхийн төрөл</Lbl>
      <div style={{display:'flex',gap:10,marginBottom:16}}>
        {[['user','🧑 Суралцагч'],['teacher','🎓 Багш']].map(([v,l])=><button key={v} type="button" onClick={()=>setF(x=>({...x,role:v}))} style={{flex:1,padding:'10px',borderRadius:10,border:f.role===v?`2px solid ${S.primary}`:`2px solid ${S.border}`,background:f.role===v?S.primaryLight:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',color:f.role===v?S.primaryDark:S.muted}}>{l}</button>)}
      </div>
      <Lbl>Нэр</Lbl><Inp v={f.name} set={v=>setF(x=>({...x,name:v}))} ph="Таны нэр"/>
      <Lbl>Имэйл хаяг</Lbl><Inp v={f.email} set={v=>setF(x=>({...x,email:v}))} ph="example@mail.com" tp="email"/>
      <Lbl>Нэвтрэх нэр</Lbl><Inp v={f.username} set={v=>{setF(x=>({...x,username:v}));setE('');}} ph="Нэвтрэх нэр"/>
      <Lbl>Нууц үг</Lbl><Inp v={f.password} set={v=>setF(x=>({...x,password:v}))} ph="Нууц үг (4+ тэмдэгт)" tp="password"/>
      <Lbl>Нууц үг давтах</Lbl><Inp v={f.password2} set={v=>setF(x=>({...x,password2:v}))} ph="Нууц үг дахин бичнэ үү" tp="password"/>
      {f.password2&&f.password!==f.password2&&<div style={{fontSize:12,color:S.danger,marginTop:-8,marginBottom:8}}>⚠️ Нууц үг таарахгүй байна</div>}
      {f.password2&&f.password===f.password2&&f.password.length>=4&&<div style={{fontSize:12,color:S.success,marginTop:-8,marginBottom:8}}>✓ Нууц үг таарч байна</div>}
      {f.role==='teacher'&&<div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'12px 14px',marginBottom:16,fontSize:12,color:'#92400e',lineHeight:1.6}}>ℹ️ Админ зөвшөөрсний дараа нэвтрэх боломжтой.</div>}
      <button type="submit" className="bh" style={{width:'100%',padding:'12px',background:S.primary,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700}}>{f.role==='teacher'?'Хүсэлт илгээх':'Бүртгүүлэх'}</button>
    </form>}
    <div style={{textAlign:'center',marginTop:16,fontSize:13}}>Бүртгэлтэй? <button onClick={goL} style={{color:S.primary,fontWeight:600,background:'none',border:'none',cursor:'pointer',fontSize:13}}>Нэвтрэх</button></div>
    <button onClick={goH} style={{display:'block',margin:'10px auto 0',color:S.muted,background:'none',border:'none',cursor:'pointer',fontSize:12}}>← Нүүр</button>
  </div></div>;
}

function Lbl({children}){return<label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>{children}</label>;}
function Inp({v,set,ph,tp}){return<input value={v} onChange={e=>set(e.target.value)} placeholder={ph} type={tp||'text'} required style={{width:'100%',padding:'11px 14px',border:`1px solid ${S.border}`,borderRadius:10,marginBottom:14,outline:'none'}}/>;}

// === ADMIN ===
function AdminP({teachers,pending,courses,news,onApprove,onReject,onRm,onDelC,onAddN,onDelN,getAv}){
  const [tab,setTab]=useState('pending');const [nf,setNf]=useState({title:'',content:''});
  const tabs=[{id:'pending',n:'Хүсэлтүүд',c:pending.length},{id:'teachers',n:'Багш нар',c:teachers.length},{id:'courses',n:'Сургалтууд',c:courses.length},{id:'news',n:'Мэдээ',c:news.length}];
  return<div style={{paddingTop:24,animation:'fadeUp 0.3s'}}>
    <h1 style={{fontSize:22,fontWeight:800,marginBottom:20}}>⚙️ Админ удирдлага</h1>
    <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className="bh" style={{padding:'9px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'none',background:tab===t.id?S.primary:'#fff',color:tab===t.id?'#fff':S.text,boxShadow:S.shadow,display:'flex',alignItems:'center',gap:6}}>
        {t.n}{t.c>0&&<span style={{background:tab===t.id?'rgba(255,255,255,0.3)':S.primaryLight,color:tab===t.id?'#fff':S.primary,padding:'1px 7px',borderRadius:20,fontSize:10,fontWeight:700}}>{t.c}</span>}
      </button>)}
    </div>
    <div style={{background:'#fff',borderRadius:14,padding:24,boxShadow:S.shadow,minHeight:300}}>
      {tab==='pending'&&(pending.length>0?pending.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:`1px solid ${S.border}`}}>
        <div><div style={{fontWeight:600,fontSize:15}}>{t.name}</div><div style={{fontSize:12,color:S.muted}}>@{t.username} • {t.email} • {ago(t.createdAt)}</div></div>
        <div style={{display:'flex',gap:8}}><button onClick={()=>onApprove(t.id)} className="bh" style={{padding:'7px 14px',background:S.success,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600}}>✓ Зөвшөөрөх</button><button onClick={()=>onReject(t.id)} className="bh" style={{padding:'7px 14px',background:S.danger,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600}}>✕ Татгалзах</button></div>
      </div>):<MT i="📋" t="Хүсэлт байхгүй" s="Багш бүртгүүлэхэд энд харагдана"/>)}
      {tab==='teachers'&&(teachers.length>0?teachers.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:`1px solid ${S.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}><Av uid={t.id} name={t.name} src={getAv(t.id)} sz={40}/><div><div style={{fontWeight:600}}>{t.name}</div><div style={{fontSize:12,color:S.muted}}>@{t.username} • {t.email||'—'}</div></div></div>
        <button onClick={()=>onRm(t.id)} className="bh" style={{padding:'7px 12px',background:'#fef2f2',color:S.danger,border:'1px solid #fecaca',borderRadius:8,fontSize:12}}>Хасах</button>
      </div>):<MT i="👤" t="Багш байхгүй"/>)}
      {tab==='courses'&&(courses.length>0?courses.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:`1px solid ${S.border}`}}>
        <div><div style={{fontWeight:600,fontSize:14}}>{c.title}</div><div style={{fontSize:12,color:S.muted}}>👤 {c.teacherName} • {c.isFree?'Үнэгүй':fmt(c.price)} • {(c.lessons||[]).filter(l=>l.videoUrl).length} видео</div></div>
        <button onClick={()=>onDelC(c.id)} className="bh" style={{padding:'5px 10px',background:'#fef2f2',color:S.danger,border:'1px solid #fecaca',borderRadius:6,fontSize:11}}>Устгах</button>
      </div>):<MT i="📚" t="Байхгүй"/>)}
      {tab==='news'&&<><div style={{background:S.bg,borderRadius:12,padding:18,marginBottom:18}}>
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:10}}>📝 Шинэ мэдээ</h3>
        <input value={nf.title} onChange={e=>setNf(f=>({...f,title:e.target.value}))} placeholder="Гарчиг" style={{width:'100%',padding:'10px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginBottom:8,outline:'none'}}/>
        <textarea value={nf.content} onChange={e=>setNf(f=>({...f,content:e.target.value}))} placeholder="Агуулга" rows={3} style={{width:'100%',padding:'10px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginBottom:8,outline:'none',resize:'vertical'}}/>
        <button onClick={()=>{if(nf.title&&nf.content){onAddN(nf);setNf({title:'',content:''});}}} className="bh" style={{padding:'8px 18px',background:S.primary,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600}}>Нийтлэх</button>
      </div>{news.map(n=><div key={n.id} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:`1px solid ${S.border}`}}><div><div style={{fontWeight:600,fontSize:14}}>{n.title}</div><div style={{fontSize:12,color:S.muted}}>{ago(n.date)}</div></div><button onClick={()=>onDelN(n.id)} className="bh" style={{padding:'4px 10px',background:'#fef2f2',color:S.danger,border:'1px solid #fecaca',borderRadius:6,fontSize:11}}>Устгах</button></div>)}</>}
    </div>
  </div>;
}

// === TEACHER ===
function TeacherP({user,setUser,courses,onAdd,onDel,onUpd,av,onAv}){
  const [tab,setTab]=useState('courses');const [show,setShow]=useState(false);const [edit,setEdit]=useState(null);
  const colors=['#1e40af','#dc2626','#059669','#7c3aed','#b91c1c','#0ea5e9','#d97706','#be185d','#0d9488','#6366f1'];
  const blank={title:'',cat:'computer',price:0,isFree:true,desc:'',color:colors[0],lessons:[{title:'',videoUrl:''}]};
  const [f,setF]=useState(blank);const [pn,setPn]=useState(user.name);

  const addL=()=>setF(x=>({...x,lessons:[...x.lessons,{title:'',videoUrl:''}]}));
  const updL=(i,k,v)=>setF(x=>({...x,lessons:x.lessons.map((l,j)=>j===i?{...l,[k]:v}:l)}));
  const rmL=i=>setF(x=>({...x,lessons:x.lessons.filter((_,j)=>j!==i)}));
  const doAdd=()=>{if(!f.title)return;onAdd({...f,price:f.isFree?0:Number(f.price),lessons:f.lessons.filter(l=>l.title)});setF({...blank,color:colors[Math.floor(Math.random()*colors.length)]});setShow(false);};
  const doUpd=()=>{if(!edit)return;onUpd(edit,{...f,price:f.isFree?0:Number(f.price),lessons:f.lessons.filter(l=>l.title)});setEdit(null);setF(blank);};
  const openE=c=>{setEdit(c.id);setF({title:c.title,cat:c.cat,price:c.price,isFree:c.isFree,desc:c.desc,color:c.color,lessons:c.lessons?.length?c.lessons:[{title:'',videoUrl:''}]});setShow(false);};

  return<div style={{paddingTop:24,animation:'fadeUp 0.3s'}}>
    <h1 style={{fontSize:22,fontWeight:800,marginBottom:20}}>🎓 Багшийн хэсэг</h1>
    <div style={{display:'flex',gap:8,marginBottom:20}}>
      {[['courses','📚 Хичээлүүд'],['profile','👤 Профайл']].map(([id,nm])=><button key={id} onClick={()=>{setTab(id);setEdit(null);}} className="bh" style={{padding:'9px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'none',background:tab===id?S.primary:'#fff',color:tab===id?'#fff':S.text,boxShadow:S.shadow}}>{nm}</button>)}
    </div>
    <div style={{background:'#fff',borderRadius:14,padding:24,boxShadow:S.shadow,minHeight:300}}>
      {tab==='courses'&&<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <h2 style={{fontSize:16,fontWeight:700}}>Миний хичээлүүд ({courses.length})</h2>
          {!edit&&<button onClick={()=>setShow(!show)} className="bh" style={{padding:'8px 16px',background:show?'#f1f5f9':S.primary,color:show?S.text:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600}}>{show?'✕ Хаах':'+ Хичээл нэмэх'}</button>}
        </div>

        {(show||edit)&&<div style={{background:S.bg,borderRadius:12,padding:18,marginBottom:18}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{edit?'✏️ Засах':'📖 Шинэ хичээл'}</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><Lbl>Нэр *</Lbl><input value={f.title} onChange={e=>setF(x=>({...x,title:e.target.value}))} placeholder="Хичээлийн нэр" style={{width:'100%',padding:'9px 12px',border:`1px solid ${S.border}`,borderRadius:8,outline:'none'}}/></div>
            <div><Lbl>Ангилал</Lbl><select value={f.cat} onChange={e=>setF(x=>({...x,cat:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:`1px solid ${S.border}`,borderRadius:8,outline:'none',background:'#fff'}}>{CATS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
            <Lbl>Төлбөр:</Lbl>
            {[['free','Үнэгүй'],['paid','Төлбөртэй']].map(([v,l])=><button key={v} type="button" onClick={()=>setF(x=>({...x,isFree:v==='free'}))} style={{padding:'6px 14px',borderRadius:8,border:f.isFree===(v==='free')?`2px solid ${S.primary}`:`1px solid ${S.border}`,background:f.isFree===(v==='free')?S.primaryLight:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',color:f.isFree===(v==='free')?S.primaryDark:S.muted}}>{l}</button>)}
            {!f.isFree&&<input type="number" value={f.price} onChange={e=>setF(x=>({...x,price:e.target.value}))} placeholder="₮" style={{width:100,padding:'7px 10px',border:`1px solid ${S.border}`,borderRadius:8,outline:'none'}}/>}
          </div>
          <textarea value={f.desc} onChange={e=>setF(x=>({...x,desc:e.target.value}))} placeholder="Тайлбар" rows={2} style={{width:'100%',padding:'9px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginBottom:12,outline:'none',resize:'vertical'}}/>

          {/* LESSONS WITH VIDEO */}
          <div style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <label style={{fontSize:13,fontWeight:700}}>📹 Хичээлүүд</label>
              <button type="button" onClick={addL} style={{fontSize:12,color:S.primary,background:'none',border:'none',fontWeight:600,cursor:'pointer'}}>+ Хичээл нэмэх</button>
            </div>
            {f.lessons.map((l,i)=><div key={i} style={{background:'#fff',border:`1px solid ${S.border}`,borderRadius:10,padding:12,marginBottom:8}}>
              <div style={{display:'flex',gap:8,marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:700,color:S.primary,marginTop:8,flexShrink:0}}>{i+1}.</span>
                <input value={l.title} onChange={e=>updL(i,'title',e.target.value)} placeholder="Хичээлийн нэр" style={{flex:1,padding:'8px 10px',border:`1px solid ${S.border}`,borderRadius:6,outline:'none',fontSize:13}}/>
                {f.lessons.length>1&&<button type="button" onClick={()=>rmL(i)} style={{color:S.danger,background:'none',border:'none',fontSize:14,cursor:'pointer'}}>✕</button>}
              </div>
              <input value={l.videoUrl} onChange={e=>updL(i,'videoUrl',e.target.value)} placeholder="YouTube линк (жишээ: https://youtube.com/watch?v=abc123)" style={{width:'100%',padding:'8px 10px',border:`1px solid ${S.border}`,borderRadius:6,outline:'none',fontSize:12}}/>
              {l.videoUrl&&ytId(l.videoUrl)&&<div style={{marginTop:6}}>
                <div style={{fontSize:11,color:S.success,marginBottom:6}}>✓ YouTube видео холбогдсон</div>
                <div style={{position:'relative',paddingBottom:'56.25%',height:0,borderRadius:8,overflow:'hidden'}}>
                  <iframe src={`https://www.youtube.com/embed/${ytId(l.videoUrl)}`} title="preview" frameBorder="0" style={{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}/>
                </div>
              </div>}
              {l.videoUrl&&!ytId(l.videoUrl)&&l.videoUrl.startsWith('http')&&<div style={{marginTop:4,fontSize:11,color:S.accent}}>⚠️ YouTube линк оруулна уу (жишээ: https://youtube.com/watch?v=...)</div>}
            </div>)}
          </div>

          <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:600,marginBottom:4,display:'block'}}>Өнгө</label><div style={{display:'flex',gap:5}}>{colors.map(c=><button key={c} onClick={()=>setF(x=>({...x,color:c}))} style={{width:24,height:24,borderRadius:'50%',background:c,border:f.color===c?'3px solid #000':'2px solid transparent',cursor:'pointer'}}/>)}</div></div>
          <div style={{display:'flex',gap:8}}>
            {edit?<><button onClick={doUpd} className="bh" style={{padding:'9px 20px',background:S.primary,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600}}>Хадгалах</button>
              <button onClick={()=>{setEdit(null);setF(blank);}} style={{padding:'9px 20px',background:'#f1f5f9',color:S.text,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Цуцлах</button></>
            :<button onClick={doAdd} className="bh" style={{padding:'9px 20px',background:S.primary,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600}}>Нэмэх</button>}
          </div>
        </div>}

        {courses.length>0?courses.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:`1px solid ${S.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:40,height:40,borderRadius:8,background:`${c.color}22`,display:'flex',alignItems:'center',justifyContent:'center',color:c.color,fontSize:14,fontWeight:700}}>{c.title[0]}</div>
            <div><div style={{fontWeight:600,fontSize:14}}>{c.title}</div><div style={{fontSize:12,color:S.muted}}>{c.isFree?'Үнэгүй':fmt(c.price)} • {(c.lessons||[]).filter(l=>l.videoUrl).length}/{(c.lessons||[]).length} видео</div></div>
          </div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>openE(c)} className="bh" style={{padding:'5px 10px',background:S.primaryLight,color:S.primaryDark,border:`1px solid ${S.primary}33`,borderRadius:6,fontSize:11,fontWeight:600}}>✏️ Засах</button>
            <button onClick={()=>onDel(c.id)} className="bh" style={{padding:'5px 10px',background:'#fef2f2',color:S.danger,border:'1px solid #fecaca',borderRadius:6,fontSize:11}}>Устгах</button>
          </div>
        </div>):<MT i="📚" t="Хичээл нэмээгүй"/>}
      </>}

      {tab==='profile'&&<div style={{maxWidth:360}}>
        <h2 style={{fontSize:16,fontWeight:700,marginBottom:18}}>👤 Профайл засах</h2>
        <ImgPick src={av} onPick={onAv} sz={90}/>
        <div style={{marginTop:16}}>
          <Lbl>Нэр</Lbl><input value={pn} onChange={e=>setPn(e.target.value)} style={{width:'100%',padding:'10px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginBottom:14,outline:'none'}}/>
          <Lbl>Имэйл</Lbl><input value={user.email||''} disabled style={{width:'100%',padding:'10px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginBottom:14,outline:'none',background:'#f9fafb',color:S.muted}}/>
          <button onClick={()=>setUser(u=>({...u,name:pn}))} className="bh" style={{padding:'10px 22px',background:S.primary,color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600}}>Хадгалах</button>
        </div>
      </div>}
    </div>
  </div>;
}
