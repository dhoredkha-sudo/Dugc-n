import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Modal, Linking,
  Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
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

const C = { ink: '#12263F', paper: '#F3F5F8', teal: '#1F7A8C', amber: '#F2A33A', line: '#D9DFE7', mute: '#5C6B7E', red: '#B3392F' };
const TYPES = [
  { key: 'all', label: 'সব' },
  { key: 'note', label: 'নোট' },
  { key: 'pdf', label: 'পিডিএফ' },
  { key: 'question', label: 'প্রশ্ন' },
  { key: 'answer', label: 'উত্তরপত্র' },
];
const typeLabel = (k) => (TYPES.find((t) => t.key === k) || {}).label || '';

const driveId = (url) => {
  const m = url.match(/\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
  return m ? m[1] : null;
};
const viewUrl = (u) => { const id = driveId(u); return id ? `https://drive.google.com/file/d/${id}/view` : u; };
const downloadUrl = (u) => { const id = driveId(u); return id ? `https://drive.google.com/uc?export=download&id=${id}` : u; };

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loginOpen, setLoginOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const isAdmin = !!user && user.uid === ADMIN_UID;

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); }), []);
  useEffect(() => {
    return onValue(ref(db, 'posts'), (snap) => {
      const v = snap.val() || {};
      const list = Object.keys(v).map((id) => ({ id, ...v[id] }));
      list.sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
      setPosts(list);
    }, () => Alert.alert('সমস্যা', 'ডেটা লোড করা যায়নি। ইন্টারনেট চেক করুন।'));
  }, []);

  const shown = filter === 'all' ? posts : posts.filter((p) => p.type === filter);

  const remove = (p) => Alert.alert('মুছে ফেলবেন?', p.title, [
    { text: 'না' },
    { text: 'হ্যাঁ, মুছুন', style: 'destructive', onPress: () => remove(ref(db, 'posts/' + p.id)) },
  ]);

  if (!ready) return <View style={s.center}><ActivityIndicator size="large" color={C.teal} /></View>;

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>DUGC N</Text>
          <Text style={s.sub}>নোট, পিডিএফ ও পরীক্ষার প্রশ্ন</Text>
        </View>
        {isAdmin ? (
          <TouchableOpacity style={s.hBtn} onPress={() => signOut(auth)}><Text style={s.hBtnT}>লগআউট</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.hBtn} onPress={() => setLoginOpen(true)}><Text style={s.hBtnT}>অ্যাডমিন</Text></TouchableOpacity>
        )}
      </View>

      <View style={s.chips}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setFilter(t.key)}
            style={[s.chip, filter === t.key && s.chipOn]}>
            <Text style={[s.chipT, filter === t.key && s.chipTOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
        ListEmptyComponent={<Text style={s.empty}>এখানে এখনো কিছু নেই।</Text>}
        renderItem={({ item: p }) => (
          <View style={s.card}>
            <View style={[s.bar, { backgroundColor: p.type === 'pdf' ? C.amber : C.teal }]} />
            <View style={{ flex: 1, padding: 14 }}>
              <Text style={s.tag}>{typeLabel(p.type)}</Text>
              <Text style={s.title}>{p.title}</Text>
              {!!p.body && <Text style={s.body}>{p.body}</Text>}
              {!!p.link && (
                <View style={s.row}>
                  <TouchableOpacity style={s.btn} onPress={() => Linking.openURL(viewUrl(p.link))}><Text style={s.btnT}>দেখুন</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.btn, s.btnAlt]} onPress={() => Linking.openURL(downloadUrl(p.link))}><Text style={[s.btnT, { color: C.ink }]}>ডাউনলোড</Text></TouchableOpacity>
                </View>
              )}
              {isAdmin && <TouchableOpacity onPress={() => remove(p)}><Text style={s.del}>মুছুন</Text></TouchableOpacity>}
            </View>
          </View>
        )}
        ListFooterComponent={<Text style={s.foot}>Developed by Azim R</Text>}
      />

      {isAdmin && (
        <TouchableOpacity style={s.fab} onPress={() => setAddOpen(true)}><Text style={s.fabT}>+ নতুন পোস্ট</Text></TouchableOpacity>
      )}

      <LoginModal visible={loginOpen} onClose={() => setLoginOpen(false)} />
      <AddModal visible={addOpen} onClose={() => setAddOpen(false)} />
    </View>
  );
}

