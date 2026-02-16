import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  serverTimestamp,
  setDoc,
  writeBatch,
  where,
  orderBy
} from 'firebase/firestore';
import { 
  Menu, X, Search, User, ShieldCheck, Edit3, Trash2, 
  Plus, Image as ImageIcon, Layout, Save,
  Share2, Download, LogOut, ChevronRight, AlertTriangle, 
  Link as LinkIcon, Upload, FileText, Settings, Eye, List,
  MessageSquare, Users, BarChart2, Database, Globe, Tag
} from 'lucide-react';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAIw0NeSi-0Vb9hUwyGlhx4dA3r0dbTSYo",
  authDomain: "shajgoj-ea28b.firebaseapp.com",
  projectId: "shajgoj-ea28b",
  storageBucket: "shajgoj-ea28b.firebasestorage.app",
  messagingSenderId: "1050845378650",
  appId: "1:1050845378650:web:656c247cdf22e954294063"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const appId = 'diganta-cms-v3'; 

// --- Helper Functions ---
const getBanglaDate = (seconds) => {
  const date = seconds ? new Date(seconds * 1000) : new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('bn-BD', options);
};

const resizeImage = (file, maxWidth = 800) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const updateMetaTags = (title, description) => {
  document.title = title;
  
  // OG Title
  let metaOgTitle = document.querySelector('meta[property="og:title"]');
  if (!metaOgTitle) {
    metaOgTitle = document.createElement('meta');
    metaOgTitle.setAttribute('property', 'og:title');
    document.head.appendChild(metaOgTitle);
  }
  metaOgTitle.content = title;

  // Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = description || title;
};

// --- Components ---

