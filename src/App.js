import { useState, useEffect, useCallback } from "react";

// ==================== DATA & HELPERS ====================
const CATS = [
  { id:'computer', name:'Компьютер', icon:'💻', color:'#0ea5e9' },
  { id:'language', name:'Гадаад хэл', icon:'🌍', color:'#f59e0b' },
  { id:'education', name:'Ерөнхий боловсрол', icon:'🎓', color:'#10b981' },
];

const ADMIN_CREDS = { username:'Admin', password:'99033062' };

const defaultCourses = [
  { id:'c1', title:'Excel програмын анхан шат', cat:'computer', teacherId:'admin', teacherName:'Админ', price:18000, isFree:false, students:142, rating:4.7, desc:'Excel програмын бүрэн сургалт. Формула, функц, диаграмм бүгдийг сурна.', lessons:['Excel-ийн бүтэц','Формула бичих','SUM, AVERAGE функц','IF функц','Диаграмм үүсгэх'], color:'#1e40af', createdAt:Date.now()-86400000*30 },
  { id:'c2', title:'Microsoft Word дунд шат', cat:'computer', teacherId:'admin', teacherName:'Админ', price:0, isFree:true, students:89, rating:4.5, desc:'Word програмын дунд шатны бүрэн сургалт.', lessons:['Breaks ашиглах','Headers & Footers','Table of Contents','Mail Merge'], color:'#2563eb', createdAt:Date.now()-86400000*20 },
  { id:'c3', title:'Англи хэл | Анхан шат', cat:'language', teacherId:'admin', teacherName:'Админ', price:25000, isFree:false, students:320, rating:4.8, desc:'Англи хэлний анхан шатны цогц сургалт.', lessons:['Alphabet & Pronunciation','Basic Grammar','Daily Conversation','Reading Practice'], color:'#dc2626', createdAt:Date.now()-86400000*15 },
  { id:'c4', title:'Монгол бичиг | Анхан шат', cat:'education', teacherId:'admin', teacherName:'Админ', price:9900, isFree:false, students:450, rating:4.9, desc:'Монгол бичгийн үсэг, дүрэм, бичих дасгал.', lessons:['Үсгийн бүтэц','Үндсэн дүрэм','Үг бичих','Өгүүлбэр бичих'], color:'#b91c1c', createdAt:Date.now()-86400000*10 },
  { id:'c5', title:'Физик | 12-р анги ЭЕШ', cat:'education', teacherId:'admin', teacherName:'Админ', price:0, isFree:true, students:567, rating:4.6, desc:'12-р ангийн Физикийн ЭЕШ бэлтгэл.', lessons:['Кинематик','Динамик','Энерги','Цахилгаан'], color:'#7c3aed', createdAt:Date.now()-86400000*5 },
  { id:'c6', title:'Python програмчлал', cat:'computer', teacherId:'admin', teacherName:'Админ', price:35000, isFree:false, students:210, rating:4.7, desc:'Python хэлний үндсийг эзэмших сургалт.', lessons:['Variables','Functions','Lists & Dicts','OOP Basics','Projects'], color:'#059669', createdAt:Date.now()-86400000*3 },
];

const defaultNews = [
  { id:'n1', title:'EduMN платформ нээгдлээ!', content:'Манай платформ албан ёсоор нээгдлээ. Бүх сургалтуудаас 50% хөнгөлөлттэй.', date:Date.now()-86400000*30, author:'Админ' },
  { id:'n2', title:'Шинэ багш нар элслээ', content:'Энэ сард 5 шинэ багш манай платформд нэгдлээ.', date:Date.now()-86400000*7, author:'Админ' },
];

const fmt = (p) => p === 0 ? 'ҮНЭГҮЙ' : p.toLocaleString() + '₮';
const genId = () => Math.random().toString(36).substr(2, 9);
const timeAgo = (ts) => { const d = Math.floor((Date.now()-ts)/86400000); return d===0?'Өнөөдөр':d===1?'Өчигдөр':d<30?d+' өдрийн өмнө':Math.floor(d/30)+' сарын өмнө'; };

const S = {
  primary:'#0d9488', primaryDark:'#0f766e', primaryLight:'#ccfbf1',
  accent:'#f59e0b', danger:'#ef4444', success:'#10b981',
  bg:'#f0fdf4', text:'#1e293b', muted:'#94a3b8', border:'#e2e8f0',
  shadow:'0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)',
  shadowLg:'0 10px 25px rgba(0,0,0,0.08)',
  font:"'Noto Sans',-apple-system,sans-serif",
};

