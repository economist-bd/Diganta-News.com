import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
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
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Menu, X, Search, User, LogIn, Edit3, Trash2, 
  Plus, Image as ImageIcon, Layout, Settings, 
  Share2, Download, ShieldCheck, ChevronRight
} from 'lucide-react';

// --- Firebase Configuration ---
// দ্রষ্টব্য: প্রিভিউ মোডে কাজ করার জন্য আমরা সিস্টেম ভেরিয়েবল ব্যবহার করছি।
// আপনি যখন আপনার নিজস্ব ডোমেইনে (firebase hosting) আপলোড করবেন, 
// তখন নিচের commented অংশটি ব্যবহার করবেন।

 // আপনার কনফিগারেশন (ডিপ্লয় করার সময় এই অংশ আন-কমেন্ট করবেন এবং নিচের লাইনটি কমেন্ট করবেন)
const firebaseConfig = {
  apiKey: "AIzaSyAIw0NeSi-0Vb9hUwyGlhx4dA3r0dbTSYo",
  authDomain: "shajgoj-ea28b.firebaseapp.com",
  projectId: "shajgoj-ea28b",
  storageBucket: "shajgoj-ea28b.firebasestorage.app",
  messagingSenderId: "1050845378650",
  appId: "1:1050845378650:web:656c247cdf22e954294063"
};


// প্রিভিউ এর জন্য ডিফল্ট কনফিগ


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Helper Functions ---
const getBanglaDate = () => {
  const date = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('bn-BD', options);
};

// ইমেজ রিসাইজ ফাংশন (কমপ্রেশন)
const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // ইমেজের সাইজ কমানো হয়েছে দ্রুত লোডের জন্য
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// মেটা ট্যাগ আপডেট ফাংশন (SEO & OG Tags)
const updateMetaTags = (title, image) => {
  document.title = title;
  // ওপেন গ্রাফ ট্যাগ আপডেট (Simple Implementation)
  let metaOgTitle = document.querySelector('meta[property="og:title"]');
  if (!metaOgTitle) {
    metaOgTitle = document.createElement('meta');
    metaOgTitle.setAttribute('property', 'og:title');
    document.head.appendChild(metaOgTitle);
  }
  metaOgTitle.content = title;

  let metaOgImage = document.querySelector('meta[property="og:image"]');
  if (!metaOgImage) {
    metaOgImage = document.createElement('meta');
    metaOgImage.setAttribute('property', 'og:image');
    document.head.appendChild(metaOgImage);
  }
  metaOgImage.content = image || '';
};

// --- Components ---

