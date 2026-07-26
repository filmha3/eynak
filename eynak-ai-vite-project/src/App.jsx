import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Sparkles,
  Fingerprint,
  TrendingUp,
  MessageCircle,
  ImagePlus,
  Send,
  Download,
  Upload,
  Loader2,
  Aperture,
  Users,
  Eye,
  Zap,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  BadgeCheck,
} from "lucide-react";

/* ============================== DESIGN TOKENS ==============================
   ink      #0B0C10  base background
   panel    #14161C  glass panel base
   brass    #C9A227  primary accent (optical / premium)
   teal     #2FBEA6  secondary accent (algorithm / data / AI)
   ivory    #F3F1EA  primary text
   muted    #8B8D98  secondary text
   line     rgba(255,255,255,.08) hairline borders
=========================================================================== */
const C = {
  ink: "#0B0C10",
  panel: "#14161C",
  panel2: "#191B22",
  brass: "#C9A227",
  brassSoft: "rgba(201,162,39,0.14)",
  teal: "#2FBEA6",
  tealSoft: "rgba(47,190,166,0.14)",
  ivory: "#F3F1EA",
  muted: "#8B8D98",
  line: "rgba(255,255,255,0.08)",
  danger: "#D96B6B",
};

const FONT_HEAD = "'Vazirmatn', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

