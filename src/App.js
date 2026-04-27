import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "./firebase";
import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, where
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "firebase/auth";

// ==================== STYLES ====================
const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; color: #333; }
  .nav { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
  .logo { color: #fff; font-size: 22px; font-weight: 800; cursor: pointer; }
  .logo span { color: #f59e0b; }
  .nav-links { display: flex; gap: 8px; align-items: center; }
  .btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; }
  .btn-primary { background: #f59e0b; color: #1a1a2e; }
  .btn-primary:hover { background: #d97706; transform: translateY(-1px); }
  .btn-outline { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.3); }
  .btn-outline:hover { border-color: #f59e0b; color: #f59e0b; }
  .btn-danger { background: #ef4444; color: #fff; }
  .btn-danger:hover { background: #dc2626; }
  .btn-success { background: #10b981; color: #fff; }
  .btn-success:hover { background: #059669; }
  .btn-sm { padding: 5px 10px; font-size: 12px; }
  .hero { background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); color: #fff; padding: 80px 24px; text-align: center; }
  .hero h1 { font-size: 48px; font-weight: 800; margin-bottom: 16px; }
  .hero h1 span { color: #f59e0b; }
  .hero p { font-size: 18px; opacity: 0.85; margin-bottom: 32px; }
  .hero-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
  .section { padding: 60px 24px; max-width: 1200px; margin: 0 auto; }
  .section-title { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .section-sub { color: #6b7280; margin-bottom: 32px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
  .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
  .card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
  .card-img { height: 160px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 48px; }
  .card-body { padding: 16px; }
  .card-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; line-height: 1.3; }
  .card-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #1a1a2e; overflow: hidden; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-free { background: #d1fae5; color: #065f46; }
  .badge-paid { background: #fef3c7; color: #92400e; }
  .badge-cat { background: #e0e7ff; color: #3730a3; }
  .badge-pending { background: #fef9c3; color: #854d0e; }
  .badge-approved { background: #dcfce7; color: #166534; }
  .price { font-size: 18px; font-weight: 800; color: #f59e0b; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .modal { background: #fff; border-radius: 20px; padding: 32px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
  .modal h2 { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #374151; }
  .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 14px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; transition: border-color 0.2s; font-family: inherit; }
  .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #f59e0b; }
  .form-group textarea { min-height: 100px; resize: vertical; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .alert { padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 14px; font-weight: 500; }
  .alert-error { background: #fee2e2; color: #991b1b; }
  .alert-success { background: #d1fae5; color: #065f46; }
  .tabs { display: flex; gap: 8px; margin-bottom: 32px; flex-wrap: wrap; }
  .tab { padding: 8px 20px; border-radius: 20px; border: 2px solid #e5e7eb; background: #fff; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s; }
  .tab.active { background: #1a1a2e; color: #f59e0b; border-color: #1a1a2e; }
  .admin-panel { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .admin-panel h3 { font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #f3f4f6; }
  .table { width: 100%; border-collapse: collapse; }
  .table th, .table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .table th { background: #f9fafb; font-weight: 700; color: #374151; }
  .table tr:hover td { background: #fafafa; }
  .course-detail { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
  .video-container { background: #000; border-radius: 16px; overflow: hidden; margin-bottom: 24px; aspect-ratio: 16/9; position: relative; }
  .video-container iframe { width: 100%; height: 100%; border: none; }
  .video-lock { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #fff; gap: 16px; }
  .video-lock .lock-icon { font-size: 48px; }
  .teacher-card { display: flex; align-items: center; gap: 16px; background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
  .teacher-avatar { width: 64px; height: 64px; border-radius: 50%; background: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #1a1a2e; overflow: hidden; }
  .teacher-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .news-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 16px; }
  .news-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .news-card p { color: #6b7280; line-height: 1.6; }
  .news-date { font-size: 12px; color: #9ca3af; margin-top: 12px; }
  .profile-section { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 600px; margin: 0 auto; }
  .profile-avatar-wrap { text-align: center; margin-bottom: 24px; }
  .profile-avatar-img { width: 100px; height: 100px; border-radius: 50%; background: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 700; color: #1a1a2e; margin: 0 auto 12px; overflow: hidden; }
  .profile-avatar-img img { width: 100%; height: 100%; object-fit: cover; }
  .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .cat-card { background: #fff; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.06); transition: all 0.2s; border: 2px solid transparent; }
  .cat-card:hover, .cat-card.active { border-color: #f59e0b; transform: translateY(-2px); }
  .cat-icon { font-size: 36px; margin-bottom: 8px; }
  .cat-name { font-weight: 700; font-size: 15px; }
  .footer { background: #1a1a2e; color: rgba(255,255,255,0.7); padding: 40px 24px; text-align: center; }
  .footer a { color: #f59e0b; text-decoration: none; }
  .spinner { border: 3px solid #f3f4f6; border-top: 3px solid #f59e0b; border-radius: 50%; width: 24px; height: 24px; animation: spin 0.8s linear infinite; margin: 0 auto; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-wrap { display: flex; align-items: center; justify-content: center; padding: 60px; }
  .user-menu { position: relative; }
  .user-dropdown { position: absolute; right: 0; top: 48px; background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); min-width: 200px; overflow: hidden; z-index: 300; }
  .user-dropdown a, .user-dropdown button { display: block; width: 100%; padding: 12px 16px; text-align: left; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 500; color: #374151; transition: background 0.2s; text-decoration: none; }
  .user-dropdown a:hover, .user-dropdown button:hover { background: #f9fafb; }
  .notification { position: fixed; top: 80px; right: 24px; background: #10b981; color: #fff; padding: 12px 20px; border-radius: 12px; font-weight: 600; z-index: 400; animation: slideIn 0.3s ease; }
  @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .progress-bar { background: #e5e7eb; border-radius: 99px; height: 8px; overflow: hidden; }
  .progress-fill { background: linear-gradient(90deg, #f59e0b, #f97316); height: 100%; border-radius: 99px; transition: width 0.3s; }
  .empty-state { text-align: center; padding: 60px 20px; color: #9ca3af; }
  .empty-state .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .search-bar { display: flex; gap: 12px; margin-bottom: 24px; }
  .search-bar input { flex: 1; padding: 10px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; }
  .search-bar input:focus { outline: none; border-color: #f59e0b; }
`;

const CATEGORIES = [
  { id: "computer", name: "Компьютер", icon: "💻" },
  { id: "language", name: "Гадаад хэл", icon: "🌍" },
  { id: "general", name: "Ерөнхий боловсрол", icon: "📚" },
];

const ADMIN = { username: "Admin", password: "99033062" };

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null); // firebase auth user
  const [userRole, setUserRole] = useState(null); // "admin" | "teacher" | "user"
  const [userProfile, setUserProfile] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [courses, setCourses] = useState([]);
  const [news, setNews] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [adminTab, setAdminTab] = useState("teachers");
  const dropRef = useRef();

  const notify = (msg, color = "#10b981") => {
    setNotification({ msg, color });
    setTimeout(() => setNotification(null), 3000);
  };

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (profileDoc.exists()) {
          const profile = profileDoc.data();
          setUser(firebaseUser);
          setUserRole(profile.role);
          setUserProfile(profile);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Realtime courses
  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Realtime news
  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Realtime approved teachers
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "teacher"));
    const unsub = onSnapshot(q, (snap) => {
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Realtime pending teachers (admin only)
  useEffect(() => {
    if (userRole !== "admin") return;
    const q = query(collection(db, "pendingTeachers"));
    const unsub = onSnapshot(q, (snap) => {
      setPendingTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [userRole]);

  // Close dropdown outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Admin login (hardcoded, not Firebase)
  const handleAdminLogin = async (username, password) => {
    if (username === ADMIN.username && password === ADMIN.password) {
      // Sign in with Firebase anonymous + set admin
      await signOut(auth).catch(() => {});
      setUser({ uid: "admin", displayName: "Admin" });
      setUserRole("admin");
      setUserProfile({ name: "Admin", role: "admin" });
      setShowLogin(false);
      notify("Админ нэвтэрлээ!");
      setPage("admin");
      return true;
    }
    return false;
  };

  const handleSignout = async () => {
    if (userRole === "admin") {
      setUser(null); setUserRole(null); setUserProfile(null);
    } else {
      await signOut(auth);
    }
    setShowDropdown(false);
    setPage("home");
    notify("Гарлаа!");
  };

  const filteredCourses = courses.filter(c => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
    const matchCat = !selectedCat || c.category === selectedCat;
    return matchQ && matchCat;
  });

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  return (
    <>
      <style>{styles}</style>
      {notification && <div className="notification" style={{ background: notification.color }}>{notification.msg}</div>}

      <Nav
        page={page} setPage={setPage} user={user} userRole={userRole}
        userProfile={userProfile} showDropdown={showDropdown}
        setShowDropdown={setShowDropdown} dropRef={dropRef}
        setShowLogin={setShowLogin} setShowSignup={setShowSignup}
        handleSignout={handleSignout} pendingTeachers={pendingTeachers}
      />

      {showLogin && <LoginModal
        onClose={() => setShowLogin(false)}
        onAdminLogin={handleAdminLogin}
        setUser={setUser} setUserRole={setUserRole} setUserProfile={setUserProfile}
        notify={notify} db={db} setPage={setPage}
      />}
      {showSignup && <SignupModal
        onClose={() => setShowSignup(false)}
        notify={notify} db={db} setShowLogin={setShowLogin}
      />}

      {page === "home" && <HomePage
        courses={courses} news={news} setPage={setPage}
        setSelectedCourse={setSelectedCourse} setSelectedCat={setSelectedCat}
        user={user} userRole={userRole} setShowLogin={setShowLogin}
      />}
      {page === "courses" && <CoursesPage
        courses={filteredCourses} setSelectedCourse={setSelectedCourse}
        setPage={setPage} selectedCat={selectedCat} setSelectedCat={setSelectedCat}
        searchQ={searchQ} setSearchQ={setSearchQ}
        user={user} userRole={userRole} setShowLogin={setShowLogin}
      />}
      {page === "courseDetail" && selectedCourse && <CourseDetailPage
        course={selectedCourse} courses={courses} teachers={teachers}
        user={user} userRole={userRole} setShowLogin={setShowLogin}
        notify={notify} db={db} setPage={setPage}
      />}
      {page === "news" && <NewsPage news={news} />}
      {page === "admin" && userRole === "admin" && <AdminPage
        pendingTeachers={pendingTeachers} teachers={teachers}
        courses={courses} news={news} db={db} notify={notify}
        adminTab={adminTab} setAdminTab={setAdminTab}
      />}
      {page === "teacher" && userRole === "teacher" && <TeacherPage
        user={user} userProfile={userProfile} courses={courses}
        db={db} notify={notify} setUserProfile={setUserProfile}
      />}
      {page === "profile" && user && userRole === "user" && <ProfilePage
        user={user} userProfile={userProfile} courses={courses}
        db={db} notify={notify} setUserProfile={setUserProfile}
      />}
      {page === "contact" && <ContactPage />}

      <footer className="footer">
        <p><strong style={{ color: "#f59e0b" }}>EduMN</strong> — Монгол онлайн сургалтын платформ</p>
        <p style={{ marginTop: 8 }}>📞 <a href="tel:99033062">9903-3062</a> | ✉️ <a href="mailto:contact@edumn.mn">contact@edumn.mn</a></p>
        <p style={{ marginTop: 8, fontSize: 12 }}>© 2024 EduMN. Бүх эрх хуулиар хамгаалагдсан.</p>
      </footer>
    </>
  );
}

// ==================== NAV ====================
function Nav({ page, setPage, user, userRole, userProfile, showDropdown, setShowDropdown, dropRef, setShowLogin, setShowSignup, handleSignout, pendingTeachers }) {
  const roleLabel = userRole === "admin" ? "⚙️ Админ" : userRole === "teacher" ? "🎓 Багш" : "👤";
  return (
    <nav className="nav">
      <div className="logo" onClick={() => setPage("home")}>Edu<span>MN</span></div>
      <div className="nav-links">
        <button className="btn btn-outline btn-sm" onClick={() => setPage("courses")}>Сургалтууд</button>
        <button className="btn btn-outline btn-sm" onClick={() => setPage("news")}>Мэдээ</button>
        <button className="btn btn-outline btn-sm" onClick={() => setPage("contact")}>Холбоо</button>
        {!user ? (
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setShowLogin(true)}>Нэвтрэх</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowSignup(true)}>Бүртгүүлэх</button>
          </>
        ) : (
          <div className="user-menu" ref={dropRef}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDropdown(!showDropdown)}>
              {roleLabel} {pendingTeachers?.length > 0 && userRole === "admin" && <span style={{ background: "#ef4444", borderRadius: "99px", padding: "1px 6px", fontSize: 11, marginLeft: 4 }}>{pendingTeachers.length}</span>} ▾
            </button>
            {showDropdown && (
              <div className="user-dropdown">
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontWeight: 700, color: "#374151" }}>
                  {userProfile?.name || user.displayName || "Хэрэглэгч"}
                </div>
                {userRole === "admin" && <button onClick={() => { setPage("admin"); setShowDropdown(false); }}>⚙️ Админ самбар</button>}
                {userRole === "teacher" && <button onClick={() => { setPage("teacher"); setShowDropdown(false); }}>🎓 Багшийн самбар</button>}
                {userRole === "user" && <button onClick={() => { setPage("profile"); setShowDropdown(false); }}>👤 Миний профайл</button>}
                <button onClick={handleSignout} style={{ color: "#ef4444" }}>🚪 Гарах</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

// ==================== LOGIN MODAL ====================
function LoginModal({ onClose, onAdminLogin, setUser, setUserRole, setUserProfile, notify, db, setPage }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.password) { setError("Бүх талбарыг бөглөнө үү"); return; }
    setLoading(true);
    setError("");
    // Admin login
    const isAdmin = await onAdminLogin(form.username, form.password);
    if (isAdmin) { setLoading(false); return; }
    // Firebase email login
    try {
      const cred = await signInWithEmailAndPassword(auth, form.username, form.password);
      const profileDoc = await getDoc(doc(db, "users", cred.user.uid));
      if (profileDoc.exists()) {
        const profile = profileDoc.data();
        setUser(cred.user); setUserRole(profile.role); setUserProfile(profile);
        if (profile.role === "teacher") setPage("teacher");
        else if (profile.role === "user") setPage("home");
        notify("Амжилттай нэвтэрлээ!");
        onClose();
      }
    } catch (e) {
      setError("Нэвтрэх нэр эсвэл нууц үг буруу байна");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>🔐 Нэвтрэх</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label>Имэйл / Нэвтрэх нэр</label>
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="имэйл@domain.com эсвэл Admin" />
        </div>
        <div className="form-group">
          <label>Нууц үг</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", padding: "12px" }} onClick={handleSubmit} disabled={loading}>
          {loading ? "Нэвтэрж байна..." : "Нэвтрэх"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#6b7280" }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#f59e0b", fontWeight: 600 }} onClick={onClose}>Хаах</button>
        </div>
      </div>
    </div>
  );
}

// ==================== SIGNUP MODAL ====================
function SignupModal({ onClose, notify, db, setShowLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "user" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.confirm) { setError("Бүх талбарыг бөглөнө үү"); return; }
    if (form.password !== form.confirm) { setError("Нууц үг таарахгүй байна"); return; }
    if (form.password.length < 6) { setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой"); return; }
    setLoading(true); setError("");
    try {
      if (form.role === "teacher") {
        // Add to pending teachers
        const pendingRef = doc(collection(db, "pendingTeachers"));
        await setDoc(pendingRef, {
          name: form.name, email: form.email, password: form.password,
          role: "teacher", status: "pending", createdAt: serverTimestamp()
        });
        setSuccess("Хүсэлт илгээгдлээ! Админ зөвшөөрснөөр нэвтрэх боломжтой болно.");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
        await setDoc(doc(db, "users", cred.user.uid), {
          name: form.name, email: form.email, role: "user", createdAt: serverTimestamp()
        });
        notify("Бүртгэл амжилттай!");
        onClose();
      }
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setError("Энэ имэйл аль хэдийн бүртгэлтэй байна");
      else setError("Алдаа гарлаа: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>📝 Бүртгүүлэх</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}<br /><button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => { onClose(); setShowLogin(true); }}>Нэвтрэх</button></div>}
        {!success && <>
          <div className="form-group">
            <label>Нэр</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Таны нэр" />
          </div>
          <div className="form-group">
            <label>Имэйл</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          </div>
          <div className="form-group">
            <label>Нууц үг</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Хамгийн багадаа 6 тэмдэгт" />
          </div>
          <div className="form-group">
            <label>Нууц үг давтах</label>
            <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="Нууц үгийг дахин оруулна уу" />
            {form.confirm && (form.password === form.confirm
              ? <span style={{ color: "#10b981", fontSize: 12 }}>✓ Таарч байна</span>
              : <span style={{ color: "#ef4444", fontSize: 12 }}>⚠️ Таарахгүй байна</span>)}
          </div>
          <div className="form-group">
            <label>Төрөл</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="user">Суралцагч</option>
              <option value="teacher">Багш болон бүртгүүлэх</option>
            </select>
          </div>
          {form.role === "teacher" && <div className="alert" style={{ background: "#fef3c7", color: "#92400e" }}>⚠️ Багшийн хүсэлт админ зөвшөөрснөөр идэвхжинэ</div>}
          <button className="btn btn-primary" style={{ width: "100%", padding: 12 }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
          </button>
        </>}
      </div>
    </div>
  );
}

// ==================== HOME PAGE ====================
function HomePage({ courses, news, setPage, setSelectedCourse, setSelectedCat, user, userRole, setShowLogin }) {
  return (
    <>
      <div className="hero">
        <h1>Тав тухтай <span>суралц</span></h1>
        <p>Монголын шилдэг багш нараас мэргэжлийн хичээл үзэж чадвараа хөгжүүл</p>
        <div className="hero-btns">
          <button className="btn btn-primary" style={{ fontSize: 16, padding: "12px 32px" }} onClick={() => setPage("courses")}>Сургалтуудыг үзэх</button>
          {!user && <button className="btn btn-outline" style={{ fontSize: 16, padding: "12px 32px" }} onClick={() => setShowLogin(true)}>Нэвтрэх</button>}
        </div>
      </div>

      <div className="section">
        <div className="section-title">📂 Ангилалууд</div>
        <div className="cat-grid">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="cat-card" onClick={() => { setSelectedCat(cat.id); setPage("courses"); }}>
              <div className="cat-icon">{cat.icon}</div>
              <div className="cat-name">{cat.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{courses.filter(c => c.category === cat.id).length} сургалт</div>
            </div>
          ))}
        </div>

        <div className="section-title">🔥 Шинэ сургалтууд</div>
        <p className="section-sub">Шинээр нэмэгдсэн сургалтуудыг үзэх</p>
        {courses.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📭</div><p>Одоогоор сургалт байхгүй байна</p></div>
        ) : (
          <div className="grid">
            {courses.slice(0, 6).map(c => (
              <CourseCard key={c.id} course={c} onClick={() => { setSelectedCourse(c); setPage("courseDetail"); }} />
            ))}
          </div>
        )}
        {courses.length > 6 && <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="btn btn-primary" onClick={() => setPage("courses")}>Бүгдийг үзэх →</button>
        </div>}
      </div>

      {news.length > 0 && <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-title">📰 Сүүлийн мэдээ</div>
        {news.slice(0, 2).map(n => (
          <div key={n.id} className="news-card">
            <h3>{n.title}</h3>
            <p>{n.content?.substring(0, 150)}{n.content?.length > 150 ? "..." : ""}</p>
            <div className="news-date">{n.createdAt?.toDate?.()?.toLocaleDateString("mn-MN") || ""}</div>
          </div>
        ))}
        <button className="btn btn-outline" style={{ color: "#1a1a2e", borderColor: "#1a1a2e", marginTop: 8 }} onClick={() => setPage("news")}>Бүх мэдээ →</button>
      </div>}
    </>
  );
}

// ==================== COURSE CARD ====================
function CourseCard({ course, onClick }) {
  const cat = CATEGORIES.find(c => c.id === course.category);
  return (
    <div className="card" onClick={onClick}>
      <div className="card-img" style={{ background: cat ? undefined : "linear-gradient(135deg, #667eea, #764ba2)" }}>
        {cat ? <span style={{ fontSize: 48 }}>{cat.icon}</span> : "📚"}
      </div>
      <div className="card-body">
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          {cat && <span className="badge badge-cat">{cat.name}</span>}
          <span className={`badge ${course.isFree ? "badge-free" : "badge-paid"}`}>{course.isFree ? "Үнэгүй" : "Төлбөртэй"}</span>
        </div>
        <div className="card-title">{course.title}</div>
        <div className="card-meta">
          <div className="avatar">
            {course.teacherPhoto ? <img src={course.teacherPhoto} alt="" /> : (course.teacherName?.[0] || "T")}
          </div>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{course.teacherName}</span>
        </div>
        <div className="price">{course.isFree ? "Үнэгүй" : `${(course.price || 0).toLocaleString()}₮`}</div>
      </div>
    </div>
  );
}

// ==================== COURSES PAGE ====================
function CoursesPage({ courses, setSelectedCourse, setPage, selectedCat, setSelectedCat, searchQ, setSearchQ, user, userRole, setShowLogin }) {
  return (
    <div className="section">
      <div className="section-title">📚 Бүх сургалтууд</div>
      <div className="search-bar">
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Сургалт хайх..." />
      </div>
      <div className="tabs">
        <div className={`tab ${!selectedCat ? "active" : ""}`} onClick={() => setSelectedCat(null)}>Бүгд</div>
        {CATEGORIES.map(cat => (
          <div key={cat.id} className={`tab ${selectedCat === cat.id ? "active" : ""}`} onClick={() => setSelectedCat(cat.id)}>
            {cat.icon} {cat.name}
          </div>
        ))}
      </div>
      {courses.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🔍</div><p>Сургалт олдсонгүй</p></div>
      ) : (
        <div className="grid">
          {courses.map(c => <CourseCard key={c.id} course={c} onClick={() => { setSelectedCourse(c); setPage("courseDetail"); }} />)}
        </div>
      )}
    </div>
  );
}

// ==================== COURSE DETAIL PAGE ====================
function CourseDetailPage({ course, courses, teachers, user, userRole, setShowLogin, notify, db, setPage }) {
  const [enrolled, setEnrolled] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const ytId = getYouTubeId(course.videoUrl);
  const canWatch = course.isFree || enrolled || userRole === "admin" || userRole === "teacher";
  const teacher = teachers.find(t => t.id === course.teacherId);

  useEffect(() => {
    if (!user || userRole !== "user") return;
    getDoc(doc(db, "users", user.uid)).then(d => {
      if (d.exists()) {
        const enrolled_list = d.data().enrolledCourses || [];
        setEnrolled(enrolled_list.includes(course.id));
      }
    });
  }, [user, course.id, db, userRole]);

  const handleEnroll = async () => {
    if (!user) { setShowLogin(true); return; }
    if (course.isFree) {
      await updateDoc(doc(db, "users", user.uid), {
        enrolledCourses: [...(user.enrolledCourses || []), course.id]
      });
      setEnrolled(true);
      notify("Амжилттай бүртгүүллээ!");
    } else {
      setShowPayment(true);
    }
  };

  return (
    <div className="course-detail">
      <button className="btn btn-outline" style={{ color: "#374151", borderColor: "#e5e7eb", marginBottom: 16 }} onClick={() => setPage("courses")}>← Буцах</button>

      <div className="video-container">
        {canWatch && ytId ? (
          <iframe src={`https://www.youtube.com/embed/${ytId}`} allowFullScreen title={course.title} />
        ) : (
          <div className="video-lock">
            <div className="lock-icon">🔒</div>
            <div style={{ fontWeight: 600, fontSize: 18 }}>Бүртгүүлснийхээ дараа үзнэ үү</div>
            {!ytId && canWatch && <div style={{ color: "#9ca3af", fontSize: 14 }}>Видео удахгүй нэмэгдэнэ</div>}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span className={`badge ${course.isFree ? "badge-free" : "badge-paid"}`}>{course.isFree ? "Үнэгүй" : "Төлбөртэй"}</span>
            {CATEGORIES.find(c => c.id === course.category) && <span className="badge badge-cat">{CATEGORIES.find(c => c.id === course.category)?.name}</span>}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{course.title}</h1>
          <p style={{ color: "#6b7280", lineHeight: 1.7 }}>{course.description}</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", minWidth: 220, textAlign: "center" }}>
          <div className="price" style={{ fontSize: 28, marginBottom: 16 }}>{course.isFree ? "Үнэгүй" : `${(course.price || 0).toLocaleString()}₮`}</div>
          {!enrolled && userRole === "user" && (
            <button className="btn btn-primary" style={{ width: "100%", padding: 12 }} onClick={handleEnroll}>
              {course.isFree ? "Үнэгүй бүртгүүлэх" : "Худалдаж авах"}
            </button>
          )}
          {enrolled && <div className="alert alert-success">✅ Бүртгүүлсэн</div>}
          {!user && <button className="btn btn-primary" style={{ width: "100%", padding: 12 }} onClick={() => setShowLogin(true)}>Нэвтрэх</button>}
        </div>
      </div>

      {teacher && (
        <div className="teacher-card">
          <div className="teacher-avatar">
            {teacher.photoUrl ? <img src={teacher.photoUrl} alt="" /> : (teacher.name?.[0] || "T")}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{teacher.name}</div>
            <div style={{ color: "#6b7280", fontSize: 14 }}>{teacher.email}</div>
            {teacher.bio && <div style={{ color: "#374151", fontSize: 14, marginTop: 4 }}>{teacher.bio}</div>}
          </div>
        </div>
      )}

      {showPayment && <PaymentModal course={course} onClose={() => setShowPayment(false)} notify={notify} />}
    </div>
  );
}

// ==================== PAYMENT MODAL ====================
function PaymentModal({ course, onClose, notify }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>💳 Төлбөр төлөх</h2>
        <div style={{ background: "#f9fafb", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{course.title}</div>
          <div className="price">{(course.price || 0).toLocaleString()}₮</div>
        </div>
        <div className="form-group">
          <label>Төлбөрийн арга</label>
          <select defaultValue="qpay">
            <option value="qpay">QPay</option>
            <option value="transfer">Банкны шилжүүлэг</option>
            <option value="wallet">Хэтэвч</option>
          </select>
        </div>
        <div className="alert" style={{ background: "#e0f2fe", color: "#0c4a6e" }}>
          📱 QPay апп нээгээд QR уншуулна уу<br />
          🏦 Банкны шилжүүлэг: 9903-3062 дансанд<br />
          📞 Лавлах: 9903-3062
        </div>
        <button className="btn btn-success" style={{ width: "100%", padding: 12 }} onClick={() => { notify("Төлбөрийн мэдэгдэл илгээгдлээ!"); onClose(); }}>Баталгаажуулах</button>
        <button className="btn btn-outline" style={{ width: "100%", padding: 12, marginTop: 8, color: "#374151", borderColor: "#e5e7eb" }} onClick={onClose}>Хаах</button>
      </div>
    </div>
  );
}

// ==================== NEWS PAGE ====================
function NewsPage({ news }) {
  return (
    <div className="section">
      <div className="section-title">📰 Мэдээ мэдээлэл</div>
      {news.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📭</div><p>Одоогоор мэдээ байхгүй</p></div>
      ) : news.map(n => (
        <div key={n.id} className="news-card">
          <h3>{n.title}</h3>
          <p style={{ marginTop: 8 }}>{n.content}</p>
          <div className="news-date">{n.createdAt?.toDate?.()?.toLocaleDateString("mn-MN") || ""}</div>
        </div>
      ))}
    </div>
  );
}

// ==================== ADMIN PAGE ====================
function AdminPage({ pendingTeachers, teachers, courses, news, db, notify, adminTab, setAdminTab }) {
  const [showAddNews, setShowAddNews] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: "", content: "" });

  const approveTeacher = async (pt) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, pt.email, pt.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: pt.name, email: pt.email, role: "teacher",
        photoUrl: "", bio: "", createdAt: serverTimestamp()
      });
      await deleteDoc(doc(db, "pendingTeachers", pt.id));
      notify(`${pt.name} багшийг зөвшөөрлөө!`);
    } catch (e) {
      notify("Алдаа: " + e.message, "#ef4444");
    }
  };

  const rejectTeacher = async (id) => {
    await deleteDoc(doc(db, "pendingTeachers", id));
    notify("Хүсэлт татгалзагдлаа");
  };

  const addNews = async () => {
    if (!newsForm.title || !newsForm.content) { notify("Бүх талбарыг бөглөнө үү", "#ef4444"); return; }
    await setDoc(doc(collection(db, "news")), { ...newsForm, createdAt: serverTimestamp() });
    setNewsForm({ title: "", content: "" });
    setShowAddNews(false);
    notify("Мэдээ нийтлэгдлээ!");
  };

  const deleteNews = async (id) => {
    await deleteDoc(doc(db, "news", id));
    notify("Мэдээ устгагдлаа");
  };

  const deleteCourse = async (id) => {
    await deleteDoc(doc(db, "courses", id));
    notify("Сургалт устгагдлаа");
  };

  return (
    <div className="section">
      <div className="section-title">⚙️ Админ самбар</div>
      <div className="tabs">
        <div className={`tab ${adminTab === "teachers" ? "active" : ""}`} onClick={() => setAdminTab("teachers")}>
          Багшийн хүсэлт {pendingTeachers.length > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: "99px", padding: "1px 6px", fontSize: 11, marginLeft: 4 }}>{pendingTeachers.length}</span>}
        </div>
        <div className={`tab ${adminTab === "allteachers" ? "active" : ""}`} onClick={() => setAdminTab("allteachers")}>Багш нар</div>
        <div className={`tab ${adminTab === "courses" ? "active" : ""}`} onClick={() => setAdminTab("courses")}>Сургалтууд</div>
        <div className={`tab ${adminTab === "news" ? "active" : ""}`} onClick={() => setAdminTab("news")}>Мэдээ</div>
      </div>

      {adminTab === "teachers" && (
        <div className="admin-panel">
          <h3>Багшийн хүсэлтүүд ({pendingTeachers.length})</h3>
          {pendingTeachers.length === 0 ? <div className="empty-state"><div className="empty-icon">✅</div><p>Шинэ хүсэлт байхгүй</p></div> : (
            <table className="table">
              <thead><tr><th>Нэр</th><th>Имэйл</th><th>Огноо</th><th>Үйлдэл</th></tr></thead>
              <tbody>{pendingTeachers.map(pt => (
                <tr key={pt.id}>
                  <td><strong>{pt.name}</strong></td>
                  <td>{pt.email}</td>
                  <td>{pt.createdAt?.toDate?.()?.toLocaleDateString("mn-MN") || "-"}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => approveTeacher(pt)}>✓ Зөвшөөрөх</button>
                    <button className="btn btn-danger btn-sm" onClick={() => rejectTeacher(pt.id)}>✗ Татгалзах</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {adminTab === "allteachers" && (
        <div className="admin-panel">
          <h3>Бүх багш нар ({teachers.length})</h3>
          <table className="table">
            <thead><tr><th>Нэр</th><th>Имэйл</th><th>Сургалт</th></tr></thead>
            <tbody>{teachers.map(t => (
              <tr key={t.id}>
                <td><strong>{t.name}</strong></td>
                <td>{t.email}</td>
                <td>{courses.filter(c => c.teacherId === t.id).length} сургалт</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {adminTab === "courses" && (
        <div className="admin-panel">
          <h3>Бүх сургалтууд ({courses.length})</h3>
          <table className="table">
            <thead><tr><th>Гарчиг</th><th>Багш</th><th>Үнэ</th><th>Үйлдэл</th></tr></thead>
            <tbody>{courses.map(c => (
              <tr key={c.id}>
                <td><strong>{c.title}</strong></td>
                <td>{c.teacherName}</td>
                <td>{c.isFree ? <span className="badge badge-free">Үнэгүй</span> : `${(c.price || 0).toLocaleString()}₮`}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => deleteCourse(c.id)}>Устгах</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {adminTab === "news" && (
        <div className="admin-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Мэдээ ({news.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddNews(!showAddNews)}>+ Мэдээ нэмэх</button>
          </div>
          {showAddNews && (
            <div style={{ background: "#f9fafb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div className="form-group"><label>Гарчиг</label><input value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} /></div>
              <div className="form-group"><label>Агуулга</label><textarea value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })} /></div>
              <button className="btn btn-primary" onClick={addNews}>Нийтлэх</button>
            </div>
          )}
          {news.map(n => (
            <div key={n.id} className="news-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3>{n.title}</h3>
                <button className="btn btn-danger btn-sm" onClick={() => deleteNews(n.id)}>Устгах</button>
              </div>
              <p style={{ marginTop: 8 }}>{n.content?.substring(0, 100)}...</p>
              <div className="news-date">{n.createdAt?.toDate?.()?.toLocaleDateString("mn-MN") || ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== TEACHER PAGE ====================
function TeacherPage({ user, userProfile, courses, db, notify, setUserProfile }) {
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "computer", isFree: true, price: "", videoUrl: "" });
  const [profileForm, setProfileForm] = useState({ bio: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(userProfile?.photoUrl || "");
  const [tab, setTab] = useState("courses");
  const myCourses = courses.filter(c => c.teacherId === user?.uid);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { notify("Зураг 500KB-аас бага байх ёстой", "#ef4444"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPhotoPreview(ev.target.result); setPhotoFile(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    const updates = { bio: profileForm.bio || userProfile?.bio || "" };
    if (photoFile) updates.photoUrl = photoFile;
    await updateDoc(doc(db, "users", user.uid), updates);
    setUserProfile({ ...userProfile, ...updates });
    notify("Профайл хадгалагдлаа!");
  };

  const addCourse = async () => {
    if (!courseForm.title || !courseForm.description) { notify("Бүх талбарыг бөглөнө үү", "#ef4444"); return; }
    await setDoc(doc(collection(db, "courses")), {
      ...courseForm,
      price: courseForm.isFree ? 0 : Number(courseForm.price),
      teacherId: user.uid,
      teacherName: userProfile?.name || user.displayName,
      teacherPhoto: userProfile?.photoUrl || "",
      createdAt: serverTimestamp()
    });
    setCourseForm({ title: "", description: "", category: "computer", isFree: true, price: "", videoUrl: "" });
    setShowAddCourse(false);
    notify("Сургалт нэмэгдлээ!");
  };

  const deleteCourse = async (id) => {
    await deleteDoc(doc(db, "courses", id));
    notify("Сургалт устгагдлаа");
  };

  return (
    <div className="section">
      <div className="section-title">🎓 Багшийн самбар</div>
      <div className="tabs">
        <div className={`tab ${tab === "courses" ? "active" : ""}`} onClick={() => setTab("courses")}>Миний сургалтууд</div>
        <div className={`tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>Профайл</div>
      </div>

      {tab === "courses" && (
        <div className="admin-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Миний сургалтууд ({myCourses.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddCourse(!showAddCourse)}>+ Сургалт нэмэх</button>
          </div>

          {showAddCourse && (
            <div style={{ background: "#f9fafb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h4 style={{ marginBottom: 16 }}>Шинэ сургалт нэмэх</h4>
              <div className="form-group"><label>Сургалтын нэр</label><input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} /></div>
              <div className="form-group"><label>Тайлбар</label><textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ангилал</label>
                  <select value={courseForm.category} onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Төлбөрийн төрөл</label>
                  <select value={courseForm.isFree ? "free" : "paid"} onChange={e => setCourseForm({ ...courseForm, isFree: e.target.value === "free" })}>
                    <option value="free">Үнэгүй</option>
                    <option value="paid">Төлбөртэй</option>
                  </select>
                </div>
              </div>
              {!courseForm.isFree && <div className="form-group"><label>Үнэ (₮)</label><input type="number" value={courseForm.price} onChange={e => setCourseForm({ ...courseForm, price: e.target.value })} placeholder="50000" /></div>}
              <div className="form-group">
                <label>YouTube Видео линк</label>
                <input value={courseForm.videoUrl} onChange={e => setCourseForm({ ...courseForm, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                {courseForm.videoUrl && getYouTubeId(courseForm.videoUrl) && (
                  <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", aspectRatio: "16/9" }}>
                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYouTubeId(courseForm.videoUrl)}`} title="preview" style={{ border: "none" }} />
                  </div>
                )}
              </div>
              <button className="btn btn-primary" onClick={addCourse}>Нэмэх</button>
              <button className="btn btn-outline" style={{ marginLeft: 8, color: "#374151", borderColor: "#e5e7eb" }} onClick={() => setShowAddCourse(false)}>Болих</button>
            </div>
          )}

          {myCourses.length === 0 ? <div className="empty-state"><div className="empty-icon">📭</div><p>Сургалт байхгүй байна</p></div> : (
            <table className="table">
              <thead><tr><th>Нэр</th><th>Ангилал</th><th>Үнэ</th><th>Видео</th><th>Үйлдэл</th></tr></thead>
              <tbody>{myCourses.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong></td>
                  <td>{CATEGORIES.find(cat => cat.id === c.category)?.name}</td>
                  <td>{c.isFree ? <span className="badge badge-free">Үнэгүй</span> : `${(c.price || 0).toLocaleString()}₮`}</td>
                  <td>{c.videoUrl ? "✅" : "❌"}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => deleteCourse(c.id)}>Устгах</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === "profile" && (
        <div className="profile-section">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-img">
              {photoPreview || userProfile?.photoUrl ? <img src={photoPreview || userProfile?.photoUrl} alt="" /> : (userProfile?.name?.[0] || "T")}
            </div>
            <label className="btn btn-outline btn-sm" style={{ color: "#374151", borderColor: "#e5e7eb", cursor: "pointer" }}>
              📷 Зураг солих
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            </label>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>500KB хүртэл</div>
          </div>
          <div className="form-group"><label>Нэр</label><input value={userProfile?.name || ""} disabled style={{ background: "#f9fafb" }} /></div>
          <div className="form-group"><label>Имэйл</label><input value={userProfile?.email || ""} disabled style={{ background: "#f9fafb" }} /></div>
          <div className="form-group">
            <label>Тайлбар (bio)</label>
            <textarea defaultValue={userProfile?.bio || ""} onChange={e => setProfileForm({ bio: e.target.value })} placeholder="Өөрийн тухай бичнэ үү..." />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={saveProfile}>Хадгалах</button>
        </div>
      )}
    </div>
  );
}

// ==================== PROFILE PAGE (USER) ====================
function ProfilePage({ user, userProfile, courses, db, notify, setUserProfile }) {
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then(d => {
      if (d.exists()) {
        const ids = d.data().enrolledCourses || [];
        setEnrolledCourses(courses.filter(c => ids.includes(c.id)));
      }
    });
  }, [user, courses, db]);

  return (
    <div className="section">
      <div className="section-title">👤 Миний профайл</div>
      <div className="profile-section" style={{ marginBottom: 32 }}>
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-img">{userProfile?.name?.[0] || "U"}</div>
        </div>
        <div className="form-group"><label>Нэр</label><input value={userProfile?.name || ""} disabled style={{ background: "#f9fafb" }} /></div>
        <div className="form-group"><label>Имэйл</label><input value={userProfile?.email || ""} disabled style={{ background: "#f9fafb" }} /></div>
      </div>
      <div className="section-title" style={{ fontSize: 20 }}>📚 Бүртгүүлсэн сургалтууд</div>
      {enrolledCourses.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📭</div><p>Сургалт байхгүй байна</p></div>
      ) : (
        <div className="grid">
          {enrolledCourses.map(c => <CourseCard key={c.id} course={c} onClick={() => {}} />)}
        </div>
      )}
    </div>
  );
}

// ==================== CONTACT PAGE ====================
function ContactPage() {
  return (
    <div className="section" style={{ maxWidth: 600 }}>
      <div className="section-title">📞 Холбоо барих</div>
      <div className="admin-panel">
        <div style={{ fontSize: 16, lineHeight: 2 }}>
          <div>📞 Утас: <a href="tel:99033062" style={{ color: "#f59e0b", fontWeight: 700 }}>9903-3062</a></div>
          <div>✉️ Имэйл: <a href="mailto:contact@edumn.mn" style={{ color: "#f59e0b", fontWeight: 700 }}>contact@edumn.mn</a></div>
          <div>🌐 Вэб: <a href="https://baasandorjne-coder.github.io/edumn" target="_blank" rel="noreferrer" style={{ color: "#f59e0b", fontWeight: 700 }}>edumn.mn</a></div>
          <div>📍 Хаяг: Улаанбаатар, Монгол</div>
        </div>
      </div>
    </div>
  );
}
