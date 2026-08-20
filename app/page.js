'use client';

import { useEffect, useState } from 'react';

const QUESTIONS = [
  { q: "Champagner oder Craft-Bier — was bringt dich schneller zum Lockerlassen?",
    a: ["Champagner, ich bin klassisch fein 🥂", "Bier, ich bin bodenständig 🍺", "Beides, ich bin flexibel 😏", "Wasser reicht, ich brauch keinen Mut"] },
  { q: "Wie isst du ein gutes Date: Vorspeise zuerst — oder gleich zum Dessert?",
    a: ["Vorspeise, ich genieße jeden Gang", "Dessert zuerst, das Leben ist kurz 😉", "Ich teile lieber einen Teller", "Ich bestelle einfach alles"] },
  { q: "Kerzenlicht-Dinner oder Lagerfeuer unterm Sternenhimmel — wobei wird's bei dir romantisch?",
    a: ["Kerzenlicht, ich mag's elegant", "Lagerfeuer, ich mag's wild 🔥", "Beides, Hauptsache es knistert", "Netflix reicht mir eigentlich auch"] },
  { q: "Erstes Date: Gentleman-Modus oder direkt Vollgas?",
    a: ["Gentleman-Modus, ich nehm mir Zeit", "Vollgas, ich weiß was ich will 😏", "Kommt drauf an, wer mich fragt", "Ich lass mich einfach überraschen"] },
  { q: "Ein Gute-Nacht-Kuss an der Tür — reicht dir das, oder hättest du gern noch etwas länger Zeit mit mir?",
    a: ["Der Kuss reicht mir völlig", "Etwas länger Zeit mit dir wäre schön 😉", "Kommt drauf an, wie das Date lief", "Ich küss nicht beim ersten Date"] },
  { q: "Skala von Kuscheltier bis Feuerwerk — wie explosiv wird unser Date?",
    a: ["Kuscheltier, ganz gemütlich", "Irgendwo dazwischen", "Feuerwerk, volle Ladung 🎆", "Überraschung garantiert"] }
];

const REACTIONS = ["Oh, interessant … 😏", "Notiert.", "Das gefällt mir.", "Aha, ein Mensch mit Geschmack.", "Wird vermerkt, für später.", "Gut zu wissen …"];

async function api(path, options) {
  const res = await fetch(path, {
    method: options?.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Etwas ist schiefgelaufen.');
  return data;
}

function Marquee({ total, lit }) {
  return (
    <div className="marquee">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={'bulb' + (i < lit ? ' lit' : '')} />
      ))}
    </div>
  );
}

