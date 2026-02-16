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
  setDoc
} from 'firebase/firestore';
import { 
  Menu, X, Search, User, ShieldCheck, Edit3, Trash2, 
  Plus, Image as ImageIcon, Layout, Save,
  Share2, Download, LogOut, ChevronRight, AlertTriangle, 
  Link as LinkIcon, Upload, FileText, Settings, Eye, List
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

const appId = 'diganta-news-pwa-v2'; 

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

const updateMetaTags = (title) => {
  document.title = title;
  let metaOgTitle = document.querySelector('meta[property="og:title"]');
  if (!metaOgTitle) {
    metaOgTitle = document.createElement('meta');
    metaOgTitle.setAttribute('property', 'og:title');
    document.head.appendChild(metaOgTitle);
  }
  metaOgTitle.content = title;
};

// --- Components ---

// Rich Text Editor (Optimized)
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
    
    const newValue = newText;
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  return (
    <div className="border rounded-md overflow-hidden border-gray-300 bg-white">
      <div className="bg-gray-50 p-2 flex gap-2 border-b flex-wrap">
        <button type="button" onClick={() => insertTag('b')} className="px-3 py-1 bg-white border rounded font-bold hover:bg-orange-50 text-sm">B</button>
        <button type="button" onClick={() => insertTag('h3')} className="px-3 py-1 bg-white border rounded font-bold hover:bg-orange-50 text-sm">H3</button>
        <button type="button" onClick={() => insertTag('p')} className="px-3 py-1 bg-white border rounded hover:bg-orange-50 text-sm">P</button>
        <button type="button" onClick={() => insertTag('br')} className="px-3 py-1 bg-white border rounded hover:bg-orange-50 text-sm">New Line</button>
      </div>
      <textarea
        id="news-content"
        className="w-full h-[400px] p-4 focus:outline-none resize-none font-serif text-lg leading-relaxed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="এখানে সংবাদ লিখুন..."
      />
    </div>
  );
};

const Navbar = ({ categories, activeCategory, setActiveCategory, setView }) => (
  <nav className="sticky top-0 bg-white z-40 border-b shadow-sm">
    <div className="container mx-auto">
      <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide px-4 py-3 gap-6 md:justify-center">
          <button 
            onClick={() => { setActiveCategory('সব খবর'); setView('home'); window.scrollTo(0,0); }}
            className={`text-sm font-bold uppercase tracking-wider ${activeCategory === 'সব খবর' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-700 hover:text-red-600'}`}
          >
            সব খবর
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => { setActiveCategory(cat.name); setView('home'); window.scrollTo(0,0); }}
              className={`text-sm font-bold uppercase tracking-wider ${activeCategory === cat.name ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-700 hover:text-red-600'}`}
            >
              {cat.name}
            </button>
          ))}
      </div>
    </div>
  </nav>
);

