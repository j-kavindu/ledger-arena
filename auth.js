'use strict';
// Firebase's public web configuration. No admin credentials or client secret belongs here.
const firebaseConfig = {
  apiKey: 'AIzaSyBJwORmeq5I0RLKCLUKgjTCThhMmeJxJrc',
  authDomain: 'accounting-simulation.firebaseapp.com',
  projectId: 'accounting-simulation',
  appId: '1:747399856674:web:5b400eda8c02f00094007b'
};
const accountRoot = document.querySelector('#accountControls');
let firebaseAuth, authSdk, firestoreSdk, firebaseDb, cloudSync, currentUser = null, busy = false;
window.ledgerOnProgressChange=(uid)=>{if(uid&&uid===currentUser?.uid)cloudSync?.queue()};
const googleIcon = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.2 3-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.3 2.6A5.9 5.9 0 0 1 12 6Z"/></svg>';
function accountMessage(message) {
  const status = document.querySelector('#accountStatus');
  status.textContent = message;
}
function renderAccount() {
  accountRoot.replaceChildren();
  if (currentUser) {
    const profile = document.createElement('span');
    profile.className = 'account-profile';
    const avatar = document.createElement('span');
    avatar.className = 'account-avatar';
    avatar.textContent = (currentUser.displayName || currentUser.email || 'U').slice(0, 1).toUpperCase();
    avatar.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'account-name';
    name.textContent = currentUser.displayName || currentUser.email || 'Signed in';
    profile.title = currentUser.email || 'Signed in with Google';
    profile.append(avatar, name);
    const logout = document.createElement('button');
    logout.className = 'account-button';
    logout.textContent = busy ? 'Signing out…' : 'Sign out';
    logout.disabled = busy;
    logout.onclick = logoutGoogle;
    accountRoot.append(profile, logout);
  } else {
    const button = document.createElement('button');
    button.className = 'account-button google-login';
    button.innerHTML = googleIcon;
    const label = document.createElement('span');
    label.textContent = busy ? 'Connecting…' : 'Sign in with Google';
    button.append(label);
    button.disabled = busy;
    button.onclick = loginGoogle;
    accountRoot.append(button);
  }
}
function authError(error) {
  return ({
    'auth/popup-closed-by-user': 'Sign-in cancelled. You can continue practising as a guest.',
    'auth/cancelled-popup-request': 'A sign-in window is already open. Complete it or try again.',
    'auth/popup-blocked': 'Allow pop-ups for this website, then select Sign in with Google again.',
    'auth/unauthorized-domain': 'Google sign-in is not yet enabled for this website address.',
    'auth/network-request-failed': 'Unable to connect. Check your connection and try again.',
    'auth/operation-not-allowed': 'Google sign-in is temporarily unavailable.',
    'auth/web-storage-unsupported': 'Allow browser storage to stay signed in.'
  })[error?.code] || 'Unable to sign in right now. Please try again. Guest practice is still available.';
}
function canSwitch() { return !window.ledgerCanSwitchAccount || window.ledgerCanSwitchAccount(); }
function loginGoogle() {
  if (busy || !canSwitch()) return;
  if (!firebaseAuth) { initialiseAccount(); return; }
  busy = true;
  renderAccount();
  accountMessage('Complete Google sign-in in the new window.');
  const provider = new authSdk.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  // Start synchronously within the user gesture, so mobile popup blockers can allow it.
  authSdk.signInWithPopup(firebaseAuth, provider)
    .catch(error => accountMessage(authError(error)))
    .finally(() => { busy = false; renderAccount(); });
}
async function logoutGoogle() {
  if (busy || !canSwitch()) return;
  busy = true; renderAccount();
  try { if(cloudSync)await Promise.race([(async()=>{await cloudSync.flush();await cloudSync.flush()})(),new Promise(resolve=>setTimeout(resolve,2000))]);await authSdk.signOut(firebaseAuth); }
  catch { accountMessage('Unable to sign out. Please try again.'); }
  finally { busy = false; renderAccount(); }
}
async function initialiseAccount() {
  if (busy) return;
  busy = true; renderAccount(); accountMessage('Preparing secure sign-in…');
  try {
    const [appSdk, sdk, databaseSdk] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js')
    ]);
    authSdk = sdk;
    const firebaseApp=appSdk.getApps().length?appSdk.getApp():appSdk.initializeApp(firebaseConfig);
    firebaseAuth=sdk.getAuth(firebaseApp);firestoreSdk=databaseSdk;firebaseDb=databaseSdk.getFirestore(firebaseApp);
    await sdk.setPersistence(firebaseAuth, sdk.browserLocalPersistence);
    sdk.onAuthStateChanged(firebaseAuth, user => {
      if(currentUser?.uid===user?.uid&&cloudSync)return;
      cloudSync?.stop();cloudSync=null;
      currentUser = user;
      window.ledgerSetAccount?.(user?.uid || null);
      renderAccount();
      accountMessage(user ? 'Loading your synced progress…' : 'Practise as a guest or sign in to sync across devices.');
      if(user)cloudSync=window.LedgerCloud.create({sdk:firestoreSdk,db:firebaseDb,uid:user.uid,getState:window.ledgerGetProgress,apply:window.ledgerMergeProgress,status:accountMessage});
    }, () => accountMessage('Unable to check your account. Please reload to try again.'));
  } catch {
    accountMessage('Sign-in could not load. Check your connection, then select Sign in with Google to retry.');
  } finally { busy = false; renderAccount(); }
}
initialiseAccount();
