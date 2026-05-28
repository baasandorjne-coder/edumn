import React, { useState, useEffect, useRef, useCallback } from "react";
import { db, auth, storage } from "./firebase";
import {
  collection, doc, setDoc, getDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, where, getDocs
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBUr_bJ_kAtwNaweB4I29YPQ_Zg8_R_1Yg", authDomain: "edumn-146bf.firebaseapp.com",
  projectId: "edumn-146bf", storageBucket: "edumn-146bf.firebasestorage.app",
  messagingSenderId: "739210902569", appId: "1:739210902569:web:e9657e7b986358a2817038",
};
let secondaryApp; try { secondaryApp = initializeApp(FIREBASE_CONFIG, "sec"); } catch { secondaryApp = initializeApp(FIREBASE_CONFIG, "sec2"); }
const secondaryAuth = getAuth(secondaryApp);

const EBS_SUBJECTS = [
  { id: "mn_lang", name: "Монгол хэл", icon: "🇲🇳" },
  { id: "literature", name: "Уран зохиол", icon: "📖" },
  { id: "math", name: "Математик", icon: "🔢" },
  { id: "nature", name: "Байгалийн ухаан", icon: "🌿" },
  { id: "physics", name: "Физик", icon: "⚡" },
  { id: "chemistry", name: "Хими", icon: "⚗️" },
  { id: "biology", name: "Биологи", icon: "🧬" },
  { id: "geography", name: "Газарзүй", icon: "🌏" },
  { id: "history", name: "Түүх", icon: "🏛️" },
  { id: "mn_history", name: "Монголын түүх", icon: "🏯" },
  { id: "social", name: "Нийгэм", icon: "👥" },
  { id: "english", name: "Англи хэл", icon: "🔤" },
  { id: "it", name: "Мэдээлэл зүй", icon: "💻" },
  { id: "technology", name: "Технологи", icon: "🔧" },
  { id: "arts", name: "Дүрслэх урлаг", icon: "🎨" },
  { id: "music", name: "Хөгжим", icon: "🎵" },
  { id: "pe", name: "Биеийн тамир", icon: "🏃" },
  { id: "economics", name: "Эдийн засаг", icon: "💹" },
  { id: "law", name: "Эрх зүй", icon: "⚖️" },
  { id: "world_history", name: "Дэлхийн түүх", icon: "🌍" },
];
const GRADES = Array.from({length:12},(_,i)=>({id:String(i+1),name:`${i+1}-р анги`}));
const GRADE_GROUPS = [
  { label: "Бага боловсрол (1-5)", grades: ["1","2","3","4","5"] },
  { label: "Суурь боловсрол (6-9)", grades: ["6","7","8","9"] },
  { label: "Бүрэн дунд боловсрол (10-12)", grades: ["10","11","12"] },
];

const COMPUTER_SUBS = [
  { id: "programming", name: "Программчлал", icon: "👨‍💻" },
  { id: "webdev", name: "Веб хөгжүүлэлт", icon: "🌐" },
  { id: "design", name: "График дизайн", icon: "🎨" },
  { id: "office", name: "Microsoft Office", icon: "📊" },
  { id: "video_edit", name: "Видео монтаж", icon: "🎬" },
  { id: "cybersecurity", name: "Кибер аюулгүй байдал", icon: "🔒" },
  { id: "mobile_app", name: "Мобайл апп", icon: "📱" },
  { id: "data_analysis", name: "Өгөгдлийн шинжилгээ", icon: "📈" },
];
const LANGUAGE_SUBS = [
  { id: "lang_english", name: "Англи хэл", icon: "🇬🇧" },
  { id: "lang_russian", name: "Орос хэл", icon: "🇷🇺" },
  { id: "lang_chinese", name: "Хятад хэл", icon: "🇨🇳" },
  { id: "lang_korean", name: "Солонгос хэл", icon: "🇰🇷" },
  { id: "lang_japanese", name: "Япон хэл", icon: "🇯🇵" },
  { id: "lang_ielts", name: "IELTS / TOEFL", icon: "📝" },
  { id: "lang_german", name: "Герман хэл", icon: "🇩🇪" },
  { id: "lang_french", name: "Франц хэл", icon: "🇫🇷" },
];
const PERSONAL_SUBS = [
  { id: "leadership", name: "Удирдлага & Лидершип", icon: "👑" },
  { id: "communication", name: "Харилцааны ур чадвар", icon: "🗣️" },
  { id: "finance_lit", name: "Санхүүгийн боловсрол", icon: "💰" },
  { id: "entrepreneurship", name: "Бизнес эхлүүлэх", icon: "🚀" },
  { id: "time_mgmt", name: "Цаг хугацааны менежмент", icon: "⏰" },
  { id: "psychology", name: "Сэтгэл зүй", icon: "🧠" },
  { id: "healthy_life", name: "Эрүүл амьдралын хэв маяг", icon: "🌿" },
  { id: "creativity", name: "Бүтээлч сэтгэлгээ", icon: "💡" },
];
const CATS = [
  { id: "general", name: "Ерөнхий боловсрол", icon: "📚", gradient: "linear-gradient(135deg,#6366f1,#4f46e5)", subs: EBS_SUBJECTS },
  { id: "computer", name: "Компьютер", icon: "💻", gradient: "linear-gradient(135deg,#0ea5e9,#0284c7)", subs: COMPUTER_SUBS },
  { id: "language", name: "Гадаад хэл", icon: "🌍", gradient: "linear-gradient(135deg,#06b6d4,#0891b2)", subs: LANGUAGE_SUBS },
  { id: "personal", name: "Хувь хүний хөгжил", icon: "🌱", gradient: "linear-gradient(135deg,#10b981,#059669)", subs: PERSONAL_SUBS },
];
const ALL_SUBS = CATS.flatMap(c => c.subs || []);
const LEVELS = [
  { id: "beginner", name: "Анхан шат", icon: "🟢", bg: "#ecfdf5", color: "#047857" },
  { id: "intermediate", name: "Дунд шат", icon: "🟡", bg: "#fffbeb", color: "#b45309" },
  { id: "advanced", name: "Ахисан шат", icon: "🔴", bg: "#fef2f2", color: "#b91c1c" },
];
const getEbsSub = id => EBS_SUBJECTS.find(s => s.id === id);
const getGrade = id => GRADES.find(g => g.id === id);
const ADMIN = { username: "Admin", password: "99033062" };

// ===================== МОНГОЛЫН БАЙРШИЛ =====================
const LOCATIONS = {
  "Улаанбаатар": ["Баянзүрх","Сүхбаатар","Хан-Уул","Баянгол","Чингэлтэй","Сонгинохайрхан","Налайх","Багануур","Багахангай"],
  "Архангай": ["Эрдэнэбулган","Батцэнгэл","Булган","Цэцэрлэг","Өлзийт","Хайрхан","Цахир","Хотонт","Тариат","Өндөр-Улаан","Эрдэнэмандал","Ихтамир","Жаргалант","Өгийнуур"],
  "Баян-Өлгий": ["Өлгий","Алтай","Булган","Цэнгэл","Дэлүүн","Буянт","Ногооннуур","Толбо","Улаанхус","Сагсай","Баяннуур"],
  "Баянхонгор": ["Баянхонгор","Баянлиг","Баян-Овоо","Богд","Бөмбөгөр","Бууцагаан","Галуут","Гурванбулаг","Жинст","Заг","Өлзийт","Хүрээмарал","Шинэжинст","Эрдэнэцогт"],
  "Булган": ["Булган","Бугат","Баяннуур","Гурванбулаг","Дашинчилэн","Хангал","Могод","Орхон","Рашаант","Сайхан","Тэшиг","Хутаг-Өндөр","Хялганат"],
  "Говь-Алтай": ["Алтай","Бигэр","Бугат","Дарив","Делгэр","Есөнбулаг","Жаргалан","Халиун","Тайшир","Тонхил","Төгрөг","Цээл","Чандмань","Эрдэнэ"],
  "Говьсүмбэр": ["Чойр","Баянтал","Шивээговь"],
  "Дархан-Уул": ["Дархан","Орхон","Хонгор","Шарын гол"],
  "Дорноговь": ["Сайншанд","Айраг","Алтанширээ","Даланжаргалан","Дэлгэрэх","Замын-Үүд","Иххэт","Мандах","Өргөн","Сайхандулаан","Улаанбадрах","Хатанбулаг","Хөвсгөл","Эрдэнэ"],
  "Дорнод": ["Чойбалсан","Баян-Уул","Баяндун","Баянтүмэн","Булган","Гурванзагал","Дашбалбар","Матад","Сэргэлэн","Халхгол","Хэрлэн","Цагаан-Овоо","Чулуунхороот"],
  "Дундговь": ["Мандалговь","Адаацаг","Баянжаргалан","Говь-Угтаал","Гурвансайхан","Дэлгэрцогт","Дэлгэрхангай","Дэрэн","Луус","Өлзийт","Өндөршил","Сайнцагаан","Сайхан","Хулд","Цагаандэлгэр","Эрдэнэдалай"],
  "Завхан": ["Улиастай","Алдархаан","Асгат","Баянтэс","Дөрвөлжин","Завханмандал","Идэр","Их-Уул","Нөмрөг","Отгон","Сантмаргац","Тосонцэнгэл","Түдэвтэй","Тэлмэн","Тэс","Ургамал","Цагаанхайрхан","Цагаанчулуут","Цэцэн-Уул","Эрдэнэхайрхан"],
  "Орхон": ["Эрдэнэт","Баян-Өндөр","Жаргалант"],
  "Өвөрхангай": ["Арвайхээр","Баруунбаян-Улаан","Богд","Бүрд","Гучин-Ус","Есөнзүйл","Зүүнбаян-Улаан","Нарийнтээл","Өлзийт","Сант","Тарагт","Төгрөг","Уянга","Хархорин","Хужирт"],
  "Өмнөговь": ["Даланзадгад","Баян-Овоо","Баяндалай","Булган","Гурвантэс","Манлай","Мандал-Овоо","Номгон","Ноён","Сэврэй","Хан-Богд","Ханхонгор","Хүрмэн","Цогт-Овоо","Цогтцэций"],
  "Сэлэнгэ": ["Сүхбаатар","Алтанбулаг","Баруунбүрэн","Байгал","Ерөө","Жавхлант","Мандал","Орхон","Орхонтуул","Сайхан","Сант","Түшиг","Хушаат","Цагааннуур","Шаамар"],
  "Сүхбаатар": ["Баруун-Урт","Асгат","Баяндэлгэр","Дарьганга","Мөнххаан","Наран","Онгон","Сүхбаатар","Түвшинширээ","Уулбаян","Халзан","Эрдэнэцагаан"],
  "Төв": ["Зуунмод","Аргалант","Архуст","Батсүмбэр","Баян","Баян-Өнжүүл","Баянчандмань","Баянхангай","Борнуур","Бүрэн","Дэлгэрхаан","Жаргалант","Заамар","Лүн","Мөнгөнморьт","Өндөрширээт","Сэргэлэн","Угтаалцайдам","Цээл","Эрдэнэ","Эрдэнэсант"],
  "Увс": ["Улаангом","Баруунтуруун","Бөхмөрөн","Давст","Завхан","Зүүнговь","Зүүнхангай","Малчин","Наранбулаг","Өлгий","Өмнөговь","Сагил","Тариалан","Түргэн","Тэс","Ховд","Хяргас","Цагаанхайрхан"],
  "Ховд": ["Ховд","Алтай","Булган","Буянт","Дарви","Дөргөн","Дуут","Жаргалант","Зэрэг","Манхан","Мөст","Мянгад","Үенч","Ховд","Цэцэг","Чандмань","Эрдэнэбүрэн"],
  "Хөвсгөл": ["Мөрөн","Алаг-Эрдэнэ","Арбулаг","Баянзүрх","Бүрэнтогтох","Галт","Жаргалант","Их-Уул","Рашаант","Рэнчинлхүмбэ","Тариалан","Тосонцэнгэл","Түнэл","Улаан-Уул","Ханх","Цагаан-Үүр","Цэцэрлэг","Чандмань-Өндөр","Эрдэнэбулган"],
  "Хэнтий": ["Чингис","Батноров","Батширээт","Биндэр","Галшар","Дадал","Дархан","Дэлгэрхаан","Жаргалтхаан","Мөрөн","Норовлин","Өмнөдэлгэр","Хэрлэн","Цэнхэрмандал"],
};
const PROVINCE_LIST = Object.keys(LOCATIONS);
const getDistricts = prov => LOCATIONS[prov] || [];
const getCat = id => CATS.find(c => c.id === id);
const getSub = id => ALL_SUBS.find(s => s.id === id);
const getLevel = id => LEVELS.find(l => l.id === id);
const ytId = url => { if (!url) return null; const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?\/\s]{11})/); return m ? m[1] : null; };
const uploadFile = (file, path, onProg) => new Promise((res, rej) => {
  const task = uploadBytesResumable(ref(storage, path), file);
  task.on("state_changed", s => onProg((s.bytesTransferred / s.totalBytes) * 100), rej, () => getDownloadURL(task.snapshot.ref).then(res));
});

// Гэрчилгээний дугаар үүсгэх — давтагдашгүй ID
function genCertId(userId, courseId) {
  const seed = (userId || "U") + "-" + (courseId || "C") + "-" + Date.now();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  const code = Math.abs(hash).toString(36).toUpperCase().substring(0, 8).padEnd(8, "X");
  return "EDU-" + code.substring(0, 4) + "-" + code.substring(4, 8);
}

// QR код үүсгэгч — энгийн bit pattern (бодит QR биш ч уншигдах загвартай)
function drawQRPattern(ctx, x, y, size, text) {
  const cells = 25;
  const cellSize = size / cells;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#0a1628";
  // Текстээс seed үүсгэх
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  // Pseudo-random pattern
  const seed = Math.abs(hash);
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const isCorner = (i < 7 && j < 7) || (i < 7 && j >= cells - 7) || (i >= cells - 7 && j < 7);
      if (isCorner) continue;
      const v = (seed * (i + 1) * (j + 7) + i * 13 + j * 17) % 100;
      if (v < 48) ctx.fillRect(x + j * cellSize, y + i * cellSize, cellSize, cellSize);
    }
  }
  // 3 булангийн finder pattern
  const drawFinder = (fx, fy) => {
    ctx.fillRect(fx, fy, cellSize * 7, cellSize * 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(fx + cellSize, fy + cellSize, cellSize * 5, cellSize * 5);
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(fx + cellSize * 2, fy + cellSize * 2, cellSize * 3, cellSize * 3);
  };
  drawFinder(x, y);
  drawFinder(x + cellSize * (cells - 7), y);
  drawFinder(x, y + cellSize * (cells - 7));
}

function generateCertificate(name, course, teacher, date, certId, verifyUrl) {
  const c = document.createElement("canvas"); c.width = 1200; c.height = 850;
  const x = c.getContext("2d");

  // Background gradient
  const bg = x.createLinearGradient(0, 0, 1200, 850);
  bg.addColorStop(0, "#0a1628"); bg.addColorStop(0.5, "#162447"); bg.addColorStop(1, "#1f4068");
  x.fillStyle = bg; x.fillRect(0, 0, 1200, 850);

  // Decorative corner pattern
  x.strokeStyle = "rgba(14, 165, 233, 0.15)";
  x.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    x.beginPath();
    x.arc(0, 0, 100 + i * 30, 0, Math.PI / 2);
    x.stroke();
    x.beginPath();
    x.arc(1200, 850, 100 + i * 30, Math.PI, Math.PI * 1.5);
    x.stroke();
  }

  // Outer double border (gold-blue elegance)
  x.strokeStyle = "#fbbf24"; x.lineWidth = 3;
  x.strokeRect(25, 25, 1150, 800);
  x.strokeStyle = "#0ea5e9"; x.lineWidth = 1;
  x.strokeRect(38, 38, 1124, 774);

  // Top ribbon
  const ribbonGrad = x.createLinearGradient(0, 60, 0, 130);
  ribbonGrad.addColorStop(0, "#0ea5e9"); ribbonGrad.addColorStop(1, "#0284c7");
  x.fillStyle = ribbonGrad;
  x.beginPath();
  x.moveTo(450, 60); x.lineTo(750, 60); x.lineTo(770, 110); x.lineTo(750, 145);
  x.lineTo(600, 130); x.lineTo(450, 145); x.lineTo(430, 110); x.closePath();
  x.fill();
  x.fillStyle = "#fff"; x.font = "bold 22px sans-serif"; x.textAlign = "center";
  x.fillText("EduMN", 600, 105);

  // Title
  x.fillStyle = "#fbbf24"; x.font = "bold 14px sans-serif";
  x.fillText("CERTIFICATE  OF  COMPLETION", 600, 190);
  x.fillStyle = "#0ea5e9"; x.font = "bold 32px serif";
  x.fillText("Г Э Р Ч И Л Г Э Э", 600, 230);

  // Ornamental divider
  x.strokeStyle = "#fbbf24"; x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(400, 255); x.lineTo(550, 255); x.stroke();
  x.beginPath(); x.moveTo(650, 255); x.lineTo(800, 255); x.stroke();
  // diamond center
  x.fillStyle = "#fbbf24";
  x.beginPath(); x.moveTo(600, 250); x.lineTo(615, 260); x.lineTo(600, 270); x.lineTo(585, 260); x.closePath(); x.fill();

  // Subtitle
  x.fillStyle = "#cbd5e1"; x.font = "italic 18px serif";
  x.fillText("Энэхүү гэрчилгээгээр", 600, 310);

  // Recipient name (BIG)
  x.fillStyle = "#fff"; x.font = "bold 52px serif";
  x.fillText(name, 600, 380);
  // Underline under name
  const nameMetrics = x.measureText(name);
  const nameW = Math.min(nameMetrics.width + 60, 800);
  x.strokeStyle = "#fbbf24"; x.lineWidth = 1;
  x.beginPath(); x.moveTo(600 - nameW / 2, 400); x.lineTo(600 + nameW / 2, 400); x.stroke();

  // Description
  x.fillStyle = "#cbd5e1"; x.font = "16px sans-serif";
  x.fillText("дараах сургалтыг амжилттай дүүргэснийг гэрчилж байна:", 600, 440);

  // Course name
  x.fillStyle = "#0ea5e9"; x.font = "bold 28px sans-serif";
  const courseName = course.length > 50 ? course.substring(0, 47) + "..." : course;
  x.fillText(courseName, 600, 490);

  // Teacher & date in elegant format
  x.fillStyle = "#94a3b8"; x.font = "14px sans-serif";
  x.fillText(`Багш: ${teacher}     •     Огноо: ${date}`, 600, 535);

  // QR код (зүүн доод буланд)
  drawQRPattern(x, 80, 600, 140, verifyUrl);
  x.fillStyle = "#cbd5e1"; x.font = "11px sans-serif"; x.textAlign = "left";
  x.fillText("Үнэн зөвийг шалгах:", 80, 760);
  x.fillStyle = "#0ea5e9"; x.font = "bold 11px sans-serif";
  x.fillText("edumn.mn/verify", 80, 778);

  // Certificate ID (баруун доод буланд)
  x.textAlign = "right";
  x.fillStyle = "#94a3b8"; x.font = "11px sans-serif";
  x.fillText("ГЭРЧИЛГЭЭНИЙ ДУГААР", 1120, 620);
  x.fillStyle = "#fbbf24"; x.font = "bold 22px monospace";
  x.fillText(certId, 1120, 650);

  // Signature area (төв)
  x.textAlign = "center";
  x.strokeStyle = "#fbbf24"; x.lineWidth = 0.5;
  x.beginPath(); x.moveTo(450, 700); x.lineTo(750, 700); x.stroke();
  x.fillStyle = "#cbd5e1"; x.font = "italic 16px serif";
  x.fillText("EduMN Тамга", 600, 725);
  // Seal circle
  x.strokeStyle = "#fbbf24"; x.lineWidth = 2;
  x.beginPath(); x.arc(600, 680, 32, 0, Math.PI * 2); x.stroke();
  x.fillStyle = "#fbbf24"; x.font = "bold 11px sans-serif";
  x.fillText("EDU", 600, 678);
  x.font = "9px sans-serif";
  x.fillText("MN", 600, 690);

  // Footer
  x.fillStyle = "rgba(203, 213, 225, 0.6)"; x.font = "11px sans-serif";
  x.fillText("EduMN — Монгол онлайн сургалтын платформ  |  contact@edumn.mn  |  +976 9903-3062", 600, 800);

  return c.toDataURL("image/png");
}

// ===================== STYLES =====================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Nunito+Sans:wght@400;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter','Nunito Sans',sans-serif;background:#f8fafc;color:#1a1a2e;-webkit-font-smoothing:antialiased;}

