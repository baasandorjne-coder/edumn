import React, { useState, useEffect, useRef, useCallback } from "react";
import { db, auth, storage } from "./firebase";
import {
  collection, doc, setDoc, getDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, where, getDocs, increment
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// ===================== CONSTANTS =====================
const CATEGORIES = [
  { id: "computer", name: "Компьютер", icon: "💻" },
  { id: "language", name: "Гадаад хэл", icon: "🌍" },
  { id: "personal", name: "Хувь хүний хөгжил", icon: "🌱" },
  {
    id: "general", name: "Ерөнхий боловсрол", icon: "📚",
    subs: [
      { id: "math", name: "Математик", icon: "🔢" },
      { id: "mongolian", name: "Монгол хэл", icon: "🇲🇳" },
      { id: "chemistry", name: "Хими", icon: "⚗️" },
      { id: "biology", name: "Биологи", icon: "🧬" },
      { id: "physics", name: "Физик", icon: "⚡" },
      { id: "history", name: "Түүх", icon: "🏛️" },
      { id: "geography", name: "Газарзүй", icon: "🌏" },
      { id: "english", name: "Англи хэл", icon: "🔤" },
      { id: "social", name: "Нийгэм", icon: "👥" },
    ]
  },
];
const ALL_SUBS = CATEGORIES.flatMap(c => c.subs || []);
const ADMIN = { username: "Admin", password: "99033062" };
// QPay - merchant.qpay.mn дээр бүртгүүлж авна
const QPAY_CONFIG = { invoiceCode: "EDUMN_INVOICE", merchantId: "EDUMN" };

function ytId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?\/\s]{11})/);
  return m ? m[1] : null;
}
function getCat(cid) { return CATEGORIES.find(c => c.id === cid); }
function getSub(sid) { return ALL_SUBS.find(s => s.id === sid); }

function uploadFile(file, path, onProg) {
  return new Promise((res, rej) => {
    const task = uploadBytesResumable(ref(storage, path), file);
    task.on("state_changed", s => onProg((s.bytesTransferred / s.totalBytes) * 100), rej,
      () => getDownloadURL(task.snapshot.ref).then(res));
  });
}

// ===================== CERTIFICATE =====================
function generateCertificate(userName, courseName, teacherName, date) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200; canvas.height = 800;
  const ctx = canvas.getContext("2d");
  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 1200, 800);
  bg.addColorStop(0, "#1a1a2e"); bg.addColorStop(1, "#16213e");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1200, 800);
  // Gold border
  ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, 1152, 752);
  ctx.strokeStyle = "rgba(245,158,11,0.3)"; ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, 1128, 728);
  // Logo
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 52px Arial";
  ctx.textAlign = "center"; ctx.fillText("Edu", 600, 120);
  ctx.fillStyle = "#f59e0b"; ctx.fillText("MN", 648, 120);
  // Wait, let me redo this properly
  ctx.clearRect(0, 0, 1200, 800);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1200, 800);
  ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 8; ctx.strokeRect(24, 24, 1152, 752);
  ctx.strokeStyle = "rgba(245,158,11,0.3)"; ctx.lineWidth = 2; ctx.strokeRect(36, 36, 1128, 728);
  // EduMN logo text
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff"; ctx.font = "bold 48px Arial"; ctx.fillText("Edu", 570, 110);
  ctx.fillStyle = "#f59e0b"; ctx.font = "bold 48px Arial"; ctx.fillText("MN", 630, 110);
  // Certificate of Completion
  ctx.fillStyle = "#f59e0b"; ctx.font = "bold 20px Arial";
  ctx.fillText("ГЭРЧИЛГЭЭ", 600, 180);
  // Divider
  ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(200, 200); ctx.lineTo(1000, 200); ctx.stroke();
  // Main text
  ctx.fillStyle = "#e5e7eb"; ctx.font = "22px Arial";
  ctx.fillText("Энэхүү гэрчилгээгээр дараах хүн", 600, 260);
  // Name
  ctx.fillStyle = "#f59e0b"; ctx.font = "bold 54px Arial";
  ctx.fillText(userName, 600, 340);
  // Divider
  ctx.strokeStyle = "rgba(245,158,11,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(300, 370); ctx.lineTo(900, 370); ctx.stroke();
  // Course
  ctx.fillStyle = "#e5e7eb"; ctx.font = "22px Arial";
  ctx.fillText("дараах сургалтыг амжилттай дүүргэснийг гэрчилж байна:", 600, 420);
  ctx.fillStyle = "#fff"; ctx.font = "bold 36px Arial";
  // Truncate if too long
  const cname = courseName.length > 50 ? courseName.substring(0, 47) + "..." : courseName;
  ctx.fillText(cname, 600, 480);
  // Teacher
  ctx.fillStyle = "#9ca3af"; ctx.font = "18px Arial";
  ctx.fillText(`Багш: ${teacherName}`, 600, 540);
  // Date
  ctx.fillStyle = "#9ca3af"; ctx.font = "16px Arial";
  ctx.fillText(`Огноо: ${date}`, 600, 600);
  // Bottom decoration
  ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(200, 650); ctx.lineTo(1000, 650); ctx.stroke();
  ctx.fillStyle = "rgba(245,158,11,0.6)"; ctx.font = "14px Arial";
  ctx.fillText("EduMN — Монгол онлайн сургалтын платформ | contact@edumn.mn | 9903-3062", 600, 690);
  return canvas.toDataURL("image/png");
}

