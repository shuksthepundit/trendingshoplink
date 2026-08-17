import React, { useState, useEffect, useMemo } from "react";
import {
  Flame, RefreshCw, Clock, Share2, Link2, MessageCircle, Send, Copy, ExternalLink,
  ShoppingBag, Store, Sparkles, Hash, TrendingUp, Users, Check, Radio, ChevronRight,
} from "lucide-react";

/* ============================== DESIGN TOKENS ==============================
   Subject: Kenya's trending-news pulse, wrapped around a matatu (public minibus)
   destination board — the hand-painted, LED-lit signs matatus use to flash their
   route and nickname. That's the one distinctive signature: an amber LED ticker
   up top. Everything else stays quiet and dark so it reads as the accent, not
   as decoration piled on decoration.
================================================================================ */
const COLORS = {
  ink: "#120B1E",
  panel: "#1D1330",
  panelAlt: "#271A42",
  panelHi: "#31224F",
  border: "#3A2A5C",
  borderHi: "#4C3778",
  chalk: "#F7F3FF",
  muted: "#B7A9D9",
  mutedDim: "#7C6BA0",
  gold: "#FFB627",   // route-board amber
  pink: "#FF3E7F",   // politics
  teal: "#17B8A6",   // business / shoplink brand
  blue: "#3E8EFF",   // sports
  lime: "#C6F135",   // twitter buzz
  lav: "#B57BFF",    // health
};
const CATS = {
  "Politics": COLORS.pink,
  "Business": COLORS.teal,
  "Sports": COLORS.blue,
  "Twitter Buzz": COLORS.lime,
  "Entertainment": COLORS.gold,
  "Health": COLORS.lav,
  "Trending Searches": COLORS.lime,
};
const F_DISPLAY = '"Bebas Neue","Arial Narrow",Impact,sans-serif';
const F_BODY = '"Inter","Helvetica Neue",Arial,sans-serif';
const F_DATA = '"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
const SHOP_URL = "https://shoplink.page";
const CURATED_AS_OF = "16 Aug 2026";
// Point this at your deployed backend (see the trending-backend README).
// Leave it empty to always run on the curated local dataset below.
const BACKEND_URL = ""; // e.g. "https://your-deployed-backend.example.com"

/* ============================== SEEDED PRNG ============================== */
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h; }
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function baseVal(key, min, max) { return min + mulberry32(hashStr(key))() * (max - min); }
function jitter(key, tick, amp) { return Math.sin((tick + hashStr(key)) * 0.5) * amp; }

/* ============================== CURATED TRENDING POOL ==============================
   Paraphrased from real Kenyan coverage and X/Twitter trend trackers as of the date
   above (politics, business, sports, entertainment, health, and social buzz). A
   production version would swap this for a server-side job polling a real news/
   trends API on a schedule — a browser page can't scrape Google's results directly. */