/* NAV */
.nav{background:#ffffff;padding:0;position:sticky;top:0;z-index:100;border-bottom:1px solid #e8ecf1;box-shadow:0 1px 12px rgba(0,0,0,0.06);}
.nav-inner{max-width:1260px;margin:0 auto;padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:68px;}
.logo{font-size:22px;font-weight:900;cursor:pointer;letter-spacing:-0.5px;color:#1a1a2e;}
.logo span{color:#0ea5e9;}
.nav-r{display:flex;gap:6px;align-items:center;}
.search-box{position:relative;flex:1;max-width:420px;margin:0 24px;}
.search-box input{width:100%;padding:10px 16px 10px 42px;border:1.5px solid #e2e8f0;border-radius:24px;background:#f8fafc;color:#1a1a2e;font-size:14px;font-family:inherit;transition:all 0.3s;}
.search-box input::placeholder{color:#94a3b8;}
.search-box input:focus{outline:none;border-color:#0ea5e9;background:#fff;box-shadow:0 0 0 4px rgba(14,165,233,0.1);}
.search-icon{position:absolute;left:15px;top:50%;transform:translateY(-50%);font-size:15px;color:#94a3b8;}
.ac-list{position:absolute;top:calc(100% + 8px);left:0;right:0;background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,0.12);z-index:500;overflow:hidden;max-height:360px;overflow-y:auto;border:1px solid #e8ecf1;}
.ac-item{padding:12px 16px;cursor:pointer;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:12px;transition:all 0.15s;}
.ac-item:hover{background:#f0f9ff;}

/* BUTTONS */
.btn{padding:9px 18px;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.25s;font-family:inherit;display:inline-flex;align-items:center;gap:6px;}
.btn:disabled{opacity:0.5;cursor:not-allowed;}
.btn-primary{background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;box-shadow:0 2px 12px rgba(14,165,233,0.25);}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(14,165,233,0.35);}
.btn-ghost{background:#f0f9ff;color:#0c4a6e;border:1.5px solid #e0f2fe;}
.btn-ghost:hover{border-color:#0ea5e9;color:#0ea5e9;background:#e0f2fe;}
.btn-white{background:#fff;color:#1a1a2e;box-shadow:0 2px 10px rgba(0,0,0,0.06);}
.btn-outline-dark{background:transparent;color:#fff;border:2px solid rgba(255,255,255,0.3);}
.btn-outline-dark:hover{border-color:#38bdf8;color:#38bdf8;}
.btn-danger{background:#ef4444;color:#fff;}.btn-success{background:#10b981;color:#fff;}.btn-info{background:#3b82f6;color:#fff;}
.btn-sm{padding:6px 12px;font-size:12px;border-radius:8px;}
.btn-lg{padding:14px 32px;font-size:16px;border-radius:14px;}

/* HERO - Teal gradient */
.hero{background:linear-gradient(160deg,#0c4a6e 0%,#0369a1 40%,#0ea5e9 100%);color:#fff;padding:80px 24px 60px;text-align:center;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%);top:-200px;right:-100px;}
.hero::after{content:'';position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,0.12) 0%,transparent 70%);bottom:-100px;left:-50px;}
.hero h1{font-size:48px;font-weight:900;margin-bottom:16px;letter-spacing:-2px;position:relative;line-height:1.1;}
.hero h1 span{color:#fbbf24;}
.hero p{font-size:17px;opacity:0.75;margin-bottom:36px;max-width:480px;margin-left:auto;margin-right:auto;line-height:1.7;position:relative;}
.hero-stats{display:flex;gap:48px;justify-content:center;margin-top:48px;flex-wrap:wrap;position:relative;}
.hero-stat .num{font-size:32px;font-weight:900;color:#fbbf24;}
.hero-stat .lbl{font-size:13px;opacity:0.6;margin-top:4px;font-weight:500;}

/* SECTION */
.sec{padding:56px 32px;max-width:1260px;margin:0 auto;}
.sec-title{font-size:24px;font-weight:800;margin-bottom:6px;letter-spacing:-0.5px;color:#0f172a;}
.sec-sub{color:#94a3b8;margin-bottom:28px;font-size:14px;}

/* SECTION WRAPPER for full-width bg */
.sec-wrap{background:#fff;padding:0;}
.sec-wrap-gray{background:#f8fafc;border-top:1px solid #f0f0f5;border-bottom:1px solid #f0f0f5;}

/* CARDS */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;}
.card{background:#fff;border-radius:18px;overflow:hidden;border:1px solid #eaecf0;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);cursor:pointer;position:relative;box-shadow:0 2px 8px rgba(0,0,0,0.05);}
.card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,0.12);border-color:#e0f2fe;}
.card-img{height:180px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
.card-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 0.5s cubic-bezier(0.4,0,0.2,1);}
.card:hover .card-img img{transform:scale(1.06);}
.card-avatar{position:absolute;bottom:12px;left:16px;width:63px;height:63px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#0284c7);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;overflow:hidden;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,0.15);z-index:2;}
.card-avatar img{width:100%;height:100%;object-fit:cover;}
.card-level{position:absolute;top:12px;left:12px;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;backdrop-filter:blur(8px);}
.bm-btn{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;z-index:2;box-shadow:0 2px 6px rgba(0,0,0,0.1);}
.bm-btn:hover{background:#fff;transform:scale(1.1);box-shadow:0 4px 12px rgba(0,0,0,0.15);}
.card-body{padding:24px 18px 18px;}
.card-teacher{font-size:12px;color:#94a3b8;margin-bottom:6px;font-weight:600;}
.card-title{font-size:15px;font-weight:700;margin-bottom:10px;line-height:1.4;color:#0f172a;min-height:42px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.card-stats{display:flex;gap:14px;font-size:12px;color:#94a3b8;margin-bottom:12px;font-weight:500;}
.card-stats span{display:flex;align-items:center;gap:3px;}
.card-bottom{display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid #f0f0f5;}
.card-price{font-size:17px;font-weight:800;color:#0ea5e9;}
.card-old-price{font-size:12px;color:#94a3b8;text-decoration:line-through;margin-left:6px;}
.card-cat{font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;background:#f7f7fa;color:#64748b;}

/* CATEGORY GRID */
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:32px;}
.cat-card{border-radius:18px;padding:28px 16px;text-align:center;cursor:pointer;transition:all 0.35s cubic-bezier(0.4,0,0.2,1);border:none;position:relative;overflow:hidden;color:#fff;}
.cat-card:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,0.2);}
.cat-icon{font-size:40px;margin-bottom:10px;position:relative;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.2));transition:transform 0.3s;}
.cat-card:hover .cat-icon{transform:scale(1.15) rotate(5deg);}
.cat-name{font-weight:700;font-size:15px;position:relative;}
.cat-count{font-size:12px;opacity:0.65;margin-top:6px;position:relative;font-weight:500;}

/* MODALS */
.mo{position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(12px);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.25s;}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
.md{background:#fff;border-radius:24px;padding:32px;width:100%;max-width:460px;max-height:92vh;overflow-y:auto;animation:slideUp 0.35s cubic-bezier(0.4,0,0.2,1);box-shadow:0 24px 80px rgba(0,0,0,0.2);}
@keyframes slideUp{from{transform:translateY(24px);opacity:0;}to{transform:translateY(0);opacity:1;}}
.md h2{font-size:24px;font-weight:800;margin-bottom:20px;letter-spacing:-0.5px;color:#0f172a;}

/* FORM */
.fg{margin-bottom:14px;}
.fg label{display:block;font-size:13px;font-weight:600;margin-bottom:5px;color:#475569;}
.fg input,.fg select,.fg textarea{width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:14px;font-family:inherit;transition:all 0.25s;background:#fff;}
.fg input:focus,.fg select:focus,.fg textarea:focus{outline:none;border-color:#0ea5e9;box-shadow:0 0 0 4px rgba(14,165,233,0.08);}
.fg textarea{min-height:80px;resize:vertical;}
.fg-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}

/* ALERTS */
.al{padding:12px 16px;border-radius:12px;margin-bottom:14px;font-size:13px;font-weight:500;}
.al-err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
.al-ok{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;}
.al-info{background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;}
.al-warn{background:#fffbeb;color:#92400e;border:1px solid #fde68a;}

/* TABS */
.tabs{display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;}
.tab{padding:9px 20px;border-radius:99px;border:none;background:#f7f7fa;cursor:pointer;font-weight:600;font-size:13px;transition:all 0.25s;font-family:inherit;color:#64748b;}
.tab:hover{background:#f0f0f5;color:#334155;}
.tab.on{background:#0c4a6e;color:#38bdf8;box-shadow:0 4px 12px rgba(15,23,42,0.15);}

/* PANELS */
.panel{background:#fff;border-radius:20px;padding:24px;border:1px solid #eaecf0;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,0.04);}
.ph{font-size:16px;font-weight:700;margin-bottom:16px;padding-bottom:14px;border-bottom:2px solid #f0f4f8;display:flex;justify-content:space-between;align-items:center;color:#0f172a;}

/* TABLE */
.tbl{width:100%;border-collapse:collapse;font-size:13px;}
.tbl th,.tbl td{padding:12px 14px;text-align:left;border-bottom:1px solid #f0f0f5;}
.tbl th{background:#f9fafb;font-weight:700;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;}
.tbl tr:hover td{background:#fafbfc;}

/* BADGES */
.badge{padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;white-space:nowrap;}
.b-free{background:#ecfdf5;color:#047857;}.b-paid{background:#fffbeb;color:#b45309;}
.b-cat{background:#e0f2fe;color:#0369a1;}.b-sub{background:#fdf2f8;color:#9d174d;}

/* STATS */
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:24px;}
.stat-card{background:#fff;border-radius:18px;padding:22px;text-align:center;border:1.5px solid #f0f0f5;position:relative;overflow:hidden;transition:all 0.3s;}
.stat-card:hover{border-color:#bae6fd;box-shadow:0 4px 20px rgba(14,165,233,0.08);}
.stat-card .sv{font-size:28px;font-weight:900;color:#0ea5e9;position:relative;}
.stat-card .sl{font-size:12px;color:#94a3b8;margin-top:4px;position:relative;font-weight:600;}

/* VIDEO */
.vbox{background:#0f172a;border-radius:18px;overflow:hidden;aspect-ratio:16/9;position:relative;}
.vbox iframe,.vbox video{width:100%;height:100%;border:none;}
.vlock{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#fff;gap:14px;text-align:center;padding:20px;}

/* MISC */
.cd{max-width:960px;margin:0 auto;padding:24px;}
.t-card{display:flex;align-items:center;gap:16px;background:#f9fafb;padding:18px;border-radius:16px;margin-bottom:20px;border:1px solid #f0f0f5;}
.av-lg{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#0ea5e9,#0284c7);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;overflow:hidden;flex-shrink:0;}
.av-lg img{width:100%;height:100%;object-fit:cover;}
.ps{background:#fff;border-radius:20px;padding:28px;border:1px solid #f0f0f5;max-width:540px;margin:0 auto;}
.news-card{background:#fff;border-radius:18px;padding:24px;border:1px solid #f0f0f5;margin-bottom:14px;transition:all 0.25s;}
.news-card:hover{box-shadow:0 8px 28px rgba(0,0,0,0.06);border-color:#e8e8ed;}
.footer{background:linear-gradient(135deg,#0a1628 0%,#0c2a4a 50%,#0c3a5e 100%);color:rgba(255,255,255,0.5);padding:64px 32px 40px;}
.footer-inner{max-width:1260px;margin:0 auto;}
.footer a{color:#38bdf8;text-decoration:none;font-weight:600;}
.footer a:hover{color:#7dd3fc;}
.spin{border:3px solid #e2e8f0;border-top:3px solid #0ea5e9;border-radius:50%;animation:sp 0.8s linear infinite;}
@keyframes sp{to{transform:rotate(360deg);}}
.notif{position:fixed;top:80px;right:20px;color:#fff;padding:14px 22px;border-radius:14px;font-weight:600;z-index:999;animation:ni 0.4s cubic-bezier(0.4,0,0.2,1);font-size:14px;box-shadow:0 8px 30px rgba(0,0,0,0.2);max-width:320px;}
@keyframes ni{from{transform:translateX(100px);opacity:0;}to{transform:translateX(0);opacity:1;}}
.dd{position:absolute;right:0;top:52px;background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.12);min-width:220px;overflow:hidden;z-index:400;animation:fadeIn 0.2s;border:1px solid #f0f0f5;}
.dd button{display:block;width:100%;padding:12px 18px;text-align:left;border:none;background:none;cursor:pointer;font-size:14px;font-weight:500;color:#334155;transition:all 0.15s;font-family:inherit;}
.dd button:hover{background:#f9fafb;color:#0ea5e9;}
.pw{background:#f0f0f5;border-radius:99px;height:6px;overflow:hidden;}
.pf{background:linear-gradient(90deg,#0ea5e9,#38bdf8);height:100%;border-radius:99px;transition:width 0.4s;}
.empty{text-align:center;padding:48px 24px;color:#94a3b8;}
.empty .ei{font-size:48px;margin-bottom:14px;}
.ua{border:2px dashed #d1d5db;border-radius:16px;padding:24px;text-align:center;cursor:pointer;transition:all 0.25s;background:#fafbfc;}
.ua:hover{border-color:#0ea5e9;background:#f0f9ff;}.ua input{display:none;}
.mat-item{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#f9fafb;border-radius:12px;margin-bottom:8px;transition:all 0.15s;border:1px solid #f0f0f5;}
.mat-item:hover{background:#f0f0f5;border-color:#e2e8f0;}
.qq{background:#f9fafb;border-radius:16px;padding:18px;margin-bottom:14px;border:1px solid #f0f0f5;}
.qo{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;margin-bottom:6px;border:1.5px solid #e2e8f0;cursor:pointer;transition:all 0.25s;font-size:14px;background:#fff;}
.qo:hover{border-color:#0ea5e9;background:#f0f9ff;}
.qo.correct{border-color:#10b981;background:#f0fdf4;}.qo.wrong{border-color:#ef4444;background:#fef2f2;}.qo.selected{border-color:#3b82f6;background:#eff6ff;}
.sp-pill{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:20px;}
.sp{padding:6px 14px;border-radius:99px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.25s;font-family:inherit;color:#64748b;}
.sp:hover,.sp.on{background:#0c4a6e;border-color:#0c4a6e;color:#38bdf8;}
.vtt{display:flex;gap:8px;margin-bottom:10px;}
.vb{flex:1;padding:10px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-weight:600;font-size:13px;transition:all 0.25s;font-family:inherit;text-align:center;}
.vb.on{border-color:#0ea5e9;background:#f0f9ff;color:#b45309;}
.cert-btn{padding:12px 22px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;border:none;border-radius:14px;font-weight:700;cursor:pointer;font-size:14px;transition:all 0.25s;font-family:inherit;display:flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(14,165,233,0.25);}
.cert-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(245,158,11,0.35);}
.sr{font-size:22px;cursor:pointer;transition:all 0.15s;color:#d1d5db;}.sr.on,.sr:hover{color:#0ea5e9;transform:scale(1.2);}
.rev-item{padding:18px;border-radius:16px;background:#f9fafb;margin-bottom:10px;border:1px solid #f0f0f5;}
.share-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;}
.share-btn{padding:9px 16px;border-radius:10px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all 0.2s;}
.share-fb{background:#1877f2;color:#fff;}.share-tw{background:#1da1f2;color:#fff;}.share-cp{background:#f0f0f5;color:#334155;}
.share-btn:hover{opacity:0.88;transform:translateY(-1px);}
.filter-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:center;}
.filter-row input,.filter-row select{padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:14px;font-family:inherit;background:#fff;transition:all 0.25s;}
.filter-row input:focus,.filter-row select:focus{outline:none;border-color:#0ea5e9;box-shadow:0 0 0 4px rgba(14,165,233,0.08);}
.filter-row input{flex:1;min-width:160px;}
.hw-item{background:#f9fafb;border-radius:16px;padding:18px;margin-bottom:12px;border:1px solid #f0f0f5;}
.note-area{width:100%;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:14px;font-family:inherit;resize:vertical;min-height:100px;transition:all 0.25s;}
.note-area:focus{outline:none;border-color:#0ea5e9;box-shadow:0 0 0 4px rgba(14,165,233,0.08);}
.note-item{background:#f0f9ff;border-left:4px solid #0ea5e9;padding:14px 18px;border-radius:0 14px 14px 0;margin-bottom:10px;font-size:14px;line-height:1.7;}
.live-badge{background:#ef4444;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:8px;animation:pulse 1.5s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.6;}}
.bundle-card{background:#fff;border-radius:18px;padding:24px;border:1.5px solid #f0f0f5;margin-bottom:14px;transition:all 0.35s;cursor:pointer;}
.bundle-card:hover{border-color:#bae6fd;transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,0.06);}
.aff-box{background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:18px;padding:24px;}
.aff-link{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:11px 14px;font-size:13px;font-family:monospace;word-break:break-all;margin:10px 0;}
.coupon-box{display:flex;gap:8px;margin-bottom:14px;}
.coupon-box input{flex:1;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:14px;font-family:inherit;}.coupon-box input:focus{outline:none;border-color:#0ea5e9;}
.qpay-box{background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:18px;padding:28px;color:#fff;text-align:center;margin-bottom:18px;}
.qpay-qr{width:160px;height:160px;background:#fff;border-radius:16px;margin:18px auto;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;}
.notif-item{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-bottom:1px solid #f0f0f5;transition:all 0.15s;cursor:pointer;}
.notif-item.unread{background:#fffbeb;}.notif-item:hover{background:#f9fafb;}
.lesson-item{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;border-bottom:1px solid #f0f0f5;transition:all 0.2s;}
.lesson-item:hover{background:#fffbeb;}
.lesson-item.active{background:#fffbeb;border-left:3px solid #0ea5e9;}
.lesson-item.done{background:#f0fdf4;}
.lesson-num{width:28px;height:28px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}

/* RESPONSIVE */
@media(max-width:768px){
  .nav-inner{padding:0 16px;height:56px;}.logo{font-size:18px;}
  .search-box{max-width:100%;margin:0 12px;}.search-box input{padding:8px 14px 8px 34px;font-size:13px;}
  .nav-r .btn-ghost{display:none;}
  .hero{padding:48px 16px 44px;}.hero h1{font-size:30px;letter-spacing:-1px;}.hero p{font-size:15px;}
  .hero-stats{gap:28px;}
  .sec{padding:36px 16px;}
  .grid{grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;}
  .cat-grid{grid-template-columns:repeat(2,1fr);}
  .stat-grid{grid-template-columns:repeat(2,1fr);}
  .cd{padding:16px;}
  .filter-row{flex-direction:column;}.filter-row input,.filter-row select{width:100%;}
  .fg-row{grid-template-columns:1fr;}
  .md{padding:24px;border-radius:18px;}
}
@media(max-width:480px){
  .hero h1{font-size:24px;}.grid{grid-template-columns:1fr;}
  .tabs{gap:4px;}.tab{padding:7px 12px;font-size:12px;}
  .cat-grid{grid-template-columns:repeat(2,1fr);gap:10px;}
}
`;
// ===================== APP (SAME LOGIC, NEW DESIGN) =====================
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null); const [role, setRole] = useState(null); const [profile, setProfile] = useState(null);
  const [showLogin, setShowLogin] = useState(false); const [showSignup, setShowSignup] = useState(false); const [showDrop, setShowDrop] = useState(false);
  const [courses, setCourses] = useState([]); const [news, setNews] = useState([]); const [teachers, setTeachers] = useState([]);
  const [pending, setPending] = useState([]); const [bundles, setBundles] = useState([]); const [coupons, setCoupons] = useState([]);
  const [selCourse, setSelCourse] = useState(null); const [selBundle, setSelBundle] = useState(null);
  const [selCat, setSelCat] = useState(null); const [selSub, setSelSub] = useState(null);
  const [notif, setNotif] = useState(null); const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState(""); const [searchOpen, setSearchOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState("all"); const [teacherFilter, setTeacherFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [adminTab, setAdminTab] = useState("teachers");
  const [bookmarks, setBookmarks] = useState([]);
  const [notifications, setNotifications] = useState([]); const [showNotifs, setShowNotifs] = useState(false);
  const dropRef = useRef(); const searchRef = useRef();
  const [teacherInitialTab, setTeacherInitialTab] = useState("courses");
  const setTeacherTabNav = tab => setTeacherInitialTab(tab);

  const notify = useCallback((msg, color = "#10b981") => { setNotif({ msg, color }); setTimeout(() => setNotif(null), 3500); }, []);

  useEffect(() => { return onAuthStateChanged(auth, async fu => { if (fu) { const pd = await getDoc(doc(db, "users", fu.uid)); if (pd.exists()) { setUser(fu); setRole(pd.data().role); setProfile(pd.data()); setBookmarks(pd.data().bookmarks || []); } } else { setUser(null); setRole(null); setProfile(null); setBookmarks([]); } setLoading(false); }); }, []);

  // URL дээр verify=XXX байвал гэрчилгээ шалгах хуудас руу шилжих
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vid = params.get("verify");
    if (vid) { setPage("verify"); window.verifyId = vid; }
  }, []);
  useEffect(() => onSnapshot(query(collection(db, "courses"), orderBy("createdAt", "desc")), s => setCourses(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), s => setNews(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(query(collection(db, "users"), where("role", "==", "teacher")), s => setTeachers(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(collection(db, "bundles"), s => setBundles(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(collection(db, "coupons"), s => setCoupons(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => { if (role !== "admin") return; return onSnapshot(collection(db, "pendingTeachers"), s => setPending(s.docs.map(d => ({ id: d.id, ...d.data() })))); }, [role]);
  useEffect(() => { if (!user) return; const uid = role === "admin" ? "admin" : user.uid; return onSnapshot(query(collection(db, "notifications"), where("userId", "==", uid), orderBy("createdAt", "desc")), s => setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() })))); }, [user, role]);
  useEffect(() => { const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const adminLogin = async (u, p) => { if (u === ADMIN.username && p === ADMIN.password) { await signOut(auth).catch(() => {}); setUser({ uid: "admin" }); setRole("admin"); setProfile({ name: "Admin", role: "admin" }); setShowLogin(false); notify("Админ нэвтэрлээ!"); setPage("admin"); return true; } return false; };
  const logout = async () => { if (role === "admin") { setUser(null); setRole(null); setProfile(null); } else await signOut(auth); setShowDrop(false); setPage("home"); notify("Гарлаа!"); };
  const toggleBookmark = async (cid) => { if (!user || role !== "user") { setShowLogin(true); return; } const nb = bookmarks.includes(cid) ? bookmarks.filter(b => b !== cid) : [...bookmarks, cid]; await updateDoc(doc(db, "users", user.uid), { bookmarks: nb }); setBookmarks(nb); notify(nb.includes(cid) ? "📌 Хадгалагдлаа!" : "Хасагдлаа"); };

  const recommended = (() => { if (!profile?.enrolledCourses?.length) return courses.slice(0, 4); const cats = courses.filter(c => profile.enrolledCourses.includes(c.id)).map(c => c.category); return courses.filter(c => !profile.enrolledCourses?.includes(c.id) && cats.includes(c.category)).slice(0, 4); })();
  const filtered = courses.filter(c => { const q = searchQ.toLowerCase(); return (!q || c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.teacherName?.toLowerCase().includes(q)) && (!selCat || c.category === selCat) && (!selSub || c.subCategory === selSub) && (!teacherFilter || c.teacherName?.toLowerCase().includes(teacherFilter.toLowerCase())) && (priceFilter === "all" || (priceFilter === "free" && c.isFree) || (priceFilter === "paid" && !c.isFree) || (priceFilter === "under50" && !c.isFree && c.price <= 50000) || (priceFilter === "over50" && !c.isFree && c.price > 50000)) && (levelFilter === "all" || c.level === levelFilter); });
  const searchResults = searchQ.length > 1 ? courses.filter(c => c.title?.toLowerCase().includes(searchQ.toLowerCase()) || c.teacherName?.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 6) : [];
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const goTo = c => { setSelCourse(c); setPage("courseDetail"); };

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}><div className="spin" style={{ width: 48, height: 48 }} /></div>;

  return <>
    <style>{CSS}</style>
    {notif && <div className="notif" style={{ background: notif.color }}>{notif.msg}</div>}

    {/* NAV */}
    <nav className="nav">
      <div className="nav-inner">
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }} onClick={() => setPage("home")}>
        <svg width="34" height="34" viewBox="0 0 40 40"><defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#38bdf8"/></linearGradient></defs><circle cx="20" cy="20" r="18" fill="url(#lg)"/><path d="M12 25 L20 14 L28 25" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="20" cy="12" r="2.5" fill="#fff"/><rect x="14" y="27" width="12" height="2" rx="1" fill="#fff"/></svg>
        <span className="logo">EduMN</span>
      </div>
      <div className="search-box" ref={searchRef}>
        <span className="search-icon">🔍</span>
        <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} placeholder="Сургалт хайх..." />
        {searchOpen && searchResults.length > 0 && <div className="ac-list">
          {searchResults.map(c => <div key={c.id} className="ac-item" onClick={() => { goTo(c); setSearchOpen(false); setSearchQ(""); }}>
            <span style={{ fontSize: 22 }}>{getCat(c.category)?.icon || "📚"}</span>
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{c.teacherName} · {c.isFree ? "Үнэгүй" : `${(c.price||0).toLocaleString()}₮`}</div></div>
          </div>)}
          <div className="ac-item" onClick={() => { setPage("courses"); setSearchOpen(false); }} style={{ justifyContent: "center", color: "#0ea5e9", fontWeight: 700 }}>Бүгдийг харах →</div>
        </div>}
      </div>
      <div className="nav-r">
        <button className="btn btn-ghost btn-sm" onClick={() => setPage("courses")}>Сургалт</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage("news")}>Мэдээ</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage("contact")}>Холбоо</button>
        {!user ? <>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowLogin(true)}>Нэвтрэх</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowSignup(true)}>Бүртгүүлэх</button>
        </> : <>
          {/* Notification bell */}
          <div style={{ position: "relative" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNotifs(!showNotifs)} style={{ fontSize: 16, padding: "6px 10px", position: "relative" }}>
              🔔{unreadNotifs > 0 && <span style={{ background: "#ef4444", borderRadius: "99px", padding: "1px 6px", fontSize: 9, marginLeft: 2, color: "#fff" }}>{unreadNotifs}</span>}
            </button>
            {showNotifs && <div style={{ position: "absolute", right: 0, top: 48, background: "#fff", borderRadius: 16, boxShadow: "0 12px 40px rgba(0,0,0,0.15)", width: 320, zIndex: 400, maxHeight: 380, overflowY: "auto" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 15 }}>🔔 Мэдэгдэл</div>
              {notifications.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Мэдэгдэл байхгүй</div>
                : notifications.slice(0, 10).map(n => <div key={n.id} className={`notif-item ${!n.read ? "unread" : ""}`} onClick={() => updateDoc(doc(db, "notifications", n.id), { read: true })}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.read ? "transparent" : "#0ea5e9", flexShrink: 0, marginTop: 6 }} />
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{n.body}</div></div>
                </div>)}
            </div>}
          </div>
          <div style={{ position: "relative" }} ref={dropRef}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDrop(!showDrop)}>
              {role === "admin" ? "⚙️" : role === "teacher" ? "🎓" : "👤"} {profile?.name?.split(" ")[0] || ""}
              {pending.length > 0 && role === "admin" && <span style={{ background: "#ef4444", borderRadius: "99px", padding: "1px 6px", fontSize: 9, marginLeft: 2 }}>{pending.length}</span>} ▾
            </button>
            {showDrop && <div className="dd">
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{profile?.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{profile?.email}</div>
                <div style={{ marginTop: 6 }}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: role==="admin"?"#fef3c7":role==="teacher"?"#f0f9ff":"#f0fdf4", color: role==="admin"?"#92400e":role==="teacher"?"#0369a1":"#047857", fontWeight: 700 }}>{role==="admin"?"⚙️ Админ":role==="teacher"?"🎓 Багш":"👤 Суралцагч"}</span></div>
              </div>
              {role === "admin" && <button onClick={() => { setPage("admin"); setShowDrop(false); }}>⚙️ Админ самбар</button>}
              {role === "teacher" && <>
                <button onClick={() => { setPage("teacher"); setShowDrop(false); setAdminTab?.("courses"); }}>📚 Сургалтууд</button>
                <button onClick={() => { setPage("teacher"); setShowDrop(false); setTeacherTabNav?.("students"); }}>👨‍🎓 Миний сурагчид</button>
                <button onClick={() => { setPage("teacher"); setShowDrop(false); setTeacherTabNav?.("profile"); }}>👤 Профайл</button>
              </>}
              {role === "user" && <><button onClick={() => { setPage("profile"); setShowDrop(false); }}>👤 Профайл</button>
                <button onClick={() => { setPage("bookmarks"); setShowDrop(false); }}>📌 Хадгалсан</button></>}
              <button onClick={logout} style={{ color: "#ef4444", borderTop: "1px solid #f1f5f9", marginTop: 4 }}>🚪 Гарах</button>
            </div>}
          </div>
        </>}
      </div>
      </div>
    </nav>

    {showLogin && <LoginModal onClose={() => setShowLogin(false)} adminLogin={adminLogin} setUser={setUser} setRole={setRole} setProfile={setProfile} notify={notify} setPage={setPage} />}
    {showSignup && <SignupModal onClose={() => setShowSignup(false)} notify={notify} setShowLogin={setShowLogin} teachers={teachers} />}

    {page === "home" && <HomePage courses={courses} news={news} teachers={teachers} recommended={recommended} setPage={setPage} goTo={goTo} setSelCat={setSelCat} setSelSub={setSelSub} user={user} bookmarks={bookmarks} toggleBookmark={toggleBookmark} setShowLogin={setShowLogin} />}
    {page === "courses" && <CoursesPage courses={filtered} goTo={goTo} selCat={selCat} setSelCat={setSelCat} selSub={selSub} setSelSub={setSelSub} searchQ={searchQ} setSearchQ={setSearchQ} priceFilter={priceFilter} setPriceFilter={setPriceFilter} teacherFilter={teacherFilter} setTeacherFilter={setTeacherFilter} levelFilter={levelFilter} setLevelFilter={setLevelFilter} bookmarks={bookmarks} toggleBookmark={toggleBookmark} />}
    {page === "courseDetail" && selCourse && <CourseDetailPage course={selCourse} teachers={teachers} user={user} role={role} profile={profile} setShowLogin={setShowLogin} notify={notify} setPage={setPage} bookmarks={bookmarks} toggleBookmark={toggleBookmark} coupons={coupons} />}
    {page === "news" && <NewsPage news={news} />}
    {page === "bookmarks" && <BookmarksPage courses={courses} bookmarks={bookmarks} goTo={goTo} toggleBookmark={toggleBookmark} />}
    {page === "admin" && role === "admin" && <AdminPage pending={pending} teachers={teachers} courses={courses} news={news} bundles={bundles} coupons={coupons} notify={notify} adminTab={adminTab} setAdminTab={setAdminTab} />}
    {page === "teacher" && role === "teacher" && <TeacherPage user={user} profile={profile} courses={courses} teachers={teachers} notify={notify} setProfile={setProfile} initialTab={teacherInitialTab} setTeacherTabNav={setTeacherTabNav} />}
    {page === "profile" && user && role === "user" && <ProfilePage user={user} profile={profile} courses={courses} notify={notify} />}
    {page === "contact" && <ContactPage />}
    {page === "verify" && <VerifyPage setPage={setPage} />}

    <footer className="footer">
      <div className="footer-inner">
        <div style={{display:"flex",gap:40,flexWrap:"wrap",justifyContent:"space-between",marginBottom:40}}>
          {/* Brand */}
          <div style={{flex:"1 1 200px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <svg width="36" height="36" viewBox="0 0 40 40"><defs><linearGradient id="flg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#38bdf8"/></linearGradient></defs><circle cx="20" cy="20" r="18" fill="url(#flg)"/><path d="M12 25 L20 14 L28 25" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="20" cy="12" r="2.5" fill="#fff"/><rect x="14" y="27" width="12" height="2" rx="1" fill="#fff"/></svg>
              <span style={{fontSize:24,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>EduMN</span>
            </div>
            <p style={{fontSize:13,lineHeight:1.7,maxWidth:220}}>ЕБС-ийн туршлагатай багш нарт мэдлэг, арга зүйгээ олон суралцагчид хүргэх боломж олгодог Монголын онлайн сургалтын платформ.</p>
          </div>
          {/* Links */}
          <div style={{flex:"1 1 140px"}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:14,marginBottom:12}}>Холбоос</div>
            {[["Сургалтууд","courses"],["Мэдээ","news"],["Холбоо барих","contact"]].map(([l])=><div key={l} style={{marginBottom:8}}><a href="#" style={{fontSize:13}}>{l}</a></div>)}
          </div>
          {/* Contact */}
          <div style={{flex:"1 1 180px"}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:14,marginBottom:12}}>Холбоо барих</div>
            <div style={{fontSize:13,marginBottom:8}}>📞 <a href="tel:99033062">9903-3062</a></div>
            <div style={{fontSize:13,marginBottom:8}}>✉️ <a href="mailto:contact@edumn.mn">contact@edumn.mn</a></div>
            <div style={{fontSize:13}}>📍 Улаанбаатар, Монгол</div>
          </div>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:20,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <p style={{fontSize:12}}>© 2025 EduMN. Бүх эрх хуулиар хамгаалагдсан.</p>
          <p style={{fontSize:12}}>Монгол онлайн сургалтын платформ 🇲🇳</p>
        </div>
      </div>
    </footer>
  </>;
}

// ===================== AUTH =====================
function LoginModal({ onClose, adminLogin, setUser, setRole, setProfile, notify, setPage }) {
  const [f, setF] = useState({ u: "", p: "" }); const [err, setErr] = useState(""); const [ld, setLd] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const sendForgot = async () => {
    if (!forgotEmail) { setErr("Имэйл хаягаа оруулна уу"); return; }
    try {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotSent(true); setErr("");
    } catch { setErr("Имэйл олдсонгүй эсвэл алдаа гарлаа"); }
  };

  const go = async () => {
    if (!f.u || !f.p) { setErr("Бүх талбарыг бөглөнө үү"); return; }
    setLd(true); setErr("");
    if (await adminLogin(f.u, f.p)) { setLd(false); return; }
    try {
      const c = await signInWithEmailAndPassword(auth, f.u, f.p);
      const pd = await getDoc(doc(db, "users", c.user.uid));
      if (pd.exists()) {
        const d = pd.data();
        setUser(c.user); setRole(d.role); setProfile(d);
        setPage(d.role === "teacher" ? "teacher" : "home"); notify("Нэвтэрлээ!"); onClose();
      } else {
        await signOut(auth);
        setErr("Таны бүртгэл админд хүлээгдэж байна. Админ зөвшөөрсний дараа нэвтэрнэ.");
      }
    } catch { setErr("Нэвтрэх нэр эсвэл нууц үг буруу"); }
    setLd(false);
  };

  return <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="md">
      {!showForgot ? <>
        <h2>Нэвтрэх</h2>
        {err && <div className="al al-err">{err}</div>}
        <div className="fg"><label>Имэйл / Нэвтрэх нэр</label><input value={f.u} onChange={e => setF({ ...f, u: e.target.value })} placeholder="имэйл эсвэл Admin" /></div>
        <div className="fg"><label>Нууц үг</label><input type="password" value={f.p} onChange={e => setF({ ...f, p: e.target.value })} onKeyDown={e => e.key === "Enter" && go()} /></div>
        <button className="btn btn-primary" style={{ width: "100%", padding: 13 }} onClick={go} disabled={ld}>{ld ? "Нэвтэрж байна..." : "Нэвтрэх"}</button>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button onClick={() => { setShowForgot(true); setForgotEmail(f.u); setErr(""); }} style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", fontSize: 13 }}>Нууц үгээ мартсан уу?</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}><button className="btn btn-sm" style={{ background: "#f1f5f9", color: "#64748b" }} onClick={onClose}>Хаах</button></div>
      </> : <>
        <h2>Нууц үг сэргээх</h2>
        {err && <div className="al al-err">{err}</div>}
        {forgotSent ? <div className="al al-info">📧 {forgotEmail} хаяг руу нууц үг шинэчлэх имэйл илгээлээ. Имэйлээ шалгаарай!</div> : <>
          <div className="fg"><label>Имэйл хаяг</label><input value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="бүртгэлтэй имэйлээ оруулна уу" /></div>
          <button className="btn btn-primary" style={{ width: "100%", padding: 13 }} onClick={sendForgot}>Имэйл илгээх</button>
        </>}
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button onClick={() => { setShowForgot(false); setForgotSent(false); setErr(""); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>← Буцах</button>
        </div>
      </>}
    </div></div>;
}

function SignupModal({ onClose, notify, setShowLogin, teachers }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    lastName:"", firstName:"", email:"", phone:"", pw:"", pw2:"",
    role:"user", userType:"student",
    province:"", district:"", school:"", grade:"",
    myTeacherId:"", myTeacherName:""
  });
  const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [ld, setLd] = useState(false);
  const isMn = str => /^[\u0400-\u04FF\s\-]+$/.test(str.trim());

  const nextStep = () => {
    setErr("");
    if (step === 1) {
      if (!f.lastName || !f.firstName) { setErr("Овог нэрээ бичнэ үү"); return; }
      if (!isMn(f.lastName) || !isMn(f.firstName)) { setErr("Монгол үсгээр бичнэ үү"); return; }
      if (!f.email) { setErr("Имэйл оруулна уу"); return; }
      if (!f.pw || f.pw.length < 6) { setErr("Нууц үг 6+ тэмдэгт"); return; }
      if (f.pw !== f.pw2) { setErr("Нууц үг таарахгүй"); return; }
      setStep(2);
    }
  };

  const go = async () => {
    if (f.role === "user" && !f.province) { setErr("Хот/Аймаг сонгоно уу"); return; }
    const fullName = f.lastName + "." + f.firstName;
    setLd(true); setErr("");
    try {
      if (f.role === "teacher") {
        // Багш Firebase Auth-д шууд бүртгүүлнэ (verification шаардахгүй)
        const c = await createUserWithEmailAndPassword(auth, f.email, f.pw);
        await updateProfile(c.user, { displayName: fullName });
        // pendingTeachers-д UID-тай хадгална — admin approve хийхэд хялбар болно
        await setDoc(doc(db, "pendingTeachers", c.user.uid), {
          uid: c.user.uid, name: fullName, lastName: f.lastName, firstName: f.firstName,
          email: f.email, phone: f.phone, role: "teacher", status: "pending",
          emailVerified: true, createdAt: serverTimestamp()
        });
        await signOut(auth);
        setOk("Бүртгэл амжилттай! Админ зөвшөөрсний дараа нэвтэрнэ үү.");
      } else {
        const c = await createUserWithEmailAndPassword(auth, f.email, f.pw);
        await updateProfile(c.user, { displayName: fullName });
        await setDoc(doc(db, "users", c.user.uid), {
          name: fullName, lastName: f.lastName, firstName: f.firstName,
          email: f.email, phone: f.phone, password: f.pw, role: "user",
          userType: f.userType,
          province: f.province, district: f.district,
          school: f.userType === "student" ? f.school : "",
          grade: f.userType === "student" ? f.grade : "",
          myTeacherId: f.myTeacherId||"", myTeacherName: f.myTeacherName||"",
          enrolledCourses: [], completedLessons: {}, bookmarks: [],
          emailVerified: true,
          affiliateCode: c.user.uid.substring(0,8), createdAt: serverTimestamp()
        });
        notify("Бүртгэл амжилттай! 🎉"); onClose();
      }
    } catch (e) { setErr(e.code === "auth/email-already-in-use" ? "Имэйл бүртгэлтэй байна" : "Алдаа: " + e.message); }
    setLd(false);
  };

  const districts = getDistricts(f.province);
  const isUB = f.province === "Улаанбаатар";

  return <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="md" style={{maxWidth:480}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h2 style={{margin:0}}>Бүртгүүлэх</h2>
        {step === 2 && !ok && <button onClick={()=>{setStep(1);setErr("");}} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer",color:"#64748b"}}>← Буцах</button>}
      </div>

      {/* Step indicator */}
      {!ok && <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[1,2].map(s=><div key={s} style={{flex:1,height:4,borderRadius:4,background:step>=s?"#0ea5e9":"#e2e8f0",transition:"all 0.3s"}}/>)}
      </div>}

      {err && <div className="al al-err">{err}</div>}

      {ok ? <>
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{fontSize:48,marginBottom:12}}>🎉</div>
          <div className="al al-ok">{ok}</div>
          <button className="btn btn-primary" style={{width:"100%",marginTop:8}} onClick={()=>{onClose();setShowLogin(true);}}>Нэвтрэх</button>
        </div>
      </> : step === 1 ? <>
        {/* STEP 1: Үндсэн мэдээлэл */}
        <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:14,textTransform:"uppercase",letterSpacing:0.5}}>Алхам 1 — Үндсэн мэдээлэл</div>

        {/* Role selector */}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["user","🎒","Суралцагч",""],["teacher","📖","Багш","ЕБС-ийн багш"]].map(([r,ic,lb,sub])=>
            <div key={r} onClick={()=>setF({...f,role:r})} style={{flex:1,padding:"10px 8px",borderRadius:12,border:`2px solid ${f.role===r?"#0ea5e9":"#e2e8f0"}`,background:f.role===r?"#f0f9ff":"#fff",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:22}}>{ic}</div>
              <div style={{fontSize:12,fontWeight:700,color:f.role===r?"#0284c7":"#475569",marginTop:2}}>{lb}</div>
              {sub && <div style={{fontSize:10,color:f.role===r?"#0ea5e9":"#94a3b8",marginTop:1}}>{sub}</div>}
            </div>
          )}
        </div>

        <div className="fg-row">
          <div className="fg">
            <label>Овог <span style={{fontSize:10,color:"#94a3b8"}}>(монголоор)</span></label>
            <input value={f.lastName} onChange={e=>setF({...f,lastName:e.target.value})} placeholder="Батаа" autoComplete="off"/>
          </div>
          <div className="fg">
            <label>Нэр <span style={{fontSize:10,color:"#94a3b8"}}>(монголоор)</span></label>
            <input value={f.firstName} onChange={e=>setF({...f,firstName:e.target.value})} placeholder="Болд" autoComplete="off"/>
          </div>
        </div>
        {(f.lastName||f.firstName) && !/^[\u0400-\u04FF\s\-]*$/.test(f.lastName+f.firstName) && <div style={{fontSize:11,color:"#ef4444",marginTop:-10,marginBottom:8}}>⚠️ Монгол үсгээр бичнэ үү</div>}

        <div className="fg"><label>Имэйл</label><input type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="email@example.com" autoComplete="off"/></div>
        <div className="fg"><label>Утас</label><input type="tel" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="99001122"/></div>
        <div className="fg-row">
          <div className="fg"><label>Нууц үг</label><input type="password" value={f.pw} onChange={e=>setF({...f,pw:e.target.value})} placeholder="6+ тэмдэгт" autoComplete="new-password"/></div>
          <div className="fg"><label>Давтах</label><input type="password" value={f.pw2} onChange={e=>setF({...f,pw2:e.target.value})} autoComplete="new-password"/>
            {f.pw2 && <span style={{fontSize:11,color:f.pw===f.pw2?"#10b981":"#ef4444",marginTop:3,display:"block",fontWeight:600}}>{f.pw===f.pw2?"✓ Таарч байна":"✗ Таарахгүй"}</span>}
          </div>
        </div>

        {f.role==="teacher" && <div className="al al-info" style={{fontSize:12,marginBottom:6}}>💼 Таны мэдлэг нэг ангиас давж, бүх Монголд хүрэх цаг болжээ!</div>}
        {f.role==="teacher" && <div className="al al-warn" style={{fontSize:12}}>⚠️ Багшийн хүсэлт админ зөвшөөрснөөр идэвхждэг</div>}

        {f.role==="teacher"
          ? <button className="btn btn-primary" style={{width:"100%",padding:13}} onClick={go} disabled={ld}>{ld?"Бүртгэж байна...":"Бүртгүүлэх"}</button>
          : <button className="btn btn-primary" style={{width:"100%",padding:13}} onClick={nextStep}>Үргэлжлүүлэх →</button>
        }

      </> : <>
        {/* STEP 2: Байршил + Сургуулийн мэдээлэл */}
        <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:14,textTransform:"uppercase",letterSpacing:0.5}}>Алхам 2 — Байршил & Сургууль</div>

        {/* Student type */}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["student","🎒","Сурагч","1-12-р анги"],["adult","👨","Насанд хүрэгч","18+ настай"]].map(([t,ic,lb,sub])=>
            <div key={t} onClick={()=>setF({...f,userType:t,school:"",grade:""})} style={{flex:1,padding:"10px 8px",borderRadius:12,border:`2px solid ${f.userType===t?"#0ea5e9":"#e2e8f0"}`,background:f.userType===t?"#f0f9ff":"#fff",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:20}}>{ic}</div>
              <div style={{fontSize:12,fontWeight:700,color:f.userType===t?"#0284c7":"#475569",marginTop:2}}>{lb}</div>
              <div style={{fontSize:10,color:"#94a3b8"}}>{sub}</div>
            </div>
          )}
        </div>

        {/* Province */}
        <div className="fg">
          <label>🏙️ Хот / Аймаг</label>
          <select value={f.province} onChange={e=>setF({...f,province:e.target.value,district:"",school:""})}>
            <option value="">-- Сонгоно уу --</option>
            <option value="Улаанбаатар">🏙️ Улаанбаатар</option>
            <optgroup label="Аймгууд">
              {PROVINCE_LIST.filter(p=>p!=="Улаанбаатар").map(p=><option key={p} value={p}>{p}</option>)}
            </optgroup>
          </select>
        </div>

        {/* District/Sum */}
        {f.province && <div className="fg">
          <label>{isUB ? "🏘️ Дүүрэг" : "🏡 Сум"}</label>
          <select value={f.district} onChange={e=>setF({...f,district:e.target.value})}>
            <option value="">-- {isUB?"Дүүрэг":"Сум"} сонгоно уу --</option>
            {districts.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>}

        {/* School — only for students */}
        {f.userType === "student" && f.province && <>
          <div className="fg">
            <label>🏫 Сургуулийн нэр <span style={{fontSize:10,color:"#94a3b8"}}>(заавал биш)</span></label>
            <input value={f.school} onChange={e=>setF({...f,school:e.target.value})} placeholder={isUB?"Жишээ: 23-р сургууль":"Жишээ: Баянзүрх сургууль"}/>
          </div>
          <div className="fg">
            <label>📚 Анги <span style={{fontSize:10,color:"#94a3b8"}}>(заавал биш)</span></label>
            <select value={f.grade} onChange={e=>setF({...f,grade:e.target.value})}>
              <option value="">-- Анги сонгоно уу --</option>
              {GRADE_GROUPS.map(g=><optgroup key={g.label} label={g.label}>{g.grades.map(gr=><option key={gr} value={gr}>{gr}-р анги</option>)}</optgroup>)}
            </select>
          </div>
        </>}

        {/* Teacher selector */}
        {teachers.length > 0 && <div className="fg">
          <label>👨‍🏫 Багш сонгох <span style={{fontSize:10,color:"#94a3b8"}}>(заавал биш)</span></label>
          <select value={f.myTeacherId||""} onChange={e=>setF({...f,myTeacherId:e.target.value,myTeacherName:teachers.find(t=>t.id===e.target.value)?.name||""})}>
            <option value="">-- Багш сонгохгүй --</option>
            {teachers.map(t=>{
              const ner=t.firstName||t.name?.split(".")?.[1]||t.name||"";
              const ovog=t.lastName||t.name?.split(".")?.[0]||"";
              return <option key={t.id} value={t.id}>{ovog} {ner}</option>;
            })}
          </select>
          {f.myTeacherId && <div style={{fontSize:11,color:"#10b981",marginTop:3}}>✅ Багш сонгогдлоо</div>}
        </div>}

        {/* Summary preview */}
        {f.province && <div style={{background:"#f0f9ff",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#0369a1",border:"1px solid #bae6fd"}}>
          📍 {f.province}{f.district?` · ${f.district}`:""}{f.userType==="student"&&f.school?` · ${f.school}`:""}
          {f.userType==="student"&&f.grade?` · ${f.grade}-р анги`:""}
        </div>}

        <button className="btn btn-primary" style={{width:"100%",padding:13}} onClick={go} disabled={ld}>{ld?"Бүртгэж байна...":"✓ Бүртгүүлэх"}</button>
      </>}
    </div>
  </div>;
}

// ===================== COURSE CARD =====================
function CourseCard({ course, onClick, bookmarks, toggleBookmark }) {
  const cat = getCat(course.category); const sub = getSub(course.subCategory);
  const level = getLevel(course.level);
  const isBookmarked = bookmarks?.includes(course.id);
  return <div className="card" onClick={onClick}>
    <div className="card-img" style={{ background: cat?.gradient || "linear-gradient(135deg,#334155,#1e293b)", height: 180 }}>
      {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" /> : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "0 16px" }}>
        <span style={{ fontSize: 52, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>{sub?.icon || cat?.icon || "📚"}</span>
      </div>}
      {course.liveUrl && <span className="live-badge" style={{ position: "absolute", top: 12, left: 12 }}>🔴 LIVE</span>}
      {level && <span className="card-level" style={{ background: level.bg, color: level.color, top: course.liveUrl ? 44 : 12 }}>{level.icon} {level.name}</span>}
      <button className="bm-btn" onClick={e => { e.stopPropagation(); toggleBookmark?.(course.id); }}>{isBookmarked ? "🔖" : "🏷️"}</button>
      {/* Teacher avatar overlay */}
      <div className="card-avatar">{course.teacherPhoto ? <img src={course.teacherPhoto} alt="" /> : (course.teacherName?.[0] || "T")}</div>
      {/* Gradient overlay at bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }} />
    </div>
    <div className="card-body">
      <div className="card-teacher">{course.teacherName}</div>
      {course.courseType === "edu" && course.grade && <div style={{fontSize:11,color:"#6366f1",fontWeight:700,marginBottom:2}}>📚 {course.grade}-р анги {getEbsSub(course.subCategory)?.name ? `· ${getEbsSub(course.subCategory).name}` : ""}</div>}
      <div className="card-title">{course.title}</div>
      <div className="card-stats">
        {course.lessonCount > 0 && <span>📹 {course.lessonCount} хичээл</span>}
        {course.viewCount > 0 && <span>👁 {course.viewCount.toLocaleString()}</span>}
        {course.totalDuration && <span>⏱ {course.totalDuration}</span>}
      </div>
      <div className="card-bottom">
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span className="card-price">{course.isFree ? "Үнэгүй" : `${(course.price||0).toLocaleString()}₮`}</span>
          {course.originalPrice && !course.isFree && <span className="card-old-price">{course.originalPrice.toLocaleString()}₮</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {course.reviewCount > 0 && <span style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 700 }}>★ {course.avgRating?.toFixed(1)}</span>}
          {cat && <span className="card-cat">{cat.icon} {cat.name}</span>}
        </div>
      </div>
    </div>
  </div>;
}

// ===================== HOME =====================
function HomePage({ courses, news, teachers, recommended, setPage, goTo, setSelCat, setSelSub, user, bookmarks, toggleBookmark, setShowLogin }) {
  const [homeTab, setHomeTab] = useState("all");
  const [openDrop, setOpenDrop] = useState(null);
  const tabBarRef = useRef(null);

  useEffect(() => {
    const h = e => { if (tabBarRef.current && !tabBarRef.current.contains(e.target)) setOpenDrop(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const catTabs = [
    { id: "all", label: "🏠 Нүүр" },
    { id: "general", label: "📚 Ерөнхий боловсрол" },
    { id: "computer", label: "💻 Компьютер" },
    { id: "language", label: "🌍 Гадаад хэл" },
    { id: "personal", label: "🌱 Хувь хүний хөгжил" },
  ];

  const handleTabClick = (t) => {
    if (t.id === "all") { setHomeTab("all"); setOpenDrop(null); return; }
    const cat = CATS.find(c => c.id === t.id);
    if (cat?.subs?.length) {
      setOpenDrop(openDrop === t.id ? null : t.id);
      setHomeTab(t.id);
    } else {
      setHomeTab(t.id); setOpenDrop(null);
    }
  };

  const goToSub = (catId, subId) => {
    setSelCat(catId); setSelSub(subId); setPage("courses"); setOpenDrop(null);
  };

  const tabCourses = homeTab === "all" ? courses : courses.filter(c => c.category === homeTab);
  return <>
    {/* Category nav tabs */}
    <div style={{ background: "#fff", borderBottom: "1px solid #e8ecf1", position: "relative", zIndex: 50 }} ref={tabBarRef}>
      <div style={{ maxWidth: 1260, margin: "0 auto", padding: "0 32px", display: "flex", gap: 0, overflowX: "auto", whiteSpace: "nowrap" }}>
        {catTabs.map(t => {
          const cat = CATS.find(c => c.id === t.id);
          const hasSubs = cat?.subs?.length > 0;
          const isOpen = openDrop === t.id;
          return <button key={t.id} onClick={() => handleTabClick(t)} style={{ padding: "14px 20px", border: "none", background: "none", cursor: "pointer", fontWeight: homeTab === t.id ? 700 : 500, fontSize: 14, color: homeTab === t.id ? "#0ea5e9" : "#475569", borderBottom: homeTab === t.id ? "3px solid #0ea5e9" : "3px solid transparent", fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {t.label}
            {hasSubs && <span style={{ fontSize: 10, opacity: 0.6, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>}
          </button>;
        })}
      </div>

      {/* EBS Subjects dropdown */}
      {openDrop === "general" && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", borderBottom: "2px solid #e0f2fe", boxShadow: "0 12px 40px rgba(0,0,0,0.1)", zIndex: 200, padding: "20px 32px 24px" }}>
        <div style={{ maxWidth: 1260, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 14, letterSpacing: 0.5, textTransform: "uppercase" }}>Хичээлийн чиглэлээр шүүх</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EBS_SUBJECTS.map(s => {
              const hasCount = courses.filter(c => c.category === "general" && c.subCategory === s.id).length;
              return <button key={s.id} onClick={() => goToSub("general", s.id)} style={{ padding: "6px 14px", border: "1.5px solid #e2e8f0", borderRadius: 20, background: "#f8fafc", cursor: "pointer", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s", color: "#334155", fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.color = "#4f46e5"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#334155"; }}>
                <span>{s.icon}</span> {s.name}
                {hasCount > 0 && <span style={{ fontSize: 10, background: "#6366f1", color: "#fff", borderRadius: 10, padding: "1px 6px", fontWeight: 700 }}>{hasCount}</span>}
              </button>;
            })}
          </div>
          <button onClick={() => { setSelCat("general"); setSelSub(null); setPage("courses"); setOpenDrop(null); }} style={{ marginTop: 14, fontSize: 13, color: "#6366f1", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Бүх ЕБС сургалтыг үзэх →</button>
        </div>
      </div>}

      {/* Other category subs dropdown */}
      {openDrop && openDrop !== "general" && (() => {
        const cat = CATS.find(c => c.id === openDrop);
        if (!cat?.subs) return null;
        return <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", borderBottom: "2px solid #e0f2fe", boxShadow: "0 12px 40px rgba(0,0,0,0.1)", zIndex: 200, padding: "20px 32px 24px" }}>
          <div style={{ maxWidth: 1260, margin: "0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 14, letterSpacing: 0.5, textTransform: "uppercase" }}>{cat.name} — чиглэл сонгох</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cat.subs.map(s => {
                const hasCount = courses.filter(c => c.category === cat.id && c.subCategory === s.id).length;
                return <button key={s.id} onClick={() => goToSub(cat.id, s.id)} style={{ padding: "6px 14px", border: "1.5px solid #e2e8f0", borderRadius: 20, background: "#f8fafc", cursor: "pointer", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s", color: "#334155", fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.background = "#f0f9ff"; e.currentTarget.style.color = "#0284c7"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#334155"; }}>
                  <span>{s.icon}</span> {s.name}
                  {hasCount > 0 && <span style={{ fontSize: 10, background: "#0ea5e9", color: "#fff", borderRadius: 10, padding: "1px 6px", fontWeight: 700 }}>{hasCount}</span>}
                </button>;
              })}
            </div>
            <button onClick={() => { setSelCat(cat.id); setSelSub(null); setPage("courses"); setOpenDrop(null); }} style={{ marginTop: 12, fontSize: 13, color: "#0ea5e9", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Бүх {cat.name} сургалтыг үзэх →</button>
          </div>
        </div>;
      })()}
    </div>

    {/* Zangia-style compact featured banner */}
    <div style={{ background: "linear-gradient(135deg,#0d1f3c 0%,#0f2d5a 60%,#0a3355 100%)", padding: "20px 32px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -60, right: -40, width: 220, height: 220, background: "radial-gradient(circle,rgba(14,165,233,0.12),transparent 70%)", borderRadius: "50%", pointerEvents:"none" }} />
      <div style={{ maxWidth: 1260, margin: "0 auto", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        {/* Left text */}
        <div style={{ flex: "0 0 auto", minWidth: 200 }}>
          <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>✨ ЕБС-ийн туршлагатай багш нараас</div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, lineHeight: 1.35, marginBottom: 10 }}>
            Сайн багш ганц ангийнхаа<br/>хүүхдүүдэд бус <span style={{color:"#38bdf8"}}>бүх Монголын</span><br/>суралцагчдад нөлөөлж чадна
          </div>
          <button className="btn btn-sm" onClick={() => setPage("courses")} style={{background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.25)",borderRadius:8,fontSize:13,padding:"7px 16px",cursor:"pointer"}}>Цааш үзэх</button>
        </div>
        {/* Course cards row */}
        {courses.length > 0 && <div style={{ flex: 1, display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
          {courses.slice(0, 4).map((c) => {
            const cat = getCat(c.category); const teacher = teachers.find(t => t.id === c.teacherId);
            const ner = teacher ? (teacher.firstName || teacher.name?.split(".")?.[1] || teacher.name) : "";
            return <div key={c.id} onClick={() => goTo(c)}
              style={{ flexShrink: 0, width: 170, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: 14, overflow: "hidden", cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)", transition: "all 0.25s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.18)"; e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)"; e.currentTarget.style.transform="none";}}>
              <div style={{ height: 96, background: cat?.gradient||"linear-gradient(135deg,#334155,#1e293b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 36, position:"relative", overflow:"hidden" }}>
                {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}} /> : (cat?.icon||"📚")}
                <div style={{position:"absolute",inset:0,background:"linear-gradient(transparent 40%,rgba(0,0,0,0.45))"}} />
                {teacher && <div style={{position:"absolute",bottom:8,left:8,width:28,height:28,borderRadius:"50%",border:"2px solid #fff",overflow:"hidden",background:"linear-gradient(135deg,#0ea5e9,#38bdf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>
                  {teacher.photoUrl?<img src={teacher.photoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(ner?.[0]||"Б")}
                </div>}
              </div>
              <div style={{ padding: "10px 10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1.35, marginBottom: 4 }}>{c.title?.substring(0,40)}{c.title?.length>40?"...":""}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Багш: {ner}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: c.isFree?"#4ade80":"#fbbf24" }}>{c.isFree?"Үнэгүй":`${(c.price||0).toLocaleString()}₮`}</div>
              </div>
            </div>;
          })}
        </div>}
      </div>
    </div>

    <div className="sec">
      {/* Category tabs quick filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div><div className="sec-title" style={{marginBottom:4}}>Ангилалууд</div><div className="sec-sub">Сонирхлоор нь шүүж сургалт олоорой</div></div>
      </div>
      <div className="cat-grid">
        {CATS.map(c => <div key={c.id} className="cat-card" style={{ background: c.gradient }} onClick={() => { setSelCat(c.id); setSelSub(null); setPage("courses"); }}>
          <div className="cat-icon">{c.icon}</div>
          <div className="cat-name">{c.name}</div>
          <div className="cat-count">{courses.filter(x => x.category === c.id).length} сургалт</div>
        </div>)}
      </div>
      {recommended.length > 0 && <><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:32,marginBottom:4}}><div className="sec-title" style={{marginBottom:0}}>✨ Танд тохирох</div><button className="btn btn-sm" style={{background:"#f0f9ff",color:"#0ea5e9",border:"1px solid #bae6fd",fontSize:12}} onClick={() => setPage("courses")}>Цааш үзэх →</button></div>
        <div className="sec-sub">Таны сонирхолд тулгуурлан санал болгож байна</div>
        <div className="grid">{recommended.map(c => <CourseCard key={c.id} course={c} onClick={() => goTo(c)} bookmarks={bookmarks} toggleBookmark={toggleBookmark} />)}</div>
        <div style={{ height: 32 }} /></>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div className="sec-title" style={{marginBottom:0}}>🔥 Шинээр нэмэгдсэн хичээлүүд</div>
        <button className="btn btn-sm" style={{background:"#f0f9ff",color:"#0ea5e9",border:"1px solid #bae6fd",fontSize:12}} onClick={() => setPage("courses")}>Цааш үзэх →</button>
      </div>
      <div className="sec-sub" style={{marginBottom:16}}>Шинэ сургалтуудыг нэн даруй эзэмшиж эхэл</div>
      {/* Registered course status notice */}
      {user && <div className="al al-info" style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,fontSize:13}}><span>📌</span><span>Бүртгүүлсэн сургалтын идэвхтэй хугацааг шалгах</span><button className="btn btn-primary btn-sm" style={{marginLeft:"auto"}}>Миний сургалт</button></div>}
      {tabCourses.length === 0 ? <div className="empty"><div className="ei">📭</div><p>Сургалт байхгүй байна</p></div>
        : <div className="grid">{tabCourses.slice(0, 8).map(c => <CourseCard key={c.id} course={c} onClick={() => goTo(c)} bookmarks={bookmarks} toggleBookmark={toggleBookmark} />)}</div>}
      {tabCourses.length > 8 && <div style={{ textAlign: "center", marginTop: 24 }}><button className="btn btn-primary" onClick={() => setPage("courses")}>Бүгдийг үзэх →</button></div>}
    </div>

    {/* БАГШ НАР — Zangia style */}
    {teachers.length > 0 && <div className="sec" style={{ paddingTop: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div><div className="sec-title" style={{marginBottom:0}}>Багш нар</div><div className="sec-sub" style={{ marginBottom: 0 }}>ЕБС-д заасан туршлагатай багш нар нэг ангиас давж, Монгол даяар нөлөөлж байна</div></div>
        <button className="btn btn-sm" style={{background:"#f0f9ff",color:"#0ea5e9",border:"1px solid #bae6fd",fontSize:12}} onClick={() => setPage("courses")}>Цааш үзэх →</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
        {teachers.slice(0, 6).map(t => {
          const ovog = t.lastName || t.name?.split(".")?.[0] || "";
          const ner = t.firstName || t.name?.split(".")?.[1] || t.name || "";
          return <div key={t.id} style={{ background: "#fff", borderRadius: 18, padding: "24px 16px 18px", textAlign: "center", border: "1.5px solid #e8ecf1", transition: "all 0.3s", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(14,165,233,0.12)"; e.currentTarget.style.borderColor = "#bae6fd"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e8ecf1"; e.currentTarget.style.transform = "none"; }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#e0f2fe,#bae6fd)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", overflow: "hidden", fontSize: 26, fontWeight: 800, color: "#0369a1", border: "3px solid #e0f2fe" }}>
              {t.photoUrl ? <img src={t.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (ner?.[0] || "Б")}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2, letterSpacing: 0.3 }}>{ovog?.toUpperCase()}</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", marginBottom: 8 }}>{ner}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>{courses.filter(c => c.teacherId === t.id).length} сургалт</div>
            <span style={{ display:"inline-block", fontSize: 11, padding: "4px 12px", borderRadius: 20, background: "#f0f9ff", color: "#0ea5e9", border: "1px solid #bae6fd", fontWeight: 600 }}>Дэлгэрэнгүй</span>
          </div>;
        })}
      </div>
    </div>}

    {/* ХЭРЭГЛЭГЧДИЙН СЭТГЭГДЭЛ */}
    <div className="sec" style={{ paddingTop: 0 }}>
      <div className="sec-title">💬 Хэрэглэгчдийн сэтгэгдэл</div>
      <div className="sec-sub">Суралцагчдын бодит туршлага</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {[
          { name: "Суралцагч", text: "Хэрэгтэй гоё сургалтууд оруулсанд маш их баярлалаа. Чанартай контент!", rating: 5 },
          { name: "Суралцагч", text: "Маш их зүйлийг ойлгож авлаа. Хичээл заасан бүх багш нартаа баярлалаа!", rating: 5 },
          { name: "Суралцагч", text: "Mash ih zviliin oilgoj awlaa. Hicheel zaasan bvh bagsh nartaa bayrlalaa.", rating: 4 },
        ].map((r, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 18, padding: 24, border: "1.5px solid #e8ecf1", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#e0f2fe,#bae6fd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#0369a1" }}>{r.name[0]}</div>
              <div><div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{r.name}</div>
                <div>{[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= r.rating ? "#fbbf24" : "#e2e8f0", fontSize: 14 }}>★</span>)}</div>
              </div>
            </div>
            <div style={{ color: "#334155", fontSize: 24, fontWeight: 800, lineHeight: 1, marginBottom: 6, opacity: 0.1 }}>"</div>
            <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.7, fontStyle: "italic" }}>{r.text}</p>
            <div style={{ color: "#334155", fontSize: 24, fontWeight: 800, lineHeight: 1, textAlign: "right", opacity: 0.1, marginTop: 6 }}>"</div>
          </div>
        ))}
      </div>
    </div>

    {news.length > 0 && <div className="sec" style={{ paddingTop: 0 }}>
      <div className="sec-title">📰 Мэдээ</div>
      {news.slice(0, 2).map(n => <div key={n.id} className="news-card"><h3 style={{ fontWeight: 700, fontSize: 17 }}>{n.title}</h3><p style={{ marginTop: 8, color: "#64748b", lineHeight: 1.7, fontSize: 14 }}>{n.content?.substring(0, 160)}...</p></div>)}
      <button className="btn btn-white btn-sm" style={{ marginTop: 8 }} onClick={() => setPage("news")}>Бүх мэдээ →</button>
    </div>}
  </>;
}

// ===================== COURSES PAGE =====================
function CoursesPage({ courses, goTo, selCat, setSelCat, selSub, setSelSub, searchQ, setSearchQ, priceFilter, setPriceFilter, teacherFilter, setTeacherFilter, levelFilter, setLevelFilter, bookmarks, toggleBookmark }) {
  const catInfo = CATS.find(c => c.id === selCat);
  return <div className="sec">
    <div className="sec-title">Бүх сургалтууд</div>
    <div className="filter-row">
      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Гарчиг, тайлбар, багш хайх..." />
      <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)}>
        <option value="all">Бүх үнэ</option><option value="free">Үнэгүй</option><option value="paid">Төлбөртэй</option>
        <option value="under50">50,000₮-</option><option value="over50">50,000₮+</option>
      </select>
      <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
        <option value="all">Бүх түвшин</option>
        {LEVELS.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
      </select>
    </div>
    <div className="tabs">
      <div className={`tab ${!selCat ? "on" : ""}`} onClick={() => { setSelCat(null); setSelSub(null); }}>Бүгд</div>
      {CATS.map(c => <div key={c.id} className={`tab ${selCat === c.id ? "on" : ""}`} onClick={() => { setSelCat(c.id); setSelSub(null); }}>{c.icon} {c.name}</div>)}
    </div>
    {catInfo?.subs && <div className="sp-pill">
      <span className={`sp ${!selSub ? "on" : ""}`} onClick={() => setSelSub(null)}>Бүгд</span>
      {catInfo.subs.map(s => <span key={s.id} className={`sp ${selSub === s.id ? "on" : ""}`} onClick={() => setSelSub(s.id)}>{s.icon} {s.name}</span>)}
    </div>}
    {courses.length === 0 ? <div className="empty"><div className="ei">🔍</div><p>Сургалт олдсонгүй</p></div>
      : <div className="grid">{courses.map(c => <CourseCard key={c.id} course={c} onClick={() => goTo(c)} bookmarks={bookmarks} toggleBookmark={toggleBookmark} />)}</div>}
  </div>;
}

// ===================== COURSE DETAIL (Zangia-style) =====================
function CourseDetailPage({ course, teachers, user, role, profile, setShowLogin, notify, setPage, bookmarks, toggleBookmark, coupons }) {
  const [enrolled, setEnrolled] = useState(false); const [completed, setCompleted] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [lessons, setLessons] = useState([]); const [selLesson, setSelLesson] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [quiz, setQuiz] = useState(null); const [answers, setAnswers] = useState({}); const [submitted, setSubmitted] = useState(false);
  const [reviews, setReviews] = useState([]); const [myRating, setMyRating] = useState(0); const [myComment, setMyComment] = useState("");
  const [completedLessons, setCompletedLessons] = useState([]);
  const [homeworks, setHomeworks] = useState([]); const [hwAnswers, setHwAnswers] = useState({});
  const [submittedHomeworks, setSubmittedHomeworks] = useState([]);
  const [quizScore, setQuizScore] = useState(null);
  const [lastLessonId, setLastLessonId] = useState(null);
  const ytPlayerRef = useRef(null);
  const [note, setNote] = useState(""); const [notes, setNotes] = useState([]);
  const [dtab, setDtab] = useState("intro");
  const teacher = teachers.find(t => t.id === course.teacherId);
  const cat = getCat(course.category); const sub = getSub(course.subCategory); const level = getLevel(course.level);
  const canWatch = course.isFree || enrolled || role === "admin" || role === "teacher";
  const activeYtId = ytId(course.videoUrl);

  useEffect(() => { if (!user || role !== "user") return; getDoc(doc(db, "users", user.uid)).then(d => { if (d.exists()) { const data = d.data(); setEnrolled((data.enrolledCourses || []).includes(course.id)); setCompletedLessons((data.completedLessons || {})[course.id] || []); const qs = (data.quizScores || {})[course.id]; if (qs) { setQuizScore(qs); setSubmitted(true); } const lastL = (data.lastLessons || {})[course.id]; if (lastL) setLastLessonId(lastL); } }); }, [user, course.id, role]);
  useEffect(() => { return onSnapshot(query(collection(db, "courses", course.id, "lessons"), orderBy("order")), s => {
    const ls = s.docs.map(d => ({ id: d.id, ...d.data() })); setLessons(ls);
    if (ls.length > 0 && !selLesson) {
      // Сүүлд үзсэн хичээлийг автоматаар сонгох (resume)
      const resumeLesson = lastLessonId ? ls.find(l => l.id === lastLessonId) : null;
      setSelLesson(resumeLesson || ls[0]);
    }
    const totalMins = ls.reduce((sum, l) => sum + (parseInt(l.duration) || 0), 0);
    const durStr = totalMins >= 60 ? `${Math.floor(totalMins/60)}ц ${totalMins%60}мин` : `${totalMins} мин`;
    updateDoc(doc(db, "courses", course.id), { lessonCount: ls.length, totalDuration: durStr }).catch(() => {});
  }); }, [course.id]);
  useEffect(() => { updateDoc(doc(db, "courses", course.id), { viewCount: (course.viewCount || 0) + 1 }).catch(() => {}); }, [course.id]);
  useEffect(() => onSnapshot(query(collection(db, "courses", course.id, "materials"), orderBy("createdAt", "desc")), s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() })))), [course.id]);
  useEffect(() => { getDoc(doc(db, "courses", course.id, "quiz", "main")).then(d => { if (d.exists()) setQuiz(d.data()); }); }, [course.id]);
  useEffect(() => onSnapshot(query(collection(db, "courses", course.id, "reviews"), orderBy("createdAt", "desc")), s => setReviews(s.docs.map(d => ({ id: d.id, ...d.data() })))), [course.id]);
  useEffect(() => onSnapshot(query(collection(db, "courses", course.id, "homeworks"), orderBy("createdAt", "desc")), s => setHomeworks(s.docs.map(d => ({ id: d.id, ...d.data() })))), [course.id]);
  useEffect(() => {
    if (!user || role !== "user" || homeworks.length === 0) { setSubmittedHomeworks([]); return; }
    Promise.all(homeworks.map(hw =>
      getDoc(doc(db, "courses", course.id, "homeworks", hw.id, "submissions", user.uid))
        .then(d => d.exists() ? hw.id : null).catch(() => null)
    )).then(ids => setSubmittedHomeworks(ids.filter(Boolean)));
  }, [user, course.id, homeworks, role]);
  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    if (document.getElementById("yt-api-script")) return;
    const tag = document.createElement("script");
    tag.id = "yt-api-script";
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);
  // Init YT Player when lesson changes — auto markDone on video end
  useEffect(() => {
    if (!selLesson || !canWatch || role !== "user") return;
    const ytid = ytId(selLesson.videoUrl);
    if (!ytid) return;
    let interval; let cancelled = false;
    const tryInit = () => {
      if (cancelled || !window.YT || !window.YT.Player) return false;
      if (!document.getElementById(`yt-${selLesson.id}`)) return false;
      try {
        if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} ytPlayerRef.current = null; }
        ytPlayerRef.current = new window.YT.Player(`yt-${selLesson.id}`, {
          events: {
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.ENDED) markDone(selLesson.id);
            }
          }
        });
        return true;
      } catch { return false; }
    };
    if (!tryInit()) {
      interval = setInterval(() => { if (tryInit() && interval) { clearInterval(interval); interval = null; } }, 400);
      setTimeout(() => { if (interval) clearInterval(interval); }, 10000);
    }
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} ytPlayerRef.current = null; }
    };
  }, [selLesson, canWatch, role]);
  useEffect(() => { if (!user || !canWatch) return; getDoc(doc(db, "courses", course.id, "notes", user.uid)).then(d => { if (d.exists()) setNotes(d.data().items || []); }); }, [user, course.id, canWatch]);
  useEffect(() => {
    if (!enrolled) { setCompleted(false); return; }
    const lessonsOk = lessons.length > 0 && completedLessons.length === lessons.length;
    const homeworksOk = homeworks.length === 0 || submittedHomeworks.length >= homeworks.length;
    let quizOk = !quiz;
    if (quiz) {
      if (quiz.mode === "google") {
        // Google Form: багшийн өгсөн оноо 80+ байх ёстой
        quizOk = quizScore && quizScore.percentage !== null && quizScore.percentage >= 80;
      } else {
        // Энгийн шалгалт: 60%+
        quizOk = quizScore !== null && quizScore.percentage >= 60;
      }
    }
    setCompleted(lessonsOk && homeworksOk && quizOk);
  }, [completedLessons, lessons, enrolled, quiz, quizScore, homeworks, submittedHomeworks]);

  const enroll = async () => {
    if (!user) { setShowLogin(true); return; }
    if (course.isFree) {
      const d = await getDoc(doc(db, "users", user.uid));
      const userData = d.data() || {};
      const updates = { enrolledCourses: [...(userData.enrolledCourses || []), course.id] };
      // Автоматаар багштай холбох — хэрэв сурагчид багш байхгүй бол энэ сургалтын багшийг тогтооно
      if (!userData.myTeacherId && course.teacherId) {
        updates.myTeacherId = course.teacherId;
        updates.myTeacherName = course.teacherName || "";
      }
      await updateDoc(doc(db, "users", user.uid), updates);
      await updateDoc(doc(db, "courses", course.id), { enrolledCount: (course.enrolledCount||0)+1 }).catch(()=>{});
      setEnrolled(true); notify("Амжилттай бүртгүүллээ!");
      await setDoc(doc(collection(db, "notifications")), { userId: user.uid, title: "Сургалтад бүртгүүллээ!", body: `"${course.title}" сургалтад бүртгүүллээ.`, read: false, createdAt: serverTimestamp() });
    } else setShowPay(true);
  };

  const markDone = async lid => {
    if (!user || role !== "user") return;
    const nl = completedLessons.includes(lid) ? completedLessons : [...completedLessons, lid];
    await updateDoc(doc(db, "users", user.uid), { [`completedLessons.${course.id}`]: nl });
    setCompletedLessons(nl);
    if (nl.length === lessons.length) notify("🎉 Сургалт дүүргэлээ! Гэрчилгээ татаж авна уу!");
  };

  const saveNote = async () => {
    if (!note.trim() || !user) return;
    const newNotes = [...notes, { text: note, lesson: selLesson?.title || "Ерөнхий", time: new Date().toLocaleString("mn-MN") }];
    await setDoc(doc(db, "courses", course.id, "notes", user.uid), { items: newNotes });
    setNotes(newNotes); setNote(""); notify("Тэмдэглэл хадгалагдлаа!");
  };

  const submitReview = async () => {
    if (!user || myRating === 0) { notify("Үнэлгээ өгнө үү", "#ef4444"); return; }
    await setDoc(doc(db, "courses", course.id, "reviews", user.uid), { userId: user.uid, userName: profile?.name || "Нэргүй", rating: myRating, comment: myComment, createdAt: serverTimestamp() });
    const total = [...reviews.filter(r => r.id !== user.uid), { rating: myRating }];
    await updateDoc(doc(db, "courses", course.id), { avgRating: Math.round(total.reduce((s, r) => s + r.rating, 0) / total.length * 10) / 10, reviewCount: total.length });
    setMyRating(0); setMyComment(""); notify("Сэтгэгдэл нэмэгдлээ!");
  };

  const submitHw = async hwId => {
    if (!hwAnswers[hwId]?.trim() || !user) return;
    await setDoc(doc(db, "courses", course.id, "homeworks", hwId, "submissions", user.uid), { userId: user.uid, userName: profile?.name, answer: hwAnswers[hwId], createdAt: serverTimestamp() });
    setSubmittedHomeworks(p => p.includes(hwId) ? p : [...p, hwId]);
    setHwAnswers(p => ({ ...p, [hwId]: "" })); notify("Даалгавар илгээгдлээ!");
  };

  const submitQuiz = async () => {
    if (!user) return;
    setSubmitted(true);
    const correct = quiz.questions.filter((q, i) => answers[i] === q.correct).length;
    const total = quiz.questions.length;
    const pct = Math.round(correct / total * 100);
    const scoreData = { score: correct, total, percentage: pct };
    try { await updateDoc(doc(db, "users", user.uid), { [`quizScores.${course.id}`]: scoreData }); } catch (e) {}
    setQuizScore(scoreData);
    notify(`${correct}/${total} зөв! (${pct}%)`, pct >= 60 ? "#10b981" : "#ef4444");
  };

  const downloadCert = async () => {
    let certId, issuedDate;
    // Аль хэдийн олгогдсон гэрчилгээ байгаа эсэхийг шалгах
    try {
      const existQuery = await getDocs(query(collection(db, "certificates"),
        where("userId", "==", user.uid),
        where("courseId", "==", course.id)));
      if (!existQuery.empty) {
        const existData = existQuery.docs[0].data();
        certId = existData.certId;
        issuedDate = existData.date;
      } else {
        certId = genCertId(user.uid, course.id);
        issuedDate = new Date().toLocaleDateString("mn-MN");
        const certData = {
          certId, userId: user.uid, courseId: course.id,
          name: profile?.name || "Суралцагч",
          courseTitle: course.title,
          teacherName: course.teacherName || "Багш",
          teacherId: course.teacherId || "",
          date: issuedDate,
          quizScore: quizScore ? quizScore.percentage : null,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, "certificates", certId), certData);
        // Хэрэглэгчийн document дотор гэрчилгээний жагсаалт нэмэх
        try {
          const ud = await getDoc(doc(db, "users", user.uid));
          const existing = ud.data()?.certificates || [];
          if (!existing.find(c => c.certId === certId)) {
            await updateDoc(doc(db, "users", user.uid), {
              certificates: [...existing, { certId, courseId: course.id, courseTitle: course.title, date: issuedDate, teacherName: course.teacherName || "Багш" }]
            });
          }
        } catch (e) {}
      }
    } catch (e) {
      certId = genCertId(user.uid, course.id);
      issuedDate = new Date().toLocaleDateString("mn-MN");
    }
    const verifyUrl = `https://edu-mn.com/?verify=${certId}`;
    const url = generateCertificate(profile?.name || "Суралцагч", course.title, course.teacherName || "Багш", issuedDate, certId, verifyUrl);
    const a = document.createElement("a"); a.href = url; a.download = `EduMN_${certId}.png`; a.click();
    notify("🎓 Гэрчилгээ татагдлаа!");
  };

  const shareUrl = `https://edu-mn.com`;

  return <div className="cd">
    <button className="btn btn-sm" style={{ background: "#f1f5f9", color: "#475569", marginBottom: 16 }} onClick={() => setPage("courses")}>← Буцах</button>

    {/* Header */}
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {cat && <span className="badge b-cat">{cat.icon} {cat.name}</span>}
          {sub && <span className="badge b-sub">{sub.icon} {sub.name}</span>}
          {level && <span className="badge" style={{ background: level.bg, color: level.color }}>{level.icon} {level.name}</span>}
          <span className={`badge ${course.isFree ? "b-free" : "b-paid"}`}>{course.isFree ? "Үнэгүй" : "Төлбөртэй"}</span>
          {course.liveUrl && <span className="live-badge">🔴 LIVE</span>}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>{course.title}</h1>
        <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: 14, fontSize: 15 }}>{course.description}</p>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#94a3b8", marginBottom: 14 }}>
          {course.lessonCount > 0 && <span>📹 {course.lessonCount} хичээл</span>}
          {course.viewCount > 0 && <span>👁 {course.viewCount.toLocaleString()} үзсэн</span>}
          {course.totalDuration && <span>⏱ {course.totalDuration}</span>}
        </div>
        {course.avgRating > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(course.avgRating) ? "#fbbf24" : "#cbd5e1", fontSize: 18 }}>★</span>)}
          <span style={{ fontWeight: 700 }}>{course.avgRating}</span>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>({course.reviewCount})</span>
        </div>}
        <div className="share-btns">
          <a className="share-btn share-fb" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">👍 Facebook</a>
          <a className="share-btn share-tw" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(course.title)}`} target="_blank" rel="noreferrer">🐦 Twitter</a>
          <button className="share-btn share-cp" onClick={() => { navigator.clipboard.writeText(shareUrl); notify("Линк хуулагдлаа!"); }}>🔗 Хуулах</button>
          <button className="share-btn share-cp" onClick={() => toggleBookmark?.(course.id)}>{bookmarks?.includes(course.id) ? "🔖 Хадгалсан" : "📌 Хадгалах"}</button>
        </div>
        {teacher && <div className="t-card" style={{ marginTop: 16 }}>
          <div className="av-lg">{teacher.photoUrl ? <img src={teacher.photoUrl} alt="" /> : (teacher.name?.[0] || "T")}</div>
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>{teacher.name}</div><div style={{ color: "#64748b", fontSize: 13 }}>{teacher.email}</div>{teacher.bio && <div style={{ fontSize: 14, marginTop: 4, color: "#475569" }}>{teacher.bio}</div>}</div>
        </div>}
      </div>
      {/* Price box */}
      <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", minWidth: 220, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#0ea5e9" }}>{course.isFree ? "Үнэгүй" : `${(course.price||0).toLocaleString()}₮`}</span>
          {course.originalPrice && !course.isFree && <span style={{ fontSize: 14, color: "#94a3b8", textDecoration: "line-through" }}>{course.originalPrice.toLocaleString()}₮</span>}
        </div>
        {!enrolled && role === "user" && <button className="btn btn-primary" style={{ width: "100%", padding: 13 }} onClick={enroll}>{course.isFree ? "Үнэгүй бүртгүүлэх" : "Худалдаж авах"}</button>}
        {enrolled && <div className="al al-ok" style={{ marginBottom: 0 }}>✅ Бүртгүүлсэн</div>}
        {enrolled && <div style={{ marginTop: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, textAlign: "left" }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: "#475569" }}>📋 Гэрчилгээний болзол:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: (lessons.length > 0 && completedLessons.length === lessons.length) ? "#10b981" : "#64748b", fontWeight: 600 }}>
              <span>{(lessons.length > 0 && completedLessons.length === lessons.length) ? "✅" : "⬜"} Бүх хичээл үзэх</span>
              <span style={{ fontSize: 11 }}>{completedLessons.length}/{lessons.length}</span>
            </div>
            {homeworks.length > 0 && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: submittedHomeworks.length >= homeworks.length ? "#10b981" : "#64748b", fontWeight: 600 }}>
              <span>{submittedHomeworks.length >= homeworks.length ? "✅" : "⬜"} Даалгавар илгээх</span>
              <span style={{ fontSize: 11 }}>{submittedHomeworks.length}/{homeworks.length}</span>
            </div>}
            {quiz && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: (quiz.mode === "google" ? (quizScore?.percentage >= 80) : (quizScore !== null && quizScore.percentage >= 60)) ? "#10b981" : "#64748b", fontWeight: 600 }}>
              <span>{(quiz.mode === "google" ? (quizScore?.percentage >= 80) : (quizScore !== null && quizScore.percentage >= 60)) ? "✅" : "⬜"} Шалгалт ({quiz.mode === "google" ? "80+" : "60+"} оноо)</span>
              <span style={{ fontSize: 11 }}>{quizScore?.percentage !== null && quizScore?.percentage !== undefined ? `${quizScore.percentage}%` : quizScore?.status === "pending" ? "⏳" : "—"}</span>
            </div>}
          </div>
          <div className="pw" style={{ marginTop: 10 }}><div className="pf" style={{ width: `${lessons.length > 0 ? completedLessons.length / lessons.length * 100 : 0}%` }} /></div>
        </div>}
        {completed && <button className="cert-btn" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={downloadCert}>🎓 Гэрчилгээ</button>}
        {!user && <button className="btn btn-primary" style={{ width: "100%", padding: 13 }} onClick={() => setShowLogin(true)}>Нэвтрэх</button>}
        {course.liveUrl && (enrolled || course.isFree) && <a href={course.liveUrl} target="_blank" rel="noreferrer" className="btn btn-danger" style={{ display: "block", marginTop: 10, padding: 12, textDecoration: "none", textAlign: "center" }}>🔴 Live нэвтрэх</a>}
      </div>
    </div>

    {/* Resume banner — сурагч сүүлд үзсэн хичээлээсээ үргэлжлүүлэх */}
    {enrolled && lastLessonId && selLesson && selLesson.id === lastLessonId && !completedLessons.includes(lastLessonId) && lessons.length > 1 && <div style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "1.5px solid #f59e0b", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 22 }}>⏯️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#78350f" }}>Үргэлжлүүлэх</div>
        <div style={{ fontSize: 12, color: "#92400e" }}>Та сүүлд "{selLesson.title}" хичээлийг үзэж байсан</div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => setDtab("content")}>▶ Үргэлжлүүлэх</button>
    </div>}

    {/* Tabs */}
    <div style={{ borderBottom: "2px solid #e2e8f0", marginBottom: 0, display: "flex", flexWrap: "wrap" }}>
      {[{ k: "intro", l: "Танилцуулга" }, { k: "video", l: `Хичээл (${lessons.length})` }, { k: "homework", l: `Даалгавар` }, { k: "quiz", l: "Шалгалт" }, { k: "notes", l: "Тэмдэглэл" }, { k: "review", l: `Сэтгэгдэл (${reviews.length})` }, { k: "files", l: "Татах" }].map(t =>
        <button key={t.k} onClick={() => setDtab(t.k)} style={{ padding: "12px 18px", border: "none", background: "none", cursor: "pointer", fontWeight: dtab === t.k ? 700 : 500, fontSize: 14, color: dtab === t.k ? "#0f172a" : "#94a3b8", borderBottom: dtab === t.k ? "3px solid #0ea5e9" : "3px solid transparent", fontFamily: "'Nunito Sans',sans-serif", marginBottom: -2, transition: "all 0.2s" }}>{t.l}</button>
      )}
    </div>

    {/* INTRO */}
    {dtab === "intro" && <div style={{ marginTop: 20 }}>
      <div className="vbox">{(activeYtId || course.videoStorageUrl) ? (activeYtId ? <iframe src={`https://www.youtube.com/embed/${activeYtId}`} allowFullScreen title={course.title} /> : <video src={course.videoStorageUrl} controls />) : <div className="vlock"><span style={{ fontSize: 36 }}>🎬</span><span style={{ color: "#94a3b8" }}>Танилцуулга видео</span></div>}</div>
      {lessons.length > 0 && <div className="panel" style={{ marginTop: 16 }}><div className="ph">Хичээлийн агуулга</div>
        {lessons.map((l, i) => <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ width: 24, height: 24, borderRadius: 8, background: "#0c4a6e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0ea5e9", flexShrink: 0 }}>{i + 1}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{l.title}</span>
          {l.duration && <span style={{ fontSize: 12, color: "#94a3b8" }}>⏱ {l.duration}</span>}
          {l.files?.length > 0 && <span style={{ fontSize: 12, color: "#3b82f6" }}>📎 {l.files.length}</span>}
        </div>)}
        <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setDtab("video")}>Хичээлүүд үзэх →</button>
      </div>}
    </div>}

    {/* VIDEO — Zangia layout */}
    {dtab === "video" && <div style={{ display: "flex", gap: 0, marginTop: 0, border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 16px 16px", overflow: "hidden", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 0, background: "#fff" }}>
        <div style={{ background: "#0c4a6e", aspectRatio: "16/9", position: "relative" }}>
          {selLesson ? (canWatch ? (
            ytId(selLesson.videoUrl) ? <iframe id={`yt-${selLesson.id}`} src={`https://www.youtube.com/embed/${ytId(selLesson.videoUrl)}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`} allowFullScreen title={selLesson.title} style={{ width: "100%", height: "100%", border: "none", position: "absolute", inset: 0 }} />
              : selLesson.videoStorageUrl ? <video src={selLesson.videoStorageUrl} controls onEnded={() => markDone(selLesson.id)} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />
                : <div className="vlock" style={{ position: "absolute", inset: 0 }}><span style={{ fontSize: 36 }}>🎬</span><span style={{ color: "#94a3b8" }}>Видео удахгүй</span></div>
          ) : <div className="vlock" style={{ position: "absolute", inset: 0 }}><span style={{ fontSize: 42 }}>🔒</span><span style={{ fontWeight: 700 }}>Бүртгүүлснийхээ дараа үзнэ</span><button className="btn btn-primary" onClick={enroll}>{course.isFree ? "Бүртгүүлэх" : "Авах"}</button></div>)
            : <div className="vlock" style={{ position: "absolute", inset: 0 }}><span>👈 Хичээл сонгоно уу</span></div>}
        </div>
        {selLesson && <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>{selLesson.title}</h3>
            {enrolled && !completedLessons.includes(selLesson.id) && <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <button className="btn btn-success btn-sm" onClick={() => markDone(selLesson.id)}>✓ Дүүргэсэн</button>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>📺 Видео дуустал автоматаар тэмдэглэгдэнэ</span>
            </div>}
            {completedLessons.includes(selLesson.id) && <span style={{ color: "#10b981", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>✅ Үзсэн</span>}
          </div>
          {selLesson.description && <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{selLesson.description}</p>}
          {selLesson.files?.length > 0 && <div style={{ marginTop: 14, padding: "12px 16px", background: "#f8fafc", borderRadius: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#475569" }}>📎 Материал:</div>
            {selLesson.files.map((f, fi) => <div key={fi} className="mat-item" style={{ marginLeft: 0 }}>
              <span style={{ fontSize: 18 }}>{f.type === "pdf" ? "📕" : f.type === "ppt" ? "📊" : "📘"}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{f.name}</span>
              {canWatch ? <a href={f.url} target="_blank" rel="noreferrer" className="btn btn-info btn-sm">⬇️</a> : <span style={{ fontSize: 11, color: "#94a3b8" }}>🔒</span>}
            </div>)}
          </div>}
        </div>}
      </div>
      {/* Lesson list */}
      <div style={{ width: 300, flexShrink: 0, borderLeft: "1px solid #e2e8f0", background: "#fafbfc", maxHeight: 540, overflowY: "auto" }}>
        <div className="lesson-item" onClick={() => setDtab("intro")} style={{ background: "#f0fdf4" }}>
          <div className="lesson-num" style={{ background: "#10b981", color: "#fff" }}>▶</div>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 13, color: "#047857" }}>Танилцуулга</div>
        </div>
        {lessons.map((l, i) => <div key={l.id} className={`lesson-item ${selLesson?.id === l.id ? "active" : ""} ${completedLessons.includes(l.id) ? "done" : ""}`} onClick={() => {
          setSelLesson(l);
          // Сүүлд үзсэн хичээлийг хадгалах
          if (user && role === "user" && enrolled) {
            updateDoc(doc(db, "users", user.uid), { [`lastLessons.${course.id}`]: l.id }).catch(() => {});
            setLastLessonId(l.id);
          }
        }}>
          <div className="lesson-num" style={{ background: completedLessons.includes(l.id) ? "#10b981" : selLesson?.id === l.id ? "#0ea5e9" : "#0c4a6e", color: "#fff" }}>
            {completedLessons.includes(l.id) ? "✓" : i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: selLesson?.id === l.id ? 700 : 500, fontSize: 13, color: selLesson?.id === l.id ? "#b45309" : "#1e293b" }}>{l.title}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
              {l.duration && <span style={{ fontSize: 11, color: "#94a3b8" }}>⏱ {l.duration}</span>}
              {l.files?.length > 0 && <span style={{ fontSize: 11, color: "#3b82f6" }}>📎 {l.files.length}</span>}
            </div>
          </div>
        </div>)}
      </div>
    </div>}

    {/* HOMEWORK */}
    {dtab === "homework" && <div className="panel" style={{ marginTop: 20 }}>
      <div className="ph">📝 Даалгавар</div>
      {homeworks.length === 0 ? <div className="empty"><div className="ei">📝</div><p>Даалгавар байхгүй</p></div>
        : homeworks.map(hw => <div key={hw.id} className="hw-item">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{hw.title}</div>
          <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{hw.description}</div>
          {hw.dueDate && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>⏰ Дуусах: {hw.dueDate}</div>}
          {canWatch && enrolled && <div style={{ marginTop: 12 }}>
            <textarea className="note-area" value={hwAnswers[hw.id] || ""} onChange={e => setHwAnswers(p => ({ ...p, [hw.id]: e.target.value }))} placeholder="Хариултаа бичнэ үү..." style={{ minHeight: 80 }} />
            <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => submitHw(hw.id)}>Илгээх</button>
          </div>}
        </div>)}
    </div>}

    {/* QUIZ */}
    {dtab === "quiz" && <div className="panel" style={{ marginTop: 20 }}>
      <div className="ph">📝 Шалгалт</div>
      {!quiz ? <div className="empty"><div className="ei">📝</div><p>Шалгалт байхгүй</p></div>
        : !canWatch ? <div className="al al-warn">🔒 Бүртгүүлнэ үү</div>
          : quiz.mode === "google" && quiz.googleFormUrl ? <>
            <div className="al al-info" style={{ marginBottom: 14 }}>📊 Энэ шалгалт Google Form ашиглан явагдана. Доорх форм дээр шалгалтаа өгөөд дараа нь "Шалгалтаа өгсөн" товчийг дарж багшаас үнэлгээ хүлээгээрэй.</div>
            <iframe src={quiz.googleFormUrl.replace("/viewform", "/viewform?embedded=true").replace(/\?.*$/, "") + "?embedded=true"} style={{ width: "100%", minHeight: 600, border: "2px solid #e2e8f0", borderRadius: 12, background: "#fff" }} title="Google Form шалгалт">Уншиж байна...</iframe>
            <div style={{ marginTop: 14, padding: "12px 14px", background: "#fff5f5", borderRadius: 10, border: "1px solid #fecaca" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#dc2626" }}>📋 Шалгалтаа дуусгасны дараа:</div>
              <a href={quiz.googleFormUrl} target="_blank" rel="noreferrer" className="btn btn-info btn-sm" style={{ marginRight: 8 }}>🔗 Шинэ цонхонд нээх</a>
              {(!quizScore) && <button className="btn btn-success btn-sm" onClick={async () => {
                if (!user) return;
                // Багшаас үнэлгээ хүлээж буй гэж тэмдэглэх
                const scoreData = { score: null, total: 100, percentage: null, mode: "google", status: "pending" };
                try { await updateDoc(doc(db, "users", user.uid), { [`quizScores.${course.id}`]: scoreData }); } catch {}
                setQuizScore(scoreData); setSubmitted(true); notify("✅ Багш үнэлгээ өгөх хүртэл хүлээнэ үү");
              }}>✓ Шалгалтаа өгсөн</button>}
              {quizScore && quizScore.status === "pending" && <div style={{ marginTop: 8, padding: 10, background: "#fef3c7", borderRadius: 8, fontSize: 13, color: "#78350f", fontWeight: 600 }}>⏳ Багш таны үнэлгээг хүлээж байна...</div>}
              {quizScore && quizScore.percentage !== null && <div style={{ marginTop: 8, padding: 12, background: quizScore.percentage >= 80 ? "#d1fae5" : "#fee2e2", borderRadius: 8, fontSize: 14, fontWeight: 700, color: quizScore.percentage >= 80 ? "#065f46" : "#991b1b" }}>
                {quizScore.percentage >= 80 ? "🎉" : "📝"} Багшийн өгсөн оноо: <span style={{ fontSize: 20 }}>{quizScore.percentage}/100</span>
                {quizScore.percentage >= 80 ? <div style={{ fontSize: 12, marginTop: 4, fontWeight: 500 }}>Гэрчилгээ авах эрхтэй боллоо!</div> : <div style={{ fontSize: 12, marginTop: 4, fontWeight: 500 }}>Гэрчилгээ авахын тулд 80+ оноо хэрэгтэй</div>}
              </div>}
            </div>
          </>
          : <>{quiz.questions?.map((q, i) => <div key={i} className="qq">
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>{i+1}-р асуулт</div>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>{q.question}</div>
            {q.options?.map((opt, j) => { let cls = "qo"; if (submitted) { if (j === q.correct) cls += " correct"; else if (answers[i] === j) cls += " wrong"; } else if (answers[i] === j) cls += " selected";
              return <div key={j} className={cls} onClick={() => !submitted && setAnswers({ ...answers, [i]: j })}>
                <span style={{ width: 22, height: 22, borderRadius: 7, border: "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{String.fromCharCode(65+j)}</span>{opt}
              </div>; })}
          </div>)}
          {!submitted && <button className="btn btn-primary" onClick={submitQuiz} disabled={Object.keys(answers).length < (quiz.questions?.length || 0)}>Илгээх</button>}
          {submitted && <div className="al al-ok">✅ Шалгалт дүүргэсэн!</div>}
          </>}
    </div>}

    {/* NOTES */}
    {dtab === "notes" && <div className="panel" style={{ marginTop: 20 }}>
      <div className="ph">📓 Тэмдэглэл</div>
      {!canWatch ? <div className="al al-warn">🔒 Бүртгүүлнэ үү</div> : <>
        <textarea className="note-area" value={note} onChange={e => setNote(e.target.value)} placeholder="Тэмдэглэлээ бичнэ үү..." />
        <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={saveNote}>💾 Хадгалах</button>
        <div style={{ marginTop: 16 }}>{notes.map((n, i) => <div key={i} className="note-item"><div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>📍 {n.lesson} · {n.time}</div>{n.text}</div>)}</div>
      </>}
    </div>}

    {/* REVIEW */}
    {dtab === "review" && <div className="panel" style={{ marginTop: 20 }}>
      <div className="ph">⭐ Сэтгэгдэл</div>
      {enrolled && <div style={{ background: "#f8fafc", borderRadius: 14, padding: 18, marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Үнэлгээ өгөх:</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>{[1,2,3,4,5].map(i => <span key={i} className={`sr ${myRating >= i ? "on" : ""}`} onClick={() => setMyRating(i)}>★</span>)}</div>
        <textarea className="note-area" value={myComment} onChange={e => setMyComment(e.target.value)} placeholder="Сэтгэгдэл бичнэ үү..." style={{ minHeight: 72 }} />
        <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={submitReview}>Илгээх</button>
      </div>}
      {reviews.length === 0 ? <div className="empty"><div className="ei">⭐</div><p>Сэтгэгдэл байхгүй</p></div>
        : reviews.map(r => <div key={r.id} className="rev-item">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 14 }}>{r.userName?.[0]}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{r.userName}</div><div>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= r.rating ? "#fbbf24" : "#cbd5e1", fontSize: 14 }}>★</span>)}</div></div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.createdAt?.toDate?.()?.toLocaleDateString("mn-MN")}</div>
          </div>
          {r.comment && <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>{r.comment}</p>}
        </div>)}
    </div>}

    {/* FILES */}
    {dtab === "files" && <div style={{ marginTop: 20 }}>
      {lessons.filter(l => l.files?.length > 0).length > 0 && <div className="panel" style={{ marginBottom: 14 }}>
        <div className="ph">📎 Хичээлийн материал</div>
        {lessons.filter(l => l.files?.length > 0).map((l, i) => <div key={l.id} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{i+1}</span>{l.title}
          </div>
          {l.files.map((f, fi) => <div key={fi} className="mat-item" style={{ marginLeft: 30 }}>
            <span style={{ fontSize: 18 }}>{f.type === "pdf" ? "📕" : f.type === "ppt" ? "📊" : "📘"}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{f.name}</span>
            {canWatch ? <a href={f.url} target="_blank" rel="noreferrer" className="btn btn-info btn-sm">⬇️ Татах</a> : <span style={{ fontSize: 11, color: "#94a3b8" }}>🔒</span>}
          </div>)}
        </div>)}
      </div>}
      <div className="panel"><div className="ph">📄 Ерөнхий материал</div>
        {materials.length === 0 ? <div className="empty"><div className="ei">📭</div><p>Материал байхгүй</p></div>
          : materials.map(m => <div key={m.id} className="mat-item">
            <span style={{ fontSize: 18 }}>{m.type === "pdf" ? "📕" : m.type === "ppt" ? "📊" : "📘"}</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{m.name}</span>
            {canWatch ? <a href={m.url} target="_blank" rel="noreferrer" className="btn btn-info btn-sm">⬇️ Татах</a> : <span style={{ fontSize: 12, color: "#94a3b8" }}>🔒</span>}
          </div>)}
      </div>
    </div>}

    {/* PAYMENT */}
    {showPay && <div className="mo" onClick={e => { if (e.target === e.currentTarget) setShowPay(false); }}>
      <div className="md">
        <h2>💳 Төлбөр</h2>
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: 16, marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{course.title}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9" }}>{(course.price||0).toLocaleString()}₮</span>
            {course.originalPrice && <span style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>{course.originalPrice.toLocaleString()}₮</span>}
          </div>
        </div>
        <div className="al al-info">📱 QPay апп нээгээд QR уншуулна уу<br/>🏦 Шилжүүлэг: 9903-3062<br/>📞 Лавлах: 9903-3062</div>
        <button className="btn btn-success" style={{ width: "100%", padding: 13 }} onClick={() => { enroll(); setShowPay(false); }}>✓ Төлбөр хийлээ</button>
        <button className="btn btn-sm" style={{ width: "100%", marginTop: 8, background: "#f1f5f9", color: "#64748b" }} onClick={() => setShowPay(false)}>Болих</button>
      </div>
    </div>}
  </div>;
}

// ===================== MISC PAGES =====================
function BookmarksPage({ courses, bookmarks, goTo, toggleBookmark }) {
  const saved = courses.filter(c => bookmarks?.includes(c.id));
  return <div className="sec"><div className="sec-title">📌 Хадгалсан</div>
    {saved.length === 0 ? <div className="empty"><div className="ei">📌</div><p>Хадгалсан сургалт байхгүй</p></div>
      : <div className="grid">{saved.map(c => <CourseCard key={c.id} course={c} onClick={() => goTo(c)} bookmarks={bookmarks} toggleBookmark={toggleBookmark} />)}</div>}
  </div>;
}

function NewsPage({ news }) {
  return <div className="sec"><div className="sec-title">📰 Мэдээ</div>
    {news.length === 0 ? <div className="empty"><div className="ei">📭</div><p>Мэдээ байхгүй</p></div>
      : news.map(n => <div key={n.id} className="news-card"><h3 style={{ fontWeight: 700, fontSize: 18 }}>{n.title}</h3><p style={{ marginTop: 8, color: "#64748b", lineHeight: 1.7, fontSize: 14 }}>{n.content}</p><div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>{n.createdAt?.toDate?.()?.toLocaleDateString("mn-MN") || ""}</div></div>)}
  </div>;
}

function ProfilePage({ user, profile, courses, notify }) {
  const [enrolled, setEnrolled] = useState([]); const [completedMap, setCompletedMap] = useState({});
  useEffect(() => { if (!user?.uid) return; getDoc(doc(db, "users", user.uid)).then(d => { if (d.exists()) { setEnrolled(courses.filter(c => (d.data().enrolledCourses||[]).includes(c.id))); setCompletedMap(d.data().completedLessons||{}); } }); }, [user, courses]);
  const downloadCert = async c => {
    let certId, issuedDate;
    try {
      const existQuery = await getDocs(query(collection(db, "certificates"),
        where("userId", "==", user.uid), where("courseId", "==", c.id)));
      if (!existQuery.empty) {
        const ed = existQuery.docs[0].data();
        certId = ed.certId; issuedDate = ed.date;
      } else {
        certId = genCertId(user.uid, c.id);
        issuedDate = new Date().toLocaleDateString("mn-MN");
        await setDoc(doc(db, "certificates", certId), {
          certId, userId: user.uid, courseId: c.id,
          name: profile?.name || "Суралцагч", courseTitle: c.title,
          teacherName: c.teacherName || "Багш", date: issuedDate, createdAt: serverTimestamp()
        });
      }
    } catch { certId = genCertId(user.uid, c.id); issuedDate = new Date().toLocaleDateString("mn-MN"); }
    const verifyUrl = `https://edu-mn.com/?verify=${certId}`;
    const url = generateCertificate(profile?.name||"Суралцагч", c.title, c.teacherName||"Багш", issuedDate, certId, verifyUrl);
    const a = document.createElement("a"); a.href = url; a.download = `EduMN_${certId}.png`; a.click();
    notify("🎓 Гэрчилгээ татагдлаа!");
  };
  return <div className="sec"><div className="sec-title">👤 Профайл</div>
    <div className="ps" style={{ marginBottom: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#0ea5e9,#0284c7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 auto 12px" }}>{profile?.name?.[0]||"U"}</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.name}</div>
        <div style={{ fontSize: 14, color: "#64748b" }}>{profile?.email}</div>
      </div>
    </div>
    <div className="sec-title" style={{ fontSize: 20 }}>📚 Миний сургалтууд ({enrolled.length})</div>
    {enrolled.length === 0 ? <div className="empty"><div className="ei">📭</div><p>Сургалт байхгүй</p></div>
      : <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        {enrolled.map(c => { const cl = completedMap[c.id]||[];
          return <div key={c.id} style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 36 }}>{getCat(c.category)?.icon||"📚"}</span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.title}</div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{c.teacherName}</div><div className="pw"><div className="pf" style={{ width: `${cl.length > 0 ? 70 : 0}%` }} /></div></div>
            {cl.length >= 1 && <button className="cert-btn" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => downloadCert(c)}>🎓</button>}
          </div>; })}
      </div>}
  </div>;
}

function VerifyPage({ setPage }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState(window.verifyId || "");

  const lookup = async (id) => {
    if (!id) { setLoading(false); return; }
    setLoading(true); setCert(null);
    try {
      const d = await getDoc(doc(db, "certificates", id.trim().toUpperCase()));
      if (d.exists()) setCert(d.data());
      else setCert({ notFound: true });
    } catch { setCert({ notFound: true }); }
    setLoading(false);
  };

  useEffect(() => { if (window.verifyId) lookup(window.verifyId); else setLoading(false); }, []);

  return <div className="sec" style={{ maxWidth: 720 }}>
    <button className="btn btn-sm" style={{ background: "#f1f5f9", color: "#475569", marginBottom: 16 }} onClick={() => { setPage("home"); window.history.replaceState({}, "", "/edumn/"); }}>← Нүүр хуудас</button>
    <div className="sec-title">🔍 Гэрчилгээний баталгаажуулалт</div>
    <div className="sec-sub">Дугаараар эсвэл QR код уншуулж шалгана уу</div>

    <div className="panel" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={searchId} onChange={e => setSearchId(e.target.value)} placeholder="EDU-XXXX-XXXX" style={{ flex: 1, padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15, fontFamily: "monospace", textTransform: "uppercase" }} onKeyDown={e => e.key === "Enter" && lookup(searchId)} />
        <button className="btn btn-primary" onClick={() => lookup(searchId)}>Шалгах</button>
      </div>
    </div>

    {loading && <div style={{ textAlign: "center", padding: 40 }}><div className="spin" style={{ width: 36, height: 36, margin: "0 auto" }} /></div>}

    {!loading && cert && cert.notFound && (
      <div className="panel" style={{ textAlign: "center", padding: 40, borderLeft: "4px solid #ef4444" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Гэрчилгээ олдсонгүй</div>
        <div style={{ color: "#64748b", fontSize: 14 }}>Энэ дугаартай гэрчилгээ EduMN системд бүртгэгдээгүй байна.</div>
      </div>
    )}

    {!loading && cert && !cert.notFound && (
      <div className="panel" style={{ borderLeft: "4px solid #10b981" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 36 }}>✅</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>Жинхэнэ гэрчилгээ</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>EduMN системд бүртгэгдсэн</div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Гэрчилгээний дугаар</div>
            <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 700, color: "#0ea5e9" }}>{cert.certId}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Эзэмшигч</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{cert.name}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Сургалт</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{cert.courseTitle}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Багш</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>{cert.teacherName}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Огноо</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>{cert.date}</div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>;
}

function ContactPage() {
  return <div className="sec" style={{ maxWidth: 540 }}><div className="sec-title">📞 Холбоо барих</div>
    <div className="panel"><div style={{ fontSize: 15, lineHeight: 2.4 }}>
      <div>📞 Утас: <a href="tel:99033062" style={{ color: "#0ea5e9", fontWeight: 700, textDecoration: "none" }}>9903-3062</a></div>
      <div>✉️ Имэйл: <a href="mailto:contact@edumn.mn" style={{ color: "#0ea5e9", fontWeight: 700, textDecoration: "none" }}>contact@edumn.mn</a></div>
      <div>🌐 Вэб: <a href="https://edu-mn.com" target="_blank" rel="noreferrer" style={{ color: "#0ea5e9", fontWeight: 700, textDecoration: "none" }}>edu-mn.com</a></div>
      <div>📍 Улаанбаатар, Монгол</div>
    </div></div>
  </div>;
}

// ===================== TEACHER PAGE =====================
function GradeStudent({ student, course, notify }) {
  const [score, setScore] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    const n = parseInt(score);
    if (isNaN(n) || n < 0 || n > 100) { notify("0-100 хооронд тоо оруулна уу", "#ef4444"); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", student.id), {
        [`quizScores.${course.id}`]: { score: n, total: 100, percentage: n, mode: "google", status: "graded", gradedAt: new Date().toISOString() }
      });
      notify(`✅ ${student.name}-д ${n} оноо өглөө!`);
      setScore("");
    } catch (e) { notify("Алдаа: " + e.message, "#ef4444"); }
    setSaving(false);
  };
  return <div style={{display:"flex",alignItems:"center",gap:6,background:"#fef3c7",padding:"6px 10px",borderRadius:8,border:"1px solid #fbbf24"}}>
    <span style={{fontSize:11,fontWeight:700,color:"#78350f"}}>⏳ Үнэлгээ:</span>
    <input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} placeholder="0-100" style={{width:60,padding:"4px 8px",border:"1px solid #fbbf24",borderRadius:6,fontSize:13,fontFamily:"inherit",outline:"none"}} />
    <button className="btn btn-success btn-sm" style={{padding:"4px 10px",fontSize:11}} onClick={submit} disabled={saving || !score}>{saving ? "..." : "Хадгалах"}</button>
  </div>;
}

function TeacherPage({ user, profile, courses, teachers, notify, setProfile, initialTab, setTeacherTabNav }) {
  const [tab, setTab] = useState(initialTab || "courses");
  const [myStudents, setMyStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const mine = courses.filter(c => c.teacherId === user?.uid);

  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);
  useEffect(() => { return onSnapshot(query(collection(db, "users"), where("role", "==", "user")), s => setAllUsers(s.docs.map(d => ({id: d.id, ...d.data()})))); }, []);
  useEffect(() => { return onSnapshot(query(collection(db, "users"), where("myTeacherId", "==", user?.uid)), s => setMyStudents(s.docs.map(d => ({id: d.id, ...d.data()})))); }, [user]);

  const addStudent = async uid => {
    await updateDoc(doc(db, "users", uid), { myTeacherId: user.uid, myTeacherName: profile?.name || "" });
    notify("✅ Сурагч нэмэгдлээ!");
    setStudentSearch("");
  };
  const removeStudent = async uid => {
    if (!window.confirm("Сурагчийг жагсаалтаас хасах уу?")) return;
    await updateDoc(doc(db, "users", uid), { myTeacherId: "", myTeacherName: "" });
    notify("Сурагч хасагдлаа");
  };
  const filteredUsers = studentSearch.length > 1
    ? allUsers.filter(u => !myStudents.find(s => s.id === u.id) && (u.name?.toLowerCase().includes(studentSearch.toLowerCase()) || u.email?.toLowerCase().includes(studentSearch.toLowerCase())))
    : [];
  const [showAdd, setShowAdd] = useState(false);
  const [cf, setCf] = useState({ title: "", desc: "", courseType: "regular", cat: "computer", sub: "", grade: "", level: "beginner", free: true, price: "", originalPrice: "", vtype: "youtube", vurl: "", liveUrl: "" });
  const [vFile, setVFile] = useState(null); const [vProg, setVProg] = useState(0); const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(profile?.photoUrl || ""); const [photob64, setPhotob64] = useState(null); const [bio, setBio] = useState(profile?.bio || "");
  const [lessonCourse, setLessonCourse] = useState(null); const [lessons, setLessons] = useState([]);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editLessonId, setEditLessonId] = useState(null);
  const [lf, setLf] = useState({ title: "", desc: "", duration: "", vtype: "youtube", vurl: "" });
  const [lvFile, setLvFile] = useState(null); const [lvProg, setLvProg] = useState(0); const [lessonFiles, setLessonFiles] = useState([]);
  const [matCourse, setMatCourse] = useState(null); const [materials, setMaterials] = useState([]);
  const [matFile, setMatFile] = useState(null); const [matName, setMatName] = useState(""); const [matProg, setMatProg] = useState(0); const [matUrl, setMatUrl] = useState("");
  const [quizCourse, setQuizCourse] = useState(null); const [quiz, setQuiz] = useState({ questions: [{ question: "", options: ["", "", "", ""], correct: 0 }] }); const [quizMode, setQuizMode] = useState("form");
  const [hwCourse, setHwCourse] = useState(null); const [homeworks, setHomeworks] = useState([]); const [hwf, setHwf] = useState({ title: "", description: "", dueDate: "" });
  const [orders, setOrders] = useState([]);
  const catInfo = CATS.find(c => c.id === cf.cat);

  useEffect(() => { if (!user || mine.length === 0) return; return onSnapshot(query(collection(db, "orders"), where("courseId", "in", mine.length > 0 ? mine.map(c => c.id) : ["none"])), s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })))); }, [user, mine.length]);
  useEffect(() => { if (!lessonCourse) return; return onSnapshot(query(collection(db, "courses", lessonCourse, "lessons"), orderBy("order")), s => setLessons(s.docs.map(d => ({ id: d.id, ...d.data() })))); }, [lessonCourse]);
  useEffect(() => { if (!matCourse) return; return onSnapshot(query(collection(db, "courses", matCourse, "materials"), orderBy("createdAt", "desc")), s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() })))); }, [matCourse]);
  useEffect(() => { if (!quizCourse) return; getDoc(doc(db, "courses", quizCourse, "quiz", "main")).then(d => { if (d.exists()) setQuiz(d.data()); else setQuiz({ questions: [{ question: "", options: ["", "", "", ""], correct: 0 }] }); }); }, [quizCourse]);
  useEffect(() => { if (!hwCourse) return; return onSnapshot(query(collection(db, "courses", hwCourse, "homeworks"), orderBy("createdAt", "desc")), s => setHomeworks(s.docs.map(d => ({ id: d.id, ...d.data() })))); }, [hwCourse]);

  const [editLastName, setEditLastName] = useState(profile?.lastName || "");
  const [editFirstName, setEditFirstName] = useState(profile?.firstName || "");
  const [bankName, setBankName] = useState(profile?.bankName || "");
  const [bankAccount, setBankAccount] = useState(profile?.bankAccount || "");
  const [bankOwner, setBankOwner] = useState(profile?.bankOwner || "");
  const [qrPreview, setQrPreview] = useState(profile?.qrCode || "");
  const isMongolian = str => /^[\u0400-\u04FF\s\-]+$/.test(str.trim());
  const onPhoto = e => { const f = e.target.files[0]; if (!f) return; if (f.size > 500*1024) { notify("Зураг 500KB хүртэл", "#ef4444"); return; } const r = new FileReader(); r.onload = ev => { setPhotoPreview(ev.target.result); setPhotob64(ev.target.result); }; r.readAsDataURL(f); };
  const saveProfile = async () => {
    if (!editLastName || !editFirstName) { notify("Овог нэр бөглөнө үү", "#ef4444"); return; }
    if (!isMongolian(editLastName) || !isMongolian(editFirstName)) { notify("Овог нэрийг монгол үсгээр бичнэ үү", "#ef4444"); return; }
    const fullName = editLastName + "." + editFirstName;
    const u = { bio, lastName: editLastName, firstName: editFirstName, name: fullName, bankName, bankAccount, bankOwner };
    if (photob64) u.photoUrl = photob64;
    if (qrPreview) u.qrCode = qrPreview;
    await updateDoc(doc(db, "users", user.uid), u);
    setProfile({ ...profile, ...u });
    notify("Профайл хадгалагдлаа!");
  };

  const addCourse = async () => {
    if (!cf.title || !cf.desc) { notify("Гарчиг, тайлбар бөглөнө үү", "#ef4444"); return; }
    if (cf.courseType === "edu" && !cf.grade) { notify("Ангийн дугаар сонгоно уу", "#ef4444"); return; }
    if (cf.courseType === "edu" && !cf.sub) { notify("Хичээлийн сэдэв сонгоно уу", "#ef4444"); return; }
    setUploading(true);
    let videoStorageUrl = "";
    const isEdu = cf.courseType === "edu";
    const finalCat = isEdu ? "general" : cf.cat;
    const finalSub = isEdu ? cf.sub : cf.sub;
    const finalLevel = isEdu ? "" : cf.level;
    try {
      if (cf.vtype === "file" && vFile) { try { videoStorageUrl = await uploadFile(vFile, `videos/${user.uid}/${Date.now()}_${vFile.name}`, setVProg); } catch { notify("Видео файл байршуулж чадсангүй", "#ef4444"); setUploading(false); return; } }
      await setDoc(doc(collection(db, "courses")), { title: cf.title, description: cf.desc, courseType: cf.courseType, category: finalCat, subCategory: finalSub, grade: isEdu ? cf.grade : "", level: finalLevel, isFree: cf.free, price: cf.free ? 0 : Number(cf.price), originalPrice: cf.originalPrice ? Number(cf.originalPrice) : null, videoUrl: cf.vtype === "youtube" ? cf.vurl : "", videoStorageUrl, liveUrl: cf.liveUrl, teacherId: user.uid, teacherName: profile?.name || "", teacherPhoto: profile?.photoUrl || "", avgRating: 0, reviewCount: 0, viewCount: 0, enrolledCount: 0, lessonCount: 0, totalDuration: "", createdAt: serverTimestamp() });
      setCf({ title: "", desc: "", courseType: "regular", cat: "computer", sub: "", grade: "", level: "beginner", free: true, price: "", originalPrice: "", vtype: "youtube", vurl: "", liveUrl: "" }); setVFile(null); setVProg(0); setShowAdd(false); notify("Сургалт нэмэгдлээ!");
    } catch (e) { notify("Алдаа: " + e.message, "#ef4444"); }
    setUploading(false);
  };

  const addLesson = async () => {
    if (!lf.title || !lessonCourse) { notify("Гарчиг бөглөнө үү", "#ef4444"); return; }
    setUploading(true);
    try {
      // Эхлээд одоогийн хичээлийн өгөгдлийг авна (засах горимд бол)
      const existing = editLessonId ? lessons.find(l => l.id === editLessonId) : null;
      let videoStorageUrl = existing?.videoStorageUrl || "";
      // Видео файл шинээр сонгосон бол байршуулна
      if (lf.vtype === "file" && lvFile) {
        try { videoStorageUrl = await uploadFile(lvFile, `lessons/${lessonCourse}/${Date.now()}_${lvFile.name}`, setLvProg); }
        catch { notify("Видео байршуулж чадсангүй", "#ef4444"); setUploading(false); return; }
      }
      // YouTube горим руу шилжсэн бол хуучин файлын линкийг арилгана
      if (lf.vtype === "youtube" && !lvFile) {
        videoStorageUrl = "";
      }
      // Шинэ файлууд нэмэх (хуучныг үлдээнэ)
      const uploadedFiles = existing?.files ? [...existing.files] : [];
      for (const lfile of lessonFiles) {
        try {
          const ext = lfile.name.split(".").pop().toLowerCase();
          const type = ext === "pdf" ? "pdf" : ["ppt","pptx"].includes(ext) ? "ppt" : ["doc","docx"].includes(ext) ? "doc" : "file";
          const url = await uploadFile(lfile, `lesson-files/${lessonCourse}/${Date.now()}_${lfile.name}`, () => {});
          uploadedFiles.push({ name: lfile.name, url, type });
        } catch { notify(`${lfile.name} алдаа`, "#f59e0b"); }
      }
      const lessonData = {
        title: lf.title, description: lf.desc, duration: lf.duration,
        videoUrl: lf.vtype === "youtube" ? lf.vurl : "",
        videoStorageUrl, files: uploadedFiles
      };
      if (editLessonId) {
        // Засах: одоо байгаа document-ийг update хийнэ (сурагчдын progress-ыг хадгална)
        await updateDoc(doc(db, "courses", lessonCourse, "lessons", editLessonId), { ...lessonData, updatedAt: serverTimestamp() });
        notify("✅ Хичээл шинэчлэгдлээ!");
      } else {
        // Шинэ хичээл нэмэх
        await setDoc(doc(collection(db, "courses", lessonCourse, "lessons")), { ...lessonData, order: lessons.length + 1, createdAt: serverTimestamp() });
        notify("Хичээл нэмэгдлээ! ✅");
      }
      setLf({ title: "", desc: "", duration: "", vtype: "youtube", vurl: "" });
      setLvFile(null); setLvProg(0); setLessonFiles([]); setShowAddLesson(false); setEditLessonId(null);
    } catch (e) { notify("Алдаа: " + e.message, "#ef4444"); }
    setUploading(false);
  };

  // Засах товч дарагдсан үед form-г одоогийн утгуудаар дүүргэнэ
  const startEditLesson = (l) => {
    setEditLessonId(l.id);
    setLf({
      title: l.title || "",
      desc: l.description || "",
      duration: l.duration || "",
      vtype: l.videoUrl ? "youtube" : (l.videoStorageUrl ? "file" : "youtube"),
      vurl: l.videoUrl || ""
    });
    setLvFile(null); setLessonFiles([]);
    setShowAddLesson(true);
    // Form руу scroll хийх
    setTimeout(() => { window.scrollTo({ top: 200, behavior: "smooth" }); }, 100);
  };

  const cancelEditLesson = () => {
    setEditLessonId(null);
    setLf({ title: "", desc: "", duration: "", vtype: "youtube", vurl: "" });
    setLvFile(null); setLessonFiles([]); setShowAddLesson(false);
  };

  // Тухайн хичээлээс нэг файлыг устгах (бүх хичээлийг устгахгүйгээр)
  const removeLessonFile = async (lessonId, fileIndex) => {
    if (!window.confirm("Энэ файлыг устгах уу?")) return;
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    const newFiles = (lesson.files || []).filter((_, i) => i !== fileIndex);
    await updateDoc(doc(db, "courses", lessonCourse, "lessons", lessonId), { files: newFiles });
    notify("Файл устгагдлаа");
  };

  const addMat = async () => {
    if (!matName || !matCourse) { notify("Нэр бөглөнө үү", "#ef4444"); return; }
    if (!matFile && !matUrl) { notify("Файл эсвэл линк оруулна уу", "#ef4444"); return; }
    setUploading(true);
    try {
      let url = matUrl; let type = "link";
      if (matFile) {
        const ext = matFile.name.split(".").pop().toLowerCase();
        type = ext === "pdf" ? "pdf" : ["ppt","pptx"].includes(ext) ? "ppt" : ["doc","docx"].includes(ext) ? "doc" : "file";
        // Файлын хэмжээ шалгана — 25MB-аас их бол Drive линк ашиглахыг хүснэ
        if (matFile.size > 25 * 1024 * 1024) {
          notify("⚠️ Файл 25MB-аас их байна. Google Drive линк ашиглана уу.", "#ef4444");
          setUploading(false); return;
        }
        try {
          url = await uploadFile(matFile, `materials/${matCourse}/${Date.now()}_${matFile.name}`, setMatProg);
        } catch (uploadErr) {
          notify("⚠️ Файл байршуулж чадсангүй. Google Drive-д хуулаад линкийг доорх талбарт оруулна уу.", "#ef4444");
          setUploading(false); return;
        }
      }
      await setDoc(doc(collection(db, "courses", matCourse, "materials")), { name: matName, url, type, createdAt: serverTimestamp() });
      setMatFile(null); setMatName(""); setMatUrl(""); setMatProg(0); notify("✅ Материал нэмэгдлээ!");
    } catch (e) { notify("Алдаа: " + e.message, "#ef4444"); }
    setUploading(false);
  };

  const saveQuiz = async () => {
    if (!quizCourse) return;
    // Google Form mode — зөвхөн линкийг шалгана
    if (quizMode === "google") {
      if (!quiz.googleFormUrl) { notify("Google Form линкээ оруулна уу", "#ef4444"); return; }
      await setDoc(doc(db, "courses", quizCourse, "quiz", "main"), { mode: "google", googleFormUrl: quiz.googleFormUrl });
      notify("Google Form линк хадгалагдлаа!");
      return;
    }
    // Form mode — асуулт талбаруудыг шалгана
    if (!quiz.questions || !quiz.questions.length) { notify("Хамгийн багадаа 1 асуулт нэмнэ үү", "#ef4444"); return; }
    if (!quiz.questions.every(q => q.question && q.options.every(o => o))) { notify("Бүх талбар бөглөнө үү", "#ef4444"); return; }
    await setDoc(doc(db, "courses", quizCourse, "quiz", "main"), { mode: "form", questions: quiz.questions });
    notify("Шалгалт хадгалагдлаа!");
  };
  const addHw = async () => { if (!hwCourse || !hwf.title) { notify("Гарчиг бөглөнө үү", "#ef4444"); return; } await setDoc(doc(collection(db, "courses", hwCourse, "homeworks")), { ...hwf, teacherId: user.uid, createdAt: serverTimestamp() }); setHwf({ title: "", description: "", dueDate: "" }); notify("Даалгавар нэмэгдлээ!"); };
  const addQ = () => setQuiz({ ...quiz, questions: [...quiz.questions, { question: "", options: ["", "", "", ""], correct: 0 }] });
  const remQ = i => setQuiz({ ...quiz, questions: quiz.questions.filter((_, j) => j !== i) });
  const updQ = (i, k, v) => { const q = [...quiz.questions]; q[i] = { ...q[i], [k]: v }; setQuiz({ ...quiz, questions: q }); };
  const updO = (qi, oi, v) => { const q = [...quiz.questions]; q[qi].options[oi] = v; setQuiz({ ...quiz, questions: q }); };
  const totalRevenue = orders.filter(o => o.status === "paid").reduce((s, o) => s + (o.amount || 0), 0);

  return <div className="sec">
    <div className="sec-title">🎓 Багшийн самбар</div>
    {(() => {
      const pendingGrading = myStudents.reduce((acc, s) => {
        const myCs = mine.filter(c => (s.enrolledCourses||[]).includes(c.id));
        myCs.forEach(c => { if ((s.quizScores||{})[c.id]?.status === "pending") acc.push({ student: s, course: c }); });
        return acc;
      }, []);
      return pendingGrading.length > 0 ? <div onClick={() => setTab("students")} style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "1.5px solid #f59e0b", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <span style={{ fontSize: 22 }}>⏳</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#78350f" }}>{pendingGrading.length} сурагч таны үнэлгээг хүлээж байна</div>
          <div style={{ fontSize: 12, color: "#92400e" }}>"Сурагчид" таб руу орж оноо өгнө үү</div>
        </div>
        <span style={{ fontSize: 13, color: "#78350f", fontWeight: 700 }}>→</span>
      </div> : null;
    })()}
    <div className="stat-grid">
      <div className="stat-card"><div className="sv">{mine.length}</div><div className="sl">Нийт сургалт</div></div>
      <div className="stat-card"><div className="sv">{myStudents.length}</div><div className="sl">Суралцагч</div></div>
      <div className="stat-card"><div className="sv">{totalRevenue.toLocaleString()}₮</div><div className="sl">Орлого</div></div>
      <div className="stat-card"><div className="sv">{mine.reduce((s, c) => s + (c.reviewCount || 0), 0)}</div><div className="sl">Сэтгэгдэл</div></div>
    </div>
    <div className="tabs">
      {[["courses","Сургалт"],["lessons","Хичээл"],["mat","Материал"],["homework","Даалгавар"],["quiz","Шалгалт"],["orders","Захиалга"],["students","Сурагчид"],["profile","Профайл"]].map(([t, l]) => <div key={t} className={`tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{l}{t==="students"&&myStudents.length>0&&<span style={{background:"#0ea5e9",color:"#fff",borderRadius:"99px",padding:"1px 6px",fontSize:9,marginLeft:4}}>{myStudents.length}</span>}</div>)}
    </div>

    {tab === "courses" && <div className="panel">
      <div className="ph">Миний сургалтууд ({mine.length}) <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Нэмэх</button></div>
      {showAdd && <div style={{ background: "#f8fafc", borderRadius: 14, padding: 18, marginBottom: 18, border: "1px solid #e2e8f0" }}>
        {/* Step 1: Course type selector */}
        <div className="fg">
          <label style={{fontWeight:700,fontSize:14,marginBottom:8,display:"block"}}>📌 Хичээлийн төрөл сонгох</label>
          <div style={{display:"flex",gap:10}}>
            <div onClick={()=>setCf({...cf,courseType:"edu",cat:"general",grade:"",sub:"",level:""})} style={{flex:1,padding:"14px 16px",borderRadius:12,border:`2px solid ${cf.courseType==="edu"?"#6366f1":"#e2e8f0"}`,background:cf.courseType==="edu"?"#f0f0ff":"#fff",cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{fontSize:24,marginBottom:4}}>📚</div>
              <div style={{fontWeight:700,fontSize:13,color:cf.courseType==="edu"?"#4f46e5":"#1e293b"}}>Ерөнхий боловсрол</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>ЕБС 1-12-р анги · сэдвээр</div>
            </div>
            <div onClick={()=>setCf({...cf,courseType:"regular",cat:"computer",grade:"",sub:"",level:"beginner"})} style={{flex:1,padding:"14px 16px",borderRadius:12,border:`2px solid ${cf.courseType==="regular"?"#0ea5e9":"#e2e8f0"}`,background:cf.courseType==="regular"?"#f0f9ff":"#fff",cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{fontSize:24,marginBottom:4}}>🎓</div>
              <div style={{fontWeight:700,fontSize:13,color:cf.courseType==="regular"?"#0284c7":"#1e293b"}}>Ердийн хичээл</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Насан хүрэгчид · бүх хүнд</div>
            </div>
          </div>
        </div>

        {/* EBS fields */}
        {cf.courseType === "edu" && <div style={{background:"#f0f0ff",borderRadius:12,padding:"14px 16px",marginBottom:12,border:"1px solid #c7d2fe"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#4f46e5",marginBottom:10}}>📚 Ерөнхий боловсролын мэдээлэл</div>
          <div className="fg-row">
            <div className="fg">
              <label>Анги</label>
              <select value={cf.grade} onChange={e=>setCf({...cf,grade:e.target.value})}>
                <option value="">-- Анги сонгох --</option>
                {GRADE_GROUPS.map(g=><optgroup key={g.label} label={g.label}>{g.grades.map(gr=><option key={gr} value={gr}>{gr}-р анги</option>)}</optgroup>)}
              </select>
            </div>
            <div className="fg">
              <label>Хичээлийн сэдэв</label>
              <select value={cf.sub} onChange={e=>setCf({...cf,sub:e.target.value})}>
                <option value="">-- Сэдэв сонгох --</option>
                {EBS_SUBJECTS.map(s=><option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
          </div>
        </div>}

        {/* Regular course fields */}
        {cf.courseType === "regular" && <div style={{background:"#f0f9ff",borderRadius:12,padding:"14px 16px",marginBottom:12,border:"1px solid #bae6fd"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0284c7",marginBottom:10}}>🎓 Хичээлийн ангилал</div>
          <div className="fg-row">
            <div className="fg">
              <label>Ангилал</label>
              <select value={cf.cat} onChange={e=>setCf({...cf,cat:e.target.value,sub:""})}>
                {CATS.filter(c=>c.id!=="general").map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>📊 Түвшин</label>
              <select value={cf.level} onChange={e=>setCf({...cf,level:e.target.value})}>
                {LEVELS.map(l=><option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
              </select>
            </div>
          </div>
        </div>}

        {/* Common fields */}
        <div className="fg"><label>Сургалтын нэр</label><input value={cf.title} onChange={e=>setCf({...cf,title:e.target.value})} placeholder="Хичээлийн нэр оруулна уу" /></div>
        <div className="fg"><label>Тайлбар</label><textarea value={cf.desc} onChange={e=>setCf({...cf,desc:e.target.value})} placeholder="Хичээлийн агуулга, зорилго..." style={{minHeight:72}} /></div>
        <div className="fg-row">
          <div className="fg"><label>Төлбөр</label><select value={cf.free?"free":"paid"} onChange={e=>setCf({...cf,free:e.target.value==="free"})}><option value="free">Үнэгүй</option><option value="paid">Төлбөртэй</option></select></div>
          {!cf.free && <><div className="fg"><label>Үнэ (₮)</label><input type="number" value={cf.price} onChange={e=>setCf({...cf,price:e.target.value})} placeholder="18000" /></div>
          <div className="fg"><label>Хуучин үнэ (₮)</label><input type="number" value={cf.originalPrice} onChange={e=>setCf({...cf,originalPrice:e.target.value})} placeholder="90000" /></div></>}
        </div>
        <div className="fg"><label>🔴 Live линк (Zoom/Meet)</label><input value={cf.liveUrl} onChange={e=>setCf({...cf,liveUrl:e.target.value})} placeholder="https://zoom.us/j/..." /></div>
        <div className="fg">
          <label>🎬 Сургалтын танилцуулга видео <span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>(заавал биш)</span></label>
          <div className="al al-info" style={{fontSize:12,marginBottom:8,padding:"8px 12px"}}>💡 Энэ нь сургалтын танилцуулга видео — жишээ хичээл харуулах зорилготой. Бодит хичээлүүдийг "Хичээл" таб дээр нэмнэ.</div>
          <div className="vtt"><button className={`vb ${cf.vtype==="youtube"?"on":""}`} onClick={()=>setCf({...cf,vtype:"youtube"})}>▶️ YouTube</button><button className={`vb ${cf.vtype==="file"?"on":""}`} onClick={()=>setCf({...cf,vtype:"file"})}>📁 Файл</button></div>
          {cf.vtype==="youtube"?<input value={cf.vurl} onChange={e=>setCf({...cf,vurl:e.target.value})} placeholder="https://youtube.com/watch?v=... (танилцуулга)" />:<label className="ua"><input type="file" accept="video/*" onChange={e=>setVFile(e.target.files[0])} />{vFile?<span>✅ {vFile.name}</span>:<span>📁 Танилцуулга видео файл</span>}</label>}
          {vProg>0&&vProg<100&&<div style={{marginTop:6}}><div className="pw"><div className="pf" style={{width:`${vProg}%`}}/></div></div>}
        </div>
        <div style={{display:"flex",gap:8}}><button className="btn btn-primary" onClick={addCourse} disabled={uploading}>{uploading?"Байршуулж байна...":"Нэмэх"}</button><button className="btn btn-sm" style={{background:"#f1f5f9",color:"#64748b"}} onClick={()=>setShowAdd(false)}>Болих</button></div>
      </div>}
      {mine.length === 0 ? <div className="empty"><div className="ei">📭</div><p>Сургалт байхгүй</p></div>
        : <table className="tbl"><thead><tr><th>Нэр</th><th>Ангилал / Анги</th><th>Түвшин</th><th>Үнэ</th><th>👁 Үзсэн</th><th>🎓 Бүртгүүлсэн</th><th>★</th><th>Үйлдэл</th></tr></thead>
          <tbody>{mine.map(c => { const lv = getLevel(c.level); const ebsSub = getEbsSub(c.subCategory); const grade = getGrade(c.grade); return <tr key={c.id}>
            <td><strong>{c.title}</strong>{c.courseType==="edu"&&<span style={{display:"block",fontSize:10,color:"#6366f1",fontWeight:600}}>📚 ЕБС</span>}</td>
            <td>{c.courseType==="edu"?(grade?`${grade.name} · ${ebsSub?.name||""}`:"ЕБС"):(getCat(c.category)?.name+(c.subCategory?` / ${getSub(c.subCategory)?.name}`:""))}</td>
            <td>{c.courseType==="edu"?<span style={{fontSize:11,color:"#94a3b8"}}>-</span>:lv?<span className="badge" style={{background:lv.bg,color:lv.color}}>{lv.icon} {lv.name}</span>:"-"}</td>
            <td>{c.isFree ? <span className="badge b-free">Үнэгүй</span> : `${(c.price||0).toLocaleString()}₮`}</td>
            <td><span style={{fontWeight:700,color:"#0ea5e9"}}>{c.viewCount||0}</span></td>
            <td><span style={{fontWeight:700,color:"#10b981"}}>{(c.enrolledCount||0)+(orders.filter(o=>o.courseId===c.id).length)}</span></td>
            <td>{c.avgRating > 0 ? `★${c.avgRating}` : "-"}</td>
            <td><button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db, "courses", c.id))}>Устгах</button></td>
          </tr>; })}</tbody></table>}
    </div>}

    {tab === "lessons" && <div className="panel">
      <div className="ph">📹 Хичээлүүд</div>
      <div className="fg"><label>Сургалт</label><select value={lessonCourse || ""} onChange={e => { setLessonCourse(e.target.value); cancelEditLesson(); }}><option value="">-- Сонгох --</option>{mine.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
      {lessonCourse && <>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><button className="btn btn-primary btn-sm" onClick={() => { if (showAddLesson) { cancelEditLesson(); } else { setShowAddLesson(true); } }}>{showAddLesson ? "Хаах" : "+ Хичээл нэмэх"}</button></div>
        {showAddLesson && <div style={{ background: editLessonId ? "#fef3c7" : "#f8fafc", borderRadius: 14, padding: 16, marginBottom: 16, border: editLessonId ? "2px solid #f59e0b" : "1px solid #e2e8f0" }}>
          {editLessonId && <div style={{ background: "#fde68a", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 700, color: "#78350f", display: "flex", alignItems: "center", gap: 8 }}>
            <span>✏️</span><span>Засварлаж байна — сурагчдын явц хадгалагдана</span>
          </div>}
          <div className="fg-row"><div className="fg"><label>Нэр</label><input value={lf.title} onChange={e => setLf({ ...lf, title: e.target.value })} /></div><div className="fg"><label>Хугацаа</label><input value={lf.duration} onChange={e => setLf({ ...lf, duration: e.target.value })} placeholder="15 мин" /></div></div>
          <div className="fg"><label>Тайлбар</label><textarea value={lf.desc} onChange={e => setLf({ ...lf, desc: e.target.value })} style={{ minHeight: 56 }} /></div>
          <div className="fg"><label>Видео</label>
            <div className="vtt"><button className={`vb ${lf.vtype === "youtube" ? "on" : ""}`} onClick={() => setLf({ ...lf, vtype: "youtube" })}>▶️ YouTube</button><button className={`vb ${lf.vtype === "file" ? "on" : ""}`} onClick={() => setLf({ ...lf, vtype: "file" })}>📁 Файл</button></div>
            {lf.vtype === "youtube" ? <input value={lf.vurl} onChange={e => setLf({ ...lf, vurl: e.target.value })} placeholder="https://youtube.com/watch?v=..." /> : <label className="ua"><input type="file" accept="video/*" onChange={e => setLvFile(e.target.files[0])} />{lvFile ? <span>✅ {lvFile.name}</span> : <span>{editLessonId ? "📁 Шинэ видео файл (хоосон бол хуучин үлдэнэ)" : "📁 Видео файл"}</span>}</label>}
            {editLessonId && lf.vtype === "youtube" && lessons.find(l => l.id === editLessonId)?.videoUrl && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>💡 Хуучин: {lessons.find(l => l.id === editLessonId)?.videoUrl?.substring(0, 50)}...</div>}
          </div>
          <div className="fg"><label>📎 Шинэ материал (PDF, DOC, PPT)</label><label className="ua"><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip" multiple onChange={e => setLessonFiles(Array.from(e.target.files))} />{lessonFiles.length > 0 ? <div>{lessonFiles.map(f => <div key={f.name} style={{ fontSize: 12 }}>✅ {f.name}</div>)}</div> : <span>📎 {editLessonId ? "Нэмэлт файл сонгох" : "Файл сонгох (олон боломжтой)"}</span>}</label></div>
          {/* Хуучин файлуудыг харуулна — устгах боломжтой */}
          {editLessonId && lessons.find(l => l.id === editLessonId)?.files?.length > 0 && <div className="fg">
            <label>📂 Одоо байгаа файлууд</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {lessons.find(l => l.id === editLessonId).files.map((f, idx) => <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 16 }}>{f.type === "pdf" ? "📕" : f.type === "ppt" ? "📊" : f.type === "doc" ? "📘" : "📄"}</span>
                <span style={{ flex: 1, fontSize: 12 }}>{f.name}</span>
                <button className="btn btn-danger btn-sm" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => removeLessonFile(editLessonId, idx)}>✕</button>
              </div>)}
            </div>
          </div>}
          <div style={{ display: "flex", gap: 8 }}><button className="btn btn-primary" onClick={addLesson} disabled={uploading}>{uploading ? "Байршуулж байна..." : editLessonId ? "💾 Хадгалах" : "Нэмэх"}</button><button className="btn btn-sm" style={{ background: "#f1f5f9", color: "#64748b" }} onClick={cancelEditLesson}>Болих</button></div>
        </div>}
        {lessons.length === 0 ? <div className="empty"><div className="ei">📹</div><p>Хичээл байхгүй</p></div>
          : <table className="tbl"><thead><tr><th>#</th><th>Нэр</th><th>Хугацаа</th><th>Видео</th><th>Файл</th><th>Үйлдэл</th></tr></thead>
            <tbody>{lessons.map((l, i) => <tr key={l.id} style={editLessonId === l.id ? { background: "#fef3c7" } : {}}><td>{i+1}</td><td><strong>{l.title}</strong></td><td>{l.duration||"-"}</td><td>{(l.videoUrl||l.videoStorageUrl)?"✅":"❌"}</td><td>{l.files?.length>0?<span style={{color:"#3b82f6"}}>📎{l.files.length}</span>:"-"}</td><td style={{ display: "flex", gap: 4 }}>
              <button className="btn btn-sm" style={{ background: "#0ea5e9", color: "#fff", padding: "4px 10px", fontSize: 11 }} onClick={() => startEditLesson(l)}>✏️ Засах</button>
              <button className="btn btn-danger btn-sm" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => { if (window.confirm(`"${l.title}" хичээлийг устгах уу?`)) deleteDoc(doc(db,"courses",lessonCourse,"lessons",l.id)); }}>Устгах</button>
            </td></tr>)}</tbody></table>}
      </>}
    </div>}

    {tab === "mat" && <div className="panel">
      <div className="ph">📄 Материал</div>
      <div className="fg"><label>Сургалт</label><select value={matCourse||""} onChange={e => setMatCourse(e.target.value)}><option value="">-- Сонгох --</option>{mine.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
      {matCourse && <>
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div className="fg"><label>Нэр</label><input value={matName} onChange={e => setMatName(e.target.value)} placeholder="Материалын нэр" /></div>
          <div className="fg"><label>📎 1-р арга: Файл байршуулах (макс. 25MB)</label>
            <label className="ua" style={{ marginBottom: 8 }}><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip" onChange={e => { setMatFile(e.target.files[0]); setMatUrl(""); }} />{matFile ? <span>✅ {matFile.name}</span> : <span>📎 Файл сонгох (PDF, Word, PPT)</span>}</label>
          </div>
          <div className="fg"><label>🔗 2-р арга: Google Drive / Dropbox линк (хязгааргүй)</label>
            <input value={matUrl} onChange={e => { setMatUrl(e.target.value); setMatFile(null); }} placeholder="https://drive.google.com/file/d/..." style={{ width: "100%", padding: "9px 14px", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontFamily: "'Nunito Sans',sans-serif" }} />
          </div>
          <div className="al al-info" style={{ fontSize: 12 }}>💡 <b>Зөвлөмж:</b> Том файл (25MB+) эсвэл байршуулалтад алдаа гарвал Google Drive-д хуулаад "Хэн ч үзэх боломжтой" болгож линкийг хуулна уу.</div>
          {uploading && matProg > 0 && <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "#0ea5e9", marginBottom: 4 }}>📤 Байршуулж байна: {Math.round(matProg)}%</div>
            <div className="pw"><div className="pf" style={{ width: `${matProg}%` }} /></div>
          </div>}
          <button className="btn btn-primary btn-sm" onClick={addMat} disabled={uploading}>{uploading ? "Байршуулж байна..." : "Нэмэх"}</button>
        </div>
        {materials.map(m => <div key={m.id} className="mat-item"><span style={{ fontSize: 18 }}>{m.type==="pdf"?"📕":m.type==="ppt"?"📊":m.type==="doc"?"📘":m.type==="link"?"🔗":"📄"}</span><span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{m.name}</span><a href={m.url} target="_blank" rel="noreferrer" className="btn btn-info btn-sm" style={{ marginRight: 6 }}>Үзэх</a><button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db,"courses",matCourse,"materials",m.id))}>Устгах</button></div>)}
      </>}
    </div>}

    {tab === "homework" && <div className="panel">
      <div className="ph">📝 Даалгавар</div>
      <div className="fg"><label>Сургалт</label><select value={hwCourse||""} onChange={e => setHwCourse(e.target.value)}><option value="">-- Сонгох --</option>{mine.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
      {hwCourse && <>
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div className="fg"><label>Гарчиг</label><input value={hwf.title} onChange={e => setHwf({ ...hwf, title: e.target.value })} /></div>
          <div className="fg"><label>Тайлбар</label><textarea value={hwf.description} onChange={e => setHwf({ ...hwf, description: e.target.value })} /></div>
          <div className="fg"><label>Дуусах хугацаа</label><input type="date" value={hwf.dueDate} onChange={e => setHwf({ ...hwf, dueDate: e.target.value })} /></div>
          <button className="btn btn-primary" onClick={addHw}>Нэмэх</button>
        </div>
        {homeworks.map(hw => <div key={hw.id} className="hw-item"><div style={{ fontWeight: 700, marginBottom: 4 }}>{hw.title}</div><div style={{ fontSize: 13, color: "#64748b" }}>{hw.description}</div><button className="btn btn-danger btn-sm" style={{ marginTop: 6 }} onClick={() => deleteDoc(doc(db,"courses",hwCourse,"homeworks",hw.id))}>Устгах</button></div>)}
      </>}
    </div>}

    {tab === "quiz" && <div className="panel">
      <div className="ph">📝 Шалгалт</div>
      <div className="fg"><label>Сургалт</label><select value={quizCourse||""} onChange={e => { setQuizCourse(e.target.value); setQuizMode("form"); }}><option value="">-- Сонгох --</option>{mine.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
      {quizCourse && <>
        {/* Quiz mode selector */}
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <div onClick={()=>setQuizMode("form")} style={{flex:1,padding:"12px 14px",borderRadius:12,border:`2px solid ${quizMode==="form"?"#0ea5e9":"#e2e8f0"}`,background:quizMode==="form"?"#f0f9ff":"#fff",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:2}}>📋</div>
            <div style={{fontWeight:700,fontSize:12,color:quizMode==="form"?"#0284c7":"#475569"}}>Шалгалт үүсгэх</div>
            <div style={{fontSize:10,color:"#94a3b8"}}>Асуулт нэмэх</div>
          </div>
          <div onClick={()=>setQuizMode("google")} style={{flex:1,padding:"12px 14px",borderRadius:12,border:`2px solid ${quizMode==="google"?"#ea4335":"#e2e8f0"}`,background:quizMode==="google"?"#fff5f5":"#fff",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:2}}>📊</div>
            <div style={{fontWeight:700,fontSize:12,color:quizMode==="google"?"#ea4335":"#475569"}}>Google Form</div>
            <div style={{fontSize:10,color:"#94a3b8"}}>Линк оруулах</div>
          </div>
        </div>

        {quizMode === "google" && <div style={{background:"#fff5f5",borderRadius:12,padding:16,border:"1px solid #fecaca"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#dc2626",marginBottom:8}}>📊 Google Form тест линк</div>
          <div className="al al-info" style={{fontSize:12,marginBottom:10}}>💡 Google Forms дээр тест үүсгээд "Хуваалцах" → "Линк хуулах" дарна уу</div>
          <div className="fg" style={{marginBottom:0}}>
            <label>Google Form линк</label>
            <input value={quiz.googleFormUrl||""} onChange={e=>setQuiz({...quiz,googleFormUrl:e.target.value})} placeholder="https://docs.google.com/forms/d/..." />
          </div>
          {quiz.googleFormUrl && <div style={{marginTop:10,padding:"10px 14px",background:"#f0f9ff",borderRadius:10,fontSize:12,color:"#0369a1"}}>
            ✅ Суралцагч тестийг энэ линкээр нэвтрэн өгнө: <a href={quiz.googleFormUrl} target="_blank" rel="noreferrer" style={{color:"#0ea5e9",wordBreak:"break-all"}}>{quiz.googleFormUrl}</a>
          </div>}
          <button className="btn btn-primary btn-sm" style={{marginTop:12}} onClick={saveQuiz}>💾 Хадгалах</button>
        </div>}

        {quizMode === "form" && <>
          {quiz.questions?.map((q, i) => <div key={i} className="qq">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>{i+1}-р асуулт</span>{quiz.questions.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => remQ(i)}>✕</button>}</div>
            <div className="fg" style={{ marginBottom: 9 }}><input value={q.question} onChange={e => updQ(i,"question",e.target.value)} placeholder="Асуулт..." /></div>
            {q.options?.map((opt, j) => <div key={j} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "center" }}><input type="radio" name={`c_${i}`} checked={q.correct===j} onChange={() => updQ(i,"correct",j)} /><input value={opt} onChange={e => updO(i,j,e.target.value)} placeholder={`${String.fromCharCode(65+j)}`} style={{ flex: 1, padding: "8px 12px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontFamily: "'Nunito Sans',sans-serif" }} />{q.correct===j && <span style={{ color: "#10b981", fontSize: 12, fontWeight: 700 }}>✓</span>}</div>)}
          </div>)}
          <div style={{ display: "flex", gap: 8 }}><button className="btn btn-info btn-sm" onClick={addQ}>+ Асуулт</button><button className="btn btn-success" onClick={saveQuiz}>💾 Хадгалах</button></div>
        </>}
      </>}
    </div>}

    {tab === "students" && <div className="panel">
      <div className="ph">👨‍🎓 Миний сурагчид ({myStudents.length})</div>

      {/* Search to add student */}
      <div style={{background:"#f0f9ff",borderRadius:12,padding:14,marginBottom:16,border:"1px solid #bae6fd"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#0284c7",marginBottom:8}}>➕ Сурагч нэмэх</div>
        <div style={{position:"relative"}}>
          <input
            value={studentSearch}
            onChange={e=>setStudentSearch(e.target.value)}
            placeholder="Сурагчийн нэр эсвэл имэйлээр хайх..."
            style={{width:"100%",padding:"10px 14px",border:"2px solid #bae6fd",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none"}}
          />
          {filteredUsers.length > 0 && <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:100,overflow:"hidden",border:"1px solid #e2e8f0",maxHeight:220,overflowY:"auto"}}>
            {filteredUsers.slice(0,8).map(u=><div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderBottom:"1px solid #f1f5f9",cursor:"pointer"}}
              onClick={()=>addStudent(u.id)}
              onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#e0f2fe,#bae6fd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#0369a1",flexShrink:0,overflow:"hidden"}}>
                {u.photoUrl?<img src={u.photoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(u.name?.[0]||"С")}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13}}>{u.name}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>{u.email}</div>
              </div>
              <span style={{fontSize:12,color:"#0ea5e9",fontWeight:700}}>+ Нэмэх</span>
            </div>)}
          </div>}
        </div>
        <div style={{fontSize:11,color:"#64748b",marginTop:6}}>💡 Сурагч сургалтанд бүртгүүлэхэд автоматаар таны сурагч болно</div>
      </div>

      {/* My students list - DETAILED with quiz scores and grading */}
      {myStudents.length === 0
        ? <div className="empty"><div className="ei">👨‍🎓</div><p>Сурагч байхгүй байна</p><div style={{fontSize:13,color:"#94a3b8",marginTop:4}}>Сурагч таны сургалтад бүртгүүлсний дараа энд харагдана</div></div>
        : <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {myStudents.map(s => {
            const myCoursesForS = mine.filter(c => (s.enrolledCourses||[]).includes(c.id));
            return <div key={s.id} style={{background:"#fff",borderRadius:14,padding:16,border:"1.5px solid #e8ecf1"}}>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:myCoursesForS.length > 0 ? 14 : 0}}>
                <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#e0f2fe,#bae6fd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#0369a1",flexShrink:0,overflow:"hidden"}}>
                  {s.photoUrl?<img src={s.photoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(s.name?.[0]||"С")}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>{s.name}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{s.email}</div>
                  <div style={{fontSize:11,color:"#0ea5e9",marginTop:2}}>📚 {myCoursesForS.length} сургалт</div>
                </div>
                <button className="btn btn-danger btn-sm" style={{flexShrink:0,padding:"4px 10px",fontSize:11}} onClick={()=>removeStudent(s.id)}>✕</button>
              </div>

              {myCoursesForS.length > 0 && <div style={{borderTop:"1px solid #f1f5f9",paddingTop:12,display:"flex",flexDirection:"column",gap:8}}>
                {myCoursesForS.map(c => {
                  const qs = (s.quizScores||{})[c.id];
                  const completedCount = ((s.completedLessons||{})[c.id]||[]).length;
                  const hasCert = (s.certificates||[]).find(ct => ct.courseId === c.id);
                  const isPending = qs && qs.status === "pending";
                  const isGraded = qs && qs.percentage !== null && qs.percentage !== undefined;
                  return <div key={c.id} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",fontSize:13}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                      <div style={{flex:1,minWidth:140}}>
                        <div style={{fontWeight:700,fontSize:13}}>{c.title}</div>
                        <div style={{fontSize:11,color:"#64748b",marginTop:2}}>📖 {completedCount} хичээл үзсэн {hasCert && <span style={{color:"#10b981",fontWeight:700,marginLeft:6}}>🎓 Гэрчилгээтэй</span>}</div>
                      </div>
                      {qs && qs.mode === "google" ? (
                        isPending ? <GradeStudent student={s} course={c} notify={notify} />
                        : isGraded ? <div style={{textAlign:"right"}}>
                          <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>Үнэлгээ</div>
                          <div style={{fontSize:18,fontWeight:800,color:qs.percentage>=80?"#10b981":"#ef4444"}}>{qs.percentage}/100</div>
                          <button className="btn btn-sm" style={{padding:"2px 8px",fontSize:10,marginTop:2,background:"#f1f5f9",color:"#64748b"}} onClick={async()=>{
                            const newScore = prompt(`${s.name}-ийн "${c.title}" сургалтын онооны өгөх (0-100):`, qs.percentage);
                            if (newScore === null) return;
                            const n = parseInt(newScore);
                            if (isNaN(n) || n < 0 || n > 100) { notify("0-100 хооронд тоо оруулна уу","#ef4444"); return; }
                            await updateDoc(doc(db,"users",s.id), { [`quizScores.${c.id}`]: { ...qs, score: n, percentage: n, status: "graded", gradedAt: new Date().toISOString() } });
                            notify("✅ Үнэлгээ шинэчлэгдлээ");
                          }}>✏️ Засах</button>
                        </div> : null
                      ) : qs && qs.percentage !== null && qs.percentage !== undefined ? <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>Шалгалт</div>
                        <div style={{fontSize:16,fontWeight:800,color:qs.percentage>=60?"#10b981":"#ef4444"}}>{qs.percentage}%</div>
                      </div> : <span style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>Шалгалт өгөөгүй</span>}
                    </div>
                  </div>;
                })}
              </div>}
            </div>;
          })}
        </div>}
    </div>}

    {tab === "orders" && <div className="panel">
      <div className="ph">💰 Захиалга</div>
      {orders.length === 0 ? <div className="empty"><div className="ei">💰</div><p>Захиалга байхгүй</p></div>
        : <><div className="al al-ok" style={{ fontWeight: 700 }}>Нийт орлого: {totalRevenue.toLocaleString()}₮ · {orders.length} захиалга</div>
          <table className="tbl"><thead><tr><th>Сургалт</th><th>Дүн</th><th>Арга</th><th>Огноо</th></tr></thead>
            <tbody>{orders.map(o => <tr key={o.id}><td>{o.courseName?.substring(0,22)}</td><td><strong>{(o.amount||0).toLocaleString()}₮</strong></td><td>{o.method==="qpay"?"QPay":"Шилжүүлэг"}</td><td style={{ fontSize: 12 }}>{o.createdAt?.toDate?.()?.toLocaleDateString("mn-MN")||"-"}</td></tr>)}</tbody></table></>}
    </div>}

    {tab === "profile" && <div className="ps">
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#0284c7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "#fff", margin: "0 auto 12px", overflow: "hidden", border: "3px solid #e0f2fe" }}>
          {photoPreview || profile?.photoUrl ? <img src={photoPreview || profile?.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (profile?.name?.[0] || "Б")}
        </div>
        <label className="btn btn-sm" style={{ background: "#f1f5f9", color: "#64748b", cursor: "pointer" }}>📷 Зураг солих<input type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} /></label>
      </div>
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#0369a1" }}>
        ✏️ Овог нэрийг монгол кирилл үсгээр бичнэ үү
      </div>
      <div className="fg-row">
        <div className="fg">
          <label>Овог <span style={{fontSize:11,color:"#94a3b8"}}>(монголоор)</span></label>
          <input value={editLastName} onChange={e => setEditLastName(e.target.value)} placeholder="Жишээ: Батаа" />
          {editLastName && !isMongolian(editLastName) && <span style={{fontSize:11,color:"#ef4444",marginTop:3,display:"block"}}>⚠️ Монгол үсгээр бичнэ үү</span>}
        </div>
        <div className="fg">
          <label>Нэр <span style={{fontSize:11,color:"#94a3b8"}}>(монголоор)</span></label>
          <input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} placeholder="Жишээ: Болд" />
          {editFirstName && !isMongolian(editFirstName) && <span style={{fontSize:11,color:"#ef4444",marginTop:3,display:"block"}}>⚠️ Монгол үсгээр бичнэ үү</span>}
        </div>
      </div>
      <div className="fg"><label>Имэйл</label><input value={profile?.email||""} disabled style={{ background: "#f8fafc", color: "#94a3b8" }} /></div>
      <div className="fg"><label>Тайлбар / Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Өөрийн тухай товч танилцуулга..." style={{minHeight:80}} /></div>

      {/* Bank info section */}
      <div style={{borderTop:"1px solid #e2e8f0",marginTop:4,paddingTop:16,marginBottom:4}}>
        <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:12}}>🏦 Банкны мэдээлэл <span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>(төлбөр хүлээн авах)</span></div>
        <div className="fg-row">
          <div className="fg">
            <label>Банкны нэр</label>
            <select value={bankName} onChange={e=>setBankName(e.target.value)}>
              <option value="">-- Банк сонгох --</option>
              {["Хаан банк","Голомт банк","Хас банк","Төрийн банк","Монгол банк","Тэрбум банк","Капитрон банк","Кредит банк","Богд банк"].map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Дансны дугаар</label>
            <input value={bankAccount} onChange={e=>setBankAccount(e.target.value)} placeholder="Жишээ: 4900123456" type="text" />
          </div>
        </div>
        <div className="fg">
          <label>Данс эзэмшигчийн нэр</label>
          <input value={bankOwner} onChange={e=>setBankOwner(e.target.value)} placeholder="Банкны дансан дахь нэр" />
        </div>
        <div className="fg">
          <label>📱 QPay / Данс QR код <span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>(заавал биш)</span></label>
          <div className="al al-info" style={{fontSize:12,marginBottom:8,padding:"8px 12px"}}>💡 QPay-ийн QR кодыг зургаар байршуулна. Суралцагч скан хийн төлбөр төлнө.</div>
          <label className="ua" style={{marginBottom:8}}>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setQrPreview(ev.target.result);r.readAsDataURL(f);}} />
            {qrPreview?<div style={{display:"flex",alignItems:"center",gap:12}}><img src={qrPreview} alt="QR" style={{width:80,height:80,objectFit:"contain",borderRadius:8,border:"1px solid #e2e8f0"}}/><span style={{fontSize:12,color:"#10b981"}}>✅ QR код байршуулсан</span></div>:<span>📱 QR код зураг оруулах</span>}
          </label>
          {qrPreview && <button className="btn btn-sm" style={{background:"#fef2f2",color:"#ef4444",border:"1px solid #fecaca",fontSize:11}} onClick={()=>setQrPreview("")}>✕ Устгах</button>}
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: "100%", padding: 13 }} onClick={saveProfile}>💾 Хадгалах</button>
    </div>}
  </div>;
}

// ===================== ADMIN PAGE =====================
function AdminPage({ pending, teachers, courses, news, bundles, coupons, notify, adminTab, setAdminTab }) {
  const [nf, setNf] = useState({ title: "", content: "" }); const [showNews, setShowNews] = useState(false);
  const [users, setUsers] = useState([]); const [showPw, setShowPw] = useState({});
  const [certificates, setCertificates] = useState([]);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editForm, setEditForm] = useState({ lastName: "", firstName: "", phone: "", bio: "" });

  useEffect(() => { return onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))); }, []);

  useEffect(() => { return onSnapshot(collection(db, "certificates"), s => setCertificates(s.docs.map(d => ({ id: d.id, ...d.data() })))); }, []);

  const top3Teachers = React.useMemo(() => {
    return teachers.map(t => {
      const myCourses = courses.filter(c => c.teacherId === t.id);
      const totalViews = myCourses.reduce((s, c) => s + (c.viewCount || 0), 0);
      const totalEnrolled = myCourses.reduce((s, c) => s + (c.enrolledCount || 0), 0);
      return { ...t, totalViews, totalEnrolled, courseCount: myCourses.length };
    })
    .filter(t => t.totalEnrolled > 0 || t.totalViews > 0)
    .sort((a, b) => (b.totalEnrolled - a.totalEnrolled) || (b.totalViews - a.totalViews))
    .slice(0, 3);
  }, [teachers, courses]);

  const openEdit = t => {
    setEditingTeacher(t);
    setEditForm({ lastName: t.lastName || "", firstName: t.firstName || "", phone: t.phone || "", bio: t.bio || "" });
  };
  const saveTeacher = async () => {
    const isMongolian = str => /^[\u0400-\u04FF\s\-]+$/.test(str.trim());
    if (!editForm.lastName || !editForm.firstName) { notify("Овог нэр бөглөнө үү", "#ef4444"); return; }
    if (!isMongolian(editForm.lastName) || !isMongolian(editForm.firstName)) { notify("Овог нэрийг монгол үсгээр бичнэ үү", "#ef4444"); return; }
    const fullName = editForm.lastName + "." + editForm.firstName;
    await updateDoc(doc(db, "users", editingTeacher.id), { lastName: editForm.lastName, firstName: editForm.firstName, name: fullName, phone: editForm.phone, bio: editForm.bio });
    notify("✅ Мэдээлэл хадгалагдлаа!");
    setEditingTeacher(null);
  };

  const approve = async pt => {
    try {
      // Багш аль хэдийн Firebase Auth-д бүртгэлтэй — зөвхөн users collection-д шилжүүлнэ
      const uid = pt.uid || pt.id;
      await setDoc(doc(db, "users", uid), {
        name: pt.name, lastName: pt.lastName || "", firstName: pt.firstName || "",
        email: pt.email, phone: pt.phone || "",
        role: "teacher", photoUrl: "", bio: "",
        emailVerified: false, createdAt: serverTimestamp()
      }, { merge: true });
      await deleteDoc(doc(db, "pendingTeachers", pt.id));
      notify(`✅ ${pt.name} зөвшөөрлөө!`);
    } catch (e) {
      notify("Алдаа: " + e.message, "#ef4444");
    }
  };

  const addNews = async () => {
    if (!nf.title || !nf.content) { notify("Бүх талбар бөглөнө үү", "#ef4444"); return; }
    await setDoc(doc(collection(db, "news")), { ...nf, createdAt: serverTimestamp() });
    const snap = await getDocs(query(collection(db, "users"), where("role", "==", "user")));
    for (const ud of snap.docs) { await setDoc(doc(collection(db, "notifications")), { userId: ud.id, title: "Шинэ мэдээ!", body: nf.title, read: false, createdAt: serverTimestamp() }); }
    setNf({ title: "", content: "" }); setShowNews(false); notify("Мэдээ + мэдэгдэл илгээгдлээ!");
  };

  return <div className="sec">
    <div className="sec-title">⚙️ Админ самбар</div>
    <div className="stat-grid">
      <div className="stat-card"><div className="sv">{courses.length}</div><div className="sl">Сургалт</div></div>
      <div className="stat-card"><div className="sv">{teachers.length}</div><div className="sl">Багш</div></div>
      <div className="stat-card"><div className="sv">{users.filter(u => u.role === "user").length}</div><div className="sl">Суралцагч</div></div>
      <div className="stat-card"><div className="sv">{certificates.length}</div><div className="sl">🎓 Гэрчилгээ</div></div>
      <div className="stat-card"><div className="sv">{courses.reduce((s, c) => s + (c.enrolledCount || 0), 0)}</div><div className="sl">📚 Нийт бүртгэл</div></div>
      <div className="stat-card"><div className="sv">{pending.length}</div><div className="sl">Хүлээгдэж буй</div></div>
    </div>

    {top3Teachers.length > 0 && (
      <div style={{
        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        borderRadius: 16, padding: 20, marginTop: 16, marginBottom: 16,
        border: "2px solid #f59e0b"
      }}>
        <div style={{
          fontSize: 16, fontWeight: 800, color: "#92400e", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 8
        }}>
          🏆 Шилдэг 3 багш — хамгийн олон сурагч элссэн
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {top3Teachers.map((t, i) => {
            const medals = ["🥇", "🥈", "🥉"];
            const colors = ["#fbbf24", "#9ca3af", "#cd7f32"];
            return (
              <div key={t.id} style={{
                background: "#fff", borderRadius: 12, padding: 14,
                borderTop: `4px solid ${colors[i]}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{medals[i]}</div>
                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, marginBottom: 6 }}>
                  {t.name || "Багш"}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
                  <span>👥 <strong style={{ color: "#0ea5e9" }}>{t.totalEnrolled}</strong> сурагч</span>
                  <span>📚 {t.courseCount} хичээл</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
                  👁 {t.totalViews.toLocaleString()} нийт үзэлт
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
    <div className="tabs">
      {[["teachers","Хүсэлтүүд"],["allteachers","Багш"],["users","Суралцагч"],["courses","Сургалт"],["news","Мэдээ"]].map(([t, l]) => <div key={t} className={`tab ${adminTab === t ? "on" : ""}`} onClick={() => setAdminTab(t)}>
        {l}{t === "teachers" && pending.length > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: "99px", padding: "1px 6px", fontSize: 9, marginLeft: 4 }}>{pending.length}</span>}
      </div>)}
    </div>

    {adminTab === "teachers" && <div className="panel">
      <div className="ph">Багшийн хүсэлтүүд ({pending.length})</div>
      {pending.length === 0 ? <div className="empty"><div className="ei">✅</div><p>Хүсэлт байхгүй</p></div>
        : <table className="tbl"><thead><tr><th>Нэр</th><th>Имэйл</th><th>Утас</th><th>Нууц үг</th><th>Огноо</th><th>Үйлдэл</th></tr></thead>
          <tbody>{pending.map(pt => <tr key={pt.id}>
            <td><strong>{pt.name}</strong></td><td style={{ fontSize: 12 }}>{pt.email}</td>
            <td style={{ fontSize: 12 }}>{pt.phone || "-"}</td>
            <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{showPw[pt.id] ? pt.password : "••••••"}</span> <button className="btn btn-sm" style={{ padding: "1px 6px", fontSize: 10, background: "#f1f5f9", color: "#64748b" }} onClick={() => setShowPw(p => ({ ...p, [pt.id]: !p[pt.id] }))}>{showPw[pt.id] ? "Нуух" : "👁"}</button></td>
            <td style={{ fontSize: 12 }}>{pt.createdAt?.toDate?.()?.toLocaleDateString("mn-MN")||"-"}</td>
            <td style={{ display: "flex", gap: 5 }}><button className="btn btn-success btn-sm" onClick={() => approve(pt)}>✓</button><button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db,"pendingTeachers",pt.id))}>✗</button></td>
          </tr>)}</tbody></table>}
    </div>}

    {adminTab === "allteachers" && <div className="panel">
      <div className="ph">Багш нар ({teachers.length})</div>
      {editingTeacher && <div className="mo" onClick={e => e.target === e.currentTarget && setEditingTeacher(null)}>
        <div className="md"><h2>✏️ Багш засах</h2>
          <div style={{fontSize:13,color:"#64748b",marginBottom:12}}>{editingTeacher.email}</div>
          <div className="fg-row">
            <div className="fg"><label>Овог <span style={{fontSize:11,color:"#94a3b8"}}>(монголоор)</span></label><input value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} placeholder="Батаа" /></div>
            <div className="fg"><label>Нэр <span style={{fontSize:11,color:"#94a3b8"}}>(монголоор)</span></label><input value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} placeholder="Болд" /></div>
          </div>
          {(editForm.lastName || editForm.firstName) && !/^[\u0400-\u04FF\s\-]*$/.test(editForm.lastName + editForm.firstName) && <div style={{fontSize:12,color:"#ef4444",marginBottom:8}}>⚠️ Зөвхөн монгол (кирилл) үсгээр бичнэ үү</div>}
          <div className="fg"><label>Утас</label><input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="99001122" /></div>
          <div className="fg"><label>Тайлбар (Bio)</label><textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="Багшийн тухай..." style={{minHeight:80}} /></div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={saveTeacher}>💾 Хадгалах</button>
            <button className="btn btn-sm" style={{background:"#f1f5f9",color:"#64748b"}} onClick={() => setEditingTeacher(null)}>Болих</button>
          </div>
        </div>
      </div>}
      <table className="tbl"><thead><tr><th>Нэр</th><th>Имэйл</th><th>Утас</th><th>Нууц үг</th><th>Баталгаа</th><th>Сургалт</th><th>Үйлдэл</th></tr></thead>
        <tbody>{teachers.map(t => <tr key={t.id}>
          <td><strong>{t.name}</strong></td><td style={{ fontSize: 12 }}>{t.email}</td>
          <td style={{ fontSize: 12 }}>{t.phone || "-"}</td>
          <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{showPw["t_"+t.id] ? (t.password||"-") : "••••••"}</span> <button className="btn btn-sm" style={{ padding: "1px 6px", fontSize: 10, background: "#f1f5f9", color: "#64748b" }} onClick={() => setShowPw(p => ({ ...p, ["t_"+t.id]: !p["t_"+t.id] }))}>{showPw["t_"+t.id] ? "Нуух" : "👁"}</button></td>
          <td>{t.emailVerified ? <span className="badge b-free">✅</span> : <span className="badge b-paid">⏳</span>}</td>
          <td>{courses.filter(c => c.teacherId === t.id).length}</td>
          <td style={{display:"flex",gap:4}}><button className="btn btn-info btn-sm" onClick={() => openEdit(t)}>✏️</button><button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm(`${t.name} устгах уу?`)) deleteDoc(doc(db,"users",t.id)); }}>🗑</button></td>
        </tr>)}</tbody></table>
    </div>}

    {adminTab === "users" && <div className="panel">
      <div className="ph">Суралцагчид ({users.filter(u => u.role === "user").length})</div>
      <table className="tbl"><thead><tr><th>Нэр</th><th>Имэйл</th><th>Утас</th><th>Нууц үг</th><th>Огноо</th><th>Үйлдэл</th></tr></thead>
        <tbody>{users.filter(u => u.role === "user").map(u => <tr key={u.id}>
          <td><strong>{u.name}</strong></td><td style={{ fontSize: 12 }}>{u.email}</td>
          <td style={{ fontSize: 12 }}>{u.phone || "-"}</td>
          <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{showPw["u_"+u.id] ? (u.password||"-") : "••••••"}</span> <button className="btn btn-sm" style={{ padding: "1px 6px", fontSize: 10, background: "#f1f5f9", color: "#64748b" }} onClick={() => setShowPw(p => ({ ...p, ["u_"+u.id]: !p["u_"+u.id] }))}>{showPw["u_"+u.id] ? "Нуух" : "👁"}</button></td>
          <td style={{ fontSize: 12 }}>{u.createdAt?.toDate?.()?.toLocaleDateString("mn-MN")||"-"}</td>
          <td><button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm(`${u.name} устгах уу?`)) deleteDoc(doc(db,"users",u.id)); }}>Устгах</button></td>
        </tr>)}</tbody></table>
    </div>}

    {adminTab === "courses" && <div className="panel">
      <div className="ph">Сургалтууд ({courses.length})</div>
      <table className="tbl"><thead><tr><th>Нэр</th><th>Багш</th><th>Түвшин</th><th>Үнэ</th><th>👁</th><th>★</th><th>Үйлдэл</th></tr></thead>
        <tbody>{courses.map(c => { const lv = getLevel(c.level); return <tr key={c.id}>
          <td><strong>{c.title}</strong></td><td>{c.teacherName}</td>
          <td>{lv ? <span className="badge" style={{ background: lv.bg, color: lv.color }}>{lv.icon}</span> : "-"}</td>
          <td>{c.isFree ? <span className="badge b-free">Үнэгүй</span> : `${(c.price||0).toLocaleString()}₮`}</td>
          <td>{c.viewCount || 0}</td>
          <td>{c.avgRating > 0 ? `★${c.avgRating}` : "-"}</td>
          <td><button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db,"courses",c.id))}>Устгах</button></td>
        </tr>; })}</tbody></table>
    </div>}

    {adminTab === "news" && <div className="panel">
      <div className="ph">Мэдээ ({news.length}) <button className="btn btn-primary btn-sm" onClick={() => setShowNews(!showNews)}>+ Нэмэх</button></div>
      {showNews && <div style={{ background: "#f8fafc", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div className="fg"><label>Гарчиг</label><input value={nf.title} onChange={e => setNf({ ...nf, title: e.target.value })} /></div>
        <div className="fg"><label>Агуулга</label><textarea value={nf.content} onChange={e => setNf({ ...nf, content: e.target.value })} /></div>
        <button className="btn btn-primary" onClick={addNews}>Нийтлэх + Мэдэгдэл</button>
      </div>}
      {news.map(n => <div key={n.id} className="news-card"><div style={{ display: "flex", justifyContent: "space-between" }}><h3 style={{ fontWeight: 700, fontSize: 15 }}>{n.title}</h3><button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc(db,"news",n.id))}>Устгах</button></div><p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{n.content?.substring(0,100)}...</p></div>)}
    </div>}
  </div>;
}