const RichTextEditor = ({ value, onChange }) => {
  const insertTag = (tag) => {
    const textarea = document.getElementById('news-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);
    let newText = '';

    if (tag === 'b') newText = text.substring(0, start) + `<b>${selection || 'বোল্ড'}</b>` + text.substring(end);
    else if (tag === 'br') newText = text.substring(0, start) + `<br/>` + text.substring(end);
    else if (tag === 'h3') newText = text.substring(0, start) + `<h3>${selection || 'হেডিং'}</h3>` + text.substring(end);
    else if (tag === 'p') newText = text.substring(0, start) + `<p>${selection || 'প্যারাগ্রাফ'}</p>` + text.substring(end);
    
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  return (
    <div className="border rounded-md overflow-hidden border-gray-300 bg-white">
      <div className="bg-gray-50 p-2 flex gap-2 border-b flex-wrap">
        <button type="button" onClick={() => insertTag('b')} className="px-3 py-1 bg-white border rounded font-bold hover:bg-blue-50 text-sm">B</button>
        <button type="button" onClick={() => insertTag('h3')} className="px-3 py-1 bg-white border rounded font-bold hover:bg-blue-50 text-sm">H3</button>
        <button type="button" onClick={() => insertTag('p')} className="px-3 py-1 bg-white border rounded hover:bg-blue-50 text-sm">P</button>
        <button type="button" onClick={() => insertTag('br')} className="px-3 py-1 bg-white border rounded hover:bg-blue-50 text-sm">New Line</button>
      </div>
      <textarea
        id="news-content"
        className="w-full h-[400px] p-4 focus:outline-none resize-none font-serif text-lg leading-relaxed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="এখানে লিখুন..."
      />
    </div>
  );
};

const Navbar = ({ categories, pages, activeCategory, setActiveCategory, setView, setSelectedPage }) => (
  <nav className="sticky top-0 bg-white z-40 border-b shadow-sm">
    <div className="container mx-auto">
      <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide px-4 py-3 gap-6 md:justify-center">
          <button 
            onClick={() => { setActiveCategory('সব খবর'); setView('home'); window.scrollTo(0,0); }}
            className={`text-sm font-bold uppercase tracking-wider ${activeCategory === 'সব খবর' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
          >
            হোম
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => { setActiveCategory(cat.name); setView('home'); window.scrollTo(0,0); }}
              className={`text-sm font-bold uppercase tracking-wider ${activeCategory === cat.name ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
            >
              {cat.name}
            </button>
          ))}
          {/* Dynamic Pages in Menu */}
          {pages && pages.map(page => (
            <button
               key={page.id}
               onClick={() => { setSelectedPage(page); setView('page'); window.scrollTo(0,0); }}
               className="text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-blue-600"
            >
              {page.title}
            </button>
          ))}
      </div>
    </div>
  </nav>
);

const AdDisplay = ({ adData, className }) => {
  if (!adData || !adData.image) return null;
  const Content = () => <img src={adData.image} alt="Ad" className={`w-full h-auto object-cover ${className}`} />;
  return adData.link ? <a href={adData.link} target="_blank" rel="noreferrer" className="block hover:opacity-90"><Content /></a> : <Content />;
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('home'); 
  
  // Data States
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState([]);
  const [media, setMedia] = useState([]);
  const [comments, setComments] = useState([]);
  
  const [permissionError, setPermissionError] = useState(false);
  const [adminTab, setAdminTab] = useState('dashboard');
  
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'দিগন্ত',
    logo: '', 
    editorName: 'মঞ্জুরুল হক',
    footerText: 'স্বত্ব © ২০২৬ দিগন্ত মিডিয়া',
    seoDescription: 'বাংলাদেশের নির্ভরযোগ্য অনলাইন নিউজ পোর্টাল',
    ads: { header: {}, sidebar: {}, inArticle: {} }
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Editors
  const [editArticle, setEditArticle] = useState(null);
  const [editPage, setEditPage] = useState(null);
  const [activeCategory, setActiveCategory] = useState('সব খবর');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  
  // Forms
  const [formData, setFormData] = useState({ title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false, tags: '' });
  const [pageFormData, setPageFormData] = useState({ title: '', content: '' });
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');

  // --- Initial Effects ---
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
    const interval = setInterval(() => {
      if (deferredPrompt || !window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBtn(true);
        setTimeout(() => setShowInstallBtn(false), 8000);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setDeferredPrompt(null); setShowInstallBtn(false); }
    } else { alert("ব্রাউজার মেনু থেকে 'Install App' সিলেক্ট করুন।"); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser && currentUser.email === 'eco452@gmail.com');
    });
    return () => unsubscribe();
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    const handleError = (error) => { if (error.code === 'permission-denied') setPermissionError(true); };

    const unsubArticles = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'articles')), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setArticles(data);
    }, handleError);

    const unsubCats = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (data.length === 0 && isAdmin) {
           ['বাংলাদেশ', 'রাজনীতি', 'অর্থনীতি', 'আন্তর্জাতিক', 'খেলা'].forEach(name => 
             addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), { name })
           );
        } else { setCategories(data); }
    }, handleError);

    const unsubPages = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'pages'), (snap) => {
        setPages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, handleError);

    const unsubMedia = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'media'), orderBy('timestamp', 'desc')), (snap) => {
        setMedia(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, handleError);

    const unsubComments = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), orderBy('timestamp', 'desc')), (snap) => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, handleError);

    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), (snap) => {
        if (snap.exists()) setSiteSettings(prev => ({ ...prev, ...snap.data() }));
    }, handleError);

    return () => { unsubArticles(); unsubCats(); unsubPages(); unsubMedia(); unsubComments(); unsubSettings(); };
  }, [isAdmin]);

  // --- Actions ---
  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); setView('home'); } catch (e) { alert(e.message); }
  };

  const handleLogout = async () => { await signOut(auth); setIsAdmin(false); setView('home'); };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await resizeImage(file, 800);
    
    // Always save to media library
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'media'), {
       image: base64, timestamp: serverTimestamp(), type: type
    });

    if (type === 'article') setFormData({ ...formData, image: base64 });
    else if (type === 'logo') handleSettingUpdate('logo', base64);
    else if (type.startsWith('ad_')) {
       const adKey = type.split('_')[1];
       handleSettingUpdate('ads', { ...siteSettings.ads, [adKey]: { ...siteSettings.ads[adKey], image: base64 } });
    }
  };

  const handleSaveArticle = async () => {
    if (!isAdmin || !formData.title) return alert("শিরোনাম প্রয়োজন");
    const payload = { ...formData, timestamp: serverTimestamp(), author: siteSettings.editorName };
    if (editArticle) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'articles', editArticle.id), payload);
    else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'articles'), payload);
    setEditArticle(null); setFormData({ title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false, tags: '' }); setAdminTab('posts');
    alert('সংরক্ষিত হয়েছে');
  };

  const handleSavePage = async () => {
    if (!isAdmin || !pageFormData.title) return alert("শিরোনাম প্রয়োজন");
    if (editPage) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'pages', editPage.id), pageFormData);
    else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'pages'), pageFormData);
    setEditPage(null); setPageFormData({ title: '', content: '' }); setAdminTab('pages');
    alert('পেজ সংরক্ষিত হয়েছে');
  };

  const handleDelete = async (coll, id) => {
    if (isAdmin && confirm('মুছে ফেলতে চান?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', coll, id));
  };

  const handleSettingUpdate = async (key, value) => {
    const newSettings = { ...siteSettings, [key]: value };
    setSiteSettings(newSettings);
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), newSettings);
  };

  const handleCommentSubmit = async () => {
    if (!commentText || !commentName) return alert('নাম এবং মন্তব্য লিখুন');
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), {
      articleId: selectedArticle.id, articleTitle: selectedArticle.title,
      name: commentName, text: commentText, timestamp: serverTimestamp(), approved: false
    });
    setCommentText(''); setCommentName(''); alert('মন্তব্য জমা হয়েছে। অনুমোদনের জন্য অপেক্ষা করুন।');
  };

  const handleBackup = () => {
    const backupData = { articles, categories, pages, siteSettings, comments };
    const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `diganta_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
       try {
         const data = JSON.parse(event.target.result);
         if (confirm('বর্তমান ডাটা মুছে ব্যাকআপ রিস্টোর করা হবে? এটি বিপজ্জনক হতে পারে।')) {
            // In a real app, use batch write. Here just alert for safety.
            alert("নিরাপত্তার স্বার্থে ডেমো অ্যাপে অটোমেটিক রিস্টোর বন্ধ রাখা হয়েছে। তবে আপনি ম্যানুয়ালি পোস্ট করতে পারবেন।");
            console.log("Restorable Data:", data);
         }
       } catch (e) { alert("ইনভ্যালিড ব্যাকআপ ফাইল"); }
    };
    reader.readAsText(file);
  };

  // --- Views ---

  const AdminView = () => (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-16 md:w-64 bg-slate-900 text-slate-300 flex flex-col shadow-lg z-20 overflow-y-auto">
         <div className="p-4 border-b border-slate-700 flex items-center gap-2 text-white">
            <ShieldCheck size={28}/> <span className="hidden md:block font-bold text-lg">CMS Admin</span>
         </div>
         <nav className="flex-1 mt-4 space-y-1 px-2">
            {[
              { id: 'dashboard', icon: BarChart2, label: 'ড্যাশবোর্ড' },
              { id: 'posts', icon: FileText, label: 'পোস্টস' },
              { id: 'media', icon: ImageIcon, label: 'মিডিয়া' },
              { id: 'pages', icon: FileText, label: 'পেজ' },
              { id: 'comments', icon: MessageSquare, label: 'মন্তব্য' },
              { id: 'layout', icon: Layout, label: 'লেআউট' },
              { id: 'settings', icon: Settings, label: 'সেটিংস' },
              { id: 'tools', icon: Database, label: 'টুলস' },
            ].map(item => (
              <button key={item.id} onClick={() => setAdminTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition ${adminTab === item.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
                <item.icon size={20}/> <span className="hidden md:block">{item.label}</span>
              </button>
            ))}
         </nav>
         <div className="p-4 border-t border-slate-700">
            <button onClick={() => setView('home')} className="w-full flex items-center gap-3 px-2 py-2 hover:text-white"><Eye size={20}/> <span className="hidden md:block">ভিজিট সাইট</span></button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-2 py-2 text-red-400 hover:text-red-300 mt-1"><LogOut size={20}/> <span className="hidden md:block">লগ আউট</span></button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
         <div className="bg-white border-b p-4 shadow-sm flex justify-between items-center">
            <h2 className="text-xl font-bold capitalize">{adminTab}</h2>
            <div className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{user?.email}</div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            
            {/* 1. DASHBOARD */}
            {adminTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {[
                   { label: 'মোট পোস্ট', val: articles.length, color: 'bg-blue-500', icon: FileText },
                   { label: 'মন্তব্য', val: comments.length, color: 'bg-green-500', icon: MessageSquare },
                   { label: 'মিডিয়া ফাইল', val: media.length, color: 'bg-purple-500', icon: ImageIcon },
                   { label: 'পেজ', val: pages.length, color: 'bg-orange-500', icon: Globe }
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-6 rounded-lg shadow-sm border flex items-center gap-4">
                      <div className={`p-3 rounded-full text-white ${stat.color}`}><stat.icon size={24}/></div>
                      <div><p className="text-2xl font-bold">{stat.val}</p><p className="text-sm text-gray-500">{stat.label}</p></div>
                   </div>
                 ))}
                 
                 <div className="md:col-span-2 bg-white p-6 rounded shadow-sm border">
                    <h3 className="font-bold mb-4">দ্রুত অ্যাকশন</h3>
                    <div className="flex gap-4">
                       <button onClick={() => { setEditArticle(null); setFormData({ title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false, tags: '' }); setAdminTab('new-post'); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"><Plus size={16}/> নতুন পোস্ট</button>
                       <button onClick={() => setAdminTab('settings')} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"><Settings size={16}/> সাইট কনফিগার</button>
                    </div>
                 </div>
              </div>
            )}

            {/* 2. POSTS & EDITOR */}
            {adminTab === 'posts' && (
              <div className="bg-white rounded shadow-sm border">
                 <div className="p-4 border-b flex justify-between">
                    <h3 className="font-bold">সকল পোস্ট</h3>
                    <button onClick={() => { setEditArticle(null); setFormData({ title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false, tags: '' }); setAdminTab('new-post'); }} className="text-xs bg-blue-600 text-white px-3 py-1 rounded">নতুন যোগ করুন</button>
                 </div>
                 {articles.map(a => (
                   <div key={a.id} className="p-3 border-b flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="font-bold">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.author} • {a.category} • {getBanglaDate(a.timestamp?.seconds)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditArticle(a); setFormData(a); setAdminTab('new-post'); }} className="text-blue-600 p-1"><Edit3 size={16}/></button>
                        <button onClick={() => handleDelete('articles', a.id)} className="text-red-600 p-1"><Trash2 size={16}/></button>
                      </div>
                   </div>
                 ))}
              </div>
            )}

            {adminTab === 'new-post' && (
               <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 flex flex-col gap-4">
                     <input type="text" placeholder="পোস্টের শিরোনাম" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 text-xl font-bold border rounded"/>
                     <RichTextEditor value={formData.content} onChange={val => setFormData({...formData, content: val})} />
                  </div>
                  <div className="w-full lg:w-80 space-y-4">
                     <div className="bg-white p-4 rounded border shadow-sm">
                        <button onClick={handleSaveArticle} className="w-full py-2 bg-blue-600 text-white font-bold rounded flex justify-center gap-2"><Save size={16}/> {editArticle ? 'আপডেট' : 'প্রকাশ করুন'}</button>
                     </div>
                     <div className="bg-white p-4 rounded border shadow-sm">
                        <label className="text-sm font-bold block mb-2">ক্যাটাগরি</label>
                        <select className="w-full p-2 border rounded" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <button onClick={() => { const n = prompt('নতুন ক্যাটাগরি:'); if(n) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), {name: n}); }} className="text-xs text-blue-600 mt-2 block">+ নতুন ক্যাটাগরি</button>
                     </div>
                     <div className="bg-white p-4 rounded border shadow-sm">
                        <label className="text-sm font-bold block mb-2">ফিচার ইমেজ</label>
                        <div className="border border-dashed p-4 rounded bg-gray-50 text-center cursor-pointer relative">
                           {formData.image ? <img src={formData.image} className="h-32 object-cover mx-auto"/> : <span className="text-xs text-gray-400">আপলোড ইমেজ</span>}
                           <input type="file" onChange={e => handleImageUpload(e, 'article')} className="absolute inset-0 opacity-0" accept="image/*"/>
                        </div>
                     </div>
                     <div className="bg-white p-4 rounded border shadow-sm">
                        <label className="text-sm font-bold block mb-2">ট্যাগ (কমা দিয়ে লিখুন)</label>
                        <input type="text" placeholder="politics, bangla..." value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full p-2 border rounded text-sm"/>
                     </div>
                     <div className="bg-white p-4 rounded border shadow-sm">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.isLead} onChange={e => setFormData({...formData, isLead: e.target.checked})}/> লিড নিউজ</label>
                     </div>
                  </div>
               </div>
            )}

            {/* 3. MEDIA LIBRARY */}
            {adminTab === 'media' && (
               <div className="bg-white p-4 rounded border shadow-sm">
                  <div className="flex justify-between mb-4">
                     <h3 className="font-bold">মিডিয়া লাইব্রেরি</h3>
                     <div className="relative overflow-hidden bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
                        <span>আপলোড</span>
                        <input type="file" onChange={e => handleImageUpload(e, 'library')} className="absolute inset-0 opacity-0" accept="image/*"/>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                     {media.map(m => (
                       <div key={m.id} className="border rounded overflow-hidden group relative h-24">
                          <img src={m.image} className="w-full h-full object-cover"/>
                          <button onClick={() => handleDelete('media', m.id)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                       </div>
                     ))}
                  </div>
               </div>
            )}

            {/* 4. PAGES */}
            {adminTab === 'pages' && (
               <div className="space-y-6">
                  <div className="bg-white p-4 rounded border shadow-sm">
                     <h3 className="font-bold mb-4">{editPage ? 'পেজ এডিট' : 'নতুন পেজ'}</h3>
                     <input type="text" placeholder="পেজ টাইটেল (যেমন: আমাদের সম্পর্কে)" value={pageFormData.title} onChange={e => setPageFormData({...pageFormData, title: e.target.value})} className="w-full p-2 border rounded mb-2 font-bold"/>
                     <RichTextEditor value={pageFormData.content} onChange={val => setPageFormData({...pageFormData, content: val})} />
                     <button onClick={handleSavePage} className="mt-4 bg-green-600 text-white px-4 py-2 rounded font-bold">পেজ সেভ করুন</button>
                  </div>
                  <div className="bg-white p-4 rounded border shadow-sm">
                     <h3 className="font-bold mb-2">সকল পেজ</h3>
                     {pages.map(p => (
                       <div key={p.id} className="flex justify-between items-center border-b p-2">
                          <span>{p.title}</span>
                          <div className="flex gap-2">
                             <button onClick={() => { setEditPage(p); setPageFormData(p); window.scrollTo(0,0); }} className="text-blue-600"><Edit3 size={16}/></button>
                             <button onClick={() => handleDelete('pages', p.id)} className="text-red-600"><Trash2 size={16}/></button>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            )}

            {/* 5. COMMENTS */}
            {adminTab === 'comments' && (
              <div className="bg-white rounded border shadow-sm">
                 <h3 className="p-4 border-b font-bold">মন্তব্য মডারেশন</h3>
                 {comments.map(c => (
                   <div key={c.id} className="p-4 border-b flex gap-4">
                      <div className="flex-1">
                         <p className="font-bold text-sm">{c.name} <span className="text-gray-400 font-normal">on {c.articleTitle}</span></p>
                         <p className="text-gray-700 mt-1">{c.text}</p>
                         <span className={`text-xs px-2 py-0.5 rounded ${c.approved ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                           {c.approved ? 'অনুমোদিত' : 'অপেক্ষমান'}
                         </span>
                      </div>
                      <div className="flex flex-col gap-2">
                         {!c.approved && <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'comments', c.id), { approved: true })} className="text-green-600 text-sm">Approve</button>}
                         <button onClick={() => handleDelete('comments', c.id)} className="text-red-600 text-sm">Delete</button>
                      </div>
                   </div>
                 ))}
                 {comments.length === 0 && <p className="p-4 text-gray-400">কোনো মন্তব্য নেই</p>}
              </div>
            )}

            {/* 6. SETTINGS & LAYOUT */}
            {(adminTab === 'layout' || adminTab === 'settings') && (
              <div className="space-y-6 max-w-2xl mx-auto">
                 {/* Layout/Ads Section */}
                 {adminTab === 'layout' && (
                   <div className="bg-white p-6 rounded border shadow-sm">
                      <h3 className="font-bold mb-4 flex items-center gap-2"><Layout/> বিজ্ঞাপন কনফিগারেশন</h3>
                      {['header', 'sidebar', 'inArticle'].map(ad => (
                        <div key={ad} className="mb-4 border-b pb-4">
                           <label className="font-bold text-xs uppercase mb-2 block">{ad} AD</label>
                           <div className="flex gap-4">
                              <div className="w-24 h-20 bg-gray-50 border border-dashed rounded flex items-center justify-center relative">
                                 {siteSettings.ads[ad]?.image ? <img src={siteSettings.ads[ad].image} className="w-full h-full object-contain"/> : <ImageIcon className="text-gray-400"/>}
                                 <input type="file" onChange={e => handleImageUpload(e, `ad_${ad}`)} className="absolute inset-0 opacity-0 cursor-pointer"/>
                              </div>
                              <div className="flex-1">
                                 <input type="text" placeholder="Link URL" value={siteSettings.ads[ad]?.link || ''} onChange={e => handleSettingUpdate('ads', {...siteSettings.ads, [ad]: {...siteSettings.ads[ad], link: e.target.value}})} className="w-full p-2 border rounded text-sm"/>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}

                 {/* General Settings */}
                 {adminTab === 'settings' && (
                    <div className="bg-white p-6 rounded border shadow-sm space-y-4">
                       <h3 className="font-bold mb-4 flex items-center gap-2"><Settings/> সাধারণ সেটিংস</h3>
                       <div>
                          <label className="text-sm font-bold">সাইটের নাম</label>
                          <input value={siteSettings.siteName} onChange={e => handleSettingUpdate('siteName', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                       </div>
                       <div>
                          <label className="text-sm font-bold">SEO মেটা ডেসক্রিপশন</label>
                          <input value={siteSettings.seoDescription} onChange={e => handleSettingUpdate('seoDescription', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                       </div>
                       <div>
                          <label className="text-sm font-bold">লোগো</label>
                          <div className="mt-1 flex items-center gap-4">
                             {siteSettings.logo && <img src={siteSettings.logo} className="h-10 border"/>}
                             <input type="file" onChange={e => handleImageUpload(e, 'logo')} className="text-sm"/>
                          </div>
                       </div>
                       <div>
                          <label className="text-sm font-bold">ফুটার টেক্সট</label>
                          <input value={siteSettings.footerText} onChange={e => handleSettingUpdate('footerText', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                       </div>
                    </div>
                 )}
              </div>
            )}

            {/* 7. TOOLS (BACKUP) */}
            {adminTab === 'tools' && (
               <div className="bg-white p-6 rounded border shadow-sm max-w-xl mx-auto">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Database/> ব্যাকআপ ও রিস্টোর</h3>
                  <div className="space-y-4">
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                        <h4 className="font-bold text-blue-800">এক্সপোর্ট ডাটা (ব্যাকআপ)</h4>
                        <p className="text-sm text-blue-600 mb-3">পুরো সাইটের আর্টিকেল, পেজ এবং সেটিংস ডাউনলোড করে রাখুন।</p>
                        <button onClick={handleBackup} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Download size={16}/> ব্যাকআপ ডাউনলোড করুন</button>
                     </div>
                     <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                        <h4 className="font-bold text-orange-800">ইমপোর্ট ডাটা (রিস্টোর)</h4>
                        <p className="text-sm text-orange-600 mb-3">ব্যাকআপ ফাইল (.json) আপলোড করে সাইট রিস্টোর করুন।</p>
                        <input type="file" accept=".json" onChange={handleRestore} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"/>
                     </div>
                  </div>
               </div>
            )}

         </div>
      </div>
    </div>
  );

  const ArticleView = () => (
    <div className="bg-white min-h-screen pb-10">
      <Navbar categories={categories} pages={pages} activeCategory={activeCategory} setActiveCategory={setActiveCategory} setView={setView} setSelectedPage={setSelectedPage} />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
         {/* Breadcrumb */}
         <div className="flex gap-2 text-sm text-gray-500 mb-4">
            <span className="text-blue-600 font-bold cursor-pointer" onClick={() => setView('home')}>হোম</span> 
            <span>/</span>
            <span>{selectedArticle.category}</span>
         </div>
         
         <h1 className="text-3xl md:text-5xl font-bold font-serif mb-4 text-gray-900 leading-tight">
           {selectedArticle.title}
         </h1>
         
         <div className="flex justify-between items-center border-t border-b py-3 mb-6">
           <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                {selectedArticle.author?.[0] || 'A'}
              </div>
              <div className="text-xs">
                 <p className="font-bold text-gray-800">{selectedArticle.author}</p>
                 <p className="text-gray-500">{getBanglaDate(selectedArticle.timestamp?.seconds)}</p>
              </div>
           </div>
           <button className="text-gray-400 hover:text-blue-600"><Share2 size={20}/></button>
         </div>
         
         {selectedArticle.image && (
           <div className="mb-8">
             <img src={selectedArticle.image} className="w-full h-auto rounded-lg" alt="News"/>
             <p className="text-xs text-center text-gray-500 mt-2">ছবি: সংগৃহীত</p>
           </div>
         )}

         {/* In-Article Ad */}
         {siteSettings.ads?.inArticle?.image && (
           <div className="my-8 flex justify-center bg-gray-50 py-4 border-y">
             <div className="max-w-[80%]">
                <AdDisplay adData={siteSettings.ads.inArticle} />
                <p className="text-[10px] text-center text-gray-400 mt-1">বিজ্ঞাপন</p>
             </div>
           </div>
         )}

         <div className="prose prose-lg max-w-none font-serif text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
         
         {/* Tags */}
         {selectedArticle.tags && (
            <div className="mt-8 flex gap-2 flex-wrap">
               {selectedArticle.tags.split(',').map((tag, i) => (
                  <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm flex items-center gap-1"><Tag size={12}/> {tag.trim()}</span>
               ))}
            </div>
         )}

         {/* Comments Section */}
         <div className="mt-12 pt-8 border-t">
            <h3 className="text-xl font-bold mb-6">মন্তব্য ({comments.filter(c => c.articleId === selectedArticle.id && c.approved).length})</h3>
            
            {/* Comment Form */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
               <input type="text" placeholder="আপনার নাম" className="w-full p-2 mb-2 border rounded" value={commentName} onChange={e => setCommentName(e.target.value)} />
               <textarea placeholder="আপনার মতামত লিখুন..." className="w-full p-2 border rounded h-24" value={commentText} onChange={e => setCommentText(e.target.value)} />
               <button onClick={handleCommentSubmit} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded font-bold">মন্তব্য করুন</button>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
               {comments.filter(c => c.articleId === selectedArticle.id && c.approved).map(c => (
                  <div key={c.id} className="flex gap-4">
                     <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">{c.name[0]}</div>
                     <div>
                        <p className="font-bold text-sm">{c.name}</p>
                        <p className="text-xs text-gray-400">{getBanglaDate(c.timestamp?.seconds)}</p>
                        <p className="mt-1 text-gray-700">{c.text}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
      <footer className="bg-slate-900 text-white mt-12 py-12"><div className="container mx-auto px-4 text-center"><p className="text-sm text-gray-400">{siteSettings.footerText}</p></div></footer>
    </div>
  );

  const PageView = () => (
     <div className="bg-white min-h-screen pb-10">
        <Navbar categories={categories} pages={pages} activeCategory={activeCategory} setActiveCategory={setActiveCategory} setView={setView} setSelectedPage={setSelectedPage} />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
           <h1 className="text-4xl font-bold mb-8">{selectedPage.title}</h1>
           <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: selectedPage.content }} />
        </div>
        <footer className="bg-slate-900 text-white mt-12 py-12"><div className="container mx-auto px-4 text-center"><p className="text-sm text-gray-400">{siteSettings.footerText}</p></div></footer>
     </div>
  );

  const HomeView = () => {
    const filtered = activeCategory === 'সব খবর' ? articles : articles.filter(a => a.category === activeCategory);
    const lead = filtered.find(a => a.isLead) || filtered[0];
    const others = filtered.filter(a => a.id !== lead?.id);
    
    // Update Meta Title
    useEffect(() => { updateMetaTags(siteSettings.siteName, siteSettings.seoDescription); }, []);

    return (
      <div className="animate-fade-in pb-10">
        {permissionError && <div className="bg-red-600 text-white p-2 text-center text-sm">ডাটাবেজ পারমিশন সমস্যা। ফায়ারবেস রুলস চেক করুন।</div>}
        
        <div className="bg-white pt-4 pb-2 border-b">
          <div className="container mx-auto px-4 flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>{getBanglaDate()}</span>
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <div className="flex gap-2">
                   <button onClick={() => setView('admin')} className="flex items-center gap-1 text-blue-600 font-bold hover:underline"><ShieldCheck size={14}/> ড্যাশবোর্ড</button>
                   <button onClick={handleLogout} className="text-gray-500 hover:text-black">লগ আউট</button>
                </div>
              ) : (
                <button onClick={() => setView('login')} className="flex items-center gap-1 hover:text-blue-600 font-bold"><User size={14}/> লগইন</button>
              )}
            </div>
          </div>
          <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="cursor-pointer" onClick={() => setView('home')}>
                {siteSettings.logo ? <img src={siteSettings.logo} alt="Logo" className="h-16 md:h-20 object-contain" /> : <h1 className="text-5xl font-extrabold text-black font-serif tracking-tight">{siteSettings.siteName}</h1>}
             </div>
             {siteSettings.ads?.header?.image && <div className="w-full md:w-auto max-w-[728px]"><AdDisplay adData={siteSettings.ads.header} className="h-auto max-h-24 w-auto mx-auto rounded" /></div>}
          </div>
        </div>

        <Navbar categories={categories} pages={pages} activeCategory={activeCategory} setActiveCategory={setActiveCategory} setView={setView} setSelectedPage={setSelectedPage} />

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-9">
              {lead ? (
                <div onClick={() => { setSelectedArticle(lead); setView('article'); updateMetaTags(lead.title); }} className="mb-8 cursor-pointer group">
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="order-2 md:order-1">
                      <span className="text-blue-600 font-bold text-sm mb-2 inline-block">{lead.category}</span>
                      <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight group-hover:text-blue-600 transition-colors">{lead.title}</h2>
                      <p className="text-gray-600 mt-3 text-lg line-clamp-3 leading-relaxed">{lead.content.replace(/<[^>]+>/g, '')}</p>
                    </div>
                    <div className="order-1 md:order-2">
                      <div className="overflow-hidden rounded-lg aspect-video bg-gray-100">
                        {lead.image ? <img src={lead.image} alt="Lead" className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">ছবি নেই</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : <div className="text-center py-10 text-gray-400">লোড হচ্ছে...</div>}

              <div className="border-t border-gray-200 my-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {others.map(news => (
                  <div key={news.id} onClick={() => { setSelectedArticle(news); setView('article'); updateMetaTags(news.title); }} className="cursor-pointer group flex flex-col h-full">
                    <div className="overflow-hidden rounded-lg mb-3 aspect-video bg-gray-100">
                      {news.image && <img src={news.image} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300" />}
                    </div>
                    <h3 className="font-serif font-bold text-lg leading-snug group-hover:text-blue-600 mb-2">{news.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-auto">{news.content.replace(/<[^>]+>/g, '')}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-8 border-l border-gray-100 pl-0 lg:pl-6">
               {siteSettings.ads?.sidebar?.image && <div className="bg-gray-50 rounded border overflow-hidden"><AdDisplay adData={siteSettings.ads.sidebar} /><p className="text-[10px] text-center text-gray-400">বিজ্ঞাপন</p></div>}
               <div>
                 <h4 className="font-bold text-xl border-b-2 border-blue-600 inline-block mb-4 pr-4">সর্বাধিক পঠিত</h4>
                 <div className="space-y-4">
                    {articles.slice(0, 5).map((news, i) => (
                      <div key={i} onClick={() => { setSelectedArticle(news); setView('article'); }} className="flex gap-3 cursor-pointer group border-b border-gray-100 pb-2">
                        <span className="text-3xl font-extrabold text-gray-200">{i+1}</span>
                        <h5 className="font-medium text-sm group-hover:text-blue-600 leading-snug">{news.title}</h5>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          </div>
        </div>

        <footer className="bg-slate-900 text-white mt-12 py-12">
            <div className="container mx-auto px-4 text-center">
                {siteSettings.logo ? <img src={siteSettings.logo} className="h-16 mx-auto mb-4 filter brightness-0 invert" alt="logo"/> : <h2 className="text-2xl font-bold mb-4">{siteSettings.siteName}</h2>}
                <p className="text-gray-400 mb-2">সম্পাদক: {siteSettings.editorName}</p>
                <div className="flex justify-center gap-4 mb-6">
                    <a href="#" className="hover:text-blue-500">Facebook</a>
                    <a href="#" className="hover:text-blue-500">Twitter</a>
                    <a href="#" className="hover:text-blue-500">Youtube</a>
                </div>
                <div className="border-t border-gray-800 pt-6"><p className="text-sm text-gray-500">{siteSettings.footerText}</p></div>
            </div>
        </footer>
      </div>
    );
  };

  const LoginModal = () => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-2xl p-8 relative animate-scale-in">
        <button onClick={() => setView('home')} className="absolute top-4 right-4 text-gray-400 hover:text-red-600"><X/></button>
        <div className="text-center mb-6">
           <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32}/></div>
           <h2 className="text-2xl font-bold">এডমিন লগইন</h2>
        </div>
        <div className="space-y-4">
           <button onClick={handleLogin} className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-50 shadow flex items-center justify-center gap-2">Google দিয়ে লগইন করুন</button>
           <p className="text-xs text-center text-red-500">শুধুমাত্র eco452@gmail.com অনুমোদিত</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {showInstallBtn && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
           <div className="bg-blue-600 text-white p-3 rounded-lg shadow-xl flex items-center gap-3 max-w-xs relative">
             <button onClick={() => setShowInstallBtn(false)} className="absolute -top-2 -left-2 bg-white text-blue-600 rounded-full p-1 border shadow"><X size={12}/></button>
             <div className="bg-white/20 p-2 rounded"><Download size={20}/></div>
             <div><p className="font-bold text-sm">অ্যাপটি ইন্সটল করুন</p></div>
             <button onClick={handleInstallClick} className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-gray-100">Install</button>
           </div>
        </div>
      )}
      {view === 'home' && <HomeView />}
      {view === 'article' && <ArticleView />}
      {view === 'page' && <PageView />}
      {view === 'login' && <LoginModal />}
      {view === 'admin' && <AdminView />}
    </div>
  );
}