// Rich Text Editor (Updated)
const RichTextEditor = ({ value, onChange }) => {
  const insertTag = (tag, label) => {
    const textarea = document.getElementById('news-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);
    let newText = '';

    if (tag === 'b') newText = text.substring(0, start) + `<b>${selection || 'বোল্ড টেক্সট'}</b>` + text.substring(end);
    else if (tag === 'br') newText = text.substring(0, start) + `<br/>` + text.substring(end);
    else if (tag === 'h3') newText = text.substring(0, start) + `<h3>${selection || 'সাব-হেডিং'}</h3>` + text.substring(end);
    
    onChange(newText);
  };

  return (
    <div className="border rounded-md overflow-hidden border-gray-300">
      <div className="bg-gray-100 p-2 flex gap-2 border-b flex-wrap">
        <button type="button" onClick={() => insertTag('b')} className="px-3 py-1 bg-white border rounded font-bold hover:bg-red-50 text-sm">B</button>
        <button type="button" onClick={() => insertTag('h3')} className="px-3 py-1 bg-white border rounded font-bold hover:bg-red-50 text-sm">H3</button>
        <button type="button" onClick={() => insertTag('br')} className="px-3 py-1 bg-white border rounded hover:bg-red-50 text-sm">New Line</button>
      </div>
      <textarea
        id="news-content"
        className="w-full h-48 p-4 focus:outline-none resize-none font-serif text-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="সংবাদের বিস্তারিত লিখুন..."
      />
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'দিগন্ত',
    editorName: 'মঞ্জুরুল হক',
    ads: { header: '', sidebar: '' },
    footerText: 'স্বত্ব © ২০২৬ দিগন্ত মিডিয়া'
  });
  
  // Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Admin State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [editArticle, setEditArticle] = useState(null);
  const [activeCategory, setActiveCategory] = useState('সব খবর');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false
  });

  // --- Install Prompt Logic (20s Interval) ---
  useEffect(() => {
    // Listen for install event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Check every 20 seconds
    const interval = setInterval(() => {
      // If prompt exists (meaning app not installed)
      if (deferredPrompt || !window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBtn(true);
        // Hide after 8 seconds to not be annoying, will reappear next cycle
        setTimeout(() => setShowInstallBtn(false), 8000);
      }
    }, 20000); // 20 Seconds

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
      alert("অ্যাপটি ইন্সটল করতে ব্রাউজারের মেনু থেকে 'Add to Home Screen' সিলেক্ট করুন।");
    }
  };

  // --- Firebase Data ---
  useEffect(() => {
    const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    };
    initAuth();
    onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Articles
    const unsubArticles = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'articles')), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort in JS
      data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setArticles(data);
    });

    // Categories
    const unsubCats = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length === 0) {
        ['বাংলাদেশ', 'রাজনীতি', 'অর্থনীতি', 'আন্তর্জাতিক', 'খেলা', 'বিনোদন', 'প্রযুক্তি', 'মতামত'].forEach(name => 
          addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), { name })
        );
      } else {
        setCategories(data);
      }
    });

    // Settings
    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), (snap) => {
      if (snap.exists()) setSiteSettings(snap.data());
      else {
         // Default settings
         const def = {
            siteName: 'দিগন্ত',
            editorName: 'মঞ্জুরুল হক',
            ads: { header: 'https://placehold.co/728x90/f3f4f6/374151?text=Header+Ad', sidebar: 'https://placehold.co/300x250/f3f4f6/374151?text=Sidebar+Ad' }
         };
         import('firebase/firestore').then(({ setDoc }) => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), def));
      }
    });

    return () => { unsubArticles(); unsubCats(); unsubSettings(); };
  }, [user]);

  // --- Handlers ---
  const handleAdminLogin = () => {
    // Hardcoded Password for Demo
    if (adminPasswordInput === '123456') {
      setIsAdminLoggedIn(true);
      setView('admin');
    } else {
      alert('ভুল পাসওয়ার্ড!');
    }
  };

  const handleSaveArticle = async () => {
    if (!formData.title) return alert('শিরোনাম দিন');
    const payload = {
      ...formData,
      timestamp: serverTimestamp(),
      author: 'নিজস্ব প্রতিবেদক'
    };
    try {
      if (editArticle) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'articles', editArticle.id), payload);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'articles'), payload);
      }
      setEditArticle(null);
      setFormData({ title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false });
      alert('সংবাদ সফলভাবে সংরক্ষিত হয়েছে');
    } catch (e) {
      console.error(e);
      alert('ত্রুটি হয়েছে');
    }
  };

  const handleDelete = async (id) => {
    if(confirm('মুছে ফেলতে চান?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'articles', id));
    }
  };

  const handleImageUpload = async (e) => {
    if (e.target.files[0]) {
      const base64 = await resizeImage(e.target.files[0]);
      setFormData({ ...formData, image: base64 });
    }
  };

  // --- Views ---

  const Navbar = () => (
    <nav className="sticky top-0 bg-white z-40 border-b shadow-sm">
      <div className="container mx-auto">
        {/* Mobile Horizontal Scroll Menu */}
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

  const HomeView = () => {
    const filtered = activeCategory === 'সব খবর' ? articles : articles.filter(a => a.category === activeCategory);
    const lead = filtered.find(a => a.isLead) || filtered[0];
    const others = filtered.filter(a => a.id !== lead?.id);

    return (
      <div className="animate-fade-in">
        {/* Header */}
        <div className="bg-white pt-4 pb-2 border-b">
          <div className="container mx-auto px-4 flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>{getBanglaDate()}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setView('login')} className="flex items-center gap-1 hover:text-red-600 font-bold">
                 <User size={14}/> এডমিন
              </button>
            </div>
          </div>
          <div className="text-center py-4 relative">
            <h1 className="text-5xl md:text-7xl font-extrabold text-black font-serif cursor-pointer tracking-tight" onClick={() => setView('home')}>
              {siteSettings.siteName}
            </h1>
            {siteSettings.ads.header && (
              <div className="hidden lg:block absolute right-4 top-2">
                <img src={siteSettings.ads.header} alt="Ad" className="h-16 w-auto" />
              </div>
            )}
          </div>
        </div>

        <Navbar />

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main News */}
            <div className="lg:col-span-9">
              {lead && (
                <div onClick={() => { setSelectedArticle(lead); setView('article'); updateMetaTags(lead.title, lead.image); }} className="mb-8 cursor-pointer group">
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="order-2 md:order-1">
                      <span className="text-red-600 font-bold text-sm mb-2 inline-block">{lead.category}</span>
                      <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight group-hover:text-red-600 transition-colors">
                        {lead.title}
                      </h2>
                      <p className="text-gray-600 mt-3 text-lg line-clamp-3 leading-relaxed">
                        {lead.content.replace(/<[^>]+>/g, '')}
                      </p>
                      <span className="text-xs text-gray-400 mt-4 block">আপডেট: ১ ঘণ্টা আগে</span>
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
                  <div key={news.id} onClick={() => { setSelectedArticle(news); setView('article'); updateMetaTags(news.title, news.image); }} className="cursor-pointer group flex flex-col h-full">
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

            {/* Sidebar */}
            <div className="lg:col-span-3 space-y-8 border-l border-gray-100 pl-0 lg:pl-6">
               {/* Sidebar Ad */}
               {siteSettings.ads.sidebar && (
                 <div className="bg-gray-50 flex items-center justify-center min-h-[250px] rounded border">
                   <img src={siteSettings.ads.sidebar} alt="Ad" className="w-full" />
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
      </div>
    );
  };

  const ArticleView = () => (
    <div className="bg-white min-h-screen pb-10">
      <Navbar />
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
                 <p className="text-gray-500">{getBanglaDate()}</p>
              </div>
           </div>
           <div className="flex gap-3">
             <button className="text-gray-400 hover:text-blue-600"><Share2 size={20}/></button>
           </div>
         </div>
         
         {selectedArticle.image && (
           <div className="mb-8">
             <img src={selectedArticle.image} className="w-full h-auto rounded-lg" alt="News"/>
             <p className="text-xs text-center text-gray-500 mt-2">ছবি: সংগৃহীত</p>
           </div>
         )}

         <div 
           className="prose prose-lg max-w-none font-serif text-gray-800 leading-relaxed"
           dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
         />
      </div>
    </div>
  );

  const AdminView = () => (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-white shadow p-4 sticky top-0 z-30">
        <div className="container mx-auto flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-600"><ShieldCheck/> এডমিন প্যানেল</h2>
          <div className="flex gap-3">
            <button onClick={() => setView('home')} className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 text-sm">প্রিভিউ</button>
            <button onClick={() => { setIsAdminLoggedIn(false); setView('home'); }} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">লগ আউট</button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Editor */}
          <div className="bg-white p-6 rounded shadow">
             <h3 className="font-bold border-b pb-2 mb-4">{editArticle ? 'সংবাদ ইডিট করুন' : 'নতুন সংবাদ যুক্ত করুন'}</h3>
             <div className="space-y-4">
                <input 
                  className="w-full p-2 border rounded font-bold text-lg focus:ring-2 focus:ring-red-200 outline-none" 
                  placeholder="শিরোনাম লিখুন..."
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
                <div className="flex gap-4">
                   <select 
                     className="p-2 border rounded bg-white flex-1"
                     value={formData.category}
                     onChange={e => setFormData({...formData, category: e.target.value})}
                   >
                     {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                   </select>
                   <div className="flex items-center gap-2 border px-3 rounded bg-gray-50 cursor-pointer relative overflow-hidden flex-1 justify-center">
                      <ImageIcon size={18} className="text-gray-500"/>
                      <span className="text-sm text-gray-600">{formData.image ? 'ছবি যুক্ত হয়েছে' : 'ছবি আপলোড'}</span>
                      <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*"/>
                   </div>
                </div>
                
                <div className="flex items-center gap-2 my-2">
                   <input 
                    type="checkbox" 
                    id="leadCheck" 
                    checked={formData.isLead}
                    onChange={e => setFormData({...formData, isLead: e.target.checked})}
                    className="w-4 h-4 text-red-600"
                   />
                   <label htmlFor="leadCheck" className="text-sm font-bold text-red-600">লিড নিউজ (বড় করে দেখাবে)</label>
                </div>

                <RichTextEditor value={formData.content} onChange={(val) => setFormData({...formData, content: val})} />
                
                <div className="flex justify-end gap-3 pt-2">
                  {editArticle && <button onClick={() => { setEditArticle(null); setFormData({title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false}); }} className="px-4 py-2 bg-gray-200 rounded">বাতিল</button>}
                  <button onClick={handleSaveArticle} className="px-6 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700">সংরক্ষণ করুন</button>
                </div>
             </div>
          </div>
          
          {/* News List */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold border-b pb-2 mb-4">সকল সংবাদ ({articles.length})</h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {articles.map(news => (
                <div key={news.id} className="flex justify-between items-center p-2 hover:bg-gray-50 border rounded">
                   <div className="flex gap-2 items-center overflow-hidden">
                     {news.image && <img src={news.image} className="w-10 h-10 object-cover rounded" />}
                     <span className="truncate font-medium text-sm">{news.title}</span>
                   </div>
                   <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setEditArticle(news); setFormData(news); window.scrollTo(0,0); }} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Edit3 size={16}/></button>
                      <button onClick={() => handleDelete(news.id)} className="text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           {/* Ads Manager */}
           <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold border-b pb-2 mb-4 flex items-center gap-2"><Layout size={18}/> বিজ্ঞাপন ম্যানেজ করুন</h3>
              <div className="space-y-3">
                 <div>
                   <label className="text-xs font-bold text-gray-500">হেডার বিজ্ঞাপন (URL)</label>
                   <input 
                     value={siteSettings.ads.header}
                     onChange={e => setSiteSettings({...siteSettings, ads: {...siteSettings.ads, header: e.target.value}})}
                     className="w-full text-xs p-2 border rounded mt-1" 
                     placeholder="Image Link"
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500">সাইডবার বিজ্ঞাপন (URL)</label>
                   <input 
                     value={siteSettings.ads.sidebar}
                     onChange={e => setSiteSettings({...siteSettings, ads: {...siteSettings.ads, sidebar: e.target.value}})}
                     className="w-full text-xs p-2 border rounded mt-1" 
                     placeholder="Image Link"
                   />
                 </div>
                 <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), siteSettings).then(() => alert('সেভ হয়েছে'))} className="w-full py-2 bg-gray-800 text-white text-xs rounded mt-2">আপডেট করুন</button>
              </div>
           </div>

           {/* Category Manager */}
           <div className="bg-white p-6 rounded shadow">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">ক্যাটাগরি</h3>
                <button onClick={() => { const n = prompt('নাম:'); if(n) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), {name: n}); }} className="bg-red-100 text-red-600 p-1 rounded"><Plus size={16}/></button>
             </div>
             <div className="flex flex-wrap gap-2">
               {categories.map(c => (
                 <span key={c.id} className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center gap-1">
                   {c.name}
                   <X size={12} className="cursor-pointer hover:text-red-600" onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', c.id))}/>
                 </span>
               ))}
             </div>
           </div>
        </div>
      </div>
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
           <p className="text-xs text-gray-500 mt-1">শুধুমাত্র কর্তৃপক্ষের জন্য</p>
        </div>
        <div className="space-y-4">
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">পাসওয়ার্ড</label>
             <input 
               type="password" 
               className="w-full p-3 border rounded focus:ring-2 focus:ring-red-500 outline-none"
               value={adminPasswordInput}
               onChange={(e) => setAdminPasswordInput(e.target.value)}
               placeholder="******"
             />
           </div>
           <button onClick={handleAdminLogin} className="w-full py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 shadow-lg">
             লগইন করুন
           </button>
           <div className="text-center">
             <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Demo Pass: 123456</span>
           </div>
        </div>
      </div>
    </div>
  );

  // Install Pop-up Button
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
             <p className="text-[10px] opacity-90">দ্রুত খবর পড়তে হোমস্ক্রিনে যুক্ত করুন</p>
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
      {view === 'admin' && isAdminLoggedIn && <AdminView />}
    </div>
  );
}