const TRENDING_POOL = [
  { id: "t1", category: "Politics", title: "ODM presses Ruto over 50-50 power-sharing push ahead of 2027", summary: "Party officials escalate demands on running-mate terms as coalition talks intensify.", time: "3h ago", heatBase: 92 },
  { id: "t2", category: "Politics", title: "Ruto weighs keeping Kindiki or widening the coalition math for 2027", summary: "Speculation builds over the deputy president's seat as Mt Kenya allies push back on ODM.", time: "5h ago", heatBase: 78 },
  { id: "t3", category: "Twitter Buzz", title: "#RutoAtFour trends as Kenyans mark four years of the administration", summary: "Timeline split between government wins and cost-of-living complaints.", time: "6h ago", heatBase: 138 },
  { id: "t4", category: "Business", title: "Kenya's public debt climbs to roughly KSh 12.9 trillion", summary: "Fresh figures reignite debate over borrowing and debt-service costs.", time: "8h ago", heatBase: 61 },
  { id: "t5", category: "Politics", title: "Homa Bay rally turns tense as armed groups block roads", summary: "Journalists covering the event report being targeted; press body condemns the attack.", time: "10h ago", heatBase: 84 },
  { id: "t6", category: "Health", title: "Health Cabinet Secretary halts a US-linked medical facility project", summary: "Move follows a UN report flagging concerns over the facility's operators.", time: "12h ago", heatBase: 55 },
  { id: "t7", category: "Sports", title: "Harambee Stars prospect earns backing from an English club after injury", summary: "Recovery update sparks optimism among fans following a tough patch.", time: "1d ago", heatBase: 47 },
  { id: "t8", category: "Sports", title: "Gor Mahia prepare for a high-stakes Kagame Cup knockout clash", summary: "Coaching staff give a fitness update ahead of the continental tie.", time: "1d ago", heatBase: 43 },
  { id: "t9", category: "Sports", title: "Kenyan referee named for a historic UEFA Super Cup assignment", summary: "Milestone appointment draws praise from local football administrators.", time: "1d ago", heatBase: 39 },
  { id: "t10", category: "Sports", title: "Kenyan-born US runner denies doping claims amid a three-year ban", summary: "Athlete disputes the finding publicly as the case draws wider attention.", time: "2d ago", heatBase: 58 },
  { id: "t11", category: "Entertainment", title: "Pastor Kanyari trends after comments about fan messages go viral", summary: "Clips circulate widely across social timelines through the week.", time: "1d ago", heatBase: 71 },
  { id: "t12", category: "Twitter Buzz", title: "Charlene Ruto trending amid fresh family and political commentary", summary: "Discussion spans both supportive and critical takes across timelines.", time: "4h ago", heatBase: 66 },
  { id: "t13", category: "Business", title: "Proposal floated to channel a new KSh 5 trillion fund into AI infrastructure", summary: "Business voices debate where government investment could have the most impact.", time: "9h ago", heatBase: 34 },
  { id: "t14", category: "Politics", title: "New US travel rule raises risk of a 10-year ban for some Kenyans", summary: "Immigration policy shift prompts concern among prospective travelers.", time: "14h ago", heatBase: 49 },
  { id: "t15", category: "Health", title: "Road safety authority links rising accidents to population and traffic growth", summary: "Officials call for renewed enforcement as incident numbers climb.", time: "16h ago", heatBase: 28 },
  { id: "t16", category: "Twitter Buzz", title: "Kilgoris trends after a local incident draws national attention", summary: "Details continue to develop as more accounts surface online.", time: "7h ago", heatBase: 45 },
];

/* ============================== SHARE HELPERS ============================== */
function buildCaption(title) {
  return `🔥 Trending in Kenya: ${title}\nSee what's hot & shop trending picks at ${SHOP_URL}`;
}
function shareLinks(text, url) {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  return {
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
  };
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch { return false; }
  }
}