// ==================== MAIN APP ====================
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [courses, setCourses] = useState(defaultCourses);
  const [news, setNews] = useState(defaultNews);
  const [teachers, setTeachers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const keys = ['edumn-courses','edumn-news','edumn-teachers','edumn-pending','edumn-users','edumn-enrollments'];
      const setters = [setCourses,setNews,setTeachers,setPendingTeachers,setUsers,setEnrollments];
      keys.forEach((k,i) => { const v = localStorage.getItem(k); if(v) setters[i](JSON.parse(v)); });
    } catch(e) {}
    setLoaded(true);
  }, []);

  const save = useCallback((k, d) => { try { localStorage.setItem(k, JSON.stringify(d)); } catch(e) {} }, []);
  useEffect(() => { if(loaded) save('edumn-courses', courses); }, [courses, loaded, save]);
  useEffect(() => { if(loaded) save('edumn-news', news); }, [news, loaded, save]);
  useEffect(() => { if(loaded) save('edumn-teachers', teachers); }, [teachers, loaded, save]);
  useEffect(() => { if(loaded) save('edumn-pending', pendingTeachers); }, [pendingTeachers, loaded, save]);
  useEffect(() => { if(loaded) save('edumn-users', users); }, [users, loaded, save]);
  useEffect(() => { if(loaded) save('edumn-enrollments', enrollments); }, [enrollments, loaded, save]);

  const login = (username, password) => {
    if(username===ADMIN_CREDS.username && password===ADMIN_CREDS.password) { setUser({id:'admin',name:'Админ',role:'admin'}); setPage('admin'); return true; }
    const t = teachers.find(t=>t.username===username&&t.password===password);
    if(t) { setUser({...t,role:'teacher'}); setPage('teacher'); return true; }
    const u = users.find(u=>u.username===username&&u.password===password);
    if(u) { setUser({...u,role:'user'}); setPage('home'); return true; }
    return false;
  };

  const registerUser = (data) => {
    const exists = [...users,...teachers,...pendingTeachers].find(u=>u.username===data.username) || data.username===ADMIN_CREDS.username;
    if(exists) return 'Энэ нэр бүртгэлтэй байна';
    const nu = {id:genId(),...data,createdAt:Date.now()};
    if(data.role==='teacher') { setPendingTeachers(p=>[...p,{...nu,status:'pending'}]); return 'ok-teacher'; }
    setUsers(u=>[...u,nu]); setUser({...nu,role:'user'}); setPage('home'); return 'ok';
  };

  const approveTeacher = (id) => { const t=pendingTeachers.find(p=>p.id===id); if(t){setTeachers(p=>[...p,{...t,status:'approved'}]);setPendingTeachers(p=>p.filter(x=>x.id!==id));} };
  const rejectTeacher = (id) => setPendingTeachers(p=>p.filter(x=>x.id!==id));
  const removeTeacher = (id) => { setTeachers(p=>p.filter(t=>t.id!==id)); setCourses(p=>p.filter(c=>c.teacherId!==id)); };

  const addCourse = (data) => setCourses(p=>[{id:genId(),...data,students:0,rating:0,createdAt:Date.now()},...p]);
  const deleteCourse = (id) => setCourses(p=>p.filter(c=>c.id!==id));
  const enrollCourse = (cid) => { if(!user){setPage('login');return;} if(!enrollments.find(e=>e.courseId===cid&&e.userId===user.id)){setEnrollments(p=>[...p,{courseId:cid,userId:user.id,date:Date.now()}]);setCourses(p=>p.map(c=>c.id===cid?{...c,students:(c.students||0)+1}:c));} };

  const addNews = (d) => setNews(p=>[{id:genId(),...d,date:Date.now(),author:'Админ'},...p]);
  const deleteNews = (id) => setNews(p=>p.filter(n=>n.id!==id));

  const logout = () => { setUser(null); setPage('home'); };
  const goHome = () => { setPage('home'); setSelectedCourse(null); setSearch(''); setActiveCat('all'); };
  const openCourse = (c) => { setSelectedCourse(c); setPage('detail'); };

  const filtered = activeCat==='all' ? courses : courses.filter(c=>c.cat===activeCat);
  const searchResults = search ? courses.filter(c=>c.title.toLowerCase().includes(search.toLowerCase())) : [];
  const isEnrolled = (cid) => enrollments.some(e=>e.courseId===cid&&e.userId===user?.id);

  if(!loaded) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:S.font,color:S.primary,fontSize:18}}><div style={{textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>🎓</div>Ачааллаж байна...</div></div>;

  return (
    <div style={{minHeight:'100vh',background:S.bg,fontFamily:S.font,color:S.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input,select,textarea{font-family:${S.font};font-size:14px}
        button{font-family:${S.font};cursor:pointer}
        ::placeholder{color:${S.muted}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .ch:hover{transform:translateY(-4px);box-shadow:${S.shadowLg}}
        .bh:hover{filter:brightness(0.92)}
      `}</style>

      {/* HEADER */}
      <header style={{background:`linear-gradient(135deg,${S.primary},${S.primaryDark})`,position:'sticky',top:0,zIndex:1000,boxShadow:'0 4px 20px rgba(13,148,136,0.3)'}}>
        <div style={{maxWidth:1140,margin:'0 auto',padding:'0 24px',height:60,display:'flex',alignItems:'center',gap:16}}>
          <div onClick={goHome} style={{display:'flex',alignItems:'center',gap:10,color:'#fff',cursor:'pointer',flexShrink:0}}>
            <div style={{width:38,height:38,background:'rgba(255,255,255,0.2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🎓</div>
            <div style={{lineHeight:1.15}}><div style={{fontSize:20,fontWeight:800,letterSpacing:'-0.5px'}}>EduMN</div><div style={{fontSize:10,opacity:0.8}}>Мэдлэг бол хөрөнгө</div></div>
          </div>
          <div style={{flex:1,maxWidth:400,position:'relative'}}>
            <input value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value)setPage('search');else if(page==='search')setPage('home');}} placeholder="Сургалт хайх..." style={{width:'100%',padding:'9px 38px 9px 14px',border:'2px solid rgba(255,255,255,0.25)',borderRadius:10,fontSize:13,background:'rgba(255,255,255,0.95)',outline:'none'}} />
            <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:14,opacity:0.5}}>🔍</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto',flexShrink:0,flexWrap:'wrap'}}>
            {user ? <>
              {user.role==='admin' && <Btn onClick={()=>setPage('admin')} ghost>⚙️ Админ</Btn>}
              {user.role==='teacher' && <Btn onClick={()=>setPage('teacher')} ghost>📋 Хичээлүүд</Btn>}
              <Btn onClick={()=>setPage('my-courses')} ghost>📚 Миний</Btn>
              <div style={{display:'flex',alignItems:'center',gap:6,color:'#fff',fontSize:13}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:S.accent,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:11,color:'#fff'}}>{user.name?.[0]||'?'}</div>
                <span style={{fontWeight:600,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</span>
                <span style={{fontSize:9,background:'rgba(255,255,255,0.2)',padding:'2px 7px',borderRadius:20}}>{user.role==='admin'?'Админ':user.role==='teacher'?'Багш':'Суралцагч'}</span>
              </div>
              <Btn onClick={logout} ghost>Гарах</Btn>
            </> : <>
              <Btn onClick={()=>setPage('login')} white>Нэвтрэх</Btn>
              <Btn onClick={()=>setPage('register')} ghost>Бүртгүүлэх</Btn>
            </>}
          </div>
        </div>
      </header>

      {/* NAV */}
      {!['login','register','admin','teacher'].includes(page) && (
        <nav style={{background:'#fff',borderBottom:`1px solid ${S.border}`,boxShadow:S.shadow}}>
          <div style={{maxWidth:1140,margin:'0 auto',padding:'0 24px',display:'flex',gap:2,overflowX:'auto'}}>
            {[{id:'home',name:'Нүүр',icon:'🏠'},...CATS.map(c=>({id:c.id,name:c.name,icon:c.icon}))].map(item=>{
              const act=(item.id==='home'&&page==='home'&&activeCat==='all')||(page==='category'&&activeCat===item.id);
              return <button key={item.id} onClick={()=>{if(item.id==='home')goHome();else{setActiveCat(item.id);setPage('category');setSelectedCourse(null);}}}
                style={{display:'flex',alignItems:'center',gap:6,padding:'13px 16px',fontSize:13,fontWeight:act?700:500,color:act?S.primary:S.muted,borderBottom:act?`3px solid ${S.primary}`:'3px solid transparent',background:'none',border:'none',whiteSpace:'nowrap',cursor:'pointer',transition:'all 0.2s'}}>{item.icon} {item.name}</button>;
            })}
          </div>
        </nav>
      )}

      <main style={{maxWidth:1140,margin:'0 auto',padding:'0 24px',minHeight:'60vh'}}>
        {page==='login' && <LoginPage onLogin={login} goRegister={()=>setPage('register')} goHome={goHome} />}
        {page==='register' && <RegisterPage onRegister={registerUser} goLogin={()=>setPage('login')} goHome={goHome} />}
        {page==='admin' && user?.role==='admin' && <AdminDash teachers={teachers} pending={pendingTeachers} courses={courses} news={news} onApprove={approveTeacher} onReject={rejectTeacher} onRemove={removeTeacher} onDelCourse={deleteCourse} onAddNews={addNews} onDelNews={deleteNews} />}
        {page==='teacher' && user?.role==='teacher' && <TeacherDash user={user} setUser={setUser} courses={courses.filter(c=>c.teacherId===user.id)} onAdd={(d)=>addCourse({...d,teacherId:user.id,teacherName:user.name})} onDel={deleteCourse} />}

        {page==='home' && <div style={{animation:'fadeUp 0.4s ease'}}>
          <div style={{background:`linear-gradient(135deg,#134e4a,${S.primaryDark},${S.primary})`,borderRadius:16,padding:'40px 36px',margin:'24px 0',color:'#fff',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',right:-40,top:-40,width:200,height:200,background:'rgba(255,255,255,0.05)',borderRadius:'50%'}} />
            <h1 style={{fontSize:28,fontWeight:800,marginBottom:12}}>Мэдлэг бол хөрөнгө 📖</h1>
            <p style={{fontSize:15,opacity:0.85,marginBottom:24,lineHeight:1.7,maxWidth:520}}>Мэргэжлийн багш нараас суралцаж, ирээдүйгээ өөрчлөөрэй. Компьютер, гадаад хэл, ерөнхий боловсролын чиглэлээр чанартай сургалтууд.</p>
            <button onClick={()=>{setActiveCat('all');setPage('category');}} className="bh" style={{background:'#fff',color:S.primaryDark,padding:'11px 26px',borderRadius:10,fontSize:14,fontWeight:700,border:'none'}}>Бүх сургалт үзэх →</button>
          </div>
          {news.length>0 && <div style={{marginBottom:28}}>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:14}}>📢 Мэдээ</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
              {news.slice(0,3).map(n=><div key={n.id} style={{background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:S.shadow,borderLeft:`4px solid ${S.primary}`}}>
                <h3 style={{fontSize:14,fontWeight:700,marginBottom:4}}>{n.title}</h3>
                <p style={{fontSize:12,color:S.muted,lineHeight:1.6}}>{n.content.substring(0,80)}</p>
                <span style={{fontSize:11,color:S.muted}}>{timeAgo(n.date)}</span>
              </div>)}
            </div>
          </div>}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:28}}>
            {CATS.map(c=><button key={c.id} onClick={()=>{setActiveCat(c.id);setPage('category');}} className="ch" style={{background:'#fff',borderRadius:14,padding:'22px 18px',boxShadow:S.shadow,border:'none',textAlign:'left',cursor:'pointer',transition:'all 0.3s',display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:48,height:48,borderRadius:12,background:`${c.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{c.icon}</div>
              <div><div style={{fontSize:15,fontWeight:700}}>{c.name}</div><div style={{fontSize:12,color:S.muted}}>{courses.filter(x=>x.cat===c.id).length} сургалт</div></div>
            </button>)}
          </div>
          <CGrid title="Шинэ сургалтууд" list={courses.slice(0,4)} onOpen={openCourse} onMore={()=>{setActiveCat('all');setPage('category');}} />
          <CGrid title="Хамгийн их суралцсан" list={[...courses].sort((a,b)=>(b.students||0)-(a.students||0)).slice(0,4)} onOpen={openCourse} />
          <CGrid title="Үнэгүй сургалтууд" list={courses.filter(c=>c.isFree).slice(0,4)} onOpen={openCourse} />
        </div>}

        {page==='category' && <div style={{animation:'fadeUp 0.3s',paddingTop:24}}>
          <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>{CATS.find(c=>c.id===activeCat)?.name||'Бүх'} сургалтууд</h2>
          <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
            {['all',...CATS.map(c=>c.id)].map(id=><button key={id} onClick={()=>setActiveCat(id)} className="bh" style={{padding:'8px 18px',borderRadius:30,fontSize:12,fontWeight:600,border:'none',background:activeCat===id?S.primary:'#fff',color:activeCat===id?'#fff':S.muted,boxShadow:S.shadow}}>{id==='all'?'Бүгд':CATS.find(c=>c.id===id)?.name}</button>)}
          </div>
          {filtered.length>0 ? <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:36}}>{filtered.map(c=><CCard key={c.id} c={c} onClick={openCourse}/>)}</div> : <Empty icon="📭" title="Сургалт олдсонгүй" />}
        </div>}

        {page==='search' && <div style={{paddingTop:24}}>
          <h2 style={{fontSize:18,fontWeight:600,marginBottom:16}}>"{search}" — <span style={{color:S.muted,fontWeight:400}}>{searchResults.length} үр дүн</span></h2>
          {searchResults.length>0 ? <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:36}}>{searchResults.map(c=><CCard key={c.id} c={c} onClick={openCourse}/>)}</div> : <Empty icon="🔍" title="Олдсонгүй" />}
        </div>}

        {page==='detail' && selectedCourse && <Detail c={selectedCourse} enrolled={isEnrolled(selectedCourse.id)} user={user}
          onEnroll={()=>{if(!user){setPage('login');return;}if(selectedCourse.isFree||selectedCourse.price===0)enrollCourse(selectedCourse.id);else setShowPayment(true);}}
          onBuy={()=>{enrollCourse(selectedCourse.id);setShowPayment(false);}} showPay={showPayment} setShowPay={setShowPayment} />}

        {page==='my-courses' && user && <div style={{paddingTop:24,animation:'fadeUp 0.3s'}}>
          <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>📚 Миний сургалтууд</h2>
          {enrollments.filter(e=>e.userId===user.id).length>0 ? enrollments.filter(e=>e.userId===user.id).map(e=>{
            const c=courses.find(x=>x.id===e.courseId); if(!c) return null;
            return <div key={e.courseId} onClick={()=>openCourse(c)} className="ch" style={{display:'flex',background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:S.shadow,marginBottom:14,cursor:'pointer',transition:'all 0.3s'}}>
              <div style={{width:180,minHeight:100,background:`linear-gradient(135deg,${c.color},${c.color}cc)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:12,textAlign:'center',padding:12}}>{c.title}</div>
              <div style={{padding:'14px 18px',flex:1}}>
                <h3 style={{fontSize:15,fontWeight:700,marginBottom:4}}>{c.title}</h3>
                <div style={{fontSize:12,color:S.muted,marginBottom:8}}>👤 {c.teacherName}</div>
                <div style={{height:5,background:S.border,borderRadius:3,overflow:'hidden',marginBottom:4}}><div style={{height:'100%',width:'25%',background:S.primary,borderRadius:3}}/></div>
                <div style={{fontSize:11,color:S.muted}}>25% дууссан</div>
              </div>
            </div>;
          }) : <Empty icon="📚" title="Бүртгүүлсэн сургалт байхгүй" sub="Сургалтуудаас сонгоорой" />}
        </div>}
      </main>

      {/* FOOTER */}
      <footer style={{background:'#134e4a',color:'rgba(255,255,255,0.7)',padding:'36px 0 16px',marginTop:50}}>
        <div style={{maxWidth:1140,margin:'0 auto',padding:'0 24px',display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:32,marginBottom:24}}>
          <div><h3 style={{color:'#fff',fontSize:18,fontWeight:800,marginBottom:10}}>🎓 EduMN</h3><p style={{fontSize:12,lineHeight:1.8}}>Монголын чанартай онлайн сургалтын платформ. Мэдлэг бол хөрөнгө — хамтдаа суралцъя!</p></div>
          <div><h4 style={{color:'#fff',fontSize:13,fontWeight:600,marginBottom:10}}>Ангилал</h4><div style={{fontSize:12,lineHeight:2.4}}>{CATS.map(c=><div key={c.id}>{c.icon} {c.name}</div>)}</div></div>
          <div><h4 style={{color:'#fff',fontSize:13,fontWeight:600,marginBottom:10}}>Мэдээлэл</h4><div style={{fontSize:12,lineHeight:2.4}}>Бидний тухай<br/>Үйлчилгээний нөхцөл<br/>Нууцлалын бодлого</div></div>
          <div><h4 style={{color:'#fff',fontSize:13,fontWeight:600,marginBottom:10}}>Холбоо барих</h4><div style={{fontSize:12,lineHeight:2.4}}>📞 9903-3062<br/>📧 contact@edumn.mn<br/>📍 Улаанбаатар, Монгол</div></div>
        </div>
        <div style={{maxWidth:1140,margin:'0 auto',padding:'14px 24px 0',borderTop:'1px solid rgba(255,255,255,0.1)',textAlign:'center',fontSize:11}}>© 2024 EduMN. Бүх эрх хуулиар хамгаалагдсан.</div>
      </footer>
    </div>
  );
}

