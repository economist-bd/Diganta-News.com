import React, { useState, useEffect } from 'react';
import { 
  Menu, Search, User, LogIn, Settings, LogOut, 
  Video, Image as ImageIcon, Globe, Briefcase, 
  Heart, MonitorPlay, BookOpen, Sun, Moon, Edit
} from 'lucide-react';

// --- মক ডেটা (Mock Data) ---
const categories = ['সর্বশেষ', 'বাংলাদেশ', 'রাজনীতি', 'বিশ্ব', 'বাণিজ্য', 'মতামত', 'খেলা', 'বিনোদন', 'চাকরি', 'জীবনযাপন', 'প্রযুক্তি', 'শিক্ষা', 'ধর্ম'];

const mockNews = [
  { id: 1, title: 'কৃত্রিম বুদ্ধিমত্তার মাধ্যমে বদলে যাচ্ছে দেশের অর্থনীতি: নতুন সম্ভাবনা', category: 'বাণিজ্য', type: 'lead', summary: 'এআই প্রযুক্তি ব্যবহার করে ফ্রিল্যান্সিং ও আউটসোর্সিংয়ে দেশের তরুণেরা অভাবনীয় সাফল্য অর্জন করছে। অর্থনীতিবিদরা বলছেন, এটি আগামী দিনের অর্থনীতির মূল চালিকাশক্তি হতে পারে।' },
  { id: 2, title: 'শিক্ষার্থীদের জন্য নতুন আইসিটি কারিকুলাম অনুমোদন', category: 'শিক্ষা', type: 'normal', summary: 'আগামী বছর থেকে স্কুল ও কলেজ পর্যায়ে কোডিং এবং এআই বাধ্যতামূলক করা হচ্ছে।' },
  { id: 3, title: 'বিশ্ববাজারে বাংলাদেশের তৈরি পোশাকের রপ্তানি বৃদ্ধি', category: 'বাণিজ্য', type: 'normal', summary: 'চলতি অর্থবছরে পোশাক রপ্তানি গত বছরের তুলনায় ১৫ শতাংশ বৃদ্ধি পেয়েছে।' },
  { id: 4, title: 'এশিয়া কাপ ক্রিকেটে বাংলাদেশের শ্বাসরুদ্ধকর জয়', category: 'খেলা', type: 'normal', summary: 'শেষ ওভারের রোমাঞ্চে চিরপ্রতিদ্বন্দ্বী দলকে হারিয়ে ফাইনালে উঠল বাংলাদেশ।' },
  { id: 5, title: 'নতুন স্মার্টফোন আনল দেশীয় প্রযুক্তি প্রতিষ্ঠান', category: 'প্রযুক্তি', type: 'normal', summary: 'অত্যাধুনিক ক্যামেরা ও প্রসেসর সমৃদ্ধ এই ফোনটি বাজারে বেশ সাড়া ফেলেছে।' },
  { id: 6, title: 'পদ্মা সেতুতে যান চলাচলে নতুন রেকর্ড', category: 'বাংলাদেশ', type: 'normal', summary: 'ঈদের ছুটিতে একদিনে সর্বোচ্চ সংখ্যক যানবাহন পারাপার হয়েছে।' },
  { id: 7, title: 'বিশ্ব জলবায়ু সম্মেলনে বাংলাদেশের জোরালো অবস্থান', category: 'বিশ্ব', type: 'normal', summary: 'ক্ষতিপূরণ আদায়ে সোচ্চার ছিল বাংলাদেশ প্রতিনিধি দল।' },
];