export default function Page() {
  const [view, setView] = useState('loading');
  const [loginTab, setLoginTab] = useState('guest');
  const [currentUser, setCurrentUser] = useState(null);

  const [bsPass, setBsPass] = useState('');
  const [bsPass2, setBsPass2] = useState('');
  const [bsMsg, setBsMsg] = useState('');

  const [gName, setGName] = useState('');
  const [gPass, setGPass] = useState('');
  const [gMsg, setGMsg] = useState('');

  const [aPass, setAPass] = useState('');
  const [aMsg, setAMsg] = useState('');

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [reaction, setReaction] = useState('');

  const [dDate, setDDate] = useState('');
  const [dTime, setDTime] = useState('');
  const [dPlace, setDPlace] = useState('');
  const [dMsg, setDMsg] = useState('');

  const [confirmText, setConfirmText] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);

  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [nuName, setNuName] = useState('');
  const [nuPass, setNuPass] = useState('');
  const [nuMsg, setNuMsg] = useState({ text: '', ok: false });

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const boot = await api('/api/bootstrap');
      if (!boot.initialized) {
        setView('bootstrap');
        return;
      }
      const me = await api('/api/auth/me');
      if (me.session?.role === 'admin') {
        await loadAdmin();
        setView('admin');
      } else if (me.session?.role === 'guest') {
        setCurrentUser(me.session.name);
        if (me.submission) {
          setLastSubmission(me.submission);
          buildConfirmText(me.submission);
          setView('confirmed');
        } else {
          setQuizIndex(0);
          setQuizAnswers([]);
          setView('quiz');
        }
      } else {
        setView('login');
      }
    } catch {
      setView('login');
    }
  }

  async function bootstrapAdmin() {
    if (bsPass.trim().length < 4) { setBsMsg('Bitte mindestens 4 Zeichen wählen.'); return; }
    if (bsPass !== bsPass2) { setBsMsg('Die beiden Passwörter stimmen nicht überein.'); return; }
    try {
      await api('/api/bootstrap', { method: 'POST', body: { password: bsPass.trim() } });
      setBsMsg('');
      setLoginTab('admin');
      setView('login');
    } catch (e) {
      setBsMsg(e.message);
    }
  }

  async function guestLogin() {
    try {
      const res = await api('/api/auth/guest', { method: 'POST', body: { name: gName.trim(), password: gPass } });
      setGMsg('');
      setCurrentUser(res.name);
      setGName(''); setGPass('');
      setQuizIndex(0);
      setQuizAnswers([]);
      setReaction('');
      setView('quiz');
    } catch (e) {
      setGMsg(e.message);
    }
  }

  async function adminLogin() {
    try {
      await api('/api/auth/admin', { method: 'POST', body: { password: aPass } });
      setAMsg('');
      setAPass('');
      await loadAdmin();
      setView('admin');
    } catch (e) {
      setAMsg(e.message);
    }
  }

  async function logout() {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    setCurrentUser(null);
    setView('login');
    setLoginTab('guest');
  }

  function pickAnswer(ans) {
    const next = [...quizAnswers, ans];
    setQuizAnswers(next);
    setReaction(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
    const nextIndex = quizIndex + 1;
    setTimeout(() => {
      setQuizIndex(nextIndex);
      setReaction('');
      if (nextIndex >= QUESTIONS.length) {
        const today = new Date().toISOString().split('T')[0];
        setDDate(prev => prev || '');
        setView('result');
      }
    }, 500);
  }

  function buildConfirmText(sub) {
    const niceDate = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(sub.date + 'T00:00:00'));
    const text = 'Am ' + niceDate + (sub.time ? ', ' + sub.time + ' Uhr' : '') + (sub.place ? ' bei ' + sub.place : '') + '. Ich freu mich schon riesig.';
    setConfirmText(text);
  }

  async function submitDate() {
    if (!dDate) { setDMsg('Bitte ein Datum auswählen.'); return; }
    try {
      await api('/api/submissions', { method: 'POST', body: { date: dDate, time: dTime, place: dPlace, answers: quizAnswers } });
      setDMsg('');
      const sub = { name: currentUser, date: dDate, time: dTime, place: dPlace };
      setLastSubmission(sub);
      buildConfirmText(sub);
      setView('confirmed');
    } catch (e) {
      setDMsg(e.message);
    }
  }

  function downloadIcs() {
    if (!lastSubmission) return;
    const d = lastSubmission.date.replace(/-/g, '');
    const t = lastSubmission.time ? lastSubmission.time.replace(':', '') + '00' : '190000';
    const dt = d + 'T' + t;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      'SUMMARY:Date mit ' + lastSubmission.name,
      'DTSTART:' + dt,
      'LOCATION:' + (lastSubmission.place || ''),
      'DESCRIPTION:Herzklopf-Casting bestanden — ab in dieses Date!',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'date.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function loadAdmin() {
    const [u, s] = await Promise.all([api('/api/users'), api('/api/submissions')]);
    setUsers(u.users || []);
    setSubmissions(s.submissions || []);
  }

  function genPassword() {
    const words = ['Kuss', 'Funke', 'Rose', 'Herz', 'Feuer', 'Flirt', 'Zauber', 'Glut'];
    const pw = words[Math.floor(Math.random() * words.length)] + Math.floor(10 + Math.random() * 89);
    setNuPass(pw);
  }

  async function addUser() {
    if (!nuName.trim() || !nuPass.trim()) { setNuMsg({ text: 'Bitte Name und Passwort ausfüllen.', ok: false }); return; }
    try {
      await api('/api/users', { method: 'POST', body: { name: nuName.trim(), password: nuPass.trim() } });
      setNuMsg({ text: nuName.trim() + ' wurde eingeladen.', ok: true });
      setNuName(''); setNuPass('');
      await loadAdmin();
    } catch (e) {
      setNuMsg({ text: e.message, ok: false });
    }
  }

  async function deleteUser(name) {
    if (!confirm('Zugang für ' + name + ' wirklich entfernen?')) return;
    try {
      await api('/api/users/' + encodeURIComponent(name), { method: 'DELETE' });
      await loadAdmin();
    } catch {}
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="stage">
      <div className="hero">
        <p className="eyebrow">— exklusives Vorstellungsgespräch —</p>
        <h1>Herzklopf-Casting</h1>
        <p className="sub">Nur geladene Gäste. Bestehe den Flirt-Test und sicher dir ein echtes Date.</p>
      </div>

      {(view === 'quiz' || view === 'result') && (
        <Marquee total={QUESTIONS.length} lit={view === 'result' ? QUESTIONS.length : quizIndex} />
      )}
      {view !== 'quiz' && view !== 'result' && <Marquee total={QUESTIONS.length} lit={0} />}

      <div className="card">
        {view === 'loading' && (
          <div className="view"><p style={{ textAlign: 'center', color: 'rgba(42,14,24,.5)' }}>Vorhang geht auf …</p></div>
        )}

        {view === 'bootstrap' && (
          <div className="view">
            <h2 className="card-title">Bühne einrichten</h2>
            <p className="card-lede">Noch kein Admin-Passwort vergeben. Lege jetzt eines fest — damit verwaltest du später alle Namen &amp; Passwörter.</p>
            <label>Neues Admin-Passwort</label>
            <input type="password" value={bsPass} onChange={e => setBsPass(e.target.value)} placeholder="mind. 4 Zeichen" />
            <label>Passwort wiederholen</label>
            <input type="password" value={bsPass2} onChange={e => setBsPass2(e.target.value)} placeholder="nochmal eingeben" />
            <button className="btn" onClick={bootstrapAdmin}>Admin-Zugang einrichten</button>
            {bsMsg && <div className="msg error">{bsMsg}</div>}
          </div>
        )}

        {view === 'login' && (
          <div className="view">
            <div className="tabs">
              <button className={loginTab === 'guest' ? 'active' : ''} onClick={() => setLoginTab('guest')}>Ich bin geladen 💌</button>
              <button className={loginTab === 'admin' ? 'active' : ''} onClick={() => setLoginTab('admin')}>Admin</button>
            </div>

            {loginTab === 'guest' && (
              <div>
                <h2 className="card-title">Zutritt nur mit Einladung</h2>
                <p className="card-lede">Name und Passwort bitte — du weißt schon, wovon ich rede.</p>
                <label>Name</label>
                <input type="text" value={gName} onChange={e => setGName(e.target.value)} placeholder="Dein Name" />
                <label>Passwort</label>
                <input type="password" value={gPass} onChange={e => setGPass(e.target.value)} placeholder="Dein Passwort" />
                <button className="btn" onClick={guestLogin}>Reinlassen 🎭</button>
                {gMsg && <div className="msg error">{gMsg}</div>}
              </div>
            )}

            {loginTab === 'admin' && (
              <div>
                <h2 className="card-title">Backstage-Bereich</h2>
                <p className="card-lede">Nur für die Regie.</p>
                <label>Admin-Passwort</label>
                <input type="password" value={aPass} onChange={e => setAPass(e.target.value)} placeholder="Admin-Passwort" />
                <button className="btn secondary" onClick={adminLogin}>Ins Admin-Panel</button>
                {aMsg && <div className="msg error">{aMsg}</div>}
              </div>
            )}
          </div>
        )}

        {view === 'quiz' && quizIndex < QUESTIONS.length && (
          <div className="view">
            <div className="top-bar">
              <span className="q-count">Frage {quizIndex + 1} / {QUESTIONS.length}</span>
              <button className="logout-link" onClick={logout}>abmelden</button>
            </div>
            <p className="q-text">{QUESTIONS[quizIndex].q}</p>
            <div className="answers">
              {QUESTIONS[quizIndex].a.map((ans, i) => (
                <button key={i} className="answer-btn" onClick={() => pickAnswer(ans)}>{ans}</button>
              ))}
            </div>
            <p className="reaction">{reaction}</p>
          </div>
        )}

        {view === 'result' && (
          <div className="view">
            <h2 className="card-title">Chemie-Test bestanden 🔥</h2>
            <p className="card-lede">Genug geflirtet — jetzt wird's konkret. Trag ein, wann wir uns sehen.</p>
            <div className="meter-wrap">
              <div className="meter-track"><div className="meter-fill" style={{ width: '100%' }} /></div>
              <div className="meter-label">100% Übereinstimmung</div>
            </div>
            <label>Datum</label>
            <input type="date" min={today} value={dDate} onChange={e => setDDate(e.target.value)} />
            <label>Uhrzeit (optional)</label>
            <input type="time" value={dTime} onChange={e => setDTime(e.target.value)} />
            <label>Ort (optional)</label>
            <input type="text" value={dPlace} onChange={e => setDPlace(e.target.value)} placeholder="z. B. unser Lieblingsitaliener" />
            <button className="btn" onClick={submitDate}>Date festmachen 💋</button>
            {dMsg && <div className="msg error">{dMsg}</div>}
          </div>
        )}

        {view === 'confirmed' && (
          <div className="view">
            <div className="confirm-box">
              <div className="big-emoji">🥂</div>
              <h2 className="card-title">Termin steht!</h2>
              <p className="card-lede">{confirmText}</p>
              <button className="btn secondary" onClick={downloadIcs}>In Kalender speichern (.ics)</button>
              <button className="btn ghost" onClick={logout}>Abmelden</button>
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="view">
            <div className="top-bar">
              <h2 className="card-title" style={{ margin: 0 }}>Backstage-Verwaltung</h2>
              <button className="logout-link" onClick={logout}>abmelden</button>
            </div>
            <p className="card-lede">Hinweis: Das ist ein einfacher Namens-/Passwortschutz für den privaten Spaß — kein Hochsicherheitstrakt. Keine echten Zugangsdaten von woanders wiederverwenden.</p>

            <div className="admin-section">
              <h3>Neuen Gast einladen</h3>
              <div className="inline-form">
                <div>
                  <label>Name</label>
                  <input type="text" value={nuName} onChange={e => setNuName(e.target.value)} placeholder="z. B. Alex" />
                </div>
                <div>
                  <label>Passwort</label>
                  <input type="text" value={nuPass} onChange={e => setNuPass(e.target.value)} placeholder="Passwort" />
                </div>
              </div>
              <button className="btn small secondary" style={{ marginTop: 10 }} onClick={genPassword}>🎲 Passwort vorschlagen</button>
              <button className="btn" onClick={addUser}>Einladung erstellen</button>
              {nuMsg.text && <div className={'msg ' + (nuMsg.ok ? 'ok' : 'error')}>{nuMsg.text}</div>}
            </div>

            <div className="admin-section">
              <h3>Aktuelle Gäste</h3>
              {users.length === 0 && <div className="empty-hint">Noch niemand eingeladen.</div>}
              {users.map(u => (
                <div className="user-row" key={u.name}>
                  <div><div className="who">{u.name}</div><div className="pw">eingeladen am {u.created_at}</div></div>
                  <button className="del-btn" onClick={() => deleteUser(u.name)}>✕</button>
                </div>
              ))}
            </div>

            <div className="admin-section">
              <h3>Eingereichte Dates</h3>
              {submissions.length === 0 && <div className="empty-hint">Noch keine Dates eingetragen.</div>}
              {submissions.map((s, i) => {
                const niceDate = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(s.date + 'T00:00:00'));
                return (
                  <div className="sub-row" key={i}>
                    <div>
                      <div className="who">{s.name}</div>
                      <div className="pw">{niceDate}{s.time ? ', ' + s.time + ' Uhr' : ''}{s.place ? ' · ' + s.place : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="tiny">Vorhang, Bühne, Herzklopfen — nur für dich gemacht.</footer>
    </div>
  );
}