const AdDisplay = ({ adData, className }) => {
  if (!adData || !adData.image) return null;
  const Content = () => (
    <img 
      src={adData.image} 
      alt="Advertisement" 
      className={`w-full h-auto object-cover ${className}`} 
    />
  );
  if (adData.link) {
    return (
      <a href={adData.link} target="_blank" rel="noopener noreferrer" className="block cursor-pointer hover:opacity-90 transition">
        <Content />
      </a>
    );
  }
  return <Content />;
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('home'); 
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [permissionError, setPermissionError] = useState(false);
  
  // Admin Panel Tab State (Blogger Style)
  const [adminTab, setAdminTab] = useState('posts'); // posts, new-post, layout, settings
  
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'দিগন্ত',
    logo: '', 
    editorName: 'মঞ্জুরুল হক',
    footerText: 'স্বত্ব © ২০২৬ দিগন্ত মিডিয়া',
    ads: {
      header: { image: '', link: '' },
      sidebar: { image: '', link: '' },
      inArticle: { image: '', link: '' }
    }
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Admin Editor State
  const [editArticle, setEditArticle] = useState(null); // If null, create mode
  const [activeCategory, setActiveCategory] = useState('সব খবর');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false
  });

  // --- Install Prompt ---
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
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
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBtn(false);
      }
    } else {
      alert("ব্রাউজার মেনু থেকে 'Add to Home Screen' সিলেক্ট করুন।");
    }
  };

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === 'eco452@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleError = (error) => {
      console.error("Data Fetch Error:", error);
      if (error.code === 'permission-denied') setPermissionError(true);
    };

    const unsubArticles = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'articles')), 
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setArticles(data);
        setPermissionError(false);
      }, handleError);

    const unsubCats = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), 
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (data.length === 0 && isAdmin) {
           ['বাংলাদেশ', 'রাজনীতি', 'অর্থনীতি', 'আন্তর্জাতিক', 'খেলা', 'বিনোদন', 'প্রযুক্তি', 'মতামত'].forEach(name => 
             addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), { name })
           );
        } else {
          setCategories(data);
        }
      }, handleError);

    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), 
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSiteSettings(prev => ({
            ...prev,
            ...data,
            ads: { ...prev.ads, ...data.ads } 
          }));
        }
      }, handleError);

    return () => { unsubArticles(); unsubCats(); unsubSettings(); };
  }, [isAdmin]);

  // --- Handlers ---
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setView('home'); 
    } catch (error) {
      alert("লগইন সমস্যা: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setView('home');
  };

  const handleSaveArticle = async () => {
    if (!isAdmin) return alert("পারমিশন নেই");
    if (!formData.title) return alert('শিরোনাম দিন');
    
    const payload = {
      ...formData,
      timestamp: serverTimestamp(),
      author: siteSettings.editorName
    };
    
    try {
      if (editArticle) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'articles', editArticle.id), payload);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'articles'), payload);
      }
      // Reset logic
      setEditArticle(null);
      setFormData({ title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false });
      setAdminTab('posts'); // Go back to list
      alert('সফলভাবে সংরক্ষিত হয়েছে');
    } catch (e) {
      alert('ত্রুটি: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if(!isAdmin) return;
    if(confirm('মুছে ফেলতে চান?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'articles', id));
    }
  };

  const handleEditInit = (article) => {
    setEditArticle(article);
    setFormData(article);
    setAdminTab('new-post');
  };

  const handleNewPostInit = () => {
    setEditArticle(null);
    setFormData({ title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false });
    setAdminTab('new-post');
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await resizeImage(file, 800);
      if (field === 'article') {
        setFormData({ ...formData, image: base64 });
      } else if (field === 'logo') {
        handleSettingUpdate('logo', base64);
      } else if (field.startsWith('ad_')) {
        const adType = field.split('_')[1]; 
        const newAds = { ...siteSettings.ads, [adType]: { ...siteSettings.ads[adType], image: base64 } };
        handleSettingUpdate('ads', newAds);
      }
    }
  };

  const handleSettingUpdate = async (key, value) => {
    const newSettings = { ...siteSettings, [key]: value };
    setSiteSettings(newSettings);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), newSettings);
    } catch (e) {
      console.error("Settings Save Failed", e);
    }
  };

  const handleAdLinkUpdate = (adType, link) => {
    const newAds = { ...siteSettings.ads, [adType]: { ...siteSettings.ads[adType], link: link } };
    handleSettingUpdate('ads', newAds);
  };

  // --- Views ---

  // *** ADMIN PANEL (Blogger Style) ***
  const AdminView = () => {
    return (
      <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
        
        {/* Sidebar (Left) */}
        <div className="w-16 md:w-64 bg-white border-r flex flex-col shadow-sm z-20">
           <div className="p-4 border-b flex items-center gap-2 text-orange-600">
              <ShieldCheck size={28}/>
              <span className="hidden md:block font-bold text-xl tracking-tight">Blogger Admin</span>
           </div>
           
           <div className="p-4">
              <button 
                onClick={handleNewPostInit}
                className="w-full flex items-center justify-center md:justify-start gap-2 bg-orange-600 text-white p-3 rounded-full shadow-md hover:bg-orange-700 transition"
              >
                <Plus size={20}/> <span className="hidden md:block font-bold">New Post</span>
              </button>
           </div>

           <nav className="flex-1 overflow-y-auto mt-2">
              <div 
                onClick={() => setAdminTab('posts')}
                className={`flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-orange-50 ${adminTab === 'posts' ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-600' : 'text-gray-600'}`}
              >
                <FileText size={20}/> <span className="hidden md:block font-medium">Posts</span>
              </div>
              <div 
                onClick={() => setAdminTab('layout')}
                className={`flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-orange-50 ${adminTab === 'layout' ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-600' : 'text-gray-600'}`}
              >
                <Layout size={20}/> <span className="hidden md:block font-medium">Layout (Ads)</span>
              </div>
              <div 
                onClick={() => setAdminTab('settings')}
                className={`flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-orange-50 ${adminTab === 'settings' ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-600' : 'text-gray-600'}`}
              >
                <Settings size={20}/> <span className="hidden md:block font-medium">Settings</span>
              </div>
           </nav>
           
           <div className="p-4 border-t">
              <button onClick={() => setView('home')} className="w-full text-left flex items-center gap-4 px-2 py-2 text-gray-600 hover:text-blue-600">
                <Eye size={20}/> <span className="hidden md:block text-sm">View Blog</span>
              </button>
              <button onClick={handleLogout} className="w-full text-left flex items-center gap-4 px-2 py-2 text-gray-600 hover:text-red-600 mt-2">
                <LogOut size={20}/> <span className="hidden md:block text-sm">Logout</span>
              </button>
           </div>
        </div>

        {/* Main Content Area (Right) */}
        <div className="flex-1 flex flex-col overflow-hidden h-full">
           
           {/* Top Bar */}
           <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
              <h2 className="text-xl font-bold text-gray-700 capitalize">
                {adminTab === 'posts' && 'All Posts'}
                {adminTab === 'new-post' && (editArticle ? 'Edit Post' : 'Create New Post')}
                {adminTab === 'layout' && 'Layout & Ads'}
                {adminTab === 'settings' && 'Site Settings'}
              </h2>
              <div className="text-sm text-gray-500">{user?.email}</div>
           </div>

           {/* Content Body */}
           <div className="flex-1 overflow-y-auto p-4 md:p-8">
              
              {/* 1. POSTS LIST */}
              {adminTab === 'posts' && (
                <div className="bg-white rounded-lg shadow-sm border">
                   <div className="flex items-center p-4 border-b bg-gray-50 font-bold text-gray-600 text-sm">
                      <div className="flex-1">Title</div>
                      <div className="w-32 hidden md:block">Author</div>
                      <div className="w-32 hidden md:block">Date</div>
                      <div className="w-24 text-right">Actions</div>
                   </div>
                   {articles.map(article => (
                     <div key={article.id} className="group flex items-center p-4 border-b hover:bg-gray-50 transition">
                        <div className="flex-1 pr-4">
                           <h3 className="font-bold text-gray-800 text-sm md:text-base cursor-pointer hover:text-orange-600" onClick={() => handleEditInit(article)}>
                             {article.title}
                           </h3>
                           <div className="flex gap-2 mt-1 text-xs text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="cursor-pointer hover:underline" onClick={() => handleEditInit(article)}>Edit</span>
                              <span>|</span>
                              <span className="cursor-pointer hover:underline" onClick={() => { setSelectedArticle(article); setView('article'); }}>View</span>
                              <span>|</span>
                              <span className="cursor-pointer hover:underline text-red-600" onClick={() => handleDelete(article.id)}>Delete</span>
                           </div>
                        </div>
                        <div className="w-32 hidden md:block text-xs text-gray-500">{article.author}</div>
                        <div className="w-32 hidden md:block text-xs text-gray-500">{article.timestamp ? new Date(article.timestamp.seconds * 1000).toLocaleDateString() : 'Draft'}</div>
                        <div className="w-24 flex justify-end gap-2">
                           <button onClick={() => handleDelete(article.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {/* 2. EDITOR (NEW/EDIT POST) */}
              {adminTab === 'new-post' && (
                 <div className="flex flex-col lg:flex-row gap-6 h-full">
                    {/* Left: Title & Editor */}
                    <div className="flex-1 flex flex-col gap-4">
                       <input 
                         type="text" 
                         placeholder="Title" 
                         value={formData.title}
                         onChange={(e) => setFormData({...formData, title: e.target.value})}
                         className="w-full p-4 text-2xl font-bold border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                       />
                       <RichTextEditor value={formData.content} onChange={(val) => setFormData({...formData, content: val})} />
                    </div>
                    
                    {/* Right: Sidebar Settings */}
                    <div className="w-full lg:w-80 flex flex-col gap-4">
                       <div className="bg-white p-4 rounded shadow-sm border">
                          <h3 className="font-bold text-sm text-gray-600 mb-3 uppercase tracking-wider">Publish</h3>
                          <button 
                            onClick={handleSaveArticle}
                            className="w-full py-2 bg-orange-600 text-white font-bold rounded hover:bg-orange-700 flex items-center justify-center gap-2"
                          >
                            <Save size={16}/> {editArticle ? 'Update' : 'Publish'}
                          </button>
                       </div>

                       <div className="bg-white p-4 rounded shadow-sm border">
                          <h3 className="font-bold text-sm text-gray-600 mb-3 uppercase tracking-wider">Labels</h3>
                          <select 
                            className="w-full p-2 border rounded bg-gray-50"
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                          >
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                          <button onClick={() => { const n = prompt('New Label Name:'); if(n) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), {name: n}); }} className="mt-2 text-xs text-orange-600 hover:underline">+ Create new label</button>
                       </div>

                       <div className="bg-white p-4 rounded shadow-sm border">
                          <h3 className="font-bold text-sm text-gray-600 mb-3 uppercase tracking-wider">Featured Image</h3>
                          <div className="border border-dashed p-4 rounded bg-gray-50 text-center cursor-pointer relative hover:bg-gray-100">
                             {formData.image ? (
                               <img src={formData.image} className="w-full h-32 object-cover rounded"/>
                             ) : (
                               <div className="flex flex-col items-center text-gray-400">
                                 <ImageIcon size={24}/>
                                 <span className="text-xs mt-1">Upload Image</span>
                               </div>
                             )}
                             <input type="file" onChange={(e) => handleImageUpload(e, 'article')} className="absolute inset-0 opacity-0" accept="image/*"/>
                          </div>
                       </div>

                       <div className="bg-white p-4 rounded shadow-sm border">
                          <h3 className="font-bold text-sm text-gray-600 mb-3 uppercase tracking-wider">Options</h3>
                          <div className="flex items-center gap-2">
                             <input type="checkbox" id="leadCheck" checked={formData.isLead} onChange={e => setFormData({...formData, isLead: e.target.checked})} className="w-4 h-4 text-orange-600" />
                             <label htmlFor="leadCheck" className="text-sm">Feature as Lead News</label>
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              {/* 3. LAYOUT (ADS) */}
              {adminTab === 'layout' && (
                <div className="max-w-4xl mx-auto space-y-6">
                   <div className="bg-orange-50 border border-orange-200 p-4 rounded-md">
                     <h3 className="font-bold text-orange-800">Layout Configuration</h3>
                     <p className="text-sm text-orange-700">Manage your site's advertisements here. Click the upload icon to add images and paste links.</p>
                   </div>
                   
                   {/* Header Ad */}
                   <div className="bg-white p-6 rounded shadow-sm border relative">
                      <span className="absolute top-4 right-4 bg-gray-200 text-gray-600 px-2 py-1 text-xs font-bold rounded">Header Gadget</span>
                      <h4 className="font-bold text-lg mb-4">Header Banner (728x90)</h4>
                      <div className="flex gap-4 items-start">
                         <div className="w-1/3 border-2 border-dashed h-24 rounded flex items-center justify-center relative bg-gray-50 hover:bg-gray-100 cursor-pointer">
                            {siteSettings.ads.header?.image ? <img src={siteSettings.ads.header.image} className="h-full w-full object-contain"/> : <span className="text-gray-400 text-xs">Upload</span>}
                            <input type="file" onChange={(e) => handleImageUpload(e, 'ad_header')} className="absolute inset-0 opacity-0" accept="image/*"/>
                         </div>
                         <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 block mb-1">Target URL</label>
                            <input 
                              value={siteSettings.ads.header?.link || ''}
                              onChange={(e) => handleAdLinkUpdate('header', e.target.value)}
                              className="w-full p-2 border rounded text-sm" placeholder="https://..."
                            />
                            <button onClick={() => handleSettingUpdate('ads', siteSettings.ads)} className="mt-2 text-xs bg-gray-800 text-white px-3 py-1 rounded">Save</button>
                         </div>
                      </div>
                   </div>

                   {/* Sidebar Ad */}
                   <div className="bg-white p-6 rounded shadow-sm border relative">
                      <span className="absolute top-4 right-4 bg-gray-200 text-gray-600 px-2 py-1 text-xs font-bold rounded">Sidebar Gadget</span>
                      <h4 className="font-bold text-lg mb-4">Sidebar Square (300x250)</h4>
                      <div className="flex gap-4 items-start">
                         <div className="w-1/3 border-2 border-dashed h-32 rounded flex items-center justify-center relative bg-gray-50 hover:bg-gray-100 cursor-pointer">
                            {siteSettings.ads.sidebar?.image ? <img src={siteSettings.ads.sidebar.image} className="h-full w-full object-contain"/> : <span className="text-gray-400 text-xs">Upload</span>}
                            <input type="file" onChange={(e) => handleImageUpload(e, 'ad_sidebar')} className="absolute inset-0 opacity-0" accept="image/*"/>
                         </div>
                         <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 block mb-1">Target URL</label>
                            <input 
                              value={siteSettings.ads.sidebar?.link || ''}
                              onChange={(e) => handleAdLinkUpdate('sidebar', e.target.value)}
                              className="w-full p-2 border rounded text-sm" placeholder="https://..."
                            />
                            <button onClick={() => handleSettingUpdate('ads', siteSettings.ads)} className="mt-2 text-xs bg-gray-800 text-white px-3 py-1 rounded">Save</button>
                         </div>
                      </div>
                   </div>

                   {/* Article Ad */}
                   <div className="bg-white p-6 rounded shadow-sm border relative">
                      <span className="absolute top-4 right-4 bg-gray-200 text-gray-600 px-2 py-1 text-xs font-bold rounded">Post Body Gadget</span>
                      <h4 className="font-bold text-lg mb-4">In-Article Banner</h4>
                      <div className="flex gap-4 items-start">
                         <div className="w-1/3 border-2 border-dashed h-24 rounded flex items-center justify-center relative bg-gray-50 hover:bg-gray-100 cursor-pointer">
                            {siteSettings.ads.inArticle?.image ? <img src={siteSettings.ads.inArticle.image} className="h-full w-full object-contain"/> : <span className="text-gray-400 text-xs">Upload</span>}
                            <input type="file" onChange={(e) => handleImageUpload(e, 'ad_inArticle')} className="absolute inset-0 opacity-0" accept="image/*"/>
                         </div>
                         <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 block mb-1">Target URL</label>
                            <input 
                              value={siteSettings.ads.inArticle?.link || ''}
                              onChange={(e) => handleAdLinkUpdate('inArticle', e.target.value)}
                              className="w-full p-2 border rounded text-sm" placeholder="https://..."
                            />
                            <button onClick={() => handleSettingUpdate('ads', siteSettings.ads)} className="mt-2 text-xs bg-gray-800 text-white px-3 py-1 rounded">Save</button>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* 4. SETTINGS */}
              {adminTab === 'settings' && (
                 <div className="max-w-2xl mx-auto bg-white rounded shadow-sm border p-6 space-y-6">
                    <h3 className="font-bold text-lg border-b pb-2">Basic Settings</h3>
                    
                    <div>
                      <label className="font-bold text-sm text-gray-600">Title</label>
                      <input value={siteSettings.siteName} onChange={e => handleSettingUpdate('siteName', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                    </div>

                    <div>
                      <label className="font-bold text-sm text-gray-600">Description / Footer Text</label>
                      <input value={siteSettings.footerText} onChange={e => handleSettingUpdate('footerText', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                    </div>

                    <div>
                      <label className="font-bold text-sm text-gray-600">Logo</label>
                      <div className="flex items-center gap-4 mt-1">
                        {siteSettings.logo && <img src={siteSettings.logo} className="h-12 border p-1 rounded"/>}
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm font-bold text-gray-600">
                           Upload Logo
                           <input type="file" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" accept="image/*"/>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-sm text-gray-600">Editor Name</label>
                      <input value={siteSettings.editorName} onChange={e => handleSettingUpdate('editorName', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                    </div>
                 </div>
              )}

           </div>
        </div>
      </div>
    );
  };

  const HomeView = () => {
    const filtered = activeCategory === 'সব খবর' ? articles : articles.filter(a => a.category === activeCategory);
    const lead = filtered.find(a => a.isLead) || filtered[0];
    const others = filtered.filter(a => a.id !== lead?.id);

    return (
      <div className="animate-fade-in pb-10">
        {permissionError && (
          <div className="bg-red-600 text-white p-2 text-center text-sm">
             ডাটাবেজ পারমিশন সমস্যা। ফায়ারবেস রুলস চেক করুন।
          </div>
        )}

        <div className="bg-white pt-4 pb-2 border-b">
          <div className="container mx-auto px-4 flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>{getBanglaDate()}</span>
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <div className="flex gap-2">
                   <button onClick={() => setView('admin')} className="flex items-center gap-1 text-red-600 font-bold hover:underline">
                     <ShieldCheck size={14}/> ড্যাশবোর্ড
                   </button>
                   <button onClick={handleLogout} className="text-gray-500 hover:text-black">লগ আউট</button>
                </div>
              ) : (
                <button onClick={() => setView('login')} className="flex items-center gap-1 hover:text-red-600 font-bold">
                   <User size={14}/> এডমিন লগইন
                </button>
              )}
            </div>
          </div>
          
          <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
             {/* Logo or Site Name */}
             <div className="cursor-pointer" onClick={() => setView('home')}>
                {siteSettings.logo ? (
                  <img src={siteSettings.logo} alt="Logo" className="h-16 md:h-20 object-contain" />
                ) : (
                  <h1 className="text-5xl font-extrabold text-black font-serif tracking-tight">{siteSettings.siteName}</h1>
                )}
             </div>

             {/* Header Ad */}
             {siteSettings.ads?.header?.image && (
               <div className="w-full md:w-auto max-w-[728px]">
                 <AdDisplay adData={siteSettings.ads.header} className="h-auto max-h-24 w-auto mx-auto rounded" />
               </div>
             )}
          </div>
        </div>

        <Navbar categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} setView={setView} />

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-9">
              {lead && (
                <div onClick={() => { setSelectedArticle(lead); setView('article'); updateMetaTags(lead.title); }} className="mb-8 cursor-pointer group">
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="order-2 md:order-1">
                      <span className="text-red-600 font-bold text-sm mb-2 inline-block">{lead.category}</span>
                      <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight group-hover:text-red-600 transition-colors">
                        {lead.title}
                      </h2>
                      <p className="text-gray-600 mt-3 text-lg line-clamp-3 leading-relaxed">
                        {lead.content.replace(/<[^>]+>/g, '')}
                      </p>
                    </div>
                    <div className="order-1 md:order-2">
                      <div className="overflow-hidden rounded-lg aspect-video bg-gray-100">
                        {lead.image ? (
                          <img src={lead.image} alt="Lead" className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-400">ছবি নেই</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 my-6"></div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {others.map(news => (
                  <div key={news.id} onClick={() => { setSelectedArticle(news); setView('article'); updateMetaTags(news.title); }} className="cursor-pointer group flex flex-col h-full">
                    <div className="overflow-hidden rounded-lg mb-3 aspect-video bg-gray-100">
                      {news.image && <img src={news.image} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300" />}
                    </div>
                    <h3 className="font-serif font-bold text-lg leading-snug group-hover:text-red-600 mb-2">
                      {news.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-auto">
                      {news.content.replace(/<[^>]+>/g, '')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-8 border-l border-gray-100 pl-0 lg:pl-6">
               {/* Sidebar Ad */}
               {siteSettings.ads?.sidebar?.image && (
                 <div className="bg-gray-50 rounded border overflow-hidden">
                   <AdDisplay adData={siteSettings.ads.sidebar} />
                   <p className="text-[10px] text-center text-gray-400">বিজ্ঞাপন</p>
                 </div>
               )}

               <div>
                 <h4 className="font-bold text-xl border-b-2 border-red-600 inline-block mb-4 pr-4">সর্বাধিক পঠিত</h4>
                 <div className="space-y-4">
                    {articles.slice(0, 5).map((news, i) => (
                      <div key={i} onClick={() => { setSelectedArticle(news); setView('article'); }} className="flex gap-3 cursor-pointer group border-b border-gray-100 pb-2">
                        <span className="text-3xl font-extrabold text-gray-200">{i+1}</span>
                        <h5 className="font-medium text-sm group-hover:text-red-600 leading-snug">{news.title}</h5>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white mt-12 py-12">
            <div className="container mx-auto px-4 text-center">
                {siteSettings.logo ? (
                  <img src={siteSettings.logo} className="h-16 mx-auto mb-4 filter brightness-0 invert" alt="logo"/>
                ) : (
                  <h2 className="text-2xl font-bold mb-4">{siteSettings.siteName}</h2>
                )}
                <p className="text-gray-400 mb-2">সম্পাদক: {siteSettings.editorName}</p>
                <div className="flex justify-center gap-4 mb-6">
                    <a href="#" className="hover:text-red-500">Facebook</a>
                    <a href="#" className="hover:text-red-500">Twitter</a>
                    <a href="#" className="hover:text-red-500">Youtube</a>
                </div>
                <div className="border-t border-gray-800 pt-6">
                   <p className="text-sm text-gray-500">{siteSettings.footerText}</p>
                </div>
            </div>
        </footer>
      </div>
    );
  };

  const ArticleView = () => (
    <div className="bg-white min-h-screen pb-10">
      <Navbar categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} setView={setView} />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
         <div className="flex gap-2 text-sm text-gray-500 mb-4">
            <span className="text-red-600 font-bold cursor-pointer" onClick={() => setView('home')}>হোম</span> 
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

         {/* In-Article Ad (Visible in every article) */}
         {siteSettings.ads?.inArticle?.image && (
           <div className="my-8 flex justify-center bg-gray-50 py-4 border-y">
             <div className="max-w-[80%]">
                <AdDisplay adData={siteSettings.ads.inArticle} />
                <p className="text-[10px] text-center text-gray-400 mt-1">বিজ্ঞাপন</p>
             </div>
           </div>
         )}

         <div 
           className="prose prose-lg max-w-none font-serif text-gray-800 leading-relaxed"
           dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
         />
      </div>
       {/* Footer */}
       <footer className="bg-gray-900 text-white mt-12 py-12">
            <div className="container mx-auto px-4 text-center">
                <p className="text-sm text-gray-500">{siteSettings.footerText}</p>
            </div>
        </footer>
    </div>
  );

  const LoginModal = () => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-2xl p-8 relative animate-scale-in">
        <button onClick={() => setView('home')} className="absolute top-4 right-4 text-gray-400 hover:text-red-600"><X/></button>
        <div className="text-center mb-6">
           <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <ShieldCheck size={32}/>
           </div>
           <h2 className="text-2xl font-bold">এডমিন লগইন</h2>
        </div>
        <div className="space-y-4">
           <button 
             onClick={handleGoogleLogin} 
             className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-50 shadow flex items-center justify-center gap-2"
           >
             Google দিয়ে লগইন করুন
           </button>
           <p className="text-xs text-center text-red-500">শুধুমাত্র eco452@gmail.com অনুমোদিত</p>
        </div>
      </div>
    </div>
  );

  const InstallButton = () => (
    showInstallBtn ? (
      <div className="fixed top-20 right-4 z-50 animate-bounce">
         <div className="bg-red-600 text-white p-3 rounded-lg shadow-xl flex items-center gap-3 max-w-xs relative">
           <button onClick={() => setShowInstallBtn(false)} className="absolute -top-2 -left-2 bg-white text-red-600 rounded-full p-1 border shadow"><X size={12}/></button>
           <div className="bg-white/20 p-2 rounded">
             <Download size={20}/>
           </div>
           <div>
             <p className="font-bold text-sm">অ্যাপটি ইন্সটল করুন</p>
           </div>
           <button onClick={handleInstallClick} className="bg-white text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-gray-100">
             Install
           </button>
         </div>
      </div>
    ) : null
  );

  return (
    <div className="font-sans text-gray-900 selection:bg-red-100 selection:text-red-900">
      <InstallButton />
      {view === 'home' && <HomeView />}
      {view === 'article' && <ArticleView />}
      {view === 'login' && <LoginModal />}
      {view === 'admin' && <AdminView />}
    </div>
  );
}