// ===================== CSS =====================
const CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',Tahoma,sans-serif; background:#f5f7fa; color:#333; }
.nav { background:linear-gradient(135deg,#1a1a2e,#16213e); padding:0 24px; display:flex; align-items:center; justify-content:space-between; height:64px; position:sticky; top:0; z-index:100; box-shadow:0 2px 12px rgba(0,0,0,0.3); }
.logo { color:#fff; font-size:22px; font-weight:800; cursor:pointer; letter-spacing:-0.5px; }
.logo span { color:#f59e0b; }
.nav-r { display:flex; gap:8px; align-items:center; }
.btn { padding:8px 16px; border:none; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600; transition:all 0.2s; font-family:inherit; }
.btn-primary { background:#f59e0b; color:#1a1a2e; }
.btn-primary:hover { background:#d97706; }
.btn-outline { background:transparent; color:#fff; border:2px solid rgba(255,255,255,0.3); }
.btn-outline:hover { border-color:#f59e0b; color:#f59e0b; }
.btn-ghost { background:#f3f4f6; color:#374151; border:none; }
.btn-ghost:hover { background:#e5e7eb; }
.btn-danger { background:#ef4444; color:#fff; }
.btn-danger:hover { background:#dc2626; }
.btn-success { background:#10b981; color:#fff; }
.btn-info { background:#3b82f6; color:#fff; }
.btn-sm { padding:5px 11px; font-size:12px; }
.btn-lg { padding:12px 28px; font-size:16px; }
.btn:disabled { opacity:0.6; cursor:not-allowed; }
.hero { background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%); color:#fff; padding:80px 24px; text-align:center; }
.hero h1 { font-size:48px; font-weight:800; margin-bottom:14px; line-height:1.1; }
.hero h1 span { color:#f59e0b; }
.hero p { font-size:18px; opacity:0.8; margin-bottom:32px; max-width:560px; margin-left:auto; margin-right:auto; }
.hero-stats { display:flex; gap:32px; justify-content:center; margin-top:40px; flex-wrap:wrap; }
.hero-stat { text-align:center; }
.hero-stat .num { font-size:28px; font-weight:800; color:#f59e0b; }
.hero-stat .lbl { font-size:13px; opacity:0.7; margin-top:2px; }
.sec { padding:52px 24px; max-width:1200px; margin:0 auto; }
.sec-title { font-size:26px; font-weight:700; margin-bottom:6px; }
.sec-sub { color:#6b7280; margin-bottom:28px; font-size:15px; }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:22px; }
.card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.08); transition:all 0.25s; cursor:pointer; }
.card:hover { transform:translateY(-5px); box-shadow:0 10px 32px rgba(0,0,0,0.15); }
.card-img { height:160px; display:flex; align-items:center; justify-content:center; font-size:48px; position:relative; overflow:hidden; background:linear-gradient(135deg,#667eea,#764ba2); }
.card-img img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.card-body { padding:16px; }
.card-tags { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:8px; }
.card-title { font-size:15px; font-weight:700; margin-bottom:8px; line-height:1.35; }
.card-meta { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:8px; }
.badge { padding:3px 9px; border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
.b-free { background:#d1fae5; color:#065f46; }
.b-paid { background:#fef3c7; color:#92400e; }
.b-cat { background:#e0e7ff; color:#3730a3; }
.b-sub { background:#fce7f3; color:#9d174d; }
.price { font-size:18px; font-weight:800; color:#f59e0b; }
.stars { color:#f59e0b; font-size:14px; }
.av { width:26px; height:26px; border-radius:50%; background:#f59e0b; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#1a1a2e; overflow:hidden; flex-shrink:0; }
.av img,.av-lg img { width:100%; height:100%; object-fit:cover; }
.av-lg { width:64px; height:64px; border-radius:50%; background:#f59e0b; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; color:#1a1a2e; overflow:hidden; flex-shrink:0; }
.mo { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:300; display:flex; align-items:center; justify-content:center; padding:16px; }
.md { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:500px; max-height:93vh; overflow-y:auto; }
.md h2 { font-size:22px; font-weight:700; margin-bottom:18px; }
.fg { margin-bottom:13px; }
.fg label { display:block; font-size:13px; font-weight:600; margin-bottom:5px; color:#374151; }
.fg input,.fg select,.fg textarea { width:100%; padding:9px 13px; border:2px solid #e5e7eb; border-radius:9px; font-size:14px; font-family:inherit; transition:border-color 0.2s; }
.fg input:focus,.fg select:focus,.fg textarea:focus { outline:none; border-color:#f59e0b; }
.fg textarea { min-height:76px; resize:vertical; }
.fg-row { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
.al { padding:10px 14px; border-radius:9px; margin-bottom:13px; font-size:13px; font-weight:500; }
.al-err { background:#fee2e2; color:#991b1b; }
.al-ok { background:#d1fae5; color:#065f46; }
.al-info { background:#e0f2fe; color:#0c4a6e; }
.al-warn { background:#fef3c7; color:#92400e; }
.tabs { display:flex; gap:7px; margin-bottom:22px; flex-wrap:wrap; }
.tab { padding:7px 17px; border-radius:20px; border:2px solid #e5e7eb; background:#fff; cursor:pointer; font-weight:600; font-size:13px; transition:all 0.2s; }
.tab.on { background:#1a1a2e; color:#f59e0b; border-color:#1a1a2e; }
.panel { background:#fff; border-radius:16px; padding:22px; box-shadow:0 2px 16px rgba(0,0,0,0.07); margin-bottom:18px; }
.ph { font-size:16px; font-weight:700; margin-bottom:14px; padding-bottom:12px; border-bottom:2px solid #f3f4f6; display:flex; justify-content:space-between; align-items:center; }
.tbl { width:100%; border-collapse:collapse; }
.tbl th,.tbl td { padding:10px 13px; text-align:left; border-bottom:1px solid #f3f4f6; font-size:13px; }
.tbl th { background:#f9fafb; font-weight:700; color:#374151; }
.tbl tr:hover td { background:#fafafa; }
.cd { max-width:960px; margin:0 auto; padding:22px; }
.vbox { background:#000; border-radius:14px; overflow:hidden; aspect-ratio:16/9; position:relative; margin-bottom:18px; }
.vbox iframe,.vbox video { width:100%; height:100%; border:none; }
.vlock { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#fff; gap:14px; text-align:center; padding:20px; }
.t-card { display:flex; align-items:center; gap:14px; background:#f9fafb; padding:16px; border-radius:12px; margin-bottom:18px; }
.news-card { background:#fff; border-radius:14px; padding:20px; box-shadow:0 2px 14px rgba(0,0,0,0.07); margin-bottom:13px; }
.ps { background:#fff; border-radius:14px; padding:26px; box-shadow:0 2px 14px rgba(0,0,0,0.07); max-width:560px; margin:0 auto; }
.cat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(155px,1fr)); gap:13px; margin-bottom:28px; }
.cat-c { background:#fff; border-radius:12px; padding:18px; text-align:center; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.06); transition:all 0.2s; border:2px solid transparent; }
.cat-c:hover,.cat-c.on { border-color:#f59e0b; transform:translateY(-2px); }
.footer { background:#1a1a2e; color:rgba(255,255,255,0.65); padding:40px 24px; text-align:center; }
.footer a { color:#f59e0b; text-decoration:none; }
.spin { border:3px solid #f3f4f6; border-top:3px solid #f59e0b; border-radius:50%; animation:sp 0.8s linear infinite; }
@keyframes sp { to { transform:rotate(360deg); } }
.notif { position:fixed; top:74px; right:18px; color:#fff; padding:10px 17px; border-radius:11px; font-weight:600; z-index:999; animation:ni 0.3s; font-size:14px; box-shadow:0 4px 16px rgba(0,0,0,0.2); }
@keyframes ni { from { transform:translateX(80px); opacity:0; } to { transform:translateX(0); opacity:1; } }
.dd { position:absolute; right:0; top:46px; background:#fff; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.15); min-width:200px; overflow:hidden; z-index:400; }
.dd a,.dd button { display:block; width:100%; padding:10px 15px; text-align:left; border:none; background:none; cursor:pointer; font-size:13px; font-weight:500; color:#374151; transition:background 0.2s; font-family:inherit; }
.dd a:hover,.dd button:hover { background:#f9fafb; }
.pw { background:#e5e7eb; border-radius:99px; height:7px; overflow:hidden; }
.pf { background:linear-gradient(90deg,#f59e0b,#f97316); height:100%; border-radius:99px; transition:width 0.4s; }
.empty { text-align:center; padding:44px 20px; color:#9ca3af; }
.empty .ei { font-size:44px; margin-bottom:12px; }
.ua { border:2px dashed #d1d5db; border-radius:11px; padding:18px; text-align:center; cursor:pointer; transition:all 0.2s; }
.ua:hover { border-color:#f59e0b; background:#fffbeb; }
.ua input { display:none; }
.mat-item { display:flex; align-items:center; gap:11px; padding:11px 14px; background:#f9fafb; border-radius:9px; margin-bottom:7px; }
.qq { background:#f9fafb; border-radius:11px; padding:15px; margin-bottom:13px; }
.qo { display:flex; align-items:center; gap:9px; padding:9px 13px; border-radius:7px; margin-bottom:5px; border:2px solid #e5e7eb; cursor:pointer; transition:all 0.2s; font-size:13px; }
.qo:hover { border-color:#f59e0b; background:#fffbeb; }
.qo.correct { border-color:#10b981; background:#d1fae5; }
.qo.wrong { border-color:#ef4444; background:#fee2e2; }
.qo.selected { border-color:#3b82f6; background:#eff6ff; }
.sp-pill { display:flex; gap:7px; flex-wrap:wrap; margin-bottom:18px; }
.sp { padding:4px 13px; border-radius:20px; border:2px solid #e5e7eb; background:#fff; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s; }
.sp:hover,.sp.on { background:#f59e0b; border-color:#f59e0b; color:#1a1a2e; }
.vtt { display:flex; gap:9px; margin-bottom:10px; }
.vb { flex:1; padding:8px; border-radius:8px; border:2px solid #e5e7eb; background:#fff; cursor:pointer; font-weight:600; font-size:13px; transition:all 0.2s; font-family:inherit; }
.vb.on { border-color:#f59e0b; background:#fffbeb; color:#92400e; }
.lesson-item { display:flex; align-items:center; gap:12px; padding:13px 16px; border-radius:10px; margin-bottom:8px; cursor:pointer; transition:all 0.2s; border:2px solid #e5e7eb; background:#fff; }
.lesson-item:hover { border-color:#f59e0b; }
.lesson-item.active { border-color:#f59e0b; background:#fffbeb; }
.lesson-item.done { border-color:#10b981; background:#f0fdf4; }
.lesson-num { width:28px; height:28px; border-radius:50%; background:#1a1a2e; color:#f59e0b; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; }
.lesson-num.done { background:#10b981; color:#fff; }
.rev-item { padding:16px; border-radius:11px; background:#f9fafb; margin-bottom:10px; }
.rev-item .rev-hd { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.sr-wrap { display:flex; gap:3px; }
.sr { font-size:22px; cursor:pointer; transition:transform 0.1s; color:#d1d5db; }
.sr.on,.sr:hover { color:#f59e0b; transform:scale(1.15); }
.filter-row { display:flex; gap:11px; flex-wrap:wrap; margin-bottom:20px; align-items:center; }
.filter-row input,.filter-row select { padding:9px 13px; border:2px solid #e5e7eb; border-radius:9px; font-size:14px; font-family:inherit; }
.filter-row input:focus,.filter-row select:focus { outline:none; border-color:#f59e0b; }
.filter-row input { flex:1; min-width:180px; }
.stat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:14px; margin-bottom:20px; }
.stat-c { background:linear-gradient(135deg,#1a1a2e,#16213e); border-radius:12px; padding:18px; color:#fff; text-align:center; }
.stat-c .sv { font-size:28px; font-weight:800; color:#f59e0b; }
.stat-c .sl { font-size:12px; opacity:0.7; margin-top:4px; }
.cert-btn { display:flex; align-items:center; gap:8px; padding:12px 20px; background:linear-gradient(135deg,#f59e0b,#f97316); color:#1a1a2e; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:15px; transition:all 0.2s; font-family:inherit; }
.cert-btn:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(245,158,11,0.4); }
.qpay-box { background:linear-gradient(135deg,#1a1a2e,#0f3460); border-radius:14px; padding:24px; color:#fff; text-align:center; margin-bottom:16px; }
.qpay-box .qr { width:180px; height:180px; background:#fff; border-radius:12px; margin:16px auto; display:flex; align-items:center; justify-content:center; font-size:13px; color:#374151; padding:8px; }
`;

// ===================== APP =====================
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [courses, setCourses] = useState([]);
  const [news, setNews] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [pending, setPending] = useState([]);
  const [selCourse, setSelCourse] = useState(null);
  const [selCat, setSelCat] = useState(null);
  const [selSub, setSelSub] = useState(null);
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [adminTab, setAdminTab] = useState("teachers");
  const dropRef = useRef();

  const notify = useCallback((msg, color = "#10b981") => {
    setNotif({ msg, color }); setTimeout(() => setNotif(null), 3500);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async fu => {
      if (fu) {
        const pd = await getDoc(doc(db, "users", fu.uid));
        if (pd.exists()) { setUser(fu); setRole(pd.data().role); setProfile(pd.data()); }
      } else { setUser(null); setRole(null); setProfile(null); }
      setLoading(false);
    });
  }, []);

  useEffect(() => onSnapshot(query(collection(db, "courses"), orderBy("createdAt", "desc")), s => setCourses(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), s => setNews(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(query(collection(db, "users"), where("role", "==", "teacher")), s => setTeachers(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => { if (role !== "admin") return; return onSnapshot(collection(db, "pendingTeachers"), s => setPending(s.docs.map(d => ({ id: d.id, ...d.data() })))); }, [role]);
  useEffect(() => { const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const adminLogin = async (u, p) => {
    if (u === ADMIN.username && p === ADMIN.password) {
      await signOut(auth).catch(() => {});
      setUser({ uid: "admin" }); setRole("admin"); setProfile({ name: "Admin", role: "admin" });
      setShowLogin(false); notify("Админ нэвтэрлээ!"); setPage("admin"); return true;
    } return false;
  };

  const logout = async () => {
    if (role === "admin") { setUser(null); setRole(null); setProfile(null); }
    else await signOut(auth);
    setShowDrop(false); setPage("home"); notify("Гарлаа!");
  };

  const filtered = courses.filter(c => {
    const q = searchQ.toLowerCase();
    const mQ = !q || c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.teacherName?.toLowerCase().includes(q);
    const mC = !selCat || c.category === selCat;
    const mS = !selSub || c.subCategory === selSub;
    const mT = !teacherFilter || c.teacherName?.toLowerCase().includes(teacherFilter.toLowerCase());
    const mP = priceFilter === "all" || (priceFilter === "free" && c.isFree) || (priceFilter === "paid" && !c.isFree) || (priceFilter === "under50" && !c.isFree && c.price <= 50000) || (priceFilter === "over50" && !c.isFree && c.price > 50000);
    return mQ && mC && mS && mT && mP;
  });

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spin" style={{ width: 44, height: 44 }} /></div>;

  const goToCourse = c => { setSelCourse(c); setPage("courseDetail"); };

  return (
    <>
      <style>{CSS}</style>
      {notif && <div className="notif" style={{ background: notif.color }}>{notif.msg}</div>}

      {/* NAV */}
      <nav className="nav">
        <div className="logo" onClick={() => setPage("home")}>Edu<span>MN</span></div>
        <div className="nav-r">
          <button className="btn btn-outline btn-sm" onClick={() => setPage("courses")}>Сургалт</button>
          <button className="btn btn-outline btn-sm" onClick={() => setPage("news")}>Мэдээ</button>
          <button className="btn btn-outline btn-sm" onClick={() => setPage("contact")}>Холбоо</button>
          {!user ? (
            <><button className="btn btn-outline btn-sm" onClick={() => setShowLogin(true)}>Нэвтрэх</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowSignup(true)}>Бүртгүүлэх</button></>
          ) : (
            <div style={{ position: "relative" }} ref={dropRef}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowDrop(!showDrop)}>
                {role === "admin" ? "⚙️" : role === "teacher" ? "🎓" : "👤"} {profile?.name?.split(" ")[0] || "Хэрэглэгч"}
                {pending.length > 0 && role === "admin" && <span style={{ background: "#ef4444", borderRadius: "99px", padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{pending.length}</span>} ▾
              </button>
              {showDrop && (
                <div className="dd">
                  <div style={{ padding: "10px 15px", borderBottom: "1px solid #f3f4f6", fontWeight: 700, fontSize: 14 }}>{profile?.name}</div>
                  {role === "admin" && <button onClick={() => { setPage("admin"); setShowDrop(false); }}>⚙️ Админ самбар</button>}
                  {role === "teacher" && <button onClick={() => { setPage("teacher"); setShowDrop(false); }}>🎓 Багшийн самбар</button>}
                  {role === "user" && <button onClick={() => { setPage("profile"); setShowDrop(false); }}>👤 Миний профайл</button>}
                  <button onClick={logout} style={{ color: "#ef4444" }}>🚪 Гарах</button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} adminLogin={adminLogin} setUser={setUser} setRole={setRole} setProfile={setProfile} notify={notify} setPage={setPage} />}
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} notify={notify} setShowLogin={setShowLogin} />}

      {page === "home" && <HomePage courses={courses} news={news} teachers={teachers} setPage={setPage} goToCourse={goToCourse} setSelCat={setSelCat} setSelSub={setSelSub} user={user} setShowLogin={setShowLogin} />}
      {page === "courses" && <CoursesPage courses={filtered} goToCourse={goToCourse} selCat={selCat} setSelCat={setSelCat} selSub={selSub} setSelSub={setSelSub} searchQ={searchQ} setSearchQ={setSearchQ} priceFilter={priceFilter} setPriceFilter={setPriceFilter} teacherFilter={teacherFilter} setTeacherFilter={setTeacherFilter} />}
      {page === "courseDetail" && selCourse && <CourseDetailPage course={selCourse} teachers={teachers} user={user} role={role} profile={profile} setShowLogin={setShowLogin} notify={notify} setPage={setPage} />}
      {page === "news" && <NewsPage news={news} />}
      {page === "admin" && role === "admin" && <AdminPage pending={pending} teachers={teachers} courses={courses} news={news} notify={notify} adminTab={adminTab} setAdminTab={setAdminTab} />}
      {page === "teacher" && role === "teacher" && <TeacherPage user={user} profile={profile} courses={courses} notify={notify} setProfile={setProfile} />}
      {page === "profile" && user && role === "user" && <ProfilePage user={user} profile={profile} courses={courses} notify={notify} />}
      {page === "contact" && <ContactPage />}

      <footer className="footer">
        <p><strong style={{ color: "#f59e0b", fontSize: 18 }}>EduMN</strong></p>
        <p style={{ marginTop: 8 }}>📞 <a href="tel:99033062">9903-3062</a> &nbsp;|&nbsp; ✉️ <a href="mailto:contact@edumn.mn">contact@edumn.mn</a></p>
        <p style={{ marginTop: 8, fontSize: 12 }}>© 2024 EduMN. Монгол онлайн сургалтын платформ</p>
      </footer>
    </>
  );
}

// ===================== AUTH MODALS =====================
function LoginModal({ onClose, adminLogin, setUser, setRole, setProfile, notify, setPage }) {
  const [f, setF] = useState({ u: "", p: "" }); const [err, setErr] = useState(""); const [ld, setLd] = useState(false);
  const go = async () => {
    if (!f.u || !f.p) { setErr("Бүх талбарыг бөглөнө үү"); return; }
    setLd(true); setErr("");
    if (await adminLogin(f.u, f.p)) { setLd(false); return; }
    try {
      const c = await signInWithEmailAndPassword(auth, f.u, f.p);
      const pd = await getDoc(doc(db, "users", c.user.uid));
      if (pd.exists()) { setUser(c.user); setRole(pd.data().role); setProfile(pd.data()); setPage(pd.data().role === "teacher" ? "teacher" : "home"); notify("Нэвтэрлээ!"); onClose(); }
    } catch { setErr("Нэвтрэх нэр эсвэл нууц үг буруу"); }
    setLd(false);
  };
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="md">
        <h2>🔐 Нэвтрэх</h2>
        {err && <div className="al al-err">{err}</div>}
        <div className="fg"><label>Имэйл / Нэвтрэх нэр</label><input value={f.u} onChange={e => setF({ ...f, u: e.target.value })} placeholder="имэйл эсвэл Admin" /></div>
        <div className="fg"><label>Нууц үг</label><input type="password" value={f.p} onChange={e => setF({ ...f, p: e.target.value })} onKeyDown={e => e.key === "Enter" && go()} /></div>
        <button className="btn btn-primary" style={{ width: "100%", padding: 12 }} onClick={go} disabled={ld}>{ld ? "Нэвтэрж байна..." : "Нэвтрэх"}</button>
        <div style={{ textAlign: "center", marginTop: 10 }}><button className="btn btn-ghost btn-sm" onClick={onClose}>Хаах</button></div>
      </div>
    </div>
  );
}

function SignupModal({ onClose, notify, setShowLogin }) {
  const [f, setF] = useState({ name: "", email: "", pw: "", pw2: "", role: "user" });
  const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [ld, setLd] = useState(false);
  const go = async () => {
    if (!f.name || !f.email || !f.pw || !f.pw2) { setErr("Бүх талбарыг бөглөнө үү"); return; }
    if (f.pw !== f.pw2) { setErr("Нууц үг таарахгүй"); return; }
    if (f.pw.length < 6) { setErr("Нууц үг хамгийн багадаа 6 тэмдэгт"); return; }
    setLd(true); setErr("");
    try {
      if (f.role === "teacher") {
        await setDoc(doc(collection(db, "pendingTeachers")), { name: f.name, email: f.email, password: f.pw, role: "teacher", status: "pending", createdAt: serverTimestamp() });
        setOk("Хүсэлт илгээгдлээ! Админ зөвшөөрснөөр нэвтрэх боломжтой болно.");
      } else {
        const c = await createUserWithEmailAndPassword(auth, f.email, f.pw);
        await updateProfile(c.user, { displayName: f.name });
        await setDoc(doc(db, "users", c.user.uid), { name: f.name, email: f.email, role: "user", enrolledCourses: [], completedLessons: {}, createdAt: serverTimestamp() });
        notify("Бүртгэл амжилттай!"); onClose();
      }
    } catch (e) { setErr(e.code === "auth/email-already-in-use" ? "Энэ имэйл аль хэдийн бүртгэлтэй" : "Алдаа: " + e.message); }
    setLd(false);
  };
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="md">
        <h2>📝 Бүртгүүлэх</h2>
        {err && <div className="al al-err">{err}</div>}
        {ok ? <><div className="al al-ok">{ok}</div><button className="btn btn-primary" onClick={() => { onClose(); setShowLogin(true); }}>Нэвтрэх</button></> : (
          <>
            <div className="fg"><label>Нэр</label><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
            <div className="fg"><label>Имэйл</label><input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
            <div className="fg"><label>Нууц үг</label><input type="password" value={f.pw} onChange={e => setF({ ...f, pw: e.target.value })} /></div>
            <div className="fg"><label>Нууц үг давтах</label>
              <input type="password" value={f.pw2} onChange={e => setF({ ...f, pw2: e.target.value })} />
              {f.pw2 && <span style={{ fontSize: 12, color: f.pw === f.pw2 ? "#10b981" : "#ef4444", marginTop: 3, display: "block" }}>{f.pw === f.pw2 ? "✓ Таарч байна" : "⚠️ Таарахгүй"}</span>}
            </div>
            <div className="fg"><label>Төрөл</label>
              <select value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>
                <option value="user">Суралцагч</option><option value="teacher">Багш болон бүртгүүлэх</option>
              </select></div>
            {f.role === "teacher" && <div className="al al-warn">⚠️ Багшийн хүсэлт админ зөвшөөрснөөр идэвхждэг</div>}
            <button className="btn btn-primary" style={{ width: "100%", padding: 12 }} onClick={go} disabled={ld}>{ld ? "Бүртгэж байна..." : "Бүртгүүлэх"}</button>
          </>
        )}
      </div>
    </div>
  );
}

// ===================== COURSE CARD =====================
function CourseCard({ course, onClick }) {
  const cat = getCat(course.category); const sub = getSub(course.subCategory);
  const rating = course.avgRating || 0; const reviewCount = course.reviewCount || 0;
  return (
    <div className="card" onClick={onClick}>
      <div className="card-img">{course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" /> : <span>{sub?.icon || cat?.icon || "📚"}</span>}</div>
      <div className="card-body">
        <div className="card-tags">
          {cat && <span className="badge b-cat">{cat.name}</span>}
          {sub && <span className="badge b-sub">{sub.icon} {sub.name}</span>}
          <span className={`badge ${course.isFree ? "b-free" : "b-paid"}`}>{course.isFree ? "Үнэгүй" : "Төлбөртэй"}</span>
        </div>
        <div className="card-title">{course.title}</div>
        <div className="card-meta">
          <div className="av">{course.teacherPhoto ? <img src={course.teacherPhoto} alt="" /> : (course.teacherName?.[0] || "T")}</div>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{course.teacherName}</span>
        </div>
        <div className="card-footer">
          <div className="price">{course.isFree ? "Үнэгүй" : `${(course.price || 0).toLocaleString()}₮`}</div>
          {reviewCount > 0 && <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ color: "#f59e0b" }}>★</span>{rating.toFixed(1)} ({reviewCount})
          </div>}
        </div>
      </div>
    </div>
  );
}

// ===================== HOME PAGE =====================
function HomePage({ courses, news, teachers, setPage, goToCourse, setSelCat, setSelSub, user, setShowLogin }) {
  return (
    <>
      <div className="hero">
        <h1>Тав тухтай <span>суралц</span></h1>
        <p>Монголын шилдэг багш нараас мэргэжлийн хичээл үзэж чадвараа хөгжүүл</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-lg" onClick={() => setPage("courses")}>Сургалтуудыг үзэх</button>
          {!user && <button className="btn btn-outline btn-lg" onClick={() => setShowLogin(true)}>Нэвтрэх</button>}
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><div className="num">{courses.length}+</div><div className="lbl">Сургалт</div></div>
          <div className="hero-stat"><div className="num">{teachers.length}+</div><div className="lbl">Багш</div></div>
          <div className="hero-stat"><div className="num">{CATEGORIES.length}</div><div className="lbl">Ангилал</div></div>
        </div>
      </div>
      <div className="sec">
        <div className="sec-title">📂 Ангилалууд</div>
        <div className="cat-grid">
          {CATEGORIES.map(c => (
            <div key={c.id} className="cat-c" onClick={() => { setSelCat(c.id); setSelSub(null); setPage("courses"); }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{courses.filter(x => x.category === c.id).length} сургалт</div>
            </div>
          ))}
        </div>
        <div className="sec-title">🔥 Шинэ сургалтууд</div>
        {courses.length === 0 ? <div className="empty"><div className="ei">📭</div><p>Сургалт байхгүй</p></div>
          : <div className="grid">{courses.slice(0, 8).map(c => <CourseCard key={c.id} course={c} onClick={() => goToCourse(c)} />)}</div>}
        {courses.length > 8 && <div style={{ textAlign: "center", marginTop: 20 }}><button className="btn btn-primary" onClick={() => setPage("courses")}>Бүгдийг үзэх →</button></div>}
      </div>
      {news.length > 0 && <div className="sec" style={{ paddingTop: 0 }}>
        <div className="sec-title">📰 Сүүлийн мэдээ</div>
        {news.slice(0, 2).map(n => <div key={n.id} className="news-card"><h3>{n.title}</h3><p style={{ marginTop: 7, color: "#6b7280" }}>{n.content?.substring(0, 160)}...</p></div>)}
        <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setPage("news")}>Бүх мэдээ →</button>
      </div>}
    </>
  );
}

// ===================== COURSES PAGE =====================
function CoursesPage({ courses, goToCourse, selCat, setSelCat, selSub, setSelSub, searchQ, setSearchQ, priceFilter, setPriceFilter, teacherFilter, setTeacherFilter }) {
  const catInfo = CATEGORIES.find(c => c.id === selCat);
  return (
    <div className="sec">
      <div className="sec-title">📚 Бүх сургалтууд</div>
      <div className="filter-row">
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Гарчиг, тайлбар, багш хайх..." />
        <input value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} placeholder="👤 Багшийн нэр..." style={{ maxWidth: 180 }} />
        <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)}>
          <option value="all">Бүх үнэ</option>
          <option value="free">Үнэгүй</option>
          <option value="paid">Төлбөртэй</option>
          <option value="under50">50,000₮-аас доош</option>
          <option value="over50">50,000₮-аас дээш</option>
        </select>
      </div>
      <div className="tabs">
        <div className={`tab ${!selCat ? "on" : ""}`} onClick={() => { setSelCat(null); setSelSub(null); }}>Бүгд ({courses.length})</div>
        {CATEGORIES.map(c => <div key={c.id} className={`tab ${selCat === c.id ? "on" : ""}`} onClick={() => { setSelCat(c.id); setSelSub(null); }}>{c.icon} {c.name}</div>)}
      </div>
      {catInfo?.subs && (
        <div className="sp-pill">
          <span className={`sp ${!selSub ? "on" : ""}`} onClick={() => setSelSub(null)}>Бүгд</span>
          {catInfo.subs.map(s => <span key={s.id} className={`sp ${selSub === s.id ? "on" : ""}`} onClick={() => setSelSub(s.id)}>{s.icon} {s.name}</span>)}
        </div>
      )}
      {courses.length === 0 ? <div className="empty"><div className="ei">🔍</div><p>Сургалт олдсонгүй</p></div>
        : <div className="grid">{courses.map(c => <CourseCard key={c.id} course={c} onClick={() => goToCourse(c)} />)}</div>}
    </div>
  );
}

// ===================== COURSE DETAIL =====================
function CourseDetailPage({ course, teachers, user, role, profile, setShowLogin, notify, setPage }) {
  const [enrolled, setEnrolled] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [selLesson, setSelLesson] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); const [submitted, setSubmitted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0); const [myComment, setMyComment] = useState("");
  const [completedLessons, setCompletedLessons] = useState([]);
  const [dtab, setDtab] = useState("video");
  const [certUrl, setCertUrl] = useState(null);
  const teacher = teachers.find(t => t.id === course.teacherId);
  const cat = getCat(course.category); const sub = getSub(course.subCategory);
  const canWatch = course.isFree || enrolled || role === "admin" || role === "teacher";

  useEffect(() => {
    if (!user || role !== "user") return;
    getDoc(doc(db, "users", user.uid)).then(d => {
      if (d.exists()) {
        const data = d.data();
        setEnrolled((data.enrolledCourses || []).includes(course.id));
        setCompletedLessons((data.completedLessons || {})[course.id] || []);
      }
    });
  }, [user, course.id, role]);

  useEffect(() => onSnapshot(query(collection(db, "courses", course.id, "lessons"), orderBy("order")), s => {
    const ls = s.docs.map(d => ({ id: d.id, ...d.data() }));
    setLessons(ls); if (ls.length > 0 && !selLesson) setSelLesson(ls[0]);
  }), [course.id]);

  useEffect(() => onSnapshot(query(collection(db, "courses", course.id, "materials"), orderBy("createdAt", "desc")), s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() })))), [course.id]);
  useEffect(() => { getDoc(doc(db, "courses", course.id, "quiz", "main")).then(d => { if (d.exists()) setQuiz(d.data()); }); }, [course.id]);
  useEffect(() => onSnapshot(query(collection(db, "courses", course.id, "reviews"), orderBy("createdAt", "desc")), s => setReviews(s.docs.map(d => ({ id: d.id, ...d.data() })))), [course.id]);

  useEffect(() => {
    if (lessons.length > 0 && completedLessons.length === lessons.length && enrolled) setCompleted(true);
    else setCompleted(false);
  }, [completedLessons, lessons, enrolled]);

  const enroll = async () => {
    if (!user) { setShowLogin(true); return; }
    if (course.isFree) {
      const d = await getDoc(doc(db, "users", user.uid));
      await updateDoc(doc(db, "users", user.uid), { enrolledCourses: [...(d.data()?.enrolledCourses || []), course.id] });
      setEnrolled(true); notify("Амжилттай бүртгүүллээ!");
    } else setShowPay(true);
  };

  const markLessonDone = async lessonId => {
    if (!user || role !== "user") return;
    const newCompleted = completedLessons.includes(lessonId) ? completedLessons : [...completedLessons, lessonId];
    await updateDoc(doc(db, "users", user.uid), { [`completedLessons.${course.id}`]: newCompleted });
    setCompletedLessons(newCompleted);
    if (newCompleted.length === lessons.length) { notify("🎉 Сургалт дүүргэлээ! Гэрчилгээ татаж авна уу!"); }
  };

  const submitReview = async () => {
    if (!user || myRating === 0) { notify("Үнэлгээ өгнө үү", "#ef4444"); return; }
    const reviewDoc = { userId: user.uid, userName: profile?.name || "Нэргүй", rating: myRating, comment: myComment, createdAt: serverTimestamp() };
    await setDoc(doc(db, "courses", course.id, "reviews", user.uid), reviewDoc);
    // Update avg rating
    const total = [...reviews.filter(r => r.id !== user.uid), { rating: myRating }];
    const avg = total.reduce((s, r) => s + r.rating, 0) / total.length;
    await updateDoc(doc(db, "courses", course.id), { avgRating: Math.round(avg * 10) / 10, reviewCount: total.length });
    setMyRating(0); setMyComment(""); notify("Сэтгэгдэл нэмэгдлээ!");
  };

  const downloadCert = () => {
    const url = generateCertificate(profile?.name || "Суралцагч", course.title, course.teacherName || "Багш", new Date().toLocaleDateString("mn-MN"));
    const a = document.createElement("a"); a.href = url; a.download = `EduMN_Гэрчилгээ_${course.title}.png`; a.click();
    notify("Гэрчилгээ татагдлаа! 🎓");
  };

  const submitQuiz = () => {
    setSubmitted(true);
    const correct = quiz.questions.filter((q, i) => answers[i] === q.correct).length;
    notify(`${correct}/${quiz.questions.length} зөв хариулт!`, correct === quiz.questions.length ? "#10b981" : "#f59e0b");
  };

  const activeVideo = selLesson || (lessons.length === 0 ? course : null);
  const activeYtId = ytId(activeVideo?.videoUrl);

  return (
    <div className="cd">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => setPage("courses")}>← Буцах</button>

      <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
            {cat && <span className="badge b-cat">{cat.name}</span>}
            {sub && <span className="badge b-sub">{sub.icon} {sub.name}</span>}
            <span className={`badge ${course.isFree ? "b-free" : "b-paid"}`}>{course.isFree ? "Үнэгүй" : "Төлбөртэй"}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{course.title}</h1>
          <p style={{ color: "#6b7280", lineHeight: 1.7, marginBottom: 14 }}>{course.description}</p>
          {course.avgRating > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(course.avgRating) ? "#f59e0b" : "#d1d5db", fontSize: 18 }}>★</span>)}
            <span style={{ fontWeight: 700 }}>{course.avgRating}</span>
            <span style={{ color: "#9ca3af", fontSize: 13 }}>({course.reviewCount} сэтгэгдэл)</span>
          </div>}
          {teacher && <div className="t-card">
            <div className="av-lg">{teacher.photoUrl ? <img src={teacher.photoUrl} alt="" /> : (teacher.name?.[0] || "T")}</div>
            <div><div style={{ fontWeight: 700, fontSize: 15 }}>{teacher.name}</div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>{teacher.email}</div>
              {teacher.bio && <div style={{ fontSize: 13, marginTop: 4, color: "#374151" }}>{teacher.bio}</div>}
            </div>
          </div>}
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", minWidth: 210, textAlign: "center" }}>
          <div className="price" style={{ fontSize: 26, marginBottom: 14 }}>{course.isFree ? "Үнэгүй" : `${(course.price || 0).toLocaleString()}₮`}</div>
          {!enrolled && role === "user" && <button className="btn btn-primary" style={{ width: "100%", padding: 11 }} onClick={enroll}>{course.isFree ? "Үнэгүй бүртгүүлэх" : "Худалдаж авах"}</button>}
          {enrolled && <div className="al al-ok" style={{ marginBottom: 0 }}>✅ Бүртгүүлсэн</div>}
          {enrolled && <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Явц: {completedLessons.length}/{lessons.length} хичээл</div>
            <div className="pw"><div className="pf" style={{ width: `${lessons.length > 0 ? (completedLessons.length / lessons.length) * 100 : 0}%` }} /></div>
          </div>}
          {completed && <button className="cert-btn" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={downloadCert}>🎓 Гэрчилгээ татах</button>}
          {!user && <button className="btn btn-primary" style={{ width: "100%", padding: 11 }} onClick={() => setShowLogin(true)}>Нэвтрэх</button>}
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 14 }}>
        <div className={`tab ${dtab === "video" ? "on" : ""}`} onClick={() => setDtab("video")}>🎬 Хичээлүүд {lessons.length > 0 && `(${lessons.length})`}</div>
        <div className={`tab ${dtab === "mat" ? "on" : ""}`} onClick={() => setDtab("mat")}>📄 Материал {materials.length > 0 && `(${materials.length})`}</div>
        <div className={`tab ${dtab === "quiz" ? "on" : ""}`} onClick={() => setDtab("quiz")}>📝 Тест {quiz && `(${quiz.questions?.length})`}</div>
        <div className={`tab ${dtab === "review" ? "on" : ""}`} onClick={() => setDtab("review")}>⭐ Сэтгэгдэл {reviews.length > 0 && `(${reviews.length})`}</div>
      </div>

      {dtab === "video" && (
        <>
          {lessons.length > 0 && (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ width: 260, flexShrink: 0 }}>
                {lessons.map((l, i) => (
                  <div key={l.id} className={`lesson-item ${selLesson?.id === l.id ? "active" : ""} ${completedLessons.includes(l.id) ? "done" : ""}`} onClick={() => setSelLesson(l)}>
                    <div className={`lesson-num ${completedLessons.includes(l.id) ? "done" : ""}`}>{completedLessons.includes(l.id) ? "✓" : i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{l.title}</div>
                      {l.duration && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>⏱ {l.duration}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {selLesson && <>
                  <div className="vbox">
                    {canWatch ? (
                      ytId(selLesson.videoUrl) ? <iframe src={`https://www.youtube.com/embed/${ytId(selLesson.videoUrl)}`} allowFullScreen title={selLesson.title} /> :
                        selLesson.videoStorageUrl ? <video src={selLesson.videoStorageUrl} controls /> :
                          <div className="vlock"><span style={{ fontSize: 36 }}>🎬</span><span style={{ color: "#9ca3af" }}>Видео удахгүй нэмэгдэнэ</span></div>
                    ) : <div className="vlock"><span style={{ fontSize: 42 }}>🔒</span><span style={{ fontSize: 16, fontWeight: 700 }}>Бүртгүүлснийхээ дараа үзнэ үү</span><button className="btn btn-primary" onClick={enroll}>{course.isFree ? "Бүртгүүлэх" : "Худалдаж авах"}</button></div>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700 }}>{selLesson.title}</h3>
                    {enrolled && !completedLessons.includes(selLesson.id) && <button className="btn btn-success btn-sm" onClick={() => markLessonDone(selLesson.id)}>✓ Дүүргэсэн</button>}
                    {completedLessons.includes(selLesson.id) && <span style={{ color: "#10b981", fontWeight: 700, fontSize: 13 }}>✅ Дүүргэсэн</span>}
                  </div>
                  {selLesson.description && <p style={{ color: "#6b7280", marginTop: 8, lineHeight: 1.6 }}>{selLesson.description}</p>}
                </>}
              </div>
            </div>
          )}
          {lessons.length === 0 && (
            <div className="vbox">
              {canWatch ? (
                activeYtId ? <iframe src={`https://www.youtube.com/embed/${activeYtId}`} allowFullScreen title={course.title} /> :
                  course.videoStorageUrl ? <video src={course.videoStorageUrl} controls /> :
                    <div className="vlock"><span style={{ fontSize: 36 }}>🎬</span><span style={{ color: "#9ca3af" }}>Видео удахгүй нэмэгдэнэ</span></div>
              ) : <div className="vlock"><span style={{ fontSize: 42 }}>🔒</span><span style={{ fontSize: 16, fontWeight: 700 }}>Бүртгүүлснийхээ дараа үзнэ үү</span><button className="btn btn-primary" onClick={enroll}>{course.isFree ? "Бүртгүүлэх" : "Худалдаж авах"}</button></div>}
            </div>
          )}
        </>
      )}

      {dtab === "mat" && (
        <div className="panel">
          <div className="ph">📄 Сургалтын материалууд</div>
          {materials.length === 0 ? <div className="empty"><div className="ei">📭</div><p>Материал байхгүй</p></div>
            : materials.map(m => (
              <div key={m.id} className="mat-item">
                <span style={{ fontSize: 22 }}>{m.type === "pdf" ? "📕" : m.type === "ppt" ? "📊" : m.type === "doc" ? "📘" : "📎"}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                {canWatch ? <a href={m.url} target="_blank" rel="noreferrer" className="btn btn-info btn-sm">⬇️ Татах</a>
                  : <span style={{ fontSize: 12, color: "#9ca3af" }}>🔒 Бүртгүүлнэ үү</span>}
              </div>
            ))}
        </div>
      )}

      {dtab === "quiz" && (
        <div className="panel">
          <div className="ph">📝 Тест шалгалт</div>
          {!quiz ? <div className="empty"><div className="ei">📝</div><p>Тест байхгүй</p></div>
            : !canWatch ? <div className="al al-warn">🔒 Тест үзэхийн тулд бүртгүүлнэ үү</div>
              : <>
                {quiz.questions?.map((q, i) => (
                  <div key={i} className="qq">
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5 }}>{i + 1}-р асуулт</div>
                    <div style={{ fontWeight: 700, marginBottom: 11, fontSize: 15 }}>{q.question}</div>
                    {q.options?.map((opt, j) => {
                      let cls = "qo";
                      if (submitted) { if (j === q.correct) cls += " correct"; else if (answers[i] === j) cls += " wrong"; }
                      else if (answers[i] === j) cls += " selected";
                      return <div key={j} className={cls} onClick={() => !submitted && setAnswers({ ...answers, [i]: j })}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{String.fromCharCode(65 + j)}</span>{opt}
                      </div>;
                    })}
                  </div>
                ))}
                {!submitted && <button className="btn btn-primary" onClick={submitQuiz} disabled={Object.keys(answers).length < (quiz.questions?.length || 0)}>Илгээх</button>}
                {submitted && <div className="al al-ok">✅ Тест дүүргэсэн! Хариултуудыг дээр харна уу.</div>}
              </>}
        </div>
      )}

      {dtab === "review" && (
        <div className="panel">
          <div className="ph">⭐ Сэтгэгдэл & Үнэлгээ</div>
          {enrolled && (
            <div style={{ background: "#f9fafb", borderRadius: 11, padding: 16, marginBottom: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Өөрийн үнэлгээг өг:</div>
              <div className="sr-wrap" style={{ marginBottom: 10 }}>
                {[1,2,3,4,5].map(i => <span key={i} className={`sr ${myRating >= i ? "on" : ""}`} onClick={() => setMyRating(i)}>★</span>)}
              </div>
              <textarea value={myComment} onChange={e => setMyComment(e.target.value)} placeholder="Сэтгэгдэлээ бичнэ үү..." style={{ width: "100%", padding: "9px 13px", border: "2px solid #e5e7eb", borderRadius: 9, fontSize: 14, fontFamily: "inherit", minHeight: 72, resize: "vertical" }} />
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={submitReview}>Илгээх</button>
            </div>
          )}
          {reviews.length === 0 ? <div className="empty"><div className="ei">⭐</div><p>Сэтгэгдэл байхгүй</p></div>
            : reviews.map(r => (
              <div key={r.id} className="rev-item">
                <div className="rev-hd">
                  <div className="av">{r.userName?.[0] || "U"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.userName}</div>
                    <div>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= r.rating ? "#f59e0b" : "#d1d5db", fontSize: 14 }}>★</span>)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.createdAt?.toDate?.()?.toLocaleDateString("mn-MN") || ""}</div>
                </div>
                {r.comment && <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{r.comment}</p>}
              </div>
            ))}
        </div>
      )}

      {showPay && <PayModal course={course} user={user} notify={notify} onClose={() => setShowPay(false)} onSuccess={() => { setEnrolled(true); setShowPay(false); }} />}
    </div>
  );
}

// ===================== QPAY PAYMENT MODAL =====================
function PayModal({ course, user, notify, onClose, onSuccess }) {
  const [step, setStep] = useState("method");
  const [method, setMethod] = useState("qpay");
  const [payLoading, setPayLoading] = useState(false);
  const [qpayData, setQpayData] = useState(null);
  const [checking, setChecking] = useState(false);

  const createQPayInvoice = async () => {
    setPayLoading(true);
    try {
      // QPay API холболт — merchant.qpay.mn дээр бүртгүүлж token авна
      // Одоо: mock invoice үүсгэнэ
      const orderId = `EDUMN_${user.uid.substring(0, 8)}_${Date.now()}`;
      // Бодит QPay API дуудалт (token авсны дараа идэвхжүүлнэ):
      // const token = await getQPayToken();
      // const invoice = await createQPayInvoice(token, orderId, course.price, course.title);
      
      // Order Firestore-д хадгалах
      await setDoc(doc(collection(db, "orders")), {
        userId: user.uid, courseId: course.id, courseName: course.title,
        amount: course.price, method: "qpay", status: "pending",
        orderId, createdAt: serverTimestamp()
      });

      setQpayData({
        orderId,
        // Mock QR - бодит QPay integration хийхэд энд invoice.qr_text орно
        qrText: `QPAY:${orderId}:${course.price}`,
        amount: course.price
      });
      setStep("qpay");
    } catch (e) { notify("QPay алдаа: " + e.message, "#ef4444"); }
    setPayLoading(false);
  };

  const checkPayment = async () => {
    setChecking(true);
    // Бодит QPay-д: payment status шалгах API дуудна
    // Одоо: manual confirm
    await new Promise(r => setTimeout(r, 1500));
    // Demo: always success
    await updateDoc(doc(db, "users", user.uid), {
      enrolledCourses: [...[], course.id] // simplified
    });
    setStep("success");
    setChecking(false);
  };

  const bankTransfer = async () => {
    setPayLoading(true);
    const orderId = `EDUMN_${user.uid.substring(0, 8)}_${Date.now()}`;
    await setDoc(doc(collection(db, "orders")), {
      userId: user.uid, courseId: course.id, courseName: course.title,
      amount: course.price, method: "transfer", status: "pending",
      orderId, createdAt: serverTimestamp()
    });
    setStep("transfer");
    setPayLoading(false);
  };

  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="md">
        {step === "method" && <>
          <h2>💳 Төлбөрийн арга</h2>
          <div style={{ background: "#f9fafb", borderRadius: 11, padding: 13, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>{course.title}</div>
            <div className="price" style={{ fontSize: 22 }}>{(course.price || 0).toLocaleString()}₮</div>
          </div>
          {[{v:"qpay",l:"📱 QPay"},{v:"transfer",l:"🏦 Банкны шилжүүлэг"}].map(m => (
            <div key={m.v} onClick={() => setMethod(m.v)} style={{ padding: "13px 16px", borderRadius: 11, border: `2px solid ${method === m.v ? "#f59e0b" : "#e5e7eb"}`, background: method === m.v ? "#fffbeb" : "#fff", cursor: "pointer", marginBottom: 10, fontWeight: 600 }}>
              {m.l} {method === m.v && "✓"}
            </div>
          ))}
          <button className="btn btn-primary" style={{ width: "100%", padding: 12 }} disabled={payLoading}
            onClick={method === "qpay" ? createQPayInvoice : bankTransfer}>
            {payLoading ? "Боловсруулж байна..." : "Үргэлжлүүлэх →"}
          </button>
          <button className="btn btn-ghost" style={{ width: "100%", padding: 10, marginTop: 8 }} onClick={onClose}>Болих</button>
        </>}

        {step === "qpay" && qpayData && <>
          <h2>📱 QPay</h2>
          <div className="qpay-box">
            <div style={{ fontSize: 13, opacity: 0.8 }}>Төлбөрийн дүн</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b", margin: "8px 0" }}>{(qpayData.amount || 0).toLocaleString()}₮</div>
            <div className="qr">
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32 }}>📱</div>
                <div style={{ fontSize: 11, marginTop: 6, color: "#374151" }}>QPay апп-аар уншуулна уу</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, wordBreak: "break-all" }}>{qpayData.orderId}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>QPay → QR уншуулах → Баталгаажуулах</div>
          </div>
          <div className="al al-info" style={{ fontSize: 12 }}>
            💡 Merchant credentials тохируулснаар бодит QR код харагдана.<br />
            Одоо: admin-д хандаж гараар баталгаажуулна.
          </div>
          <button className="btn btn-success" style={{ width: "100%", padding: 12 }} onClick={checkPayment} disabled={checking}>
            {checking ? "Шалгаж байна..." : "✓ Төлбөр хийлээ"}
          </button>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setStep("method")}>← Буцах</button>
        </>}

        {step === "transfer" && <>
          <h2>🏦 Банкны шилжүүлэг</h2>
          <div className="al al-info">
            <div style={{ lineHeight: 2 }}>
              <div><strong>Банк:</strong> Хаан банк</div>
              <div><strong>Данс:</strong> 9903-3062</div>
              <div><strong>Хүлээн авагч:</strong> EduMN</div>
              <div><strong>Дүн:</strong> {(course.price || 0).toLocaleString()}₮</div>
              <div><strong>Гүйлгээний утга:</strong> {user?.uid?.substring(0, 8)} - {course.title?.substring(0, 20)}</div>
            </div>
          </div>
          <div className="al al-warn">⚠️ Шилжүүлэг хийсний дараа 9903-3062 дугаарт мэдэгдэнэ үү. Баталгаажсаны дараа хичээл нэвтрэх эрх нэмэгдэнэ.</div>
          <button className="btn btn-primary" style={{ width: "100%", padding: 12 }} onClick={() => { notify("Мэдэгдэл илгээгдлээ! Удахгүй нэвтрэх эрх нэмэгдэнэ."); onClose(); }}>Ойлголоо</button>
        </>}

        {step === "success" && <>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 60 }}>🎉</div>
            <h2 style={{ marginTop: 12 }}>Амжилттай!</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>Сургалтад бүртгүүллээ. Хичээлдээ амжилт хүсье!</p>
            <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }} onClick={onSuccess}>Сургалт эхлэх →</button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ===================== TEACHER PAGE =====================
function TeacherPage({ user, profile, courses, notify, setProfile }) {
  const [tab, setTab] = useState("courses");
  const mine = courses.filter(c => c.teacherId === user?.uid);
  const [showAdd, setShowAdd] = useState(false);
  const [cf, setCf] = useState({ title: "", desc: "", cat: "computer", sub: "", free: true, price: "", vtype: "youtube", vurl: "" });
  const [vFile, setVFile] = useState(null); const [vProg, setVProg] = useState(0); const [uploading, setUploading] = useState(false);
  const [photob64, setPhotob64] = useState(null); const [photoPreview, setPhotoPreview] = useState(profile?.photoUrl || "");
  const [bio, setBio] = useState(profile?.bio || "");
  // Lessons
  const [lessonCourse, setLessonCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lf, setLf] = useState({ title: "", desc: "", duration: "", vtype: "youtube", vurl: "" });
  const [lvFile, setLvFile] = useState(null); const [lvProg, setLvProg] = useState(0);
  // Materials
  const [matCourse, setMatCourse] = useState(null); const [materials, setMaterials] = useState([]);
  const [matFile, setMatFile] = useState(null); const [matName, setMatName] = useState(""); const [matProg, setMatProg] = useState(0);
  // Quiz
  const [quizCourse, setQuizCourse] = useState(null);
  const [quiz, setQuiz] = useState({ questions: [{ question: "", options: ["", "", "", ""], correct: 0 }] });
  // Stats
  const [orders, setOrders] = useState([]);
  const catInfo = CATEGORIES.find(c => c.id === cf.cat);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, "orders"), where("courseId", "in", mine.length > 0 ? mine.map(c => c.id) : ["none"])),
      s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user, mine.length]);

  useEffect(() => {
    if (!lessonCourse) return;
    return onSnapshot(query(collection(db, "courses", lessonCourse, "lessons"), orderBy("order")), s => setLessons(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [lessonCourse]);

  useEffect(() => {
    if (!matCourse) return;
    return onSnapshot(query(collection(db, "courses", matCourse, "materials"), orderBy("createdAt", "desc")), s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [matCourse]);

  useEffect(() => {
    if (!quizCourse) return;
    getDoc(doc(db, "courses", quizCourse, "quiz", "main")).then(d => { if (d.exists()) setQuiz(d.data()); else setQuiz({ questions: [{ question: "", options: ["", "", "", ""], correct: 0 }] }); });
  }, [quizCourse]);

  const onPhoto = e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 500 * 1024) { notify("Зураг 500KB-аас бага байх ёстой", "#ef4444"); return; }
    const r = new FileReader(); r.onload = ev => { setPhotoPreview(ev.target.result); setPhotob64(ev.target.result); }; r.readAsDataURL(f);
  };

  const saveProfile = async () => {
    const u = { bio }; if (photob64) u.photoUrl = photob64;
    await updateDoc(doc(db, "users", user.uid), u);
    setProfile({ ...profile, ...u }); notify("Профайл хадгалагдлаа!");
  };

  const addCourse = async () => {
    if (!cf.title || !cf.desc) { notify("Гарчиг, тайлбарыг бөглөнө үү", "#ef4444"); return; }
    setUploading(true);
    let videoStorageUrl = "";
    try {
      if (cf.vtype === "file" && vFile) videoStorageUrl = await uploadFile(vFile, `videos/${user.uid}/${Date.now()}_${vFile.name}`, setVProg);
      await setDoc(doc(collection(db, "courses")), {
        title: cf.title, description: cf.desc, category: cf.cat, subCategory: cf.sub,
        isFree: cf.free, price: cf.free ? 0 : Number(cf.price),
        videoUrl: cf.vtype === "youtube" ? cf.vurl : "", videoStorageUrl,
        teacherId: user.uid, teacherName: profile?.name || "", teacherPhoto: profile?.photoUrl || "",
        avgRating: 0, reviewCount: 0, createdAt: serverTimestamp()
      });
      setCf({ title: "", desc: "", cat: "computer", sub: "", free: true, price: "", vtype: "youtube", vurl: "" });
      setVFile(null); setVProg(0); setShowAdd(false); notify("Сургалт нэмэгдлээ!");
    } catch (e) { notify("Алдаа: " + e.message, "#ef4444"); }
    setUploading(false);
  };

  const addLesson = async () => {
    if (!lf.title || !lessonCourse) { notify("Гарчиг бөглөнө үү", "#ef4444"); return; }
    setUploading(true);
    let videoStorageUrl = "";
    try {
      if (lf.vtype === "file" && lvFile) videoStorageUrl = await uploadFile(lvFile, `lessons/${lessonCourse}/${Date.now()}_${lvFile.name}`, setLvProg);
      await setDoc(doc(collection(db, "courses", lessonCourse, "lessons")), {
        title: lf.title, description: lf.desc, duration: lf.duration,
        videoUrl: lf.vtype === "youtube" ? lf.vurl : "", videoStorageUrl,
        order: lessons.length + 1, createdAt: serverTimestamp()
      });
      setLf({ title: "", desc: "", duration: "", vtype: "youtube", vurl: "" });
      setLvFile(null); setLvProg(0); setShowAddLesson(false); notify("Хичээл нэмэгдлээ!");
    } catch (e) { notify("Алдаа: " + e.message, "#ef4444"); }
    setUploading(false);
  };

  const addMat = async () => {
    if (!matFile || !matName || !matCourse) { notify("Бүх талбарыг бөглөнө үү", "#ef4444"); return; }
    setUploading(true);
    try {
      const ext = matFile.name.split(".").pop().toLowerCase();
      const type = ext === "pdf" ? "pdf" : ["ppt","pptx"].includes(ext) ? "ppt" : ["doc","docx"].includes(ext) ? "doc" : "file";
      const url = await uploadFile(matFile, `materials/${matCourse}/${Date.now()}_${matFile.name}`, setMatProg);
      await setDoc(doc(collection(db, "courses", matCourse, "materials")), { name: matName, url, type, createdAt: serverTimestamp() });
      setMatFile(null); setMatName(""); setMatProg(0); notify("Материал нэмэгдлээ!");
    } catch (e) { notify("Алдаа: " + e.message, "#ef4444"); }
    setUploading(false);
  };

  const saveQuiz = async () => {
    if (!quizCourse) return;
    if (!quiz.questions.every(q => q.question && q.options.every(o => o))) { notify("Бүх асуулт, хариултыг бөглөнө үү", "#ef4444"); return; }
    await setDoc(doc(db, "courses", quizCourse, "quiz", "main"), quiz); notify("Тест хадгалагдлаа!");
  };

  const addQ = () => setQuiz({ ...quiz, questions: [...quiz.questions, { question: "", options: ["", "", "", ""], correct: 0 }] });
  const remQ = i => setQuiz({ ...quiz, questions: quiz.questions.filter((_, j) => j !== i) });
  const updQ = (i, k, v) => { const q = [...quiz.questions]; q[i] = { ...q[i], [k]: v }; setQuiz({ ...quiz, questions: q }); };
  const updO = (qi, oi, v) => { const q = [...quiz.questions]; q[qi].options[oi] = v; setQuiz({ ...quiz, questions: q }); };

  // Stats
  const totalRevenue = orders.filter(o => o.status === "paid").reduce((s, o) => s + (o.amount || 0), 0);
  const totalStudents = orders.length;

  return (
    <div className="sec">
      <div className="sec-title">🎓 Багшийн самбар</div>
      <div className="stat-grid">
        <div className="stat-c"><div className="sv">{mine.length}</div><div className="sl">Нийт сургалт</div></div>
        <div className="stat-c"><div className="sv">{totalStudents}</div><div className="sl">Нийт суралцагч</div></div>
        <div className="stat-c"><div className="sv">{totalRevenue.toLocaleString()}₮</div><div className="sl">Нийт орлого</div></div>
        <div className="stat-c"><div className="sv">{mine.reduce((s, c) => s + (c.reviewCount || 0), 0)}</div><div className="sl">Сэтгэгдэл</div></div>
      </div>
      <div className="tabs">
        {["courses","lessons","mat","quiz","orders","profile"].map((t, i) => (
          <div key={t} className={`tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
            {["Сургалт","Хичээлүүд","Материал","Тест","Захиалга","Профайл"][i]}
          </div>
        ))}
      </div>

      {tab === "courses" && (
        <div className="panel">
          <div className="ph">Миний сургалтууд ({mine.length}) <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Нэмэх</button></div>
          {showAdd && (
            <div style={{ background: "#f9fafb", borderRadius: 11, padding: 18, marginBottom: 18 }}>
              <div className="fg"><label>Сургалтын нэр</label><input value={cf.title} onChange={e => setCf({ ...cf, title: e.target.value })} /></div>
              <div className="fg"><label>Тайлбар</label><textarea value={cf.desc} onChange={e => setCf({ ...cf, desc: e.target.value })} /></div>
              <div className="fg-row">
                <div className="fg"><label>Ангилал</label>
                  <select value={cf.cat} onChange={e => setCf({ ...cf, cat: e.target.value, sub: "" })}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select></div>
                <div className="fg"><label>Төлбөр</label>
                  <select value={cf.free ? "free" : "paid"} onChange={e => setCf({ ...cf, free: e.target.value === "free" })}>
                    <option value="free">Үнэгүй</option><option value="paid">Төлбөртэй</option>
                  </select></div>
              </div>
              {catInfo?.subs && <div className="fg"><label>Дэд ангилал</label>
                <select value={cf.sub} onChange={e => setCf({ ...cf, sub: e.target.value })}>
                  <option value="">-- Сонгоно уу --</option>
                  {catInfo.subs.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select></div>}
              {!cf.free && <div className="fg"><label>Үнэ (₮)</label><input type="number" value={cf.price} onChange={e => setCf({ ...cf, price: e.target.value })} placeholder="50000" /></div>}
              <div className="fg"><label>Үндсэн видео (хичээл нэмэхгүй бол)</label>
                <div className="vtt">
                  <button className={`vb ${cf.vtype === "youtube" ? "on" : ""}`} onClick={() => setCf({ ...cf, vtype: "youtube" })}>▶️ YouTube</button>
                  <button className={`vb ${cf.vtype === "file" ? "on" : ""}`} onClick={() => setCf({ ...cf, vtype: "file" })}>📁 Файл</button>
                </div>
                {cf.vtype === "youtube" ? <input value={cf.vurl} onChange={e => setCf({ ...cf, vurl: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                  : <label className="ua"><input type="file" accept="video/*" onChange={e => setVFile(e.target.files[0])} />
                    {vFile ? <span>✅ {vFile.name} ({(vFile.size/1024/1024).toFixed(1)}MB)</span> : <span>📁 Видео файл сонгох (MP4, MOV...)</span>}
                  </label>}
                {vProg > 0 && vProg < 100 && <div style={{ marginTop: 7 }}><div style={{ fontSize: 12, color: "#6b7280" }}>Байршуулж байна... {Math.round(vProg)}%</div><div className="pw"><div className="pf" style={{ width: `${vProg}%` }} /></div></div>}
              </div>
              <div style={{ display: "flex", gap: 9 }}>
                <button className="btn btn-primary" onClick={addCourse} disabled={uploading}>{uploading ? "Байршуулж байна..." : "Нэмэх"}</button>
                <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Болих</button>
              </div>
            </div>
          )}
          {mine.length === 0 ? <div className="empty"><div className="ei">📭</div><p>Сургалт байхгүй</p></div>
            : <table className="tbl"><thead><tr><th>Нэр</th><th>Ангилал</th><th>Үнэ</th><th>Суралцагч</th><th>Үнэлгээ</th><th>Үйлдэл</th></tr></thead>
              <tbody>{mine.map(c => <tr key={c.id}>
                <td><strong>{c.title}</strong></td>
                <td>{getCat(c.category)?.name}{c.subCategory ? ` / ${getSub(c.subCategory)?.name}` : ""}</td>
                <td>{c.isFree ? <span className="badge b-free">Үнэгүй</span> : `${(c.price||0).toLocaleString()}₮`}</td>
                <td>{orders.filter(o => o.courseId === c.id).length}</td>
                <td>{c.avgRating > 0 ? `★ ${c.avgRating}` : "-"}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db, "courses", c.id))}>Устгах</button></td>
              </tr>)}</tbody>
            </table>}
        </div>
      )}

      {tab === "lessons" && (
        <div className="panel">
          <div className="ph">📹 Хичээлүүд</div>
          <div className="fg"><label>Сургалт сонгох</label>
            <select value={lessonCourse || ""} onChange={e => setLessonCourse(e.target.value)}>
              <option value="">-- Сонгоно уу --</option>
              {mine.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select></div>
          {lessonCourse && <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddLesson(!showAddLesson)}>+ Хичээл нэмэх</button>
            </div>
            {showAddLesson && (
              <div style={{ background: "#f9fafb", borderRadius: 11, padding: 16, marginBottom: 16 }}>
                <div className="fg-row">
                  <div className="fg"><label>Хичээлийн нэр</label><input value={lf.title} onChange={e => setLf({ ...lf, title: e.target.value })} /></div>
                  <div className="fg"><label>Үргэлжлэх хугацаа</label><input value={lf.duration} onChange={e => setLf({ ...lf, duration: e.target.value })} placeholder="15 мин" /></div>
                </div>
                <div className="fg"><label>Тайлбар</label><textarea value={lf.desc} onChange={e => setLf({ ...lf, desc: e.target.value })} style={{ minHeight: 60 }} /></div>
                <div className="fg"><label>Видео</label>
                  <div className="vtt">
                    <button className={`vb ${lf.vtype === "youtube" ? "on" : ""}`} onClick={() => setLf({ ...lf, vtype: "youtube" })}>▶️ YouTube</button>
                    <button className={`vb ${lf.vtype === "file" ? "on" : ""}`} onClick={() => setLf({ ...lf, vtype: "file" })}>📁 Файл</button>
                  </div>
                  {lf.vtype === "youtube" ? <input value={lf.vurl} onChange={e => setLf({ ...lf, vurl: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                    : <label className="ua"><input type="file" accept="video/*" onChange={e => setLvFile(e.target.files[0])} />
                      {lvFile ? <span>✅ {lvFile.name}</span> : <span>📁 Видео файл сонгох</span>}
                    </label>}
                  {lvProg > 0 && lvProg < 100 && <div style={{ marginTop: 6 }}><div style={{ fontSize: 12, color: "#6b7280" }}>Байршуулж байна... {Math.round(lvProg)}%</div><div className="pw"><div className="pf" style={{ width: `${lvProg}%` }} /></div></div>}
                </div>
                <div style={{ display: "flex", gap: 9 }}>
                  <button className="btn btn-primary" onClick={addLesson} disabled={uploading}>{uploading ? "Байршуулж байна..." : "Нэмэх"}</button>
                  <button className="btn btn-ghost" onClick={() => setShowAddLesson(false)}>Болих</button>
                </div>
              </div>
            )}
            {lessons.length === 0 ? <div className="empty"><div className="ei">📹</div><p>Хичээл байхгүй</p></div>
              : <table className="tbl"><thead><tr><th>#</th><th>Нэр</th><th>Хугацаа</th><th>Видео</th><th>Үйлдэл</th></tr></thead>
                <tbody>{lessons.map((l, i) => <tr key={l.id}>
                  <td>{i + 1}</td><td><strong>{l.title}</strong></td>
                  <td>{l.duration || "-"}</td>
                  <td>{(l.videoUrl || l.videoStorageUrl) ? "✅" : "❌"}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db, "courses", lessonCourse, "lessons", l.id))}>Устгах</button></td>
                </tr>)}</tbody>
              </table>}
          </>}
        </div>
      )}

      {tab === "mat" && (
        <div className="panel">
          <div className="ph">📄 Сургалтын материал</div>
          <div className="fg"><label>Сургалт сонгох</label>
            <select value={matCourse || ""} onChange={e => setMatCourse(e.target.value)}>
              <option value="">-- Сонгоно уу --</option>
              {mine.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select></div>
          {matCourse && <>
            <div style={{ background: "#f9fafb", borderRadius: 11, padding: 14, marginBottom: 14 }}>
              <div className="fg-row">
                <div className="fg" style={{ marginBottom: 0 }}><label>Нэр</label><input value={matName} onChange={e => setMatName(e.target.value)} placeholder="Хичээл 1 - Материал" /></div>
                <div className="fg" style={{ marginBottom: 0 }}><label>Файл</label>
                  <label className="ua" style={{ padding: "9px 13px" }}><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip" onChange={e => setMatFile(e.target.files[0])} />
                    {matFile ? <span>✅ {matFile.name}</span> : <span>📎 PDF, DOC, PPT...</span>}
                  </label></div>
              </div>
              {matProg > 0 && matProg < 100 && <div style={{ marginTop: 7 }}><div style={{ fontSize: 12, color: "#6b7280" }}>Байршуулж байна... {Math.round(matProg)}%</div><div className="pw"><div className="pf" style={{ width: `${matProg}%` }} /></div></div>}
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={addMat} disabled={uploading}>Нэмэх</button>
            </div>
            {materials.map(m => <div key={m.id} className="mat-item">
              <span style={{ fontSize: 20 }}>{m.type === "pdf" ? "📕" : m.type === "ppt" ? "📊" : m.type === "doc" ? "📘" : "📎"}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{m.name}</span>
              <button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db, "courses", matCourse, "materials", m.id))}>Устгах</button>
            </div>)}
          </>}
        </div>
      )}

      {tab === "quiz" && (
        <div className="panel">
          <div className="ph">📝 Тест үүсгэх / засах</div>
          <div className="fg"><label>Сургалт сонгох</label>
            <select value={quizCourse || ""} onChange={e => setQuizCourse(e.target.value)}>
              <option value="">-- Сонгоно уу --</option>
              {mine.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select></div>
          {quizCourse && <>
            {quiz.questions?.map((q, i) => (
              <div key={i} className="qq">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>{i + 1}-р асуулт</span>
                  {quiz.questions.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => remQ(i)}>✕</button>}
                </div>
                <div className="fg" style={{ marginBottom: 9 }}><input value={q.question} onChange={e => updQ(i, "question", e.target.value)} placeholder="Асуулт бичнэ үү..." /></div>
                {q.options?.map((opt, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                    <input type="radio" name={`c_${i}`} checked={q.correct === j} onChange={() => updQ(i, "correct", j)} />
                    <input value={opt} onChange={e => updO(i, j, e.target.value)} placeholder={`${String.fromCharCode(65+j)} хариулт`} style={{ flex: 1, padding: "7px 11px", border: "2px solid #e5e7eb", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }} />
                    {q.correct === j && <span style={{ color: "#10b981", fontSize: 11, fontWeight: 700 }}>✓ Зөв</span>}
                  </div>
                ))}
              </div>
            ))}
            <div style={{ display: "flex", gap: 9, marginTop: 8 }}>
              <button className="btn btn-info btn-sm" onClick={addQ}>+ Асуулт нэмэх</button>
              <button className="btn btn-success" onClick={saveQuiz}>💾 Хадгалах</button>
            </div>
          </>}
        </div>
      )}

      {tab === "orders" && (
        <div className="panel">
          <div className="ph">💰 Захиалга & Орлого</div>
          {orders.length === 0 ? <div className="empty"><div className="ei">💰</div><p>Захиалга байхгүй</p></div>
            : <>
              <div style={{ marginBottom: 16, padding: "12px 16px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                <div style={{ fontWeight: 700, color: "#065f46" }}>Нийт орлого: {totalRevenue.toLocaleString()}₮</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Нийт {orders.length} захиалга</div>
              </div>
              <table className="tbl">
                <thead><tr><th>Сургалт</th><th>Дүн</th><th>Арга</th><th>Огноо</th></tr></thead>
                <tbody>{orders.map(o => <tr key={o.id}>
                  <td>{o.courseName?.substring(0, 25)}</td>
                  <td><strong>{(o.amount||0).toLocaleString()}₮</strong></td>
                  <td>{o.method === "qpay" ? "QPay" : "Шилжүүлэг"}</td>
                  <td style={{ fontSize: 12 }}>{o.createdAt?.toDate?.()?.toLocaleDateString("mn-MN") || "-"}</td>
                </tr>)}</tbody>
              </table>
            </>}
        </div>
      )}

      {tab === "profile" && (
        <div className="ps">
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ width: 86, height: 86, borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, color: "#1a1a2e", margin: "0 auto 11px", overflow: "hidden" }}>
              {photoPreview || profile?.photoUrl ? <img src={photoPreview || profile?.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (profile?.name?.[0] || "T")}
            </div>
            <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>📷 Зураг солих<input type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} /></label>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>500KB хүртэл</div>
          </div>
          <div className="fg"><label>Нэр</label><input value={profile?.name || ""} disabled style={{ background: "#f9fafb" }} /></div>
          <div className="fg"><label>Имэйл</label><input value={profile?.email || ""} disabled style={{ background: "#f9fafb" }} /></div>
          <div className="fg"><label>Тайлбар (bio)</label><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Өөрийн тухай, туршлагаа бичнэ үү..." /></div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={saveProfile}>Хадгалах</button>
        </div>
      )}
    </div>
  );
}

// ===================== ADMIN PAGE =====================
function AdminPage({ pending, teachers, courses, news, notify, adminTab, setAdminTab }) {
  const [nf, setNf] = useState({ title: "", content: "" }); const [showNews, setShowNews] = useState(false);

  const approve = async pt => {
    try {
      const c = await createUserWithEmailAndPassword(auth, pt.email, pt.password);
      await setDoc(doc(db, "users", c.user.uid), { name: pt.name, email: pt.email, role: "teacher", photoUrl: "", bio: "", createdAt: serverTimestamp() });
      await deleteDoc(doc(db, "pendingTeachers", pt.id));
      notify(`${pt.name} багшийг зөвшөөрлөө!`);
    } catch (e) { notify("Алдаа: " + e.message, "#ef4444"); }
  };

  const addNews = async () => {
    if (!nf.title || !nf.content) { notify("Бүх талбарыг бөглөнө үү", "#ef4444"); return; }
    await setDoc(doc(collection(db, "news")), { ...nf, createdAt: serverTimestamp() });
    setNf({ title: "", content: "" }); setShowNews(false); notify("Мэдээ нийтлэгдлээ!");
  };

  return (
    <div className="sec">
      <div className="sec-title">⚙️ Админ самбар</div>
      <div className="stat-grid">
        <div className="stat-c"><div className="sv">{courses.length}</div><div className="sl">Нийт сургалт</div></div>
        <div className="stat-c"><div className="sv">{teachers.length}</div><div className="sl">Нийт багш</div></div>
        <div className="stat-c"><div className="sv">{pending.length}</div><div className="sl">Хүлээгдэж буй</div></div>
        <div className="stat-c"><div className="sv">{news.length}</div><div className="sl">Мэдээ</div></div>
      </div>
      <div className="tabs">
        <div className={`tab ${adminTab === "teachers" ? "on" : ""}`} onClick={() => setAdminTab("teachers")}>
          Хүсэлтүүд {pending.length > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: "99px", padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{pending.length}</span>}
        </div>
        <div className={`tab ${adminTab === "allteachers" ? "on" : ""}`} onClick={() => setAdminTab("allteachers")}>Багш нар</div>
        <div className={`tab ${adminTab === "courses" ? "on" : ""}`} onClick={() => setAdminTab("courses")}>Сургалтууд</div>
        <div className={`tab ${adminTab === "news" ? "on" : ""}`} onClick={() => setAdminTab("news")}>Мэдээ</div>
      </div>
      {adminTab === "teachers" && <div className="panel">
        <div className="ph">Багшийн хүсэлтүүд ({pending.length})</div>
        {pending.length === 0 ? <div className="empty"><div className="ei">✅</div><p>Шинэ хүсэлт байхгүй</p></div>
          : <table className="tbl"><thead><tr><th>Нэр</th><th>Имэйл</th><th>Огноо</th><th>Үйлдэл</th></tr></thead>
            <tbody>{pending.map(pt => <tr key={pt.id}>
              <td><strong>{pt.name}</strong></td><td>{pt.email}</td>
              <td style={{ fontSize: 12 }}>{pt.createdAt?.toDate?.()?.toLocaleDateString("mn-MN") || "-"}</td>
              <td style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-success btn-sm" onClick={() => approve(pt)}>✓ Зөвшөөрөх</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db, "pendingTeachers", pt.id))}>✗ Татгалзах</button>
              </td>
            </tr>)}</tbody></table>}
      </div>}
      {adminTab === "allteachers" && <div className="panel">
        <div className="ph">Бүх багш нар ({teachers.length})</div>
        <table className="tbl"><thead><tr><th>Нэр</th><th>Имэйл</th><th>Сургалт</th><th>Нийт үнэлгээ</th></tr></thead>
          <tbody>{teachers.map(t => <tr key={t.id}>
            <td><strong>{t.name}</strong></td><td>{t.email}</td>
            <td>{courses.filter(c => c.teacherId === t.id).length}</td>
            <td>{courses.filter(c => c.teacherId === t.id).reduce((s, c) => s + (c.reviewCount || 0), 0)}</td>
          </tr>)}</tbody></table>
      </div>}
      {adminTab === "courses" && <div className="panel">
        <div className="ph">Бүх сургалтууд ({courses.length})</div>
        <table className="tbl"><thead><tr><th>Нэр</th><th>Багш</th><th>Ангилал</th><th>Үнэ</th><th>Үнэлгээ</th><th>Үйлдэл</th></tr></thead>
          <tbody>{courses.map(c => <tr key={c.id}>
            <td><strong>{c.title}</strong></td><td>{c.teacherName}</td>
            <td>{getCat(c.category)?.name}</td>
            <td>{c.isFree ? <span className="badge b-free">Үнэгүй</span> : `${(c.price||0).toLocaleString()}₮`}</td>
            <td>{c.avgRating > 0 ? `★ ${c.avgRating}` : "-"}</td>
            <td><button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db, "courses", c.id))}>Устгах</button></td>
          </tr>)}</tbody></table>
      </div>}
      {adminTab === "news" && <div className="panel">
        <div className="ph">Мэдээ ({news.length}) <button className="btn btn-primary btn-sm" onClick={() => setShowNews(!showNews)}>+ Нэмэх</button></div>
        {showNews && <div style={{ background: "#f9fafb", borderRadius: 11, padding: 14, marginBottom: 14 }}>
          <div className="fg"><label>Гарчиг</label><input value={nf.title} onChange={e => setNf({ ...nf, title: e.target.value })} /></div>
          <div className="fg"><label>Агуулга</label><textarea value={nf.content} onChange={e => setNf({ ...nf, content: e.target.value })} /></div>
          <button className="btn btn-primary" onClick={addNews}>Нийтлэх</button>
        </div>}
        {news.map(n => <div key={n.id} className="news-card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3>{n.title}</h3><button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db, "news", n.id))}>Устгах</button>
          </div>
          <p style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>{n.content?.substring(0, 120)}...</p>
        </div>)}
      </div>}
    </div>
  );
}

// ===================== PROFILE PAGE =====================
function ProfilePage({ user, profile, courses, notify }) {
  const [enrolled, setEnrolled] = useState([]);
  const [completedMap, setCompletedMap] = useState({});
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then(d => {
      if (d.exists()) {
        setEnrolled(courses.filter(c => (d.data().enrolledCourses || []).includes(c.id)));
        setCompletedMap(d.data().completedLessons || {});
      }
    });
  }, [user, courses]);

  const downloadCert = (course) => {
    const url = generateCertificate(profile?.name || "Суралцагч", course.title, course.teacherName || "Багш", new Date().toLocaleDateString("mn-MN"));
    const a = document.createElement("a"); a.href = url; a.download = `EduMN_Гэрчилгээ_${course.title}.png`; a.click();
    notify("Гэрчилгээ татагдлаа! 🎓");
  };

  return (
    <div className="sec">
      <div className="sec-title">👤 Миний профайл</div>
      <div className="ps" style={{ marginBottom: 26 }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#1a1a2e", margin: "0 auto 10px" }}>{profile?.name?.[0] || "U"}</div>
        </div>
        <div className="fg"><label>Нэр</label><input value={profile?.name || ""} disabled style={{ background: "#f9fafb" }} /></div>
        <div className="fg"><label>Имэйл</label><input value={profile?.email || ""} disabled style={{ background: "#f9fafb" }} /></div>
      </div>
      <div className="sec-title" style={{ fontSize: 20 }}>📚 Миний сургалтууд ({enrolled.length})</div>
      {enrolled.length === 0 ? <div className="empty"><div className="ei">📭</div><p>Сургалт байхгүй</p></div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
          {enrolled.map(c => {
            const cl = completedMap[c.id] || [];
            return <div key={c.id} style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 36 }}>{getCat(c.category)?.icon || "📚"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{c.teacherName}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Явц: {cl.length} хичээл дүүргэсэн</div>
                <div className="pw"><div className="pf" style={{ width: `${cl.length > 0 ? 80 : 0}%` }} /></div>
              </div>
              {cl.length >= 1 && <button className="cert-btn btn-sm" onClick={() => downloadCert(c)} style={{ padding: "9px 16px", fontSize: 13 }}>🎓 Гэрчилгээ</button>}
            </div>;
          })}
        </div>}
    </div>
  );
}

// ===================== MISC PAGES =====================
function NewsPage({ news }) {
  return (
    <div className="sec">
      <div className="sec-title">📰 Мэдээ мэдээлэл</div>
      {news.length === 0 ? <div className="empty"><div className="ei">📭</div><p>Мэдээ байхгүй</p></div>
        : news.map(n => <div key={n.id} className="news-card"><h3>{n.title}</h3><p style={{ marginTop: 7, color: "#6b7280", lineHeight: 1.7 }}>{n.content}</p>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 9 }}>{n.createdAt?.toDate?.()?.toLocaleDateString("mn-MN") || ""}</div></div>)}
    </div>
  );
}

function ContactPage() {
  return (
    <div className="sec" style={{ maxWidth: 540 }}>
      <div className="sec-title">📞 Холбоо барих</div>
      <div className="panel">
        <div style={{ fontSize: 15, lineHeight: 2.4 }}>
          <div>📞 Утас: <a href="tel:99033062" style={{ color: "#f59e0b", fontWeight: 700 }}>9903-3062</a></div>
          <div>✉️ Имэйл: <a href="mailto:contact@edumn.mn" style={{ color: "#f59e0b", fontWeight: 700 }}>contact@edumn.mn</a></div>
          <div>🌐 Вэб: <a href="https://baasandorjne-coder.github.io/edumn" target="_blank" rel="noreferrer" style={{ color: "#f59e0b", fontWeight: 700 }}>edumn.mn</a></div>
          <div>📍 Хаяг: Улаанбаатар, Монгол</div>
        </div>
      </div>
    </div>
  );
}
