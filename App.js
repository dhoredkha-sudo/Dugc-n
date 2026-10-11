import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Linking, Alert,
  ActivityIndicator, StyleSheet, Image, KeyboardAvoidingView, Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  initializeAuth, getReactNativePersistence, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from 'firebase/auth';
import { getDatabase, ref, push, remove, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAk8eAh8a-T2-nCrPKvaRugcA0HekGzShA',
  authDomain: 'dugc-edu.firebaseapp.com',
  databaseURL: 'https://dugc-edu-default-rtdb.firebaseio.com',
  projectId: 'dugc-edu',
  storageBucket: 'dugc-edu.firebasestorage.app',
  messagingSenderId: '935840204952',
  appId: '1:935840204952:web:03a5114761453fe90a28ed',
};
const ADMIN_UID = 'fYkP2Xpu4xWZ7KxshphHeLvxwYV2';

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
const db = getDatabase(app);

/* ---------- data ---------- */
const CATS = [
  { key: 'notes', label: 'Notes' },
  { key: 'books', label: 'Books' },
  { key: 'pdfs', label: 'PDFs' },
  { key: 'courses', label: 'Courses' },
  { key: 'tutorials', label: 'Tutorials' },
  { key: 'questions', label: 'Question Papers' },
  { key: 'examprep', label: 'Exam Prep' },
  { key: 'results', label: 'Results' },
];
const EXAMS = ['questions', 'examprep', 'results'];
const catLabel = (k) => (CATS.find((c) => c.key === k) || { label: 'Resource' }).label;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const driveId = (url) => {
  const m = (url || '').match(/\/d\/([\w-]+)/) || (url || '').match(/[?&]id=([\w-]+)/);
  return m ? m[1] : null;
};
const viewUrl = (u) => { const id = driveId(u); return id ? `https://drive.google.com/file/d/${id}/view` : u; };
const downloadUrl = (u) => { const id = driveId(u); return id ? `https://drive.google.com/uc?export=download&id=${id}` : u; };
const driveThumb = (u) => { const id = driveId(u); return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w600` : null; };
const openLink = (u) => Linking.openURL(u).catch(() => Alert.alert('Could not open link'));

/* ---------- themes ---------- */
const DARK = {
  dark: true, bg: '#000000', surface: '#1C1C1E', border: '#2C2C31', text: '#FFFFFF', mute: '#A0A6B0',
  accent: '#2F9BFF', header: '#121214', chip: '#1C1C1E', green: '#16A56B',
  hero: ['#06223F', '#050509', '#2B1038'], input: '#1C1C1E',
};
const LIGHT = {
  dark: false, bg: '#F4F5F8', surface: '#FFFFFF', border: '#E3E6EC', text: '#101216', mute: '#5C6470',
  accent: '#0A66E0', header: '#FFFFFF', chip: '#FFFFFF', green: '#16A56B',
  hero: ['#D9E9FF', '#F4F5F8', '#EADCF7'], input: '#FFFFFF',
};

/* ---------- premium icons ---------- */
function Crown({ size = 26 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <SvgGrad id="gold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFEBA8" />
          <Stop offset="0.5" stopColor="#F5B93A" />
          <Stop offset="1" stopColor="#B8780C" />
        </SvgGrad>
      </Defs>
      <Path d="M2.5 8.2l4.7 4.1L12 3.8l4.8 8.5 4.7-4.1-1.9 11H4.4z" fill="url(#gold)" />
      <Rect x="4.4" y="17" width="15.2" height="2.2" rx="1" fill="#8A5504" opacity="0.35" />
      <Circle cx="2.5" cy="8.2" r="1.5" fill="#FFEBA8" />
      <Circle cx="12" cy="3.6" r="1.6" fill="#FFEBA8" />
      <Circle cx="21.5" cy="8.2" r="1.5" fill="#FFEBA8" />
      <Circle cx="12" cy="13" r="1.3" fill="#FFFFFF" opacity="0.9" />
    </Svg>
  );
}

function Icon({ name, size = 24, color = '#fff', filled = false, accent = ['#4DA3FF', '#A855F7'] }) {
  const gid = 'g_' + name;
  const f = `url(#${gid})`;
  const st = (c, w = 1.8) => ({ stroke: c, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' });
  let body = null;
  switch (name) {
    case 'notes':
      body = (<>
        <Rect x="4.5" y="3" width="15" height="18" rx="3.5" fill={f} />
        <Path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" {...st('#fff', 1.7)} />
      </>); break;
    case 'books':
      body = (<>
        <Path d="M12 6.5C10.5 5 8 4.5 3.5 4.5v13c4.500 0 7 .5 8.500 2z" fill={f} />
        <Path d="M12 6.5c1.500-1.500 4-2 8.500-2v13c-4.500 0-7 .5-8.500 2z" fill={f} opacity="0.7" />
      </>); break;
    case 'pdfs':
      body = (<>
        <Path d="M6 3h8l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill={f} />
        <Path d="M14 3v5h5" {...st('#fff', 1.5)} />
        <Path d="M8 13h8M8 16.500h5" {...st('#fff', 1.6)} />
      </>); break;
    case 'courses':
      body = (<>
        <Path d="M12 4L2 9l10 5 10-5z" fill={f} />
        <Path d="M6 11.800V16c0 1.500 2.700 3 6 3s6-1.500 6-3v-4.200L12 14.500z" fill={f} opacity="0.7" />
        <Path d="M22 9v6" {...st(accent[1], 1.6)} />
      </>); break;
    case 'tutorials':
      body = (<>
        <Path d="M12 2.500a6.500 6.500 0 0 0-3.800 11.800c.6.5 1 1.200 1 2V17h5.600v-.7c0-.8.4-1.500 1-2A6.500 6.500 0 0 0 12 2.500z" fill={f} />
        <Path d="M9.500 20h5M10.500 22h3" {...st(accent[0], 1.6)} />
      </>); break;
    case 'questions':
      body = (<>
        <Circle cx="12" cy="12" r="9.500" fill={f} />
        <Path d="M9.300 9.600a2.700 2.700 0 1 1 3.800 2.400c-.8.4-1.100 1-1.100 1.800" {...st('#fff', 1.9)} />
        <Circle cx="12" cy="17.200" r="1.150" fill="#fff" />
      </>); break;
    case 'examprep':
      body = (<>
        <Circle cx="12" cy="12" r="9.500" fill={f} />
        <Circle cx="12" cy="12" r="6" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.85" />
        <Circle cx="12" cy="12" r="2.300" fill="#fff" />
        <Path d="M12 12l7.500-7.500M16.500 4.500h3v3" {...st('#FFD36B', 1.8)} />
      </>); break;
    case 'results':
      body = (<>
        <Path d="M3.500 10v4a1 1 0 0 0 1 1h2.500l5.500 4.200V4.800L7 9H4.500a1 1 0 0 0-1 1z" fill={f} />
        <Path d="M16 9a4 4 0 0 1 0 6M18.600 6.400a8 8 0 0 1 0 11.200" {...st(accent[0], 1.8)} />
      </>); break;
    case 'search':
      body = (<><Circle cx="10.500" cy="10.500" r="6.500" {...st(color, 2)} /><Path d="M15.500 15.500L21 21" {...st(color, 2.2)} /></>); break;
    case 'heart':
      body = (<Path d="M12 20.500C6 16.500 3 13.200 3 9.500 3 7 4.900 5 7.400 5c1.800 0 3.300.9 4.600 2.600C13.300 5.900 14.800 5 16.600 5 19.100 5 21 7 21 9.500c0 3.700-3 7-9 11z"
        stroke={color} strokeWidth="1.9" strokeLinejoin="round" fill={filled ? color : 'none'} />); break;
    case 'eye':
      body = (<><Path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z" {...st(color)} /><Circle cx="12" cy="12" r="3" {...st(color)} /></>); break;
    case 'download':
      body = (<Path d="M12 4v11M7 11l5 5 5-5M5 20h14" {...st(color, 2)} />); break;
    case 'external':
      body = (<Path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" {...st(color)} />); break;
    case 'menu':
      body = (<Path d="M4 7h16M4 12h16M4 17h16" {...st(color, 2)} />); break;
    case 'close':
      body = (<Path d="M6 6l12 12M18 6L6 18" {...st(color, 2)} />); break;
    case 'sun':
      body = (<><Circle cx="12" cy="12" r="4" {...st(color)} /><Path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800" {...st(color)} /></>); break;
    case 'moon':
      body = (<Path d="M20 14.500A8.500 8.500 0 0 1 9.500 4 8.500 8.500 0 1 0 20 14.500z" {...st(color)} />); break;
    case 'plus':
      body = (<Path d="M12 5v14M5 12h14" {...st(color, 2.2)} />); break;
    case 'trash':
      body = (<Path d="M4 7h16M9 7V4h6v3M6.500 7l1 13h9l1-13M10 11v6M14 11v6" {...st(color, 1.7)} />); break;
    default: body = null;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <SvgGrad id={gid} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={accent[0]} />
          <Stop offset="1" stopColor={accent[1]} />
        </SvgGrad>
      </Defs>
      {body}
    </Svg>
  );
}

/* ---------- resource card ---------- */
function Card({ p, t, s, isAdmin, isSaved, onSave, onOpen, onDelete }) {
  const [bad, setBad] = useState(false);
  const thumb = p.thumb || (p.link ? driveThumb(p.link) : null);
  const cat = p.category || p.type || 'notes';
  return (
    <View style={s.card}>
      <View style={s.thumbBox}>
        {thumb && !bad ? (
          <Image source={{ uri: thumb }} style={s.thumb} resizeMode="cover" onError={() => setBad(true)} />
        ) : (
          <LinearGradient colors={t.dark ? ['#101A30', '#2A1240'] : ['#DCEBFF', '#EBDDF7']} style={s.thumb}>
            <View style={s.thumbIcon}><Icon name={CATS.some((c) => c.key === cat) ? cat : 'notes'} size={60} /></View>
          </LinearGradient>
        )}
        {!!p.featured && (
          <View style={s.badge}><Text style={s.badgeT}>Featured</Text></View>
        )}
        <TouchableOpacity style={s.heartBtn} onPress={() => onSave(p.id)}>
          <Icon name="heart" size={22} color={isSaved ? '#F0455A' : '#444'} filled={isSaved} />
        </TouchableOpacity>
      </View>
      <View style={s.cardBody}>
        <View style={s.pill}><Text style={s.pillT}>{catLabel(cat)}</Text></View>
        <Text style={s.cardTitle}>{p.title}</Text>
        {!!p.createdAt && <Text style={s.date}>{fmtDate(p.createdAt)}</Text>}
        {!!p.body && <Text style={s.excerpt} numberOfLines={3}>{p.body}</Text>}
        {!!p.link && (
          <TouchableOpacity style={s.dlBtn} onPress={() => openLink(downloadUrl(p.link))}>
            <Icon name="download" size={20} color="#fff" /><Text style={s.dlT}>Download</Text>
          </TouchableOpacity>
        )}
        <View style={s.row}>
          {!!p.link ? (
            <>
              <TouchableOpacity style={[s.outBtn, { flex: 1 }]} onPress={() => openLink(viewUrl(p.link))}>
                <Icon name="eye" size={20} color={t.accent} /><Text style={s.outT}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.outBtn, { width: 54, marginLeft: 10 }]} onPress={() => openLink(p.link)}>
                <Icon name="external" size={20} color={t.accent} />
              </TouchableOpacity>
            </>
          ) : null}
          {!!p.body && (
            <TouchableOpacity style={[s.moreBtn, p.link ? { marginLeft: 10 } : null]} onPress={() => onOpen(p)}>
              <Text style={s.moreT}>Read More</Text>
            </TouchableOpacity>
          )}
        </View>
        {isAdmin && (
          <TouchableOpacity style={s.delBtn} onPress={() => onDelete(p)}>
            <Icon name="trash" size={18} color="#F0455A" /><Text style={s.delT}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ---------- main app ---------- */
export default function App() {
  const [dark, setDark] = useState(true);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [posts, setPosts] = useState([]);
  const [saved, setSaved] = useState([]);
  const [screen, setScreen] = useState('home');
  const [cat, setCat] = useState('all');
  const [qInput, setQInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const scrollRef = useRef(null);

  const t = dark ? DARK : LIGHT;
  const s = useMemo(() => makeStyles(t), [dark]);
  const isAdmin = !!user && user.uid === ADMIN_UID;

  useEffect(() => {
    AsyncStorage.getItem('theme').then((v) => { if (v === 'light') setDark(false); }).catch(() => {});
    AsyncStorage.getItem('saved').then((v) => { if (v) setSaved(JSON.parse(v)); }).catch(() => {});
  }, []);
  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); }), []);
  useEffect(() => {
    return onValue(ref(db, 'posts'), (snap) => {
      const v = snap.val() || {};
      const list = Object.keys(v).map((id) => ({ id, ...v[id] }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setPosts(list);
      setLoaded(true);
    }, () => { setLoaded(true); Alert.alert('Connection problem', 'Could not load data. Check your internet.'); });
  }, []);

  const toggleTheme = () => {
    const next = !dark; setDark(next);
    AsyncStorage.setItem('theme', next ? 'dark' : 'light').catch(() => {});
  };
  const toggleSave = (id) => {
    const n = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(n); AsyncStorage.setItem('saved', JSON.stringify(n)).catch(() => {});
  };
  const remove_ = (p) => Alert.alert('Delete this resource?', p.title, [
    { text: 'Cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => remove(ref(db, 'posts/' + p.id)) },
  ]);

  const goTo = (screenKey, catKey) => {
    setMenuOpen(false); setScreen(screenKey); setCat(catKey || 'all');
    setTimeout(() => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: false }), 30);
  };

  const q = qInput.trim().toLowerCase();
  const shown = posts.filter((p) => {
    const pc = p.category || p.type;
    const okCat = cat === 'all' ? true : cat === 'saved' ? saved.includes(p.id) : cat === 'exams' ? EXAMS.includes(pc) : pc === cat;
    const okQ = q ? ((p.title || '') + ' ' + (p.body || '')).toLowerCase().includes(q) : true;
    return okCat && okQ;
  });

  const stats = {
    pdfs: posts.filter((p) => p.link).length,
    posts: posts.length,
    cats: new Set(posts.map((p) => p.category || p.type)).size,
  };
  const heroWords = ['Learn', 'smarter', 'with', 'free', 'notes,', 'books', '&', 'exam', 'resources'];
  const heroColors = ['#2F7BFF', '#4A6CF7', '#6A5CF0', '#7F57EC', '#9B55E6', '#B652DC', '#CC52C8', '#E0509F', '#F25A86'];
  const chips = [{ key: 'all', label: 'All Resources' }, ...CATS, { key: 'saved', label: 'Saved' }];
  const titleFor = cat === 'all' ? 'Latest resources' : cat === 'saved' ? 'Saved' : cat === 'exams' ? 'Exams' : catLabel(cat);
  const menu = [
    { label: 'Home', go: () => goTo('home') },
    { label: 'Courses', go: () => goTo('list', 'courses') },
    { label: 'Notes', go: () => goTo('list', 'notes') },
    { label: 'Books', go: () => goTo('list', 'books') },
    { label: 'PDFs', go: () => goTo('list', 'pdfs') },
    { label: 'Exams', go: () => goTo('list', 'exams') },
    { label: 'About', go: () => goTo('about') },
  ];

  if (!ready) return <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator size="large" color={t.accent} /></View>;

  return (
    <View style={s.root}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      {/* header */}
      <View style={s.header}>
        <View style={s.logoBox}>
          <LinearGradient colors={['#2F7BFF', '#9B4DF0', '#FF5C8A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logo}>
            <Text style={s.logoT}>E</Text>
          </LinearGradient>
          <Text style={s.brand}>DUGC-N.</Text>
          <TouchableOpacity onPress={() => (isAdmin ? setPanelOpen(true) : setLoginOpen(true))} style={[s.crownBtn, isAdmin && s.crownOn]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Crown size={28} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.menuBtn} onPress={() => setMenuOpen(!menuOpen)}>
          <Icon name={menuOpen ? 'close' : 'menu'} size={22} color={t.text} />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={s.menuPanel}>
          {menu.map((m) => (
            <TouchableOpacity key={m.label} onPress={m.go} style={s.menuItem}><Text style={s.menuT}>{m.label}</Text></TouchableOpacity>
          ))}
          <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
            <Icon name={dark ? 'sun' : 'moon'} size={22} color={t.text} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {screen === 'home' && (
          <>
            <LinearGradient colors={t.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
              <Text style={s.heroTitle}>
                {heroWords.map((w, i) => (<Text key={i} style={{ color: heroColors[i] }}>{w}{i < heroWords.length - 1 ? ' ' : ''}</Text>))}
              </Text>
              <Text style={s.heroSub}>Search study material, download PDFs and prepare for exams, all in one place.</Text>
              <View style={s.searchBar}>
                <TextInput style={s.searchInput} placeholder="Search notes, books, PDFs..." placeholderTextColor={t.mute}
                  value={qInput} onChangeText={setQInput} returnKeyType="search" onSubmitEditing={() => goTo('list', 'all')} />
                <TouchableOpacity style={s.searchBtn} onPress={() => goTo('list', 'all')}><Text style={s.searchBtnT}>Search</Text></TouchableOpacity>
              </View>
              <View style={s.stats}>
                {[[stats.pdfs, 'PDFs'], [stats.posts, 'Posts'], [stats.cats, 'Categories']].map(([n, l]) => (
                  <View key={l} style={s.stat}><Text style={s.statN}>{n}</Text><Text style={s.statL}>{l}</Text></View>
                ))}
              </View>
            </LinearGradient>

            <Text style={s.h2}>Browse categories</Text>
            <View style={s.grid}>
              {CATS.map((c) => (
                <TouchableOpacity key={c.key} style={s.catCard} onPress={() => goTo('list', c.key)}>
                  <Icon name={c.key} size={46} />
                  <Text style={s.catT}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {screen !== 'about' && (
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={[s.h2, { marginLeft: 0 }]}>{titleFor}</Text>
            {screen === 'list' && (
              <View style={s.listSearch}>
                <Icon name="search" size={20} color={t.mute} />
                <TextInput style={s.listSearchIn} placeholder="Search..." placeholderTextColor={t.mute} value={qInput} onChangeText={setQInput} />
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {chips.map((c) => (
                <TouchableOpacity key={c.key} onPress={() => setCat(c.key)} style={[s.chip, cat === c.key && s.chipOn]}>
                  <Text style={[s.chipT, cat === c.key && s.chipTOn]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {!loaded ? <ActivityIndicator color={t.accent} style={{ marginTop: 30 }} /> : null}
            {loaded && shown.length === 0 && <Text style={s.empty}>Nothing here yet.</Text>}
            {shown.map((p) => (
              <Card key={p.id} p={p} t={t} s={s} isAdmin={isAdmin} isSaved={saved.includes(p.id)}
                onSave={toggleSave} onOpen={setDetail} onDelete={remove_} />
            ))}
          </View>
        )}

        {screen === 'about' && (
          <View style={[s.aboutCard, { margin: 16 }]}>
            <LinearGradient colors={['#2F7BFF', '#9B4DF0', '#FF5C8A']} style={s.avatar}><Text style={s.avatarT}>A</Text></LinearGradient>
            <Text style={s.aboutName}>Azim R.</Text>
            <Text style={s.aboutRole}>Founder and Developer</Text>
            <Text style={s.aboutText}>DUGC N is a free study space for our college: notes, books, PDFs and exam resources in one place.</Text>
          </View>
        )}

        <Text style={s.foot}>Developed by Azim R</Text>
      </ScrollView>

      {isAdmin && (
        <TouchableOpacity style={s.fab} onPress={() => setAddOpen(true)}>
          <Icon name="plus" size={20} color="#fff" /><Text style={s.fabT}>New resource</Text>
        </TouchableOpacity>
      )}

      <DetailModal p={detail} t={t} s={s} onClose={() => setDetail(null)} />
      <LoginModal visible={loginOpen} onClose={() => setLoginOpen(false)} s={s} t={t} />
      <PanelModal visible={panelOpen} user={user} s={s} onClose={() => setPanelOpen(false)}
        onAdd={() => { setPanelOpen(false); setAddOpen(true); }}
        onOut={() => { setPanelOpen(false); signOut(auth); }} />
      <AddModal visible={addOpen} onClose={() => setAddOpen(false)} s={s} t={t} />
    </View>
  );
}

/* ---------- modals ---------- */
function DetailModal({ p, t, s, onClose }) {
  if (!p) return null;
  const thumb = p.thumb || (p.link ? driveThumb(p.link) : null);
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        <View style={s.detailBar}>
          <TouchableOpacity onPress={onClose} style={s.menuBtn}><Icon name="close" size={22} color={t.text} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }}>
          {thumb ? <Image source={{ uri: thumb }} style={s.detailImg} resizeMode="cover" /> : null}
          <View style={s.pill}><Text style={s.pillT}>{catLabel(p.category || p.type)}</Text></View>
          <Text style={[s.cardTitle, { fontSize: 24 }]}>{p.title}</Text>
          {!!p.createdAt && <Text style={s.date}>{fmtDate(p.createdAt)}</Text>}
          <Text style={[s.excerpt, { fontSize: 16, lineHeight: 26, color: t.text }]}>{p.body}</Text>
          {!!p.link && (
            <TouchableOpacity style={s.dlBtn} onPress={() => openLink(downloadUrl(p.link))}>
              <Icon name="download" size={20} color="#fff" /><Text style={s.dlT}>Download</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function LoginModal({ visible, onClose, s, t }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (cred.user.uid !== ADMIN_UID) { await signOut(auth); Alert.alert('Not allowed', 'This is not the admin account.'); }
      else { setPass(''); onClose(); }
    } catch (e) { Alert.alert('Login failed', 'Wrong email or password.'); }
    setBusy(false);
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalWrap}>
        <View style={s.sheet}>
          <View style={{ alignItems: 'center', marginBottom: 10 }}><Crown size={44} /></View>
          <Text style={s.sheetT}>Admin login</Text>
          <TextInput style={s.input} placeholder="Email" placeholderTextColor={t.mute} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={s.input} placeholder="Password" placeholderTextColor={t.mute} secureTextEntry value={pass} onChangeText={setPass} />
          <TouchableOpacity style={s.primary} onPress={go} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryT}>Log in</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PanelModal({ visible, user, s, onClose, onAdd, onOut }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.modalWrap}>
        <View style={s.sheet}>
          <View style={{ alignItems: 'center', marginBottom: 10 }}><Crown size={44} /></View>
          <Text style={s.sheetT}>Admin dashboard</Text>
          <Text style={[s.date, { textAlign: 'center', marginBottom: 16 }]}>{user ? user.email : ''}</Text>
          <TouchableOpacity style={s.primary} onPress={onAdd}><Text style={s.primaryT}>Add new resource</Text></TouchableOpacity>
          <TouchableOpacity style={[s.primary, { backgroundColor: '#D6455A', marginTop: 10 }]} onPress={onOut}><Text style={s.primaryT}>Log out</Text></TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>Close</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AddModal({ visible, onClose, s, t }) {
  const [category, setCategory] = useState('notes');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [thumb, setThumb] = useState('');
  const [featured, setFeatured] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!title.trim()) return Alert.alert('Enter a title');
    setBusy(true);
    try {
      await push(ref(db, 'posts'), {
        category, title: title.trim(), body: body.trim(), link: link.trim(),
        thumb: thumb.trim(), featured, createdAt: Date.now(),
      });
      setTitle(''); setBody(''); setLink(''); setThumb(''); setFeatured(false); onClose();
    } catch (e) { Alert.alert('Not saved', 'Please try again.'); }
    setBusy(false);
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalWrap}>
        <ScrollView style={s.sheet} keyboardShouldPersistTaps="handled">
          <Text style={s.sheetT}>New resource</Text>
          <Text style={s.label}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
            {CATS.map((c) => (
              <TouchableOpacity key={c.key} onPress={() => setCategory(c.key)} style={[s.chip, category === c.key && s.chipOn]}>
                <Text style={[s.chipT, category === c.key && s.chipTOn]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.label}>Title</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholderTextColor={t.mute} />
          <Text style={s.label}>Description / note text</Text>
          <TextInput style={[s.input, { height: 120, textAlignVertical: 'top' }]} multiline value={body} onChangeText={setBody} placeholderTextColor={t.mute} />
          <Text style={s.label}>Link (Google Drive PDF or page)</Text>
          <TextInput style={s.input} autoCapitalize="none" value={link} onChangeText={setLink} placeholder="https://..." placeholderTextColor={t.mute} />
          <Text style={s.label}>Thumbnail link (optional)</Text>
          <TextInput style={s.input} autoCapitalize="none" value={thumb} onChangeText={setThumb} placeholder="https://...jpg" placeholderTextColor={t.mute} />
          <TouchableOpacity onPress={() => setFeatured(!featured)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={[s.check, featured && { backgroundColor: t.accent, borderColor: t.accent }]} />
            <Text style={[s.label, { marginBottom: 0, marginLeft: 10 }]}>Featured on homepage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primary} onPress={save} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryT}>Save resource</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ---------- styles ---------- */
function makeStyles(t) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    header: { backgroundColor: t.header, paddingTop: (RNStatusBar.currentHeight || 24) + 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: t.border },
    logoBox: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    logoT: { color: '#fff', fontSize: 22, fontWeight: '800' },
    brand: { color: t.text, fontSize: 22, fontWeight: '800', marginLeft: 10 },
    crownBtn: { marginLeft: 8, padding: 4, borderRadius: 20 },
    crownOn: { backgroundColor: 'rgba(245,185,58,0.18)' },
    menuBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    menuPanel: { backgroundColor: t.surface, paddingHorizontal: 22, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    menuItem: { paddingVertical: 14 },
    menuT: { color: t.text, fontSize: 18, fontWeight: '700' },
    themeBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
    hero: { paddingHorizontal: 20, paddingTop: 44, paddingBottom: 36, alignItems: 'center' },
    heroTitle: { fontSize: 36, fontWeight: '800', textAlign: 'center', lineHeight: 44 },
    heroSub: { color: t.mute, fontSize: 16, lineHeight: 25, textAlign: 'center', marginTop: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.input, borderRadius: 40, borderWidth: 1, borderColor: t.border, paddingLeft: 20, padding: 6, marginTop: 26, width: '100%' },
    searchInput: { flex: 1, color: t.text, fontSize: 16, paddingVertical: 8 },
    searchBtn: { backgroundColor: t.accent, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 22 },
    searchBtnT: { color: '#fff', fontWeight: '800', fontSize: 16 },
    stats: { flexDirection: 'row', marginTop: 24 },
    stat: { backgroundColor: t.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: t.border, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 20, marginHorizontal: 5, alignItems: 'center', minWidth: 92 },
    statN: { color: t.text, fontSize: 30, fontWeight: '800' },
    statL: { color: t.mute, fontSize: 14, marginTop: 2 },
    h2: { color: t.text, fontSize: 28, fontWeight: '800', marginTop: 28, marginBottom: 16, marginLeft: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, justifyContent: 'space-between' },
    catCard: { width: '48%', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 28, paddingVertical: 26, alignItems: 'center', marginBottom: 14 },
    catT: { color: t.text, fontSize: 17, fontWeight: '700', marginTop: 12 },
    chip: { backgroundColor: t.chip, borderWidth: 1, borderColor: t.border, borderRadius: 30, paddingVertical: 10, paddingHorizontal: 18, marginRight: 10, marginBottom: 8 },
    chipOn: { backgroundColor: t.accent, borderColor: t.accent },
    chipT: { color: t.text, fontWeight: '700', fontSize: 15 },
    chipTOn: { color: '#fff' },
    listSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.input, borderRadius: 30, borderWidth: 1, borderColor: t.border, paddingHorizontal: 16, marginBottom: 14 },
    listSearchIn: { flex: 1, color: t.text, fontSize: 16, paddingVertical: 12, marginLeft: 10 },
    empty: { color: t.mute, textAlign: 'center', marginTop: 40, fontSize: 16 },
    card: { backgroundColor: t.surface, borderRadius: 28, borderWidth: 1, borderColor: t.border, marginBottom: 20, overflow: 'hidden' },
    thumbBox: { height: 190 },
    thumb: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    thumbIcon: { opacity: 0.95 },
    heartBtn: { position: 'absolute', top: 12, right: 12, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', top: 14, left: 14, backgroundColor: '#F5B93A', borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10 },
    badgeT: { color: '#3A2400', fontWeight: '800', fontSize: 12 },
    cardBody: { padding: 18 },
    pill: { alignSelf: 'flex-start', borderWidth: 1, borderColor: t.border, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, marginBottom: 12, backgroundColor: t.dark ? '#26262B' : '#F1F3F7' },
    pillT: { color: t.accent, fontWeight: '700', fontSize: 15 },
    cardTitle: { color: t.text, fontSize: 21, fontWeight: '800', lineHeight: 29 },
    date: { color: t.mute, fontSize: 14, marginTop: 8 },
    excerpt: { color: t.mute, fontSize: 15, lineHeight: 24, marginTop: 10 },
    dlBtn: { backgroundColor: t.green, borderRadius: 30, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
    dlT: { color: '#fff', fontWeight: '800', fontSize: 17, marginLeft: 8 },
    row: { flexDirection: 'row', marginTop: 12 },
    outBtn: { borderWidth: 1.5, borderColor: t.accent, borderRadius: 30, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    outT: { color: t.accent, fontWeight: '800', fontSize: 16, marginLeft: 8 },
    moreBtn: { backgroundColor: t.accent, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 26, alignItems: 'center' },
    moreT: { color: '#fff', fontWeight: '800', fontSize: 16 },
    delBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
    delT: { color: '#F0455A', fontWeight: '700', marginLeft: 6 },
    aboutCard: { backgroundColor: t.surface, borderRadius: 28, borderWidth: 1, borderColor: t.border, padding: 26, alignItems: 'center' },
    avatar: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
    avatarT: { color: '#fff', fontSize: 48, fontWeight: '800' },
    aboutName: { color: t.text, fontSize: 28, fontWeight: '800', marginTop: 16 },
    aboutRole: { color: t.mute, fontSize: 16, marginTop: 4 },
    aboutText: { color: t.text, fontSize: 16, lineHeight: 25, textAlign: 'center', marginTop: 16 },
    foot: { textAlign: 'center', color: t.mute, marginTop: 10, fontSize: 13 },
    fab: { position: 'absolute', right: 16, bottom: 26, backgroundColor: t.accent, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', elevation: 6 },
    fabT: { color: '#fff', fontWeight: '800', marginLeft: 8, fontSize: 16 },
    detailBar: { paddingTop: (RNStatusBar.currentHeight || 24) + 8, paddingHorizontal: 16, paddingBottom: 10, alignItems: 'flex-end' },
    detailImg: { width: '100%', height: 220, borderRadius: 22, marginBottom: 16 },
    modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: { backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, maxHeight: '92%' },
    sheetT: { fontSize: 22, fontWeight: '800', color: t.text, textAlign: 'center', marginBottom: 14 },
    label: { color: t.text, fontWeight: '700', marginBottom: 8, fontSize: 15 },
    input: { borderWidth: 1, borderColor: t.border, borderRadius: 16, padding: 14, marginBottom: 14, fontSize: 16, color: t.text, backgroundColor: t.input },
    check: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: t.border },
    primary: { backgroundColor: t.accent, borderRadius: 30, padding: 15, alignItems: 'center' },
    primaryT: { color: '#fff', fontWeight: '800', fontSize: 17 },
    cancel: { textAlign: 'center', color: t.mute, padding: 16, fontSize: 16 },
  });
}