// ==================== SMALL HELPERS ====================
function Btn({children,onClick,ghost,white}) {
  const base = {padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:600,border:'none',cursor:'pointer'};
  if(white) return <button onClick={onClick} className="bh" style={{...base,background:'#fff',color:S.primary}}>{children}</button>;
  return <button onClick={onClick} className="bh" style={{...base,background:'rgba(255,255,255,0.15)',color:'#fff',border:'1px solid rgba(255,255,255,0.3)'}}>{children}</button>;
}

function Empty({icon,title,sub}) {
  return <div style={{textAlign:'center',padding:'48px 20px',color:S.muted}}><div style={{fontSize:44,marginBottom:10}}>{icon}</div><h3 style={{fontSize:16,fontWeight:600,color:S.text,marginBottom:4}}>{title}</h3>{sub&&<p style={{fontSize:13}}>{sub}</p>}</div>;
}

function CCard({c,onClick}) {
  return <div onClick={()=>onClick(c)} className="ch" style={{background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:S.shadow,cursor:'pointer',transition:'all 0.3s',display:'flex',flexDirection:'column'}}>
    <div style={{height:120,background:`linear-gradient(135deg,${c.color||S.primary},${c.color||S.primary}bb)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,padding:16,textAlign:'center',lineHeight:1.4,position:'relative'}}>
      {c.title}
      {c.isFree&&<span style={{position:'absolute',top:8,right:8,background:S.success,color:'#fff',padding:'2px 10px',borderRadius:20,fontSize:10,fontWeight:700}}>ҮНЭГҮЙ</span>}
    </div>
    <div style={{padding:'12px 14px',flex:1,display:'flex',flexDirection:'column'}}>
      <div style={{fontSize:11,color:S.muted,marginBottom:6}}>👤 {c.teacherName}</div>
      <div style={{fontSize:13,fontWeight:600,lineHeight:1.4,marginBottom:8,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{c.title}</div>
      <div style={{marginTop:'auto',display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:`1px solid ${S.border}`}}>
        <span style={{fontSize:11,color:S.muted}}>👤 {(c.students||0).toLocaleString()}</span>
        <span style={{fontSize:14,fontWeight:700,color:c.isFree?S.success:S.text}}>{c.isFree?'ҮНЭГҮЙ':fmt(c.price)}</span>
      </div>
    </div>
  </div>;
}

function CGrid({title,list,onOpen,onMore}) {
  if(!list.length) return null;
  return <div style={{marginBottom:30}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
      <h2 style={{fontSize:18,fontWeight:700}}>{title}</h2>
      {onMore&&<button onClick={onMore} style={{color:S.primary,fontSize:13,fontWeight:500,background:'none',border:'none',cursor:'pointer'}}>Бүгдийг үзэх →</button>}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>{list.map(c=><CCard key={c.id} c={c} onClick={onOpen}/>)}</div>
  </div>;
}

// ==================== DETAIL ====================
function Detail({c,enrolled,user,onEnroll,onBuy,showPay,setShowPay}) {
  const [tab,setTab]=useState('intro');
  const stars=(r)=>Array.from({length:5},(_,i)=><span key={i} style={{color:i<Math.round(r||0)?'#f59e0b':'#ddd'}}>★</span>);
  return <div style={{paddingTop:24,animation:'fadeUp 0.3s'}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:24,alignItems:'start'}}>
      <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:S.shadow}}>
        <div style={{height:180,background:`linear-gradient(135deg,${c.color||S.primary},${c.color||S.primary}bb)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <h1 style={{color:'#fff',fontSize:22,fontWeight:800,textShadow:'0 2px 8px rgba(0,0,0,0.2)',textAlign:'center',padding:20}}>{c.title}</h1>
        </div>
        <div style={{display:'flex',borderBottom:`1px solid ${S.border}`,padding:'0 20px'}}>
          {['intro','lessons'].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'12px 16px',fontSize:13,fontWeight:tab===t?700:500,color:tab===t?S.primary:S.muted,borderBottom:tab===t?`3px solid ${S.primary}`:'3px solid transparent',background:'none',border:'none',cursor:'pointer'}}>{t==='intro'?'Танилцуулга':'Хичээл'}</button>)}
        </div>
        <div style={{padding:22}}>
          <div style={{display:'flex',gap:16,marginBottom:20,fontSize:13,color:S.muted,flexWrap:'wrap'}}><span>{stars(c.rating)} ({c.rating||0})</span><span>👤 {(c.students||0).toLocaleString()}</span>{c.lessons&&<span>📖 {c.lessons.length} хичээл</span>}</div>
          {tab==='intro'&&<><p style={{fontSize:14,color:'#475569',lineHeight:1.8,marginBottom:20}}>{c.desc}</p>{c.lessons&&<><h3 style={{fontSize:16,fontWeight:700,marginBottom:12}}>📚 Юу сурах вэ?</h3><ul style={{listStyle:'none',padding:0}}>{c.lessons.map((l,i)=><li key={i} style={{display:'flex',gap:8,padding:'7px 0',fontSize:13}}><span style={{color:S.primary,fontWeight:700}}>✓</span>{l}</li>)}</ul></>}</>}
          {tab==='lessons'&&(c.lessons?<div>{c.lessons.map((l,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 0',borderBottom:`1px solid ${S.border}`,fontSize:14}}><div style={{width:28,height:28,borderRadius:'50%',background:S.primaryLight,display:'flex',alignItems:'center',justifyContent:'center',color:S.primary,fontSize:10,fontWeight:700,flexShrink:0}}>▶</div>{i+1}. {l}</div>)}</div>:<Empty icon="📹" title="Удахгүй нэмэгдэнэ"/>)}
        </div>
      </div>
      <div style={{background:'#fff',borderRadius:14,boxShadow:S.shadowLg,overflow:'hidden',position:'sticky',top:80}}>
        <div style={{padding:22,textAlign:'center',borderBottom:`1px solid ${S.border}`}}>
          <div style={{width:60,height:60,borderRadius:'50%',background:`${c.color||S.primary}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 8px',color:c.color||S.primary,fontWeight:800}}>{c.teacherName?.[0]}</div>
          <div style={{fontSize:11,color:S.muted}}>Багш</div>
          <div style={{fontSize:15,fontWeight:700}}>{c.teacherName}</div>
        </div>
        <div style={{padding:22}}>
          <div style={{fontSize:24,fontWeight:800,color:c.isFree?S.success:S.primary,marginBottom:14}}>{c.isFree?'ҮНЭГҮЙ':fmt(c.price)}</div>
          {enrolled ? <button style={{background:S.success,color:'#fff',padding:'12px 0',borderRadius:10,fontSize:14,fontWeight:700,width:'100%',border:'none'}}>▶ Үргэлжлүүлэх</button>
          : <button onClick={onEnroll} className="bh" style={{background:S.primary,color:'#fff',padding:'12px 0',borderRadius:10,fontSize:14,fontWeight:700,width:'100%',border:'none'}}>{c.isFree?'✓ Үнэгүй бүртгүүлэх':'🛒 Худалдаж авах'}</button>}
        </div>
      </div>
    </div>
    {showPay&&<div onClick={()=>setShowPay(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:20,width:400,maxWidth:'95vw',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{padding:'18px 22px',borderBottom:`1px solid ${S.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3 style={{fontSize:16,fontWeight:700}}>💳 Төлбөр</h3><button onClick={()=>setShowPay(false)} style={{width:28,height:28,borderRadius:'50%',background:'#f1f5f9',border:'none',fontSize:14}}>✕</button></div>
        <div style={{padding:28,textAlign:'center'}}>
          <div style={{width:140,height:140,margin:'0 auto 16px',background:'#f8fafc',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',border:`2px dashed ${S.border}`}}><div style={{textAlign:'center',color:S.muted,fontSize:13}}><div style={{fontSize:32,marginBottom:6}}>📱</div>QR код</div></div>
          <p style={{fontSize:12,color:S.muted,marginBottom:14}}>QPay-ээр QR уншуулна уу</p>
          <button onClick={onBuy} className="bh" style={{padding:'10px 24px',background:S.primary,color:'#fff',borderRadius:10,fontSize:13,fontWeight:600,border:'none'}}>Баталгаажуулах</button>
        </div>
        <div style={{background:S.primary,color:'#fff',textAlign:'center',padding:14,fontSize:14,fontWeight:600}}>Дүн: <span style={{fontSize:18,fontWeight:800,marginLeft:6}}>{fmt(c.price)}</span></div>
      </div>
    </div>}
  </div>;
}

// ==================== LOGIN/REGISTER ====================
function LoginPage({onLogin,goRegister,goHome}) {
  const [u,setU]=useState('');const [p,setP]=useState('');const [err,setErr]=useState('');
  const go=(e)=>{e.preventDefault();if(!onLogin(u,p))setErr('Нэвтрэх нэр эсвэл нууц үг буруу');};
  return <div style={{maxWidth:380,margin:'60px auto',animation:'fadeUp 0.4s'}}>
    <div style={{background:'#fff',borderRadius:16,padding:'36px 30px',boxShadow:S.shadowLg}}>
      <div style={{textAlign:'center',marginBottom:24}}><div style={{fontSize:44,marginBottom:8}}>🎓</div><h1 style={{fontSize:22,fontWeight:800}}>EduMN нэвтрэх</h1><p style={{fontSize:13,color:S.muted,marginTop:6}}>Нэвтрэх нэр, нууц үгээ оруулна уу</p></div>
      <form onSubmit={go}>
        {err&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:S.danger}}>{err}</div>}
        <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>Нэвтрэх нэр</label>
        <input value={u} onChange={e=>{setU(e.target.value);setErr('');}} placeholder="Нэвтрэх нэр" required style={{width:'100%',padding:'11px 14px',border:`1px solid ${S.border}`,borderRadius:10,marginBottom:14,outline:'none'}} />
        <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>Нууц үг</label>
        <input value={p} onChange={e=>{setP(e.target.value);setErr('');}} type="password" placeholder="Нууц үг" required style={{width:'100%',padding:'11px 14px',border:`1px solid ${S.border}`,borderRadius:10,marginBottom:20,outline:'none'}} />
        <button type="submit" className="bh" style={{width:'100%',padding:'12px',background:S.primary,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700}}>Нэвтрэх</button>
      </form>
      <div style={{textAlign:'center',marginTop:16,fontSize:13}}>Бүртгэл байхгүй юу? <button onClick={goRegister} style={{color:S.primary,fontWeight:600,background:'none',border:'none',cursor:'pointer',fontSize:13}}>Бүртгүүлэх</button></div>
      <button onClick={goHome} style={{display:'block',margin:'10px auto 0',color:S.muted,background:'none',border:'none',cursor:'pointer',fontSize:12}}>← Нүүр хуудас</button>
    </div>
  </div>;
}

function RegisterPage({onRegister,goLogin,goHome}) {
  const [f,setF]=useState({name:'',username:'',password:'',role:'user'});const [err,setErr]=useState('');const [ok,setOk]=useState('');
  const go=(e)=>{e.preventDefault();if(!f.name||!f.username||!f.password){setErr('Бүх талбарыг бөглөнө үү');return;}if(f.password.length<4){setErr('Нууц үг 4+ тэмдэгт');return;}
    const r=onRegister(f);if(r==='ok')return;if(r==='ok-teacher'){setOk('Багшаар бүртгүүлэх хүсэлт илгээгдлээ! Админ зөвшөөрсний дараа нэвтэрнэ үү.');return;}setErr(r);};
  return <div style={{maxWidth:400,margin:'60px auto',animation:'fadeUp 0.4s'}}>
    <div style={{background:'#fff',borderRadius:16,padding:'36px 30px',boxShadow:S.shadowLg}}>
      <div style={{textAlign:'center',marginBottom:24}}><div style={{fontSize:44,marginBottom:8}}>📝</div><h1 style={{fontSize:22,fontWeight:800}}>Бүртгүүлэх</h1></div>
      {ok ? <div style={{textAlign:'center'}}><div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:18,marginBottom:14,fontSize:13,color:'#166534',lineHeight:1.7}}>✅ {ok}</div><button onClick={goLogin} className="bh" style={{padding:'10px 22px',background:S.primary,color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:600}}>Нэвтрэх хуудас</button></div>
      : <form onSubmit={go}>
        {err&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:S.danger}}>{err}</div>}
        <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Эрхийн төрөл</label>
        <div style={{display:'flex',gap:10,marginBottom:16}}>
          {[['user','🧑 Суралцагч'],['teacher','🎓 Багш']].map(([v,l])=><button key={v} type="button" onClick={()=>setF(x=>({...x,role:v}))} style={{flex:1,padding:'10px',borderRadius:10,border:f.role===v?`2px solid ${S.primary}`:`2px solid ${S.border}`,background:f.role===v?S.primaryLight:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',color:f.role===v?S.primaryDark:S.muted}}>{l}</button>)}
        </div>
        <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>Нэр</label>
        <input value={f.name} onChange={e=>setF(x=>({...x,name:e.target.value}))} placeholder="Таны нэр" required style={{width:'100%',padding:'11px 14px',border:`1px solid ${S.border}`,borderRadius:10,marginBottom:14,outline:'none'}} />
        <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>Нэвтрэх нэр</label>
        <input value={f.username} onChange={e=>{setF(x=>({...x,username:e.target.value}));setErr('');}} placeholder="Нэвтрэх нэр" required style={{width:'100%',padding:'11px 14px',border:`1px solid ${S.border}`,borderRadius:10,marginBottom:14,outline:'none'}} />
        <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>Нууц үг</label>
        <input value={f.password} onChange={e=>setF(x=>({...x,password:e.target.value}))} type="password" placeholder="Нууц үг (4+)" required style={{width:'100%',padding:'11px 14px',border:`1px solid ${S.border}`,borderRadius:10,marginBottom:16,outline:'none'}} />
        {f.role==='teacher'&&<div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'12px 14px',marginBottom:16,fontSize:12,color:'#92400e',lineHeight:1.6}}>ℹ️ Багшаар бүртгүүлбэл Админ зөвшөөрөл өгсний дараа нэвтрэх боломжтой.</div>}
        <button type="submit" className="bh" style={{width:'100%',padding:'12px',background:S.primary,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700}}>{f.role==='teacher'?'Хүсэлт илгээх':'Бүртгүүлэх'}</button>
      </form>}
      <div style={{textAlign:'center',marginTop:16,fontSize:13}}>Бүртгэлтэй юу? <button onClick={goLogin} style={{color:S.primary,fontWeight:600,background:'none',border:'none',cursor:'pointer',fontSize:13}}>Нэвтрэх</button></div>
      <button onClick={goHome} style={{display:'block',margin:'10px auto 0',color:S.muted,background:'none',border:'none',cursor:'pointer',fontSize:12}}>← Нүүр хуудас</button>
    </div>
  </div>;
}

// ==================== ADMIN DASHBOARD ====================
function AdminDash({teachers,pending,courses,news,onApprove,onReject,onRemove,onDelCourse,onAddNews,onDelNews}) {
  const [tab,setTab]=useState('pending');const [nf,setNf]=useState({title:'',content:''});
  const tabs=[{id:'pending',name:'Хүсэлтүүд',n:pending.length},{id:'teachers',name:'Багш нар',n:teachers.length},{id:'courses',name:'Сургалтууд',n:courses.length},{id:'news',name:'Мэдээ',n:news.length}];
  return <div style={{paddingTop:24,animation:'fadeUp 0.3s'}}>
    <h1 style={{fontSize:22,fontWeight:800,marginBottom:20}}>⚙️ Админ удирдлага</h1>
    <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className="bh" style={{padding:'9px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'none',background:tab===t.id?S.primary:'#fff',color:tab===t.id?'#fff':S.text,boxShadow:S.shadow,display:'flex',alignItems:'center',gap:6}}>
        {t.name}{t.n>0&&<span style={{background:tab===t.id?'rgba(255,255,255,0.3)':S.primaryLight,color:tab===t.id?'#fff':S.primary,padding:'1px 7px',borderRadius:20,fontSize:10,fontWeight:700}}>{t.n}</span>}
      </button>)}
    </div>
    <div style={{background:'#fff',borderRadius:14,padding:24,boxShadow:S.shadow,minHeight:300}}>
      {tab==='pending'&&(pending.length>0?pending.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:`1px solid ${S.border}`}}>
        <div><div style={{fontWeight:600,fontSize:15}}>{t.name}</div><div style={{fontSize:12,color:S.muted}}>@{t.username} • {timeAgo(t.createdAt)}</div></div>
        <div style={{display:'flex',gap:8}}><button onClick={()=>onApprove(t.id)} className="bh" style={{padding:'7px 14px',background:S.success,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600}}>✓ Зөвшөөрөх</button><button onClick={()=>onReject(t.id)} className="bh" style={{padding:'7px 14px',background:S.danger,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600}}>✕ Татгалзах</button></div>
      </div>):<Empty icon="📋" title="Шинэ хүсэлт байхгүй" sub="Багш бүртгүүлэхэд энд харагдана" />)}

      {tab==='teachers'&&(teachers.length>0?teachers.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:`1px solid ${S.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:'50%',background:`${S.primary}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:S.primary}}>{t.name[0]}</div>
          <div><div style={{fontWeight:600}}>{t.name}</div><div style={{fontSize:12,color:S.muted}}>@{t.username} • {courses.filter(c=>c.teacherId===t.id).length} хичээл</div></div>
        </div>
        <button onClick={()=>onRemove(t.id)} className="bh" style={{padding:'7px 12px',background:'#fef2f2',color:S.danger,border:'1px solid #fecaca',borderRadius:8,fontSize:12,fontWeight:600}}>Хасах</button>
      </div>):<Empty icon="👤" title="Багш байхгүй" />)}

      {tab==='courses'&&(courses.length>0?courses.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:`1px solid ${S.border}`}}>
        <div><div style={{fontWeight:600,fontSize:14}}>{c.title}</div><div style={{fontSize:12,color:S.muted}}>👤 {c.teacherName} • {c.isFree?'Үнэгүй':fmt(c.price)} • {c.students||0} суралцагч</div></div>
        <button onClick={()=>onDelCourse(c.id)} className="bh" style={{padding:'5px 10px',background:'#fef2f2',color:S.danger,border:'1px solid #fecaca',borderRadius:6,fontSize:11}}>Устгах</button>
      </div>):<Empty icon="📚" title="Сургалт байхгүй" />)}

      {tab==='news'&&<>
        <div style={{background:S.bg,borderRadius:12,padding:18,marginBottom:18}}>
          <h3 style={{fontSize:14,fontWeight:700,marginBottom:10}}>📝 Шинэ мэдээ</h3>
          <input value={nf.title} onChange={e=>setNf(f=>({...f,title:e.target.value}))} placeholder="Гарчиг" style={{width:'100%',padding:'10px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginBottom:8,outline:'none'}} />
          <textarea value={nf.content} onChange={e=>setNf(f=>({...f,content:e.target.value}))} placeholder="Агуулга" rows={3} style={{width:'100%',padding:'10px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginBottom:8,outline:'none',resize:'vertical'}} />
          <button onClick={()=>{if(nf.title&&nf.content){onAddNews(nf);setNf({title:'',content:''});}}} className="bh" style={{padding:'8px 18px',background:S.primary,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600}}>Нийтлэх</button>
        </div>
        {news.map(n=><div key={n.id} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'12px 0',borderBottom:`1px solid ${S.border}`}}>
          <div><div style={{fontWeight:600,fontSize:14}}>{n.title}</div><div style={{fontSize:12,color:S.muted}}>{n.content.substring(0,60)}... • {timeAgo(n.date)}</div></div>
          <button onClick={()=>onDelNews(n.id)} className="bh" style={{padding:'4px 10px',background:'#fef2f2',color:S.danger,border:'1px solid #fecaca',borderRadius:6,fontSize:11,flexShrink:0}}>Устгах</button>
        </div>)}
      </>}
    </div>
  </div>;
}

// ==================== TEACHER DASHBOARD ====================
function TeacherDash({user,setUser,courses,onAdd,onDel}) {
  const [tab,setTab]=useState('courses');const [show,setShow]=useState(false);
  const colors=['#1e40af','#dc2626','#059669','#7c3aed','#b91c1c','#0ea5e9','#d97706','#be185d','#0d9488','#6366f1'];
  const [f,setF]=useState({title:'',cat:'computer',price:0,isFree:true,desc:'',lessonsText:'',color:colors[0]});
  const [pn,setPn]=useState(user.name);

  const add=()=>{if(!f.title)return;onAdd({title:f.title,cat:f.cat,price:f.isFree?0:Number(f.price),isFree:f.isFree,desc:f.desc,lessons:f.lessonsText?f.lessonsText.split('\n').filter(Boolean):[],color:f.color});
    setF({title:'',cat:'computer',price:0,isFree:true,desc:'',lessonsText:'',color:colors[Math.floor(Math.random()*colors.length)]});setShow(false);};

  return <div style={{paddingTop:24,animation:'fadeUp 0.3s'}}>
    <h1 style={{fontSize:22,fontWeight:800,marginBottom:20}}>🎓 Багшийн хэсэг</h1>
    <div style={{display:'flex',gap:8,marginBottom:20}}>
      {[['courses','📚 Хичээлүүд'],['profile','👤 Профайл']].map(([id,nm])=><button key={id} onClick={()=>setTab(id)} className="bh" style={{padding:'9px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'none',background:tab===id?S.primary:'#fff',color:tab===id?'#fff':S.text,boxShadow:S.shadow}}>{nm}</button>)}
    </div>
    <div style={{background:'#fff',borderRadius:14,padding:24,boxShadow:S.shadow,minHeight:300}}>
      {tab==='courses'&&<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <h2 style={{fontSize:16,fontWeight:700}}>Миний хичээлүүд ({courses.length})</h2>
          <button onClick={()=>setShow(!show)} className="bh" style={{padding:'8px 16px',background:show?'#f1f5f9':S.primary,color:show?S.text:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600}}>{show?'✕ Хаах':'+ Хичээл нэмэх'}</button>
        </div>
        {show&&<div style={{background:S.bg,borderRadius:12,padding:18,marginBottom:18}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={{fontSize:12,fontWeight:600}}>Нэр *</label><input value={f.title} onChange={e=>setF(x=>({...x,title:e.target.value}))} placeholder="Хичээлийн нэр" style={{width:'100%',padding:'9px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginTop:4,outline:'none'}} /></div>
            <div><label style={{fontSize:12,fontWeight:600}}>Ангилал</label><select value={f.cat} onChange={e=>setF(x=>({...x,cat:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginTop:4,outline:'none',background:'#fff'}}>{CATS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:600}}>Төлбөр:</label>
            {[['free','Үнэгүй'],['paid','Төлбөртэй']].map(([v,l])=><button key={v} type="button" onClick={()=>setF(x=>({...x,isFree:v==='free'}))} style={{padding:'6px 14px',borderRadius:8,border:f.isFree===(v==='free')?`2px solid ${S.primary}`:`1px solid ${S.border}`,background:f.isFree===(v==='free')?S.primaryLight:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',color:f.isFree===(v==='free')?S.primaryDark:S.muted}}>{l}</button>)}
            {!f.isFree&&<input type="number" value={f.price} onChange={e=>setF(x=>({...x,price:e.target.value}))} placeholder="₮" style={{width:100,padding:'7px 10px',border:`1px solid ${S.border}`,borderRadius:8,outline:'none'}} />}
          </div>
          <textarea value={f.desc} onChange={e=>setF(x=>({...x,desc:e.target.value}))} placeholder="Тайлбар" rows={2} style={{width:'100%',padding:'9px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginBottom:8,outline:'none',resize:'vertical'}} />
          <textarea value={f.lessonsText} onChange={e=>setF(x=>({...x,lessonsText:e.target.value}))} placeholder={"Хичээлүүд (мөр бүрт нэг)\nХичээл 1\nХичээл 2"} rows={3} style={{width:'100%',padding:'9px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginBottom:8,outline:'none',resize:'vertical'}} />
          <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,marginBottom:4,display:'block'}}>Өнгө</label><div style={{display:'flex',gap:5}}>{colors.map(c=><button key={c} onClick={()=>setF(x=>({...x,color:c}))} style={{width:24,height:24,borderRadius:'50%',background:c,border:f.color===c?'3px solid #000':'2px solid transparent',cursor:'pointer'}}/>)}</div></div>
          <button onClick={add} className="bh" style={{padding:'9px 20px',background:S.primary,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600}}>Нэмэх</button>
        </div>}
        {courses.length>0?courses.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:`1px solid ${S.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:40,height:40,borderRadius:8,background:`${c.color}22`,display:'flex',alignItems:'center',justifyContent:'center',color:c.color,fontSize:14,fontWeight:700}}>{c.title[0]}</div>
            <div><div style={{fontWeight:600,fontSize:14}}>{c.title}</div><div style={{fontSize:12,color:S.muted}}>{c.isFree?'Үнэгүй':fmt(c.price)} • {c.students||0} суралцагч</div></div>
          </div>
          <button onClick={()=>onDel(c.id)} className="bh" style={{padding:'5px 10px',background:'#fef2f2',color:S.danger,border:'1px solid #fecaca',borderRadius:6,fontSize:11}}>Устгах</button>
        </div>):<Empty icon="📚" title="Хичээл нэмээгүй" sub="Дээрх товчийг дарж нэмнэ үү" />}
      </>}
      {tab==='profile'&&<div style={{maxWidth:360}}>
        <h2 style={{fontSize:16,fontWeight:700,marginBottom:18}}>👤 Профайл</h2>
        <div style={{textAlign:'center',marginBottom:18}}>
          <div style={{width:70,height:70,borderRadius:'50%',background:`${S.primary}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700,color:S.primary,margin:'0 auto 8px'}}>{user.name[0]}</div>
          <label className="bh" style={{display:'inline-block',padding:'6px 14px',background:'#f1f5f9',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>📷 Зураг солих</label>
        </div>
        <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>Нэр</label>
        <input value={pn} onChange={e=>setPn(e.target.value)} style={{width:'100%',padding:'10px 12px',border:`1px solid ${S.border}`,borderRadius:8,marginBottom:14,outline:'none'}} />
        <button onClick={()=>setUser(u=>({...u,name:pn}))} className="bh" style={{padding:'10px 22px',background:S.primary,color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600}}>Хадгалах</button>
      </div>}
    </div>
  </div>;
}