function LoginModal({ visible, onClose }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (cred.user.uid !== ADMIN_UID) { await signOut(auth); Alert.alert('অনুমতি নেই', 'এটি অ্যাডমিন অ্যাকাউন্ট নয়।'); }
      else { setPass(''); onClose(); }
    } catch (e) { Alert.alert('লগইন ব্যর্থ', 'ইমেইল বা পাসওয়ার্ড ভুল।'); }
    setBusy(false);
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalWrap}>
        <View style={s.sheet}>
          <Text style={s.sheetT}>অ্যাডমিন লগইন</Text>
          <TextInput style={s.input} placeholder="ইমেইল" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={s.input} placeholder="পাসওয়ার্ড" secureTextEntry value={pass} onChangeText={setPass} />
          <TouchableOpacity style={s.primary} onPress={go} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryT}>লগইন করুন</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>বাতিল</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AddModal({ visible, onClose }) {
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!title.trim()) return Alert.alert('শিরোনাম লিখুন');
    if (type === 'pdf' && !link.trim()) return Alert.alert('Google Drive লিংক দিন');
    setBusy(true);
    try {
      await push(ref(db, 'posts'), { type, title: title.trim(), body: body.trim(), link: link.trim(), createdAt: Date.now() });
      setTitle(''); setBody(''); setLink(''); onClose();
    } catch (e) { Alert.alert('সংরক্ষণ হয়নি', 'আবার চেষ্টা করুন।'); }
    setBusy(false);
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalWrap}>
        <ScrollView style={s.sheet} keyboardShouldPersistTaps="handled">
          <Text style={s.sheetT}>নতুন পোস্ট</Text>
          <View style={[s.chips, { paddingHorizontal: 0 }]}>
            {TYPES.slice(1).map((t) => (
              <TouchableOpacity key={t.key} onPress={() => setType(t.key)} style={[s.chip, type === t.key && s.chipOn]}>
                <Text style={[s.chipT, type === t.key && s.chipTOn]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={s.input} placeholder="শিরোনাম" value={title} onChangeText={setTitle} />
          <TextInput style={[s.input, { height: 120, textAlignVertical: 'top' }]} placeholder="লেখা / নোট / বিবরণ" multiline value={body} onChangeText={setBody} />
          <TextInput style={s.input} placeholder="Google Drive লিংক (ঐচ্ছিক)" autoCapitalize="none" value={link} onChangeText={setLink} />
          <TouchableOpacity style={s.primary} onPress={save} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryT}>প্রকাশ করুন</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>বাতিল</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: C.ink, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
  brand: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  sub: { color: '#A9B8CB', fontSize: 13, marginTop: 2 },
  hBtn: { borderWidth: 1, borderColor: C.amber, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12 },
  hBtnT: { color: C.amber, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingTop: 12 },
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
  chipOn: { backgroundColor: C.teal, borderColor: C.teal },
  chipT: { color: C.ink, fontWeight: '600' },
  chipTOn: { color: '#fff' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  bar: { width: 5 },
  tag: { color: C.teal, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  title: { color: C.ink, fontSize: 17, fontWeight: '700' },
  body: { color: C.mute, fontSize: 14, lineHeight: 21, marginTop: 6 },
  row: { flexDirection: 'row', marginTop: 12 },
  btn: { backgroundColor: C.ink, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 16, marginRight: 10 },
  btnAlt: { backgroundColor: C.amber },
  btnT: { color: '#fff', fontWeight: '700' },
  del: { color: C.red, marginTop: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: C.mute, marginTop: 50 },
  foot: { textAlign: 'center', color: C.mute, marginTop: 18, fontSize: 12 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: C.teal, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 20, elevation: 5 },
  fabT: { color: '#fff', fontWeight: '800' },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(18,38,63,0.55)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, maxHeight: '90%' },
  sheetT: { fontSize: 20, fontWeight: '800', color: C.ink, marginBottom: 14 },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 },
  primary: { backgroundColor: C.teal, borderRadius: 8, padding: 14, alignItems: 'center' },
  primaryT: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancel: { textAlign: 'center', color: C.mute, padding: 14 },
});
