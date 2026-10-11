// 앱이 쓰는 Firebase 기능만 모아서 window.FB 로 내보냅니다 (필요한 것만 넣어 크기를 줄임).
// 앱은 이 파일을 인터넷에서 받지 않고 assets 안에 포함해서 씁니다 (로컬 우선 · 인터넷 없어도 앱이 뜸).
import { initializeApp } from 'firebase/app';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence,
  signInAnonymously, onAuthStateChanged, signOut, connectAuthEmulator,
  GoogleAuthProvider, linkWithCredential, signInWithCredential,
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager, memoryLocalCache,
  connectFirestoreEmulator, getFirestore, doc, collection, getDoc, getDocFromServer, getDocs, setDoc, updateDoc,
  deleteDoc, onSnapshot, writeBatch, runTransaction, serverTimestamp, increment, query, where,
  orderBy, limit, Timestamp, arrayUnion, arrayRemove, deleteField, terminate,
} from 'firebase/firestore';

window.FB = {
  initializeApp,
  auth: {
    initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, signInAnonymously,
    onAuthStateChanged, signOut, connectAuthEmulator, GoogleAuthProvider, linkWithCredential,
    signInWithCredential,
  },
  fs: {
    initializeFirestore, persistentLocalCache, persistentSingleTabManager, memoryLocalCache,
    connectFirestoreEmulator, getFirestore, doc, collection, getDoc, getDocFromServer, getDocs, setDoc, updateDoc,
    deleteDoc, onSnapshot, writeBatch, runTransaction, serverTimestamp, increment, query, where,
    orderBy, limit, Timestamp, arrayUnion, arrayRemove, deleteField, terminate,
  },
};
