import React, { useState, useEffect } from 'react';
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
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Menu, X, Search, User, LogIn, Edit3, Trash2, 
  Plus, Image as ImageIcon, Layout, ShieldCheck, 
  Share2, Download, LogOut, ChevronRight, AlertTriangle
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

const appId = 'diganta-news-pwa'; 

// --- Helper Functions ---
const getBanglaDate = () => {
  const date = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('bn-BD', options);
};

const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
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

const updateMetaTags = (title, image) => {
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

const RichTextEditor = ({ value, onChange }) => {
  const insertTag = (tag) => {
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
        placeholder="সংবাদের বিস্তারিত লিখুন (HTML ট্যাগ সমর্থিত)..."
      />
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('home'); 
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [permissionError, setPermissionError] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'দিগন্ত',
    editorName: 'মঞ্জুরুল হক',
    ads: { header: '', sidebar: '' },
    footerText: 'স্বত্ব © ২০২৬ দিগন্ত মিডিয়া'
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Admin State
  const [editArticle, setEditArticle] = useState(null);
  const [activeCategory, setActiveCategory] = useState('সব খবর');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false
  });

  // --- Install Prompt Logic ---
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
      alert("ব্রাউজার মেনু থেকে 'Add to Home Screen' বা 'Install App' সিলেক্ট করুন।");
    }
  };

  // --- Auth & Data ---
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
    // Error Handling Wrapper
    const handleError = (error) => {
      console.error("Firebase Error:", error);
      if (error.code === 'permission-denied') {
        setPermissionError(true);
      }
    };

    // Articles Fetching
    const unsubArticles = onSnapshot(
      query(collection(db, 'artifacts', appId, 'public', 'data', 'articles')), 
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setArticles(data);
        setPermissionError(false); // Clear error if successful
      }, 
      handleError
    );

    // Categories Fetching
    const unsubCats = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'categories'), 
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (data.length === 0 && isAdmin) {
          try {
             ['বাংলাদেশ', 'রাজনীতি', 'অর্থনীতি', 'আন্তর্জাতিক', 'খেলা', 'বিনোদন', 'প্রযুক্তি', 'মতামত'].forEach(name => 
               addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), { name })
             );
          } catch(e) { console.error("Auto create failed", e); }
        } else {
          setCategories(data);
        }
      }, 
      handleError
    );

    // Settings Fetching
    const unsubSettings = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), 
      (snap) => {
        if (snap.exists()) setSiteSettings(snap.data());
      }, 
      handleError
    );

    return () => { unsubArticles(); unsubCats(); unsubSettings(); };
  }, [isAdmin]);

  // --- Handlers ---
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setView('home'); 
    } catch (error) {
      console.error(error);
      alert("লগইন ব্যর্থ হয়েছে: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setView('home');
  };

  const handleSaveArticle = async () => {
    if (!isAdmin) return alert("শুধুমাত্র এডমিন পোস্ট করতে পারবেন");
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
      setEditArticle(null);
      setFormData({ title: '', content: '', category: 'বাংলাদেশ', image: '', isLead: false });
      alert('সংবাদ সফলভাবে সংরক্ষিত হয়েছে');
    } catch (e) {
      console.error(e);
      alert('ত্রুটি হয়েছে: পারমিশন নেই অথবা ইন্টারনেট সমস্যা');
    }
  };

  const handleDelete = async (id) => {
    if(!isAdmin) return;
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
        {permissionError && (
          <div className="bg-red-600 text-white p-4 text-center">
             <div className="flex items-center justify-center gap-2 font-bold mb-1">
               <AlertTriangle/> ডাটাবেজ পারমিশন সমস্যা
             </div>
             <p className="text-sm">দয়া করে ফায়ারবেস কনসোলের <b>Firestore Database {'>'} Rules</b> ট্যাবে গিয়ে নিচের রুলস আপডেট করুন।</p>
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

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                      <span className="text-xs text-gray-400 mt-4 block">আপডেট: কিছুক্ষণ আগে</span>
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

              {!lead && !permissionError && (
                 <div className="text-center py-20 text-gray-400">কোনো সংবাদ লোড হয়নি (ডাটাবেজ খালি অথবা লোড হচ্ছে...)</div>
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

            <div className="lg:col-span-3 space-y-8 border-l border-gray-100 pl-0 lg:pl-6">
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
           <button className="text-gray-400 hover:text-blue-600"><Share2 size={20}/></button>
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
             <span className="hidden md:block text-sm py-2 px-3 bg-red-50 text-red-600 rounded">
               {user?.email} হিসেবে লগইন করা
             </span>
            <button onClick={() => setView('home')} className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 text-sm">প্রিভিউ</button>
            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">লগ আউট</button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
           <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold border-b pb-2 mb-4 flex items-center gap-2"><Layout size={18}/> বিজ্ঞাপন সেটিংস</h3>
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
           <button 
             onClick={handleGoogleLogin} 
             className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-50 shadow flex items-center justify-center gap-2"
           >
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             Google দিয়ে লগইন করুন
           </button>
           <div className="text-center mt-4">
             <p className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
               সতর্কতা: শুধুমাত্র <b>eco452@gmail.com</b> ইমেইল দিয়ে এডিট করা যাবে।
             </p>
           </div>
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
      {view === 'admin' && <AdminView />}
    </div>
  );
}