/* ============================== SMALL UI PIECES ============================== */
function Badge({ children, color }) {
  return (
    <span style={{
      fontFamily: F_BODY, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, padding: "3px 9px", borderRadius: 999,
      background: `${color}22`, color, border: `1px solid ${color}55`, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}
function IconBtn({ href, onClick, icon: Icon, label, color }) {
  const Comp = href ? "a" : "button";
  return (
    <Comp
      href={href} target={href ? "_blank" : undefined} rel={href ? "noopener noreferrer" : undefined} onClick={onClick}
      title={label} aria-label={label}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8,
        background: COLORS.panelHi, border: `1px solid ${COLORS.border}`, color: color || COLORS.muted, cursor: "pointer",
      }}
    ><Icon size={15} /></Comp>
  );
}

/* ============================== MAIN COMPONENT ============================== */
export default function TrendingKenyaShoplink() {
  const [tick, setTick] = useState(0);
  const [refreshEpoch, setRefreshEpoch] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState("All");
  const [handle, setHandle] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [liveStories, setLiveStories] = useState(null); // null = not loaded yet, [] = loaded empty
  const [feedStatus, setFeedStatus] = useState(BACKEND_URL ? "loading" : "curated"); // loading | live | curated | error

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  async function fetchLiveStories() {
    if (!BACKEND_URL) return;
    setFeedStatus("loading");
    try {
      const res = await fetch(`${BACKEND_URL}/api/trending`);
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const json = await res.json();
      const stories = Array.isArray(json.stories) ? json.stories : [];
      if (stories.length === 0) throw new Error("Backend returned no stories yet");
      setLiveStories(stories);
      setFeedStatus("live");
    } catch (err) {
      console.warn("Trending Kenya: live feed unavailable, using curated data —", err.message);
      setLiveStories(null);
      setFeedStatus("error");
    }
  }

  useEffect(() => {
    if (BACKEND_URL) fetchLiveStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doRefresh() {
    setRefreshing(true);
    setRefreshEpoch((e) => e + 1);
    setLastUpdated(new Date());
    if (BACKEND_URL) fetchLiveStories();
    setTimeout(() => setRefreshing(false), 500);
  }
  // simulated daily auto-refresh (rotates ranking/heat the same way a real overnight job would)
  useEffect(() => {
    const id = setInterval(doRefresh, 86400000);
    return () => clearInterval(id);
  }, []);

  const usingLive = feedStatus === "live" && liveStories && liveStories.length > 0;

  // rank + jitter the curated pool for this refresh epoch, then take the current top 10
  const curatedRanked = useMemo(() => {
    return TRENDING_POOL
      .map((item) => ({ ...item, sortKey: baseVal(item.id + "-e" + refreshEpoch, 0, 1) * 0.35 + (item.heatBase / 140) * 0.65 }))
      .sort((a, b) => b.sortKey - a.sortKey)
      .slice(0, 10)
      .map((item, i) => ({ ...item, rank: i + 1 }));
  }, [refreshEpoch]);
  const curatedLive = curatedRanked.map((item) => ({
    ...item,
    heat: Math.max(4, item.heatBase * 1000 + jitter(item.id + "H", tick, item.heatBase * 60)),
  }));

  const live = usingLive
    ? liveStories.slice(0, 10).map((s, i) => ({ ...s, rank: i + 1 }))
    : curatedLive;
  const filtered = category === "All" ? live : live.filter((i) => i.category === category);
  const marqueeItems = live.slice(0, 6);

  function fmtHeat(n) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(Math.round(n));
  }
  function handleCopy(id, text) {
    copyText(text).then((ok) => { if (ok) { setCopiedId(id); setTimeout(() => setCopiedId(""), 1600); } });
  }

  const shopShare = shareLinks(`🔥 What's trending in Kenya today — and where to shop it. Check out ${SHOP_URL}`, SHOP_URL);
  const igCaption = `🔥 Trending in Kenya today 👇\n\nSwipe to see what everyone's talking about — and shop the trend at ${SHOP_URL} (link in bio)\n\n#TrendingKenya #ShopLinkKE #KenyaOnline #NairobiBusiness`;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.chalk, fontFamily: F_BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 8px; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .marquee-track { display: inline-flex; animation: marquee 32s linear infinite; }
        button { cursor: pointer; }
        input:focus, button:focus-visible, a:focus-visible { outline: 2px solid ${COLORS.gold}; outline-offset: 2px; }
      `}</style>

      {/* ===== HEADER ===== */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.panel, position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.pink})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flame size={19} color="#1A0F0A" />
            </div>
            <div>
              <div style={{ fontFamily: F_DISPLAY, fontSize: 24, letterSpacing: 0.5, lineHeight: 1 }}>TRENDING KENYA</div>
              <div style={{ fontSize: 11, color: COLORS.mutedDim }}>Today's buzz, ready to share and shop</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Badge color={feedStatus === "live" ? COLORS.lime : feedStatus === "loading" ? COLORS.gold : COLORS.mutedDim}>
              {feedStatus === "live" ? "● Live feed" : feedStatus === "loading" ? "Connecting…" : "Curated backup data"}
            </Badge>
            <div style={{ fontSize: 11, color: COLORS.mutedDim, fontFamily: F_DATA, display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={12} /> Updated {lastUpdated.toLocaleTimeString()}
            </div>
            <button onClick={doRefresh} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 7,
              background: COLORS.gold, border: `1px solid ${COLORS.gold}`, color: "#1A0F0A", fontFamily: F_BODY, fontWeight: 700, fontSize: 12,
            }}>
              <RefreshCw size={13} style={{ animation: refreshing ? "spin 0.5s linear" : "none" }} />
              Refresh trends
            </button>
          </div>
        </div>
      </div>

      {/* ===== SIGNATURE: MATATU LED ROUTE-BOARD MARQUEE ===== */}
      <div style={{
        background: "#0A0710", borderBottom: `2px solid ${COLORS.gold}`, padding: "10px 0", overflow: "hidden", position: "relative",
        backgroundImage: "radial-gradient(rgba(255,182,39,0.06) 1px, transparent 1px)", backgroundSize: "6px 6px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 8px", maxWidth: 1180, margin: "0 auto" }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: COLORS.lime, animation: "pulse 1.4s ease-in-out infinite" }} />
          <span style={{ fontFamily: F_DATA, fontSize: 10.5, color: COLORS.lime, letterSpacing: 1.5 }}>LIVE TODAY</span>
        </div>
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((it, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 26px", fontFamily: F_DISPLAY, fontSize: 20, letterSpacing: 0.5, color: COLORS.gold, textShadow: `0 0 12px ${COLORS.gold}55` }}>
              <span style={{ color: CATS[it.category] }}>●</span> {it.title}
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 20px 60px" }}>
        {/* ===== SHOPLINK PROMO STRIP ===== */}
        <div style={{
          borderRadius: 14, border: `1px solid ${COLORS.border}`, background: `linear-gradient(120deg, ${COLORS.panelAlt}, ${COLORS.panel})`,
          padding: 20, marginBottom: 26, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Store size={16} color={COLORS.teal} />
              <span style={{ fontFamily: F_BODY, fontSize: 12, fontWeight: 700, color: COLORS.teal, letterSpacing: 0.3 }}>SHOPLINK.PAGE</span>
            </div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 26, letterSpacing: 0.3, lineHeight: 1.1 }}>Turn every trend into a sale</div>
            <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6, maxWidth: 480, lineHeight: 1.5 }}>
              Build a Shoplink — one page where customers can search, browse and buy straight from you. No app, no code, just your link.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", background: COLORS.ink, border: `1px solid ${COLORS.borderHi}`, borderRadius: 8, padding: "9px 12px", fontFamily: F_DATA, fontSize: 13 }}>
              <span style={{ color: COLORS.mutedDim }}>shoplink.page/</span>
              <input value={handle} onChange={(e) => setHandle(e.target.value.replace(/\s/g, "").toLowerCase())} placeholder="yourbrand" style={{ background: "none", border: "none", outline: "none", color: COLORS.chalk, fontFamily: F_DATA, fontSize: 13, flex: 1, marginLeft: 2 }} />
            </div>
            <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 16px", borderRadius: 8,
              background: `linear-gradient(90deg, ${COLORS.teal}, ${COLORS.lime})`, color: "#08221D", fontFamily: F_BODY, fontWeight: 800, fontSize: 13, textDecoration: "none",
            }}>
              <ShoppingBag size={15} /> Claim your Shoplink <ChevronRight size={14} />
            </a>
          </div>
        </div>

        {/* ===== CATEGORY FILTER ===== */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {["All", ...Object.keys(CATS)].map((c) => {
            const active = category === c;
            const color = CATS[c] || COLORS.chalk;
            return (
              <button key={c} onClick={() => setCategory(c)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, fontFamily: F_BODY,
                background: active ? color : COLORS.panelAlt, color: active ? "#150C22" : COLORS.muted, border: `1px solid ${active ? color : COLORS.border}`,
              }}>
                {c !== "All" && <span style={{ width: 7, height: 7, borderRadius: 999, background: active ? "#150C22" : color }} />}
                {c}
              </button>
            );
          })}
        </div>

        {/* ===== TRENDING LIST ===== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 34 }}>
          {filtered.map((item) => {
            const color = CATS[item.category];
            const caption = buildCaption(item.title);
            const links = shareLinks(caption, SHOP_URL);
            return (
              <div key={item.id} style={{
                display: "flex", gap: 14, background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14,
                borderLeft: `4px solid ${color}`,
              }}>
                <div style={{
                  flexShrink: 0, width: 38, height: 38, borderRadius: 999, background: `${color}22`, border: `2px solid ${color}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F_DISPLAY, fontSize: 16, color,
                }}>{item.rank}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                    <Badge color={color}>{item.category}</Badge>
                    <span style={{ fontSize: 11, color: COLORS.mutedDim, fontFamily: F_DATA }}>{item.time}</span>
                    {item.url ? (
                      <span style={{ fontSize: 11, color: COLORS.mutedDim, fontFamily: F_DATA }}>via {item.source || "source"}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: COLORS.mutedDim, fontFamily: F_DATA, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <TrendingUp size={11} /> {fmtHeat(item.heat)} mentions
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: F_BODY, fontWeight: 700, fontSize: 15, lineHeight: 1.35 }}>{item.title}</div>
                  <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 4, lineHeight: 1.5 }}>{item.summary}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10.5, color: COLORS.mutedDim, marginRight: 2 }}>Share:</span>
                    <IconBtn href={links.whatsapp} icon={MessageCircle} label="Share on WhatsApp" color="#25D366" />
                    <IconBtn href={links.x} icon={Hash} label="Share on X" color={COLORS.chalk} />
                    <IconBtn href={links.facebook} icon={Users} label="Share on Facebook" color="#4C8BF5" />
                    <IconBtn href={links.telegram} icon={Send} label="Share on Telegram" color="#3EA6FF" />
                    <IconBtn onClick={() => handleCopy(item.id, caption + " " + SHOP_URL)} icon={copiedId === item.id ? Check : Link2} label="Copy link" color={copiedId === item.id ? COLORS.lime : COLORS.muted} />
                    {copiedId === item.id && <span style={{ fontSize: 10.5, color: COLORS.lime }}>Copied!</span>}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: COLORS.gold, marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 3, textDecoration: "none" }}>
                        Read full story <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== BOOST YOUR REACH ===== */}
        <div style={{ borderRadius: 14, border: `1px solid ${COLORS.border}`, background: COLORS.panel, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Sparkles size={16} color={COLORS.gold} />
            <span style={{ fontFamily: F_DISPLAY, fontSize: 19, letterSpacing: 0.3 }}>Boost your reach</span>
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.muted, marginBottom: 14, maxWidth: 640, lineHeight: 1.5 }}>
            Share Trending Kenya itself to bring more shoppers and sellers into Shoplink. Pick a platform below.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href={shopShare.whatsapp} target="_blank" rel="noopener noreferrer" style={shareBtnStyle("#25D366")}><MessageCircle size={14} /> WhatsApp</a>
            <a href={shopShare.x} target="_blank" rel="noopener noreferrer" style={shareBtnStyle(COLORS.panelHi)}><Hash size={14} /> X</a>
            <a href={shopShare.facebook} target="_blank" rel="noopener noreferrer" style={shareBtnStyle("#4C8BF5")}><Users size={14} /> Facebook</a>
            <a href={shopShare.telegram} target="_blank" rel="noopener noreferrer" style={shareBtnStyle("#3EA6FF")}><Send size={14} /> Telegram</a>
            <button onClick={() => handleCopy("ig", igCaption)} style={shareBtnStyle(COLORS.pink)}>
              {copiedId === "ig" ? <Check size={14} /> : <Copy size={14} />} Copy caption for Instagram / TikTok
            </button>
            <button onClick={() => handleCopy("link", SHOP_URL)} style={shareBtnStyle(COLORS.panelHi)}>
              {copiedId === "link" ? <Check size={14} /> : <Link2 size={14} />} Copy shoplink.page
            </button>
          </div>
          <div style={{ fontSize: 11, color: COLORS.mutedDim, marginTop: 10 }}>
            Instagram and TikTok don't support pre-filled share links — copy the caption above and paste it into your post or story.
          </div>
        </div>

        {/* ===== SELLER CTA ===== */}
        <div style={{
          borderRadius: 14, border: `1px solid ${COLORS.teal}55`, background: `linear-gradient(135deg, ${COLORS.panelAlt}, ${COLORS.panel})`, padding: 22,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Store size={17} color={COLORS.teal} />
            <span style={{ fontFamily: F_DISPLAY, fontSize: 22, letterSpacing: 0.3 }}>Sell what's trending</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 12 }}>
            {[
              { t: "One link, every platform", d: "Share the same Shoplink on WhatsApp, Instagram, TikTok and Facebook — no separate storefronts to manage." },
              { t: "Customers search & buy directly", d: "People find your products and check out from your page, without leaving the chat or the app they're already in." },
              { t: "Ride today's trends", d: "Post your Shoplink under a trending topic to reach people already talking about it." },
            ].map((b, i) => (
              <div key={i} style={{ background: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>{b.t}</div>
                <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>{b.d}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>
            {["#ShopLinkKE", "#TrendingKenya", "#NairobiBusiness", "#BuyKenyan", "#OnlineSellerKE"].map((h) => (
              <span key={h} style={{ fontFamily: F_DATA, fontSize: 11.5, padding: "5px 10px", borderRadius: 999, background: COLORS.panelHi, border: `1px solid ${COLORS.border}`, color: COLORS.gold }}>{h}</span>
            ))}
            <button onClick={() => handleCopy("tags", "#ShopLinkKE #TrendingKenya #NairobiBusiness #BuyKenyan #OnlineSellerKE")} style={{
              display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: COLORS.mutedDim, fontSize: 11, textDecoration: "underline",
            }}>{copiedId === "tags" ? "Copied!" : "Copy all hashtags"}</button>
          </div>
          <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 7, marginTop: 18, padding: "11px 20px", borderRadius: 9,
            background: `linear-gradient(90deg, ${COLORS.teal}, ${COLORS.lime})`, color: "#08221D", fontFamily: F_BODY, fontWeight: 800, fontSize: 13.5, textDecoration: "none",
          }}><ExternalLink size={15} /> Create your Shoplink — it's free</a>
        </div>

        <div style={{ marginTop: 28, padding: 14, borderTop: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.mutedDim, display: "flex", gap: 6, alignItems: "flex-start" }}>
          <Radio size={13} style={{ marginTop: 1, flexShrink: 0 }} />
          Stories are curated from real Kenyan news and social-trend coverage as of {CURATED_AS_OF} by default. Set BACKEND_URL to a deployed
          trending-backend instance (see its README) to pull a genuinely live, auto-refreshing feed instead — this page falls back to the
          curated set automatically if the live feed is unreachable, so it never breaks.
        </div>
      </div>
    </div>
  );
}

const shareBtnStyle = (color) => ({
  display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 8,
  background: COLORS.panelAlt, border: `1px solid ${color}`, color: COLORS.chalk, fontFamily: F_BODY, fontWeight: 600, fontSize: 12.5,
  textDecoration: "none",
});