export default function App() {
  // --- স্টেট ম্যানেজমেন্ট (State Management) ---
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'login', 'admin', 'profile'
  const [user, setUser] = useState(null); // null মানে লগআউট, ডেটা থাকলে লগইন
  const [searchQuery, setSearchQuery] = useState('');
  
  // অ্যাডমিন প্যানেলের জন্য লেআউট স্টেট
  const [layoutConfig, setLayoutConfig] = useState({
    themeColor: 'blue',
    showSports: true,
    showTech: true,
    showEntertainment: true,
    siteTitle: 'আলোর মেলা'
  });

  const [currentDateTime, setCurrentDateTime] = useState('');

  // সময় আপডেট করার জন্য
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDateTime(now.toLocaleDateString('bn-BD', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- থিম কালার নির্ধারণ ---
  const themeClasses = {
    blue: 'bg-blue-600 text-white',
    red: 'bg-red-600 text-white',
    green: 'bg-emerald-600 text-white',
    dark: 'bg-gray-800 text-white'
  };

  const activeThemeClass = themeClasses[layoutConfig.themeColor] || themeClasses.blue;
  const activeTextThemeClass = layoutConfig.themeColor === 'blue' ? 'text-blue-600' : 
                               layoutConfig.themeColor === 'red' ? 'text-red-600' : 
                               layoutConfig.themeColor === 'green' ? 'text-emerald-600' : 'text-gray-800';

  // --- কম্পোনেন্ট: নেভিগেশন বার (Navbar) ---
  const Navbar = () => (
    <header className="border-b shadow-sm sticky top-0 bg-white z-50">
      {/* টপ বার */}
      <div className="flex justify-between items-center py-2 px-4 md:px-8 border-b text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span className="font-bold pr-2">{currentDateTime}</span>
          <button className="hover:text-blue-600 transition">ই-পেপার</button>
          <button className="hover:text-blue-600 transition">English</button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <input 
              type="text" 
              placeholder="খুঁজুন..." 
              className="border rounded-full py-1 px-3 pl-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-400" />
          </div>
          
          {user ? (
            <div className="flex items-center space-x-3">
              {user.role === 'admin' && (
                <button onClick={() => setCurrentPage('admin')} className="flex items-center space-x-1 text-red-600 hover:text-red-800 font-bold">
                  <Settings className="w-4 h-4" /> <span>অ্যাডমিন</span>
                </button>
              )}
              <button onClick={() => setCurrentPage('profile')} className="flex items-center space-x-1 hover:text-blue-600">
                <User className="w-4 h-4" /> <span>{user.name}</span>
              </button>
              <button onClick={() => {setUser(null); setCurrentPage('home');}} className="text-gray-500 hover:text-red-500">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setCurrentPage('login')} className="flex items-center space-x-1 hover:text-blue-600">
              <LogIn className="w-4 h-4" /> <span>লগইন</span>
            </button>
          )}
        </div>
      </div>

      {/* মেইন লোগো ও হেডার */}
      <div className="py-6 text-center cursor-pointer" onClick={() => setCurrentPage('home')}>
        <h1 className={`text-5xl font-extrabold ${activeTextThemeClass} tracking-tight`}>
          {layoutConfig.siteTitle}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">সত্যের সন্ধানে, আলোর পথে</p>
      </div>

      {/* ক্যাটাগরি মেনু */}
      <div className={`${activeThemeClass} overflow-x-auto`}>
        <div className="flex space-x-6 px-4 md:px-8 py-3 min-w-max mx-auto justify-center">
          <button className="md:hidden"><Menu className="w-5 h-5" /></button>
          {categories.map((cat, index) => (
            <button key={index} className="font-medium hover:text-gray-200 whitespace-nowrap transition">
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );

  // --- কম্পোনেন্ট: হোমপেজ (HomePage) ---
  const HomePage = () => {
    const leadNews = mockNews.find(n => n.type === 'lead');
    const otherNews = mockNews.filter(n => n.type !== 'lead');

    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* টপ নিউজ গ্রিড */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* লিড নিউজ (বাম দিকে বড় অংশ) */}
          <div className="md:col-span-2">
            {leadNews && (
              <div className="group cursor-pointer">
                <div className="bg-gray-200 w-full h-80 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
                  {/* ইমেজ প্লেসহোল্ডার */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 to-transparent z-10"></div>
                  <ImageIcon className="w-16 h-16 text-gray-400 group-hover:scale-110 transition duration-500" />
                  <span className="absolute bottom-4 left-4 z-20 bg-red-600 text-white text-xs px-2 py-1 rounded">{leadNews.category}</span>
                </div>
                <h2 className="text-3xl font-bold mb-3 group-hover:text-blue-600 transition leading-tight">
                  {leadNews.title}
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">{leadNews.summary}</p>
              </div>
            )}
          </div>

          {/* সর্বশেষ ও পঠিত (ডান দিকের কলাম) */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex border-b border-gray-300 mb-4 pb-2">
              <button className={`flex-1 text-center font-bold ${activeTextThemeClass} border-b-2 border-current pb-1`}>সর্বশেষ</button>
              <button className="flex-1 text-center font-bold text-gray-500 hover:text-black">সর্বাধিক পঠিত</button>
            </div>
            <div className="space-y-4">
              {otherNews.slice(0, 5).map((news) => (
                <div key={news.id} className="flex gap-3 border-b border-gray-200 pb-3 last:border-0 cursor-pointer group">
                  <span className={`text-2xl font-bold text-gray-300 group-hover:${activeTextThemeClass}`}>
                    {news.id}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 leading-snug">{news.title}</h3>
                    <span className="text-xs text-gray-500 mt-1 block">{news.category} • ২ ঘণ্টা আগে</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* মাল্টিমিডিয়া সেকশন (ভিডিও ও ছবি) */}
        <div className="bg-gray-900 text-white rounded-xl p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Video className="w-6 h-6 text-red-500"/> মাল্টিমিডিয়া</h2>
            <button className="text-sm hover:underline">সব দেখুন</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(v => (
              <div key={v} className="cursor-pointer group">
                <div className="bg-gray-800 h-40 rounded-lg flex items-center justify-center relative overflow-hidden mb-2">
                  <MonitorPlay className="w-10 h-10 text-gray-500 group-hover:text-white transition z-10" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition"></div>
                </div>
                <h3 className="text-sm font-medium group-hover:text-gray-300">শিক্ষার্থীদের জন্য এআই বিষয়ক বিশেষ কর্মশালা...</h3>
              </div>
            ))}
          </div>
        </div>

        {/* ডাইনামিক সেকশন (অ্যাডমিন প্যানেল থেকে নিয়ন্ত্রিত) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {layoutConfig.showTech && (
            <div className="border-t-4 border-blue-500 pt-4">
              <h2 className="text-xl font-bold mb-4 text-blue-800">প্রযুক্তি ও আইসিটি</h2>
              <div className="bg-blue-50 h-32 rounded flex items-center justify-center mb-3">
                <Globe className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="font-bold hover:text-blue-600 cursor-pointer">ফ্রিল্যান্সিংয়ে কীভাবে সফল হবেন? জেনে নিন বিশেষজ্ঞদের মতামত</h3>
              <p className="text-sm text-gray-600 mt-2">নতুনদের জন্য এআই টুলের ব্যবহার...</p>
            </div>
          )}

          {layoutConfig.showSports && (
            <div className="border-t-4 border-green-500 pt-4">
              <h2 className="text-xl font-bold mb-4 text-green-800">খেলাধুলা</h2>
              <div className="bg-green-50 h-32 rounded flex items-center justify-center mb-3">
                <Heart className="w-8 h-8 text-green-300" />
              </div>
              <h3 className="font-bold hover:text-green-600 cursor-pointer">বিশ্বকাপ বাছাইপর্বে বাংলাদেশ দলের প্রস্তুতি কেমন?</h3>
            </div>
          )}

          {layoutConfig.showEntertainment && (
            <div className="border-t-4 border-purple-500 pt-4">
              <h2 className="text-xl font-bold mb-4 text-purple-800">বিনোদন</h2>
              <div className="bg-purple-50 h-32 rounded flex items-center justify-center mb-3">
                <MonitorPlay className="w-8 h-8 text-purple-300" />
              </div>
              <h3 className="font-bold hover:text-purple-600 cursor-pointer">ঈদের নতুন নাটকের শুটিং শুরু, নায়ক-নায়িকা কে?</h3>
            </div>
          )}

        </div>
      </div>
    );
  };

  // --- কম্পোনেন্ট: লগইন পেজ (Login Page) ---
  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
      e.preventDefault();
      // ডেমো লগইন লজিক
      if (email === 'admin@alormela.com' && password === 'admin') {
        setUser({ name: 'মঞ্জুরুল হক (অ্যাডমিন)', email, role: 'admin' });
        setCurrentPage('admin');
      } else {
        setUser({ name: 'সাধারণ পাঠক', email, role: 'user' });
        setCurrentPage('profile');
      }
    };

    return (
      <div className="max-w-md mx-auto mt-20 p-8 border rounded-xl shadow-lg bg-white">
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold ${activeTextThemeClass} mb-2`}>লগইন করুন</h2>
          <p className="text-gray-500">আপনার ব্যক্তিগত ড্যাশবোর্ডে প্রবেশ করুন</p>
          <div className="mt-4 p-3 bg-blue-50 text-sm text-blue-800 rounded border border-blue-100 text-left">
            <strong>ডেমো অ্যাকাউন্ট:</strong><br/>
            অ্যাডমিন: admin@alormela.com / admin<br/>
            সাধারণ ইউজার: যেকোনো ইমেইল / পাসওয়ার্ড
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">ইমেইল ঠিকানা</label>
            <input 
              type="email" 
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-medium">পাসওয়ার্ড</label>
            <input 
              type="password" 
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>
          <button type="submit" className={`w-full py-3 rounded-lg font-bold transition shadow-md ${activeThemeClass}`}>
            প্রবেশ করুন
          </button>
        </form>
      </div>
    );
  };

  // --- কম্পোনেন্ট: ইউজার প্রোফাইল (User Profile) ---
  const ProfilePage = () => (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="flex items-center gap-6 mb-8 border-b pb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-gray-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-bold">
              {user.role === 'admin' ? 'অ্যাডমিনিস্ট্রেটর' : 'নিবন্ধিত পাঠক'}
            </span>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5"/> আপনার সেভ করা খবর (Bookmark)</h3>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg hover:shadow-md transition bg-gray-50 cursor-pointer">
            <h4 className="font-semibold text-lg hover:text-blue-600">কৃত্রিম বুদ্ধিমত্তার মাধ্যমে বদলে যাচ্ছে দেশের অর্থনীতি</h4>
            <p className="text-sm text-gray-500">সংরক্ষণ করেছেন: ২ দিন আগে</p>
          </div>
          <div className="p-4 border rounded-lg hover:shadow-md transition bg-gray-50 cursor-pointer">
            <h4 className="font-semibold text-lg hover:text-blue-600">শিক্ষার্থীদের জন্য নতুন আইসিটি কারিকুলাম</h4>
            <p className="text-sm text-gray-500">সংরক্ষণ করেছেন: ১ সপ্তাহ আগে</p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- কম্পোনেন্ট: অ্যাডমিন প্যানেল (Admin Panel - Edit Layout) ---
  const AdminPage = () => {
    if (!user || user.role !== 'admin') {
      return <div className="text-center mt-20 text-red-600 font-bold text-2xl">অ্যাক্সেস ডিনাইড! শুধুমাত্র অ্যাডমিন প্রবেশ করতে পারবেন।</div>;
    }

    return (
      <div className="max-w-6xl mx-auto mt-10 p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* অ্যাডমিন সাইডবার */}
        <div className="col-span-1 bg-white border rounded-xl shadow-sm p-4">
          <h2 className="text-xl font-bold border-b pb-3 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5"/> ড্যাশবোর্ড
          </h2>
          <ul className="space-y-2">
            <li className={`p-2 rounded font-medium cursor-pointer ${activeThemeClass}`}>লেআউট এডিটর</li>
            <li className="p-2 rounded font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">সংবাদ প্রকাশ</li>
            <li className="p-2 rounded font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">ইউজার ম্যানেজমেন্ট</li>
            <li className="p-2 rounded font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">রিপোর্ট ও এনালিটিক্স</li>
          </ul>
        </div>

        {/* লেআউট এডিটর ফর্ম */}
        <div className="col-span-1 md:col-span-3 bg-white border rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
            <Edit className="w-6 h-6"/> লেআউট এডিটর (Frontend Controls)
          </h2>

          <div className="space-y-8">
            {/* সাইট টাইটেল */}
            <div>
              <label className="block font-bold text-gray-700 mb-2">ওয়েবসাইটের নাম (Site Title)</label>
              <input 
                type="text" 
                className="w-full max-w-md border rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={layoutConfig.siteTitle}
                onChange={(e) => setLayoutConfig({...layoutConfig, siteTitle: e.target.value})}
              />
            </div>

            {/* থিম কালার */}
            <div>
              <label className="block font-bold text-gray-700 mb-2">ওয়েবসাইটের থিম কালার</label>
              <div className="flex gap-4">
                <button onClick={() => setLayoutConfig({...layoutConfig, themeColor: 'blue'})} className={`w-10 h-10 rounded-full bg-blue-600 border-4 ${layoutConfig.themeColor === 'blue' ? 'border-gray-800' : 'border-transparent'}`}></button>
                <button onClick={() => setLayoutConfig({...layoutConfig, themeColor: 'red'})} className={`w-10 h-10 rounded-full bg-red-600 border-4 ${layoutConfig.themeColor === 'red' ? 'border-gray-800' : 'border-transparent'}`}></button>
                <button onClick={() => setLayoutConfig({...layoutConfig, themeColor: 'green'})} className={`w-10 h-10 rounded-full bg-emerald-600 border-4 ${layoutConfig.themeColor === 'green' ? 'border-gray-800' : 'border-transparent'}`}></button>
                <button onClick={() => setLayoutConfig({...layoutConfig, themeColor: 'dark'})} className={`w-10 h-10 rounded-full bg-gray-800 border-4 ${layoutConfig.themeColor === 'dark' ? 'border-gray-400' : 'border-transparent'}`}></button>
              </div>
            </div>

            {/* হোমপেজ সেকশন টগল */}
            <div>
              <label className="block font-bold text-gray-700 mb-4">হোমপেজ সেকশন নিয়ন্ত্রণ (Show/Hide)</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600"
                    checked={layoutConfig.showTech}
                    onChange={(e) => setLayoutConfig({...layoutConfig, showTech: e.target.checked})}
                  />
                  <span className="text-lg">প্রযুক্তি ও আইসিটি সেকশন দেখান</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600"
                    checked={layoutConfig.showSports}
                    onChange={(e) => setLayoutConfig({...layoutConfig, showSports: e.target.checked})}
                  />
                  <span className="text-lg">খেলাধুলা সেকশন দেখান</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600"
                    checked={layoutConfig.showEntertainment}
                    onChange={(e) => setLayoutConfig({...layoutConfig, showEntertainment: e.target.checked})}
                  />
                  <span className="text-lg">বিনোদন সেকশন দেখান</span>
                </label>
              </div>
              <p className="text-sm text-green-600 mt-4 font-semibold">
                * পরিবর্তনগুলো সাথে সাথেই সংরক্ষিত হচ্ছে। উপরের মেনু থেকে 'হোমপেজ'-এ গিয়ে পরিবর্তন দেখতে পারেন।
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- ফুটার (Footer) ---
  const Footer = () => (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-20 border-t-4 border-gray-700">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">{layoutConfig.siteTitle}</h2>
          <p className="text-sm">বাংলাদেশের অন্যতম শীর্ষস্থানীয় ডিজিটাল নিউজ পোর্টাল। সত্য ও বস্তুনিষ্ঠ সংবাদ সবার আগে পৌঁছে দেওয়াই আমাদের লক্ষ্য।</p>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-4">বিভাগসমূহ</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition">বাংলাদেশ</a></li>
            <li><a href="#" className="hover:text-white transition">রাজনীতি</a></li>
            <li><a href="#" className="hover:text-white transition">প্রযুক্তি ও এআই</a></li>
            <li><a href="#" className="hover:text-white transition">অর্থনীতি</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-4">আমাদের সম্পর্কে</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition">যোগাযোগ</a></li>
            <li><a href="#" className="hover:text-white transition">বিজ্ঞাপন</a></li>
            <li><a href="#" className="hover:text-white transition">শর্তাবলি</a></li>
            <li><a href="#" className="hover:text-white transition">গোপনীয়তা নীতি</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-4">নিউজলেটার</h3>
          <p className="text-sm mb-4">প্রতিদিনের বাছাই করা খবর ইমেইলে পেতে সাবস্ক্রাইব করুন।</p>
          <div className="flex">
            <input type="email" placeholder="ইমেইল দিন" className="px-3 py-2 w-full text-black rounded-l focus:outline-none"/>
            <button className={`${activeThemeClass} px-4 py-2 rounded-r font-bold`}>সাবস্ক্রাইব</button>
          </div>
        </div>
      </div>
      <div className="text-center mt-12 pt-8 border-t border-gray-800 text-sm">
        &copy; {new Date().getFullYear()} {layoutConfig.siteTitle} | সর্বস্বত্ব সংরক্ষিত
      </div>
    </footer>
  );

  // --- মূল রেন্ডারিং (Main Rendering Logic) ---
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <Navbar />
      
      {/* পেজ রাউটিং লজিক */}
      <main className="min-h-[60vh]">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'login' && <LoginPage />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'admin' && <AdminPage />}
      </main>

      <Footer />
    </div>
  );
}

