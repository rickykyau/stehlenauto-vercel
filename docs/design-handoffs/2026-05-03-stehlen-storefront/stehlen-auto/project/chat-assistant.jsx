// ============================================================
// Stehlen Auto — Live Chat / AI Assistant Overlay (RIG, the bot)
// ============================================================
const { I } = window.STEHLEN_UI;

function ChatAssistant({ vehicle, onNav, mobile }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(1);
  const [mode, setMode] = useState('ai'); // 'ai' | 'human'
  const [queueWait, setQueueWait] = useState(2);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', t: 'morning. i\'m RIG — Stehlen\'s install assistant. ask me about fitment, install steps, or order status.', ts: '7:42 AM' },
    { id: 2, role: 'bot', kind: 'chips', chips: [
      { l: 'Will this fit my truck?',     q: 'fit' },
      { l: 'Track an order',              q: 'track' },
      { l: 'Install help',                q: 'install' },
      { l: 'Talk to a human',             q: 'human' },
    ] },
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, open]);

  const fakeReply = (q) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      let reply;
      const v = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'your truck';
      if (q === 'fit' || /fit|fitment|will.*fit/i.test(q)) {
        reply = { id: Date.now(), role: 'bot', t: `for ${v}: 142 parts confirmed. tonneau covers, bumpers, racks, grilles all bolt-on. want me to list ${vehicle?'recommended':''} parts?`, ts: 'now', kind: 'rich', actions: [
          { l: 'Show parts for my truck', do: () => { setOpen(false); onNav('vehicle-hub'); } },
          { l: 'Build & quote',           do: () => { setOpen(false); onNav('build'); } },
        ] };
      } else if (q === 'track' || /track|order|where.*part|shipped/i.test(q)) {
        reply = { id: Date.now(), role: 'bot', t: 'order STH-281-4422 is in transit. ETA tomorrow by 8pm. signed for at delivery.', ts: 'now', kind: 'rich', actions: [
          { l: 'Open order detail', do: () => { setOpen(false); onNav('order-detail'); } },
        ] };
      } else if (q === 'install' || /install|torque|how.*do.*i/i.test(q)) {
        reply = { id: Date.now(), role: 'bot', t: 'pull the install guide for that part. avg 25–45 min, no drilling. need help mid-install? i can connect you to a tech.', ts: 'now', kind: 'rich', actions: [
          { l: 'Open install guide', do: () => { setOpen(false); onNav('install-guide'); } },
          { l: 'Connect to a tech',  do: () => setMode('human') },
        ] };
      } else if (q === 'human' || /human|person|agent|talk to someone/i.test(q)) {
        reply = { id: Date.now(), role: 'bot', t: 'connecting you to a real human. queue is short.', ts: 'now' };
        setTimeout(() => setMode('human'), 600);
      } else {
        reply = { id: Date.now(), role: 'bot', t: `got it. for ${v}, the most common ask after that is install timing. anything else?`, ts: 'now' };
      }
      setMessages(m => [...m, reply]);
    }, 900);
  };

  const send = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', t: text, ts: 'now' };
    setMessages(m => [...m, userMsg]);
    setInput('');
    if (mode === 'ai') fakeReply(text);
  };

  // Connecting to human
  useEffect(() => {
    if (mode === 'human' && !messages.find(m => m.kind === 'human-greet')) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(m => [...m,
          { id: Date.now(), role: 'system', kind: 'system', t: 'Connected to MARCUS T. · Stehlen Fitment Specialist · 8 yr ASE-cert' },
          { id: Date.now()+1, role: 'human', kind: 'human-greet', avatar: 'MT', name: 'Marcus T.', t: 'hey — Marcus here. picking up RIG\'s thread. what truck are you working on?', ts: 'now' },
        ]);
      }, 1400);
    }
  }, [mode]);

  // Open => clear unread
  useEffect(() => { if (open) setUnread(0); }, [open]);

  // ---------- Closed state: floating launcher ----------
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} aria-label="Open chat" style={{
        position: 'fixed',
        bottom: mobile ? 76 : 24,
        right: mobile ? 16 : 24,
        zIndex: 80,
        background: 'var(--c-accent)',
        color: 'var(--c-bg)',
        border: 0,
        width: 60, height: 60,
        borderRadius: 30,
        boxShadow: '0 12px 40px rgba(245,168,35,0.35), 0 4px 16px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <I.chat size={26} stroke="var(--c-bg)" sw={2.4} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, minWidth: 22, height: 22, padding: '0 6px',
            background: '#0a0a0a', color: 'var(--c-accent)', borderRadius: 11, border: '2px solid var(--c-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, fontFamily: 'var(--f-mono)',
          }}>{unread}</span>
        )}
      </button>
    );
  }

  // ---------- Open state ----------
  const panelStyle = mobile ? {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'var(--c-bg)', display: 'flex', flexDirection: 'column',
  } : {
    position: 'fixed', bottom: 24, right: 24, zIndex: 100,
    width: 400, height: 620, maxHeight: 'calc(100vh - 48px)',
    background: 'var(--c-bg)', border: '1px solid var(--c-border)',
    borderRadius: 'var(--r-md)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  };

  return (
    <div style={panelStyle}>
      {/* HEADER */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: 40, height: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: mode === 'ai' ? 'var(--c-accent)' : 'var(--c-surface-2)', color: mode === 'ai' ? 'var(--c-bg)' : 'var(--c-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.05em' }}>
            {mode === 'ai' ? 'RIG' : 'MT'}
          </div>
          <span style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--c-success)', border: '2px solid var(--c-surface)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 700, letterSpacing: '0.02em' }}>{mode === 'ai' ? 'RIG · Install Assistant' : 'Marcus T.'}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.12em', marginTop: 2 }}>
            {mode === 'ai' ? 'AI · ALWAYS ON · TYPICALLY < 5S' : 'STEHLEN HUMAN · TYPICALLY < ' + queueWait + 'M'}
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 0, color: 'var(--c-muted)', cursor: 'pointer', padding: 6 }} aria-label="Close">
          <I.close size={18} />
        </button>
      </div>

      {/* CONTEXT BAR */}
      {vehicle && (
        <div style={{ padding: '10px 16px', background: 'rgba(245,168,35,0.06)', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <I.truck size={12} stroke="var(--c-accent)" /> <strong style={{ color: 'var(--c-text)' }}>{vehicle.year} {vehicle.make} {vehicle.model}</strong> in context
          </div>
          <span className="mono" style={{ fontSize: 9, color: 'var(--c-accent)', letterSpacing: '0.14em', fontWeight: 700 }}>SHARED</span>
        </div>
      )}

      {/* MESSAGES */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(m => {
          if (m.kind === 'system') return (
            <div key={m.id} style={{ textAlign: 'center', padding: '8px 0' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--c-muted)', letterSpacing: '0.14em', background: 'var(--c-surface)', padding: '6px 12px', borderRadius: 999, border: '1px solid var(--c-border)' }}>
                ● {m.t}
              </span>
            </div>
          );
          if (m.kind === 'chips') return (
            <div key={m.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 36 }}>
              {m.chips.map(c => (
                <button key={c.l} onClick={() => send(c.l) || setTimeout(() => fakeReply(c.q), 0)} className="chip" style={{ height: 32, padding: '0 14px', cursor: 'pointer', fontSize: 11, background: 'var(--c-surface)' }}>
                  {c.l}
                </button>
              ))}
            </div>
          );
          const isUser = m.role === 'user';
          const isHuman = m.role === 'human';
          return (
            <div key={m.id} style={{ display: 'flex', gap: 8, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              {!isUser && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: isHuman ? 'var(--c-surface-2)' : 'var(--c-accent)',
                  color: isHuman ? 'var(--c-text)' : 'var(--c-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 10, letterSpacing: '0.04em', flexShrink: 0,
                }}>
                  {isHuman ? (m.avatar || 'MT') : 'RIG'}
                </div>
              )}
              <div style={{ maxWidth: '78%' }}>
                <div style={{
                  background: isUser ? 'var(--c-accent)' : 'var(--c-surface)',
                  color: isUser ? 'var(--c-bg)' : 'var(--c-text)',
                  padding: '10px 14px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: 13, lineHeight: 1.5,
                  border: isUser ? 0 : '1px solid var(--c-border)',
                  fontWeight: isUser ? 500 : 400,
                }}>
                  {m.t}
                </div>
                {m.kind === 'rich' && m.actions && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {m.actions.map(a => (
                      <button key={a.l} onClick={a.do} className="btn btn-sm" style={{ height: 30 }}>{a.l} →</button>
                    ))}
                  </div>
                )}
                <div className="mono" style={{ fontSize: 9, color: 'var(--c-muted-2)', marginTop: 4, letterSpacing: '0.08em', textAlign: isUser ? 'right' : 'left' }}>{m.ts}</div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: mode === 'ai' ? 'var(--c-accent)' : 'var(--c-surface-2)', color: mode === 'ai' ? 'var(--c-bg)' : 'var(--c-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>
              {mode === 'ai' ? 'RIG' : 'MT'}
            </div>
            <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', padding: '12px 14px', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4 }}>
              <Dot delay={0} /><Dot delay={0.15} /><Dot delay={0.3} />
            </div>
          </div>
        )}
      </div>

      {/* SUGGESTIONS RAIL */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--c-border)', background: 'var(--c-surface)', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[
          { l: 'Fitment for my truck', q: 'fit' },
          { l: 'Order status',         q: 'track' },
          { l: 'Install timing',       q: 'install' },
          { l: 'Returns',              q: 'returns' },
          { l: 'Talk to human',        q: 'human' },
        ].map(s => (
          <button key={s.l} onClick={() => { send(s.l); setTimeout(() => fakeReply(s.q), 0); }} className="chip" style={{ height: 26, padding: '0 10px', cursor: 'pointer', fontSize: 10, flexShrink: 0, background: 'var(--c-bg)' }}>
            {s.l}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} style={{ padding: 12, borderTop: '1px solid var(--c-border)', background: 'var(--c-bg)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <button type="button" title="Attach photo" style={{ background: 'transparent', border: '1px solid var(--c-border)', color: 'var(--c-muted)', width: 36, height: 36, borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I.plus size={14} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'ai' ? 'Ask RIG anything…' : 'Message Marcus…'}
          style={{
            flex: 1, height: 36, padding: '0 12px',
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            color: 'var(--c-text)', fontSize: 13, borderRadius: 'var(--r-sm)',
            outline: 'none', fontFamily: 'var(--f-body)',
          }}
        />
        <button type="submit" disabled={!input.trim()} style={{
          background: input.trim() ? 'var(--c-accent)' : 'var(--c-surface-2)',
          color: input.trim() ? 'var(--c-bg)' : 'var(--c-muted)',
          border: 0, width: 36, height: 36, borderRadius: 'var(--r-sm)',
          cursor: input.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }} aria-label="Send">
          <I.arrowR size={15} stroke={input.trim() ? 'var(--c-bg)' : 'var(--c-muted)'} sw={2.4} />
        </button>
      </form>

      {/* footer */}
      <div style={{ padding: '6px 12px 10px', textAlign: 'center', background: 'var(--c-bg)' }}>
        <span className="mono" style={{ fontSize: 9, color: 'var(--c-muted-2)', letterSpacing: '0.12em' }}>
          {mode === 'ai' ? 'AI · MAY MAKE MISTAKES · CHECK FITMENT' : 'PRIVATE CHAT · ENCRYPTED'}
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: '50%', background: 'var(--c-muted)',
      animation: 'rigPulse 1.2s ease-in-out infinite',
      animationDelay: `${delay}s`,
    }} />
  );
}

// inject keyframes once
if (!document.getElementById('rig-style')) {
  const s = document.createElement('style');
  s.id = 'rig-style';
  s.textContent = '@keyframes rigPulse { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }';
  document.head.appendChild(s);
}

window.ChatAssistant = ChatAssistant;