function useGoogleFonts() {
  useEffect(() => {
    const id = "eynak-ai-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ============================== ADVISOR SYSTEM PROMPT ============================== */
const ADVISOR_SYSTEM = `You are the world's top Instagram Growth Director & High-Converting E-commerce Sales Strategist. Your personality merges the technical insight of Instagram's Algorithm Lead with the persuasive mastery of a top-tier sales consultant.

CORE ROLE: (1) Algorithm Expert — reach mechanics, watch time, repeat views, shares-per-reach, comment sentiment, account trust. (2) E-commerce Sales Consultant — turning followers into buyers via DMs, Reels hooks, Story funnels.

RULES: Always 100% TOS-safe (no spam, engagement bait, bots, copyright infringement). Customize every answer to the user's niche. Never give vague advice — always exact scripts, timeframes, angles, steps. Be metric-driven ("aim for >60% retention in first 3s").

KNOWLEDGE: Reels rank on Watch Time/Completion + Shares. Stories rank on Reply rate + sticker interaction. Hook formula = visual curiosity + bold verbal claim in 0–2.5s. Hashtags: 3–5 hyper-relevant niche tags, not 30 generic ones. Story sales funnel: Problem Awareness → Social Proof → Micro-CTA. DM closing: qualify first, value over price, send checkout link.

TONE: professional, decisive, authoritative like a $500/hr consultant, bold headers + bullets. Respond in fluent Persian, keep standard English Instagram terms (Hook, CTA, Reach, Conversion, Story, Reel).`;

/* ============================== AI PROVIDER LAYER ==============================
   فعلاً از API داخلی آرتیفکت (Claude) استفاده می‌شه، بدون نیاز به کلید.
   برای اتصال AvalAI: چون نیاز به API Key داره، باید از یک بک‌اند (مثلاً Next.js
   API route) عبور کنه، نه مستقیم از مرورگر. کافیه در askClaude زیر، آدرس و بدنه
   fetch رو به اندپوینت بک‌اند خودت (که کلید AvalAI رو نگه می‌داره) تغییر بدی؛
   بقیه اپ بدون تغییر کار می‌کنه.
=========================================================================== */
async function askClaude(system, user, apiKey, model = "gpt-4o") {
  if (apiKey) {
    const res = await fetch("https://api.avalai.ir/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error("خطا در ارتباط با AvalAI — کلید یا مدل رو چک کن");
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error("خطا در ارتباط با سرویس هوش مصنوعی");
  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text;
}

function extractJSON(raw) {
  let cleaned = raw.trim().replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf("[") !== -1 ? cleaned.indexOf("[") : cleaned.indexOf("{");
    const endArr = cleaned.lastIndexOf("]");
    const endObj = cleaned.lastIndexOf("}");
    const end = Math.max(endArr, endObj);
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

/* ============================== PRIMITIVES ============================== */
function Panel({ children, style, className = "" }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function LensIcon({ Icon, active, size = 20 }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full transition-all duration-300"
      style={{
        width: 40,
        height: 40,
        background: active ? C.brassSoft : "transparent",
        border: `1px solid ${active ? C.brass : "transparent"}`,
      }}
    >
      <Icon size={size} color={active ? C.brass : C.muted} strokeWidth={1.8} />
      {active && (
        <span
          className="absolute rounded-full"
          style={{
            inset: -1,
            border: `1px solid ${C.brass}`,
            opacity: 0.35,
          }}
        />
      )}
    </div>
  );
}

function ApertureSpin({ size = 18, color = C.brass }) {
  return (
    <Aperture
      size={size}
      color={color}
      strokeWidth={1.8}
      style={{ animation: "spin 1.4s linear infinite" }}
    />
  );
}

function Chip({ children, tone = "muted" }) {
  const colors = {
    muted: { c: C.muted, bg: "rgba(255,255,255,0.05)" },
    brass: { c: C.brass, bg: C.brassSoft },
    teal: { c: C.teal, bg: C.tealSoft },
  }[tone];
  return (
    <span
      className="px-2 py-0.5 rounded-md text-[11px] tracking-wide"
      style={{ color: colors.c, background: colors.bg, fontFamily: FONT_MONO }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({ children, onClick, loading, disabled, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
      style={{
        background: C.brass,
        color: "#171208",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
    >
      {loading ? <ApertureSpin size={16} color="#171208" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, icon: Icon, small }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl transition-all duration-200 ${
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      }`}
      style={{ border: `1px solid ${C.line}`, color: C.ivory, background: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.brass)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
    >
      {Icon && <Icon size={small ? 13 : 15} />}
      {children}
    </button>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1 text-[11px] transition-colors"
      style={{ color: copied ? C.teal : C.muted, fontFamily: FONT_MONO }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "کپی شد" : "کپی"}
    </button>
  );
}

function ErrorNote({ message }) {
  if (!message) return null;
  return (
    <div
      className="text-xs px-3 py-2 rounded-lg mt-2"
      style={{ color: C.danger, background: "rgba(217,107,107,0.1)", border: `1px solid rgba(217,107,107,0.25)` }}
    >
      {message}
    </div>
  );
}

/* ============================== TOP BAR (workspace) ============================== */
function TopBar({ workspace, setWorkspace }) {
  return (
    <Panel className="p-4 mb-6 flex flex-wrap items-center gap-4" style={{ backdropFilter: "blur(10px)" }}>
      <div className="flex items-center gap-2">
        <Aperture size={18} color={C.brass} strokeWidth={1.8} />
        <span className="text-xs" style={{ color: C.muted }}>
          فضای کاری
        </span>
      </div>
      <input
        value={workspace.niche}
        onChange={(e) => setWorkspace({ ...workspace, niche: e.target.value })}
        placeholder="حوزه کسب‌وکار (مثلا: فروش عینک زنانه)"
        className="flex-1 min-w-[220px] bg-transparent outline-none text-sm py-1.5 px-3 rounded-lg"
        style={{ border: `1px solid ${C.line}`, color: C.ivory }}
      />
      <input
        value={workspace.brand}
        onChange={(e) => setWorkspace({ ...workspace, brand: e.target.value })}
        placeholder="نام برند (اختیاری)"
        className="flex-1 min-w-[160px] bg-transparent outline-none text-sm py-1.5 px-3 rounded-lg"
        style={{ border: `1px solid ${C.line}`, color: C.ivory }}
      />
      <input
        value={workspace.avalKey}
        onChange={(e) => setWorkspace({ ...workspace, avalKey: e.target.value })}
        placeholder="کلید AvalAI (فقط در همین جلسه، جایی ذخیره نمی‌شه)"
        type="password"
        className="flex-1 min-w-[220px] bg-transparent outline-none text-sm py-1.5 px-3 rounded-lg"
        style={{ border: `1px solid ${C.line}`, color: C.ivory }}
      />
      <input
        value={workspace.avalModel}
        onChange={(e) => setWorkspace({ ...workspace, avalModel: e.target.value })}
        placeholder="مدل (مثلا gpt-4o)"
        className="w-32 bg-transparent outline-none text-sm py-1.5 px-3 rounded-lg"
        style={{ border: `1px solid ${C.line}`, color: C.ivory }}
      />
      <div className="flex items-center gap-1 mr-auto">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.teal, boxShadow: `0 0 8px ${C.teal}` }} />
        <span className="text-[11px]" style={{ color: C.muted, fontFamily: FONT_MONO }}>
          {workspace.avalKey ? "AvalAI" : "Claude"}
        </span>
      </div>
    </Panel>
  );
}

/* ============================== DASHBOARD ============================== */
function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <Panel className="p-4 flex-1 min-w-[150px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ color: C.muted }}>
          {label}
        </span>
        <Icon size={15} color={tone} strokeWidth={1.8} />
      </div>
      <div className="text-2xl font-semibold" style={{ color: C.ivory, fontFamily: FONT_MONO }}>
        {value}
      </div>
    </Panel>
  );
}

function Dashboard({ workspace, goTo }) {
  const cards = [
    { key: "ideas", title: "موتور ایده و اسکریپت ریلز", desc: "۱۰ ایده ویروسی روزانه با هوک و راهنمای فیلم‌برداری", icon: Sparkles },
    { key: "brand", title: "هویت برند و بیو", desc: "اسم برند، بیوی تبدیل‌محور و کانسپت هایلایت", icon: Fingerprint },
    { key: "trends", title: "تحلیل روند و رقبا", desc: "الگوهای ویروسی روز در حوزه شما (تحلیل هوش مصنوعی)", icon: TrendingUp },
    { key: "advisor", title: "مشاور الگوریتم و فروش", desc: "چت با متخصص رشد اینستاگرام و بستن فروش در دایرکت", icon: MessageCircle },
    { key: "frames", title: "ساخت فریم و اورلی PNG", desc: "قاب و واترمارک شفاف برای عکس محصولات", icon: ImagePlus },
  ];
  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="فالوور" value="۳۹.۱K" icon={Users} tone={C.brass} />
        <StatCard label="ریچ ۳۰ روز" value="۴۷.۲K" icon={Eye} tone={C.teal} />
        <StatCard label="نرخ درگیری" value="۲.۴٪" icon={Zap} tone={C.brass} />
        <StatCard label="امتیاز رشد AI" value="۶۲/۱۰۰" icon={Aperture} tone={C.teal} />
      </div>
      <p className="text-[11px] mb-4" style={{ color: C.muted }}>
        * آمار بالا نمونه نمایشی است. برای اتصال داده واقعی، پیج اینستاگرام کسب‌وکار را متصل کنید.
      </p>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => goTo(c.key)}
            className="text-right p-5 rounded-2xl transition-all duration-200 group"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.brass)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
          >
            <div className="flex items-center justify-between mb-4">
              <LensIcon Icon={c.icon} active size={18} />
              <ChevronLeft size={16} color={C.muted} className="transition-transform group-hover:-translate-x-1" />
            </div>
            <div className="font-medium mb-1" style={{ color: C.ivory }}>
              {c.title}
            </div>
            <div className="text-xs leading-relaxed" style={{ color: C.muted }}>
              {c.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================== IDEAS ENGINE ============================== */
function IdeasEngine({ workspace }) {
  const [ideas, setIdeas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!workspace.niche.trim()) {
      setError("اول حوزه کسب‌وکارت رو در بالای صفحه بنویس.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const system =
        "تو مدیر تولید محتوای ریلز اینستاگرام برای فروشگاه‌های آنلاین هستی و مثل بهترین کارشناس رشد فکر می‌کنی. فقط و فقط یک آرایه JSON خالص برمی‌گردونی، بدون هیچ متن اضافه یا Markdown.";
      const user = `حوزه کسب‌وکار: ${workspace.niche}. نام برند: ${workspace.brand || "نامشخص"}.
۸ ایده ریل ویروسی و متفاوت (نه شبیه هم) به فارسی تولید کن. هر ایده حداکثر این فیلدها رو داشته باشه و هر مقدار خیلی کوتاه و خلاصه باشه (حداکثر ۱۴ کلمه):
[{"hook":"جمله قلاب اول ویدیو","concept":"ایده کلی ریل","shoot":"یک نکته کوتاه فیلم‌برداری (زاویه/نور/ریتم)"}]
فقط آرایه JSON رو برگردون.`;
      const raw = await askClaude(system, user, workspace.avalKey, workspace.avalModel);
      const parsed = extractJSON(raw);
      if (!parsed) throw new Error("پاسخ قابل پردازش نبود، دوباره تلاش کن.");
      setIdeas(parsed);
    } catch (e) {
      setError(e.message || "خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="موتور ایده و اسکریپت ریلز"
        desc="ایده‌های ویروسی مخصوص حوزه‌ی کسب‌وکارت، همراه با هوک و راهنمای کوتاه فیلم‌برداری."
      />
      <PrimaryButton onClick={generate} loading={loading} icon={Sparkles}>
        تولید ایده‌های امروز
      </PrimaryButton>
      <ErrorNote message={error} />
      <div className="grid gap-3 mt-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {ideas &&
          ideas.map((it, i) => (
            <Panel key={i} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Chip tone="brass">ایده {String(i + 1).padStart(2, "0")}</Chip>
                <CopyButton text={`${it.hook}\n${it.concept}\n${it.shoot}`} />
              </div>
              <div className="text-sm font-medium mb-2" style={{ color: C.ivory }}>
                «{it.hook}»
              </div>
              <div className="text-xs mb-2 leading-relaxed" style={{ color: C.muted }}>
                {it.concept}
              </div>
              <div className="text-[11px] flex items-start gap-1.5" style={{ color: C.teal }}>
                <Zap size={12} className="mt-0.5 flex-shrink-0" />
                {it.shoot}
              </div>
            </Panel>
          ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, desc }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold mb-1" style={{ color: C.ivory }}>
        {title}
      </h2>
      <p className="text-sm" style={{ color: C.muted }}>
        {desc}
      </p>
    </div>
  );
}

/* ============================== BRAND IDENTITY ============================== */
function BrandIdentity({ workspace }) {
  const [names, setNames] = useState(null);
  const [bio, setBio] = useState(null);
  const [highlights, setHighlights] = useState(null);
  const [currentBio, setCurrentBio] = useState("");
  const [loadingKey, setLoadingKey] = useState("");
  const [error, setError] = useState("");

  const run = async (key, system, user, setter) => {
    if (!workspace.niche.trim()) {
      setError("اول حوزه کسب‌وکارت رو در بالای صفحه بنویس.");
      return;
    }
    setLoadingKey(key);
    setError("");
    try {
      const raw = await askClaude(system, user, workspace.avalKey, workspace.avalModel);
      const parsed = extractJSON(raw);
      setter(parsed || raw);
    } catch (e) {
      setError(e.message || "خطایی رخ داد.");
    } finally {
      setLoadingKey("");
    }
  };

  const genNames = () =>
    run(
      "names",
      "تو استراتژیست برندسازی اینستاگرام هستی. فقط آرایه JSON خالص برگردون بدون متن اضافه.",
      `حوزه: ${workspace.niche}. ۶ اسم برند کوتاه، حرفه‌ای و به‌یادموندنی (لاتین، بدون عدد/آندرلاین اضافه) پیشنهاد بده. فرمت:
[{"name":"...", "why":"دلیل کوتاه (حداکثر ۱۰ کلمه)"}]`,
      setNames
    );

  const genBio = () =>
    run(
      "bio",
      "تو کارشناس بهینه‌سازی بیو اینستاگرام برای فروش هستی. فقط JSON خالص برگردون.",
      `حوزه: ${workspace.niche}. نام برند: ${workspace.brand || "برند"}. بیوی فعلی (اگر بود): "${currentBio || "ندارد"}".
یک بیوی حرفه‌ای ۴ خطی فارسی با ساختار: خط برند+ارزش، خط اعتمادسازی، خط لوکیشن/ارسال، خط CTA بنویس. فرمت:
{"bio":"متن با \\n بین خط‌ها", "why":"یک جمله کوتاه چرا این ساختار خوب کار می‌کنه"}`,
      setBio
    );

  const genHighlights = () =>
    run(
      "hl",
      "تو طراح هویت بصری اینستاگرام هستی. فقط آرایه JSON برگردون.",
      `حوزه: ${workspace.niche}. ۵ اسم و کانسپت کاور هایلایت پیشنهاد بده (کوتاه). فرمت:
[{"title":"اسم هایلایت", "concept":"توضیح خیلی کوتاه کانسپت بصری کاور"}]`,
      setHighlights
    );

  return (
    <div>
      <SectionHeader title="هویت برند و بیو" desc="اسم، بیوی تبدیل‌محور و کانسپت هایلایت‌ها را بساز." />
      <ErrorNote message={error} />

      <Panel className="p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: C.ivory }}>
            پیشنهاد اسم برند
          </h3>
          <GhostButton onClick={genNames} icon={RefreshCw} small>
            {loadingKey === "names" ? <ApertureSpin size={13} /> : "تولید"}
          </GhostButton>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {names &&
            (Array.isArray(names) ? names : []).map((n, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: C.panel2, border: `1px solid ${C.line}` }}>
                <div className="text-sm font-medium" style={{ color: C.brass, fontFamily: FONT_MONO }}>
                  {n.name}
                </div>
                <div className="text-[11px] mt-1" style={{ color: C.muted }}>
                  {n.why}
                </div>
              </div>
            ))}
        </div>
      </Panel>

      <Panel className="p-5 mb-5">
        <h3 className="text-sm font-medium mb-3" style={{ color: C.ivory }}>
          بهینه‌سازی بیو
        </h3>
        <textarea
          value={currentBio}
          onChange={(e) => setCurrentBio(e.target.value)}
          placeholder="بیوی فعلی‌ات رو اینجا بچسبون (اختیاری)..."
          className="w-full bg-transparent outline-none text-sm p-3 rounded-lg mb-3 resize-none"
          style={{ border: `1px solid ${C.line}`, color: C.ivory, minHeight: 70 }}
        />
        <GhostButton onClick={genBio} icon={Sparkles} small>
          {loadingKey === "bio" ? <ApertureSpin size={13} /> : "بهینه‌سازی بیو"}
        </GhostButton>
        {bio && bio.bio && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: C.panel2, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-2">
              <Chip tone="teal">بیوی پیشنهادی</Chip>
              <CopyButton text={bio.bio} />
            </div>
            <pre className="text-sm whitespace-pre-wrap" style={{ color: C.ivory, fontFamily: FONT_HEAD }}>
              {bio.bio}
            </pre>
            {bio.why && (
              <div className="text-[11px] mt-2" style={{ color: C.muted }}>
                {bio.why}
              </div>
            )}
          </div>
        )}
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: C.ivory }}>
            کانسپت هایلایت‌ها
          </h3>
          <GhostButton onClick={genHighlights} icon={RefreshCw} small>
            {loadingKey === "hl" ? <ApertureSpin size={13} /> : "تولید"}
          </GhostButton>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {highlights &&
            (Array.isArray(highlights) ? highlights : []).map((h, i) => (
              <div key={i} className="p-3 rounded-xl flex items-start gap-2" style={{ background: C.panel2, border: `1px solid ${C.line}` }}>
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ border: `1px solid ${C.brass}` }}
                >
                  <span className="text-xs" style={{ color: C.brass, fontFamily: FONT_MONO }}>
                    {i + 1}
                  </span>
                </div>
                <div>
                  <div className="text-sm" style={{ color: C.ivory }}>
                    {h.title}
                  </div>
                  <div className="text-[11px]" style={{ color: C.muted }}>
                    {h.concept}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Panel>
    </div>
  );
}

/* ============================== TRENDS ============================== */
function Trends({ workspace }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!workspace.niche.trim()) {
      setError("اول حوزه کسب‌وکارت رو در بالای صفحه بنویس.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const system =
        "تو تحلیل‌گر ترند اینستاگرام هستی. بر اساس دانش عمومی از الگوهای ویروسی رایج در این حوزه تحلیل کن، نه داده لحظه‌ای اسکرپ‌شده. فقط آرایه JSON خالص برگردون.";
      const user = `حوزه: ${workspace.niche}. ۵ الگوی محتوایی ویروسی رایج در این حوزه رو توصیف کن. فرمت:
[{"pattern":"اسم کوتاه الگو", "why":"چرا جواب میده (حداکثر ۱۲ کلمه)", "howTo":"چطور برای این برند پیاده‌اش کنیم (حداکثر ۱۴ کلمه)"}]`;
      const raw = await askClaude(system, user, workspace.avalKey, workspace.avalModel);
      const parsed = extractJSON(raw);
      if (!parsed) throw new Error("پاسخ قابل پردازش نبود، دوباره تلاش کن.");
      setItems(parsed);
    } catch (e) {
      setError(e.message || "خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="تحلیل روند و رقبا"
        desc="الگوهای محتوایی که این روزها در حوزه‌ی تو خوب کار می‌کنن — تحلیل هوش مصنوعی بر پایه‌ی الگوهای شناخته‌شده، نه داده زنده‌ی اسکرپ‌شده."
      />
      <PrimaryButton onClick={generate} loading={loading} icon={TrendingUp}>
        تحلیل الگوهای امروز
      </PrimaryButton>
      <ErrorNote message={error} />
      <div className="mt-5 space-y-3">
        {items &&
          items.map((it, i) => (
            <Panel key={i} className="p-4 flex items-start gap-4">
              <div className="text-2xl font-semibold flex-shrink-0" style={{ color: C.brass, fontFamily: FONT_MONO }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: C.ivory }}>
                  {it.pattern}
                </div>
                <div className="text-xs mb-1" style={{ color: C.muted }}>
                  {it.why}
                </div>
                <div className="text-[11px]" style={{ color: C.teal }}>
                  → {it.howTo}
                </div>
              </div>
            </Panel>
          ))}
      </div>
    </div>
  );
}

/* ============================== ADVISOR CHAT ============================== */
function Advisor({ workspace }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "سلام! من مشاور رشد اینستاگرام و فروشت هستم. درباره الگوریتم، شدو بن، تایمینگ پست، یا اسکریپت بستن فروش در دایرکت بپرس." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const system = `${ADVISOR_SYSTEM}\n\nCURRENT USER NICHE: ${workspace.niche || "آنلاین شاپ"}`;
      const history = newMessages
        .map((m) => `${m.role === "user" ? "کاربر" : "مشاور"}: ${m.text}`)
        .join("\n");
      const raw = await askClaude(system, history, workspace.avalKey, workspace.avalModel);
      setMessages([...newMessages, { role: "assistant", text: raw.trim() }]);
    } catch (e) {
      setError(e.message || "خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: 420 }}>
      <SectionHeader title="مشاور الگوریتم و فروش" desc="چت زنده با متخصص رشد اینستاگرام و بستن فروش." />
      <Panel className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] ${m.role === "user" ? "self-start" : "self-end"}`}>
            <div
              className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                background: m.role === "user" ? C.panel2 : C.brassSoft,
                border: `1px solid ${m.role === "user" ? C.line : "rgba(201,162,39,0.3)"}`,
                color: C.ivory,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="self-end flex items-center gap-2 px-4 py-2 text-xs" style={{ color: C.muted }}>
            <ApertureSpin size={14} /> در حال فکر کردن...
          </div>
        )}
        <div ref={bottomRef} />
      </Panel>
      <ErrorNote message={error} />
      <div className="flex items-center gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="سوالت رو بپرس..."
          className="flex-1 bg-transparent outline-none text-sm py-3 px-4 rounded-xl"
          style={{ border: `1px solid ${C.line}`, color: C.ivory }}
        />
        <button
          onClick={send}
          disabled={loading}
          className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          style={{ background: C.brass, color: "#171208" }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

/* ============================== FRAME / OVERLAY GENERATOR ============================== */
function FrameGenerator({ workspace }) {
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const [img, setImg] = useState(null);
  const [style, setStyle] = useState("gold-line");
  const [caption, setCaption] = useState(workspace.brand || "");

  const styles = [
    { key: "gold-line", label: "قاب طلایی نازک" },
    { key: "corner-mark", label: "گوشه‌های برند" },
    { key: "gradient-fade", label: "محو گرادیانی پایین" },
  ];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = 900;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#0B0C10";
    ctx.fillRect(0, 0, size, size);

    if (img) {
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    } else {
      ctx.fillStyle = "#8B8D98";
      ctx.font = "24px Vazirmatn";
      ctx.textAlign = "center";
      ctx.fillText("عکس محصول را بارگذاری کنید", size / 2, size / 2);
    }

    if (style === "gold-line") {
      ctx.strokeStyle = "#C9A227";
      ctx.lineWidth = 6;
      ctx.strokeRect(24, 24, size - 48, size - 48);
    } else if (style === "corner-mark") {
      ctx.strokeStyle = "#C9A227";
      ctx.lineWidth = 5;
      const m = 30,
        len = 70;
      [
        [m, m, 1, 0, 0, 1],
        [size - m, m, -1, 0, 0, 1],
        [m, size - m, 1, 0, 0, -1],
        [size - m, size - m, -1, 0, 0, -1],
      ].forEach(([x, y, dx1, dy1, dx2, dy2]) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx1 * len, y + dy1 * len);
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx2 * len, y + dy2 * len);
        ctx.stroke();
      });
    } else if (style === "gradient-fade") {
      const grad = ctx.createLinearGradient(0, size - 220, 0, size);
      grad.addColorStop(0, "rgba(11,12,16,0)");
      grad.addColorStop(1, "rgba(11,12,16,0.92)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, size - 220, size, 220);
    }

    if (caption.trim()) {
      ctx.fillStyle = "#F3F1EA";
      ctx.font = "600 34px Vazirmatn";
      ctx.textAlign = "center";
      ctx.fillText(caption.trim(), size / 2, size - 50);
      ctx.fillStyle = "#C9A227";
      ctx.font = "300 16px Vazirmatn";
    }
  }, [img, style, caption]);

  useEffect(() => {
    draw();
  }, [draw]);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const image = new Image();
      image.onload = () => setImg(image);
      image.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const download = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "frame.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div>
      <SectionHeader title="ساخت فریم و اورلی PNG" desc="عکس محصول را بارگذاری کن، قاب برند بگیر و به‌صورت PNG دانلود کن." />
      <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
        <Panel className="p-4 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full max-w-[480px] rounded-xl" style={{ border: `1px solid ${C.line}` }} />
        </Panel>
        <div className="space-y-4">
          <Panel className="p-4">
            <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
            <GhostButton onClick={() => fileRef.current.click()} icon={Upload}>
              بارگذاری عکس محصول
            </GhostButton>
          </Panel>
          <Panel className="p-4">
            <div className="text-xs mb-3" style={{ color: C.muted }}>
              سبک قاب
            </div>
            <div className="flex flex-col gap-2">
              {styles.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStyle(s.key)}
                  className="text-right px-3 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: style === s.key ? C.brassSoft : "transparent",
                    border: `1px solid ${style === s.key ? C.brass : C.line}`,
                    color: C.ivory,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Panel>
          <Panel className="p-4">
            <div className="text-xs mb-2" style={{ color: C.muted }}>
              متن روی قاب (اختیاری)
            </div>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="نام برند یا شعار"
              className="w-full bg-transparent outline-none text-sm py-2 px-3 rounded-lg"
              style={{ border: `1px solid ${C.line}`, color: C.ivory }}
            />
          </Panel>
          <PrimaryButton onClick={download} icon={Download}>
            دانلود PNG
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ============================== APP SHELL ============================== */
const NAV = [
  { key: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { key: "ideas", label: "ایده و اسکریپت", icon: Sparkles },
  { key: "brand", label: "هویت برند", icon: Fingerprint },
  { key: "trends", label: "تحلیل روند", icon: TrendingUp },
  { key: "advisor", label: "مشاور هوشمند", icon: MessageCircle },
  { key: "frames", label: "فریم و اورلی", icon: ImagePlus },
];

export default function App() {
  useGoogleFonts();
  const [tab, setTab] = useState("dashboard");
  const [workspace, setWorkspace] = useState({ niche: "", brand: "", avalKey: "", avalModel: "gpt-4o" });

  return (
    <div dir="rtl" style={{ background: C.ink, minHeight: "100vh", fontFamily: FONT_HEAD, color: C.ivory }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px; }
      `}</style>

      <div className="flex">
        {/* Sidebar */}
        <div
          className="hidden md:flex flex-col items-center py-6 gap-2 flex-shrink-0"
          style={{ width: 84, borderLeft: `1px solid ${C.line}` }}
        >
          <div className="mb-6">
            <Aperture size={26} color={C.brass} strokeWidth={1.6} />
          </div>
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setTab(n.key)} className="flex flex-col items-center gap-1 py-2 group">
              <LensIcon Icon={n.icon} active={tab === n.key} />
              <span
                className="text-[10px] transition-colors"
                style={{ color: tab === n.key ? C.brass : C.muted }}
              >
                {n.label}
              </span>
            </button>
          ))}
        </div>

        {/* Mobile top nav */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-2 z-20"
          style={{ background: C.panel, borderTop: `1px solid ${C.line}` }}
        >
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setTab(n.key)} className="flex flex-col items-center gap-1 p-1">
              <LensIcon Icon={n.icon} active={tab === n.key} size={16} />
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 p-5 md:p-8 pb-24 md:pb-8 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <BadgeCheck size={18} color={C.teal} />
            <h1 className="text-lg font-semibold">مدیر رشد و فروش اینستاگرام هوش مصنوعی</h1>
          </div>
          <TopBar workspace={workspace} setWorkspace={setWorkspace} />
          <div key={tab} style={{ animation: "fadeIn 0.35s ease" }}>
            {tab === "dashboard" && <Dashboard workspace={workspace} goTo={setTab} />}
            {tab === "ideas" && <IdeasEngine workspace={workspace} />}
            {tab === "brand" && <BrandIdentity workspace={workspace} />}
            {tab === "trends" && <Trends workspace={workspace} />}
            {tab === "advisor" && <Advisor workspace={workspace} />}
            {tab === "frames" && <FrameGenerator workspace={workspace} />}
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
