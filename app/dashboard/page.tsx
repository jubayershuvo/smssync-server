"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, ArrowDownLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy,
  Download, KeyRound, LayoutDashboard, LogOut, MessageSquare, Plug, Plus,
  RefreshCw, Search, Smartphone, Trash2, Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Msg = { _id: string; deviceId: string; sender: string; body: string; receivedAt: string; simSlot: string; type: string };
type Stats = {
  totals: { total: number; incoming: number; outgoing: number; today: number; week: number; lastAt: string | null };
  series: { date: string; incoming: number; outgoing: number }[];
  devices: { deviceId: string; count: number; lastAt: string }[];
  topSenders: { sender: string; count: number }[];
  messages: Msg[];
  pagination: { page: number; total: number; totalPages: number };
};
type Tab = "overview" | "messages" | "devices" | "connect";

const NAV: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "connect", label: "Connect", icon: Plug },
];

const card = "rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur";
const ago = (d?: string | null) => {
  if (!d) return "never";
  const s = Math.max(1, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function Dashboard() {
  const { user, token, isLoading, signout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [devices, setDevices] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState("");
  const [newDevice, setNewDevice] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const say = useCallback((text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/signin");
  }, [isLoading, user, router]);

  const auth = useMemo(() => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), [token]);

  const loadStats = useCallback(async () => {
    if (!token) return;
    const p = new URLSearchParams({ page: String(page) });
    if (q) p.set("q", q);
    if (deviceFilter) p.set("device", deviceFilter);
    if (typeFilter) p.set("type", typeFilter);
    try {
      const r = await fetch(`/api/stats?${p}`, { headers: auth });
      const j = await r.json();
      if (j.success) setStats(j);
    } catch { say("Could not load stats", false); }
    setLoading(false);
  }, [token, auth, page, q, deviceFilter, typeFilter, say]);

  const loadUser = useCallback(async () => {
    if (!token) return;
    const r = await fetch("/api/user", { headers: auth });
    const j = await r.json();
    if (j.success) { setDevices(j.user.allowedDevices || []); setApiKey(j.user.apiKey || ""); }
  }, [token, auth]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => {
    const t = setTimeout(loadStats, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadStats, q]);
  useEffect(() => {
    const i = setInterval(loadStats, 15000);
    return () => clearInterval(i);
  }, [loadStats]);

  const act = async (body: object, okMsg: string) => {
    setBusy(true);
    try {
      const r = await fetch("/api/user", { method: "POST", headers: auth, body: JSON.stringify(body) });
      const j = await r.json();
      if (!j.success) return say(j.error || "Something went wrong", false);
      if (j.allowedDevices) setDevices(j.allowedDevices);
      if (j.apiKey) setApiKey(j.apiKey);
      say(okMsg);
      return true;
    } catch { say("Network error", false); }
    finally { setBusy(false); }
  };

  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(key); say("Copied to clipboard");
    setTimeout(() => setCopied(""), 1500);
  };

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-cyan-400" /></div>;
  }

  const t = stats?.totals;
  const max = Math.max(1, ...(stats?.series.map((s) => s.incoming + s.outgoing) ?? [1]));
  const share = t && t.total ? Math.round((t.incoming / t.total) * 100) : 0;
  const unknown = (stats?.devices ?? []).filter((d) => !devices.includes(d.deviceId));

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copy(text, id)} className="flex items-center gap-1.5 rounded-lg bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20 active:scale-95">
      {copied === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === id ? "Copied" : "Copy"}
    </button>
  );

  return (
    <div className="relative min-h-screen text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute -right-40 bottom-0 h-[480px] w-[480px] rounded-full bg-indigo-600/10 blur-[130px]" />
      </div>

      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.07] bg-[#070b14]/80 p-5 backdrop-blur lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10"><img src="./icon.png" alt="" /></div>
          <span className="text-lg font-bold">SMS<span className="text-cyan-400">Sync</span></span>
        </Link>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setTab(n.id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${tab === n.id ? "bg-cyan-400/10 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,.25)]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <n.icon className="h-4 w-4" />{n.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <Link href="/docs" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-white"><KeyRound className="h-4 w-4" />API docs</Link>
          <a href="/SMS_Sync.apk" download className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-[#07101a] transition hover:bg-cyan-300"><Download className="h-4 w-4" />Get Android app</a>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-sm font-bold">{user.name?.[0]?.toUpperCase() || "U"}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-slate-500">@{user.username}</p></div>
            <button onClick={() => { signout(); router.push("/"); }} title="Sign out" className="text-slate-500 transition hover:text-red-400"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/[0.07] bg-[#070b14]/90 backdrop-blur lg:hidden">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)} className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition ${tab === n.id ? "text-cyan-300" : "text-slate-500"}`}>
            <n.icon className="h-5 w-5" />{n.label}
          </button>
        ))}
      </nav>

      <main className="px-5 pb-28 pt-8 sm:px-8 lg:ml-64 lg:pb-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hey {user.name?.split(" ")[0]} 👋</h1>
            <p className="mt-1 text-sm text-slate-400">Last sync {ago(t?.lastAt)} · {devices.length} allowed device{devices.length === 1 ? "" : "s"}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { loadStats(); loadUser(); say("Refreshed"); }} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-white active:scale-95"><RefreshCw className="h-4 w-4" />Refresh</button>
            <button onClick={() => { signout(); router.push("/"); }} className="rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:text-red-400 lg:hidden"><LogOut className="h-4 w-4" /></button>
          </div>
        </header>

        {/* Quick-start banner */}
        {devices.length === 0 && (
          <div className="fade-up mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5">
            <p className="text-sm text-amber-200">No device allowed yet — messages from unknown devices are rejected. Add your phone&apos;s device ID to start syncing.</p>
            <button onClick={() => setTab("devices")} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-300">Add device</button>
          </div>
        )}

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {[
                { l: "Total messages", v: t?.total, i: MessageSquare, c: "text-cyan-300" },
                { l: "Today", v: t?.today, i: Activity, c: "text-emerald-300" },
                { l: "Incoming", v: t?.incoming, i: ArrowDownLeft, c: "text-blue-300" },
                { l: "Outgoing", v: t?.outgoing, i: ArrowUpRight, c: "text-violet-300" },
              ].map((s, i) => (
                <div key={s.l} style={{ animationDelay: `${i * 70}ms` }} className={`fade-up ${card} p-5 transition hover:-translate-y-1 hover:border-cyan-400/30`}>
                  <s.i className={`h-5 w-5 ${s.c}`} />
                  <p className="mt-4 text-3xl font-bold tabular-nums">{loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-white/10" /> : (s.v ?? 0).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <section className={`${card} fade-up p-6 xl:col-span-2`}>
                <div className="mb-6 flex items-center justify-between">
                  <div><h2 className="font-semibold">Last 14 days</h2><p className="text-xs text-slate-500">{t?.week ?? 0} messages this week</p></div>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-cyan-400" />Incoming</span>
                    <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-violet-400" />Outgoing</span>
                  </div>
                </div>
                <div className="flex h-48 items-end gap-1.5 sm:gap-2">
                  {(stats?.series ?? Array.from({ length: 14 }, () => ({ date: "", incoming: 0, outgoing: 0 }))).map((d, i) => {
                    const total = d.incoming + d.outgoing;
                    return (
                      <div key={i} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.date}: ${total} (in ${d.incoming}, out ${d.outgoing})`}>
                        <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-white/10 px-1.5 text-[10px] opacity-0 transition group-hover:opacity-100">{total}</div>
                        <div className="bar-grow flex flex-col overflow-hidden rounded-t-md" style={{ height: `${(total / max) * 100}%`, minHeight: total ? 4 : 2, animationDelay: `${i * 35}ms` }}>
                          <div className="bg-violet-400" style={{ flex: d.outgoing }} />
                          <div className="bg-gradient-to-t from-cyan-500 to-cyan-300" style={{ flex: d.incoming }} />
                          {!total && <div className="h-full bg-white/10" />}
                        </div>
                        <span className="mt-2 text-center text-[10px] text-slate-600">{d.date.slice(8)}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={`${card} fade-up p-6`}>
                <h2 className="font-semibold">Direction</h2>
                <div className="my-6 flex items-center justify-center">
                  <div className="relative h-36 w-36 rounded-full transition-all duration-700" style={{ background: `conic-gradient(#22d3ee ${share * 3.6}deg, #a78bfa 0)` }}>
                    <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[#0b1220]"><span className="text-3xl font-bold">{share}%</span><span className="text-[11px] text-slate-500">incoming</span></div>
                  </div>
                </div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-slate-500" />Top senders</h3>
                <div className="space-y-2.5">
                  {(stats?.topSenders ?? []).length === 0 && <p className="text-xs text-slate-600">No data yet</p>}
                  {stats?.topSenders.map((s) => (
                    <div key={s.sender}>
                      <div className="flex justify-between text-xs"><span className="truncate text-slate-300">{s.sender}</span><span className="text-slate-500">{s.count}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-cyan-400/70 transition-all duration-700" style={{ width: `${(s.count / stats.topSenders[0].count) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className={`${card} fade-up p-6`}>
              <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Latest messages</h2><button onClick={() => setTab("messages")} className="text-xs font-medium text-cyan-300 hover:underline">View all</button></div>
              <MessageList msgs={stats?.messages.slice(0, 5) ?? []} loading={loading} />
            </section>
          </div>
        )}

        {tab === "messages" && (
          <section className={`${card} fade-up p-5 sm:p-6`}>
            <div className="mb-5 flex flex-wrap gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search sender or text…" className="w-full rounded-xl border border-white/[0.08] bg-[#080f1c] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10" />
              </div>
              <select value={deviceFilter} onChange={(e) => { setDeviceFilter(e.target.value); setPage(1); }} className="rounded-xl border border-white/[0.08] bg-[#080f1c] px-3 py-2.5 text-sm outline-none focus:border-cyan-400/50">
                <option value="">All devices</option>
                {(stats?.devices ?? []).map((d) => <option key={d.deviceId} value={d.deviceId}>{d.deviceId}</option>)}
              </select>
              <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-xl border border-white/[0.08] bg-[#080f1c] px-3 py-2.5 text-sm outline-none focus:border-cyan-400/50">
                <option value="">All types</option><option value="incoming">Incoming</option><option value="outgoing">Outgoing</option>
              </select>
            </div>
            <MessageList msgs={stats?.messages ?? []} loading={loading} />
            {stats && (
              <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                <span>{stats.pagination.total.toLocaleString()} result{stats.pagination.total === 1 ? "" : "s"}</span>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-white/10 p-2 transition enabled:hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                  <span>{page} / {stats.pagination.totalPages}</span>
                  <button disabled={page >= stats.pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-white/10 p-2 transition enabled:hover:text-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "devices" && (
          <div className="fade-up mx-auto max-w-3xl space-y-6">
            <section className={`${card} p-6`}>
              <h2 className="font-semibold">Allow a device</h2>
              <p className="mt-1 text-sm text-slate-400">Only messages from allowed device IDs are accepted. Copy the device ID shown in the Android app.</p>
              <form onSubmit={async (e) => { e.preventDefault(); if (!newDevice.trim()) return; if (await act({ action: "add-device", deviceId: newDevice.trim() }, "Device allowed")) setNewDevice(""); }} className="mt-5 flex gap-3">
                <input value={newDevice} onChange={(e) => setNewDevice(e.target.value)} placeholder="Paste device ID" className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-[#080f1c] px-4 py-3 font-mono text-sm outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10" />
                <button disabled={busy || !newDevice.trim()} className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#07101a] transition hover:bg-cyan-300 active:scale-95 disabled:opacity-40"><Plus className="h-4 w-4" />Add</button>
              </form>
            </section>

            {unknown.length > 0 && (
              <section className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.05] p-5">
                <p className="mb-3 text-sm font-semibold text-amber-200">Seen in your messages but not allowed</p>
                {unknown.map((d) => (
                  <div key={d.deviceId} className="flex items-center justify-between gap-3 py-1.5"><span className="truncate font-mono text-xs text-amber-100">{d.deviceId}</span>
                    <button onClick={() => act({ action: "add-device", deviceId: d.deviceId }, "Device allowed")} className="text-xs font-semibold text-amber-300 hover:underline">Allow</button></div>
                ))}
              </section>
            )}

            <section className="space-y-3">
              {devices.length === 0 && <div className={`${card} p-10 text-center text-sm text-slate-500`}><Smartphone className="mx-auto mb-3 h-8 w-8 text-slate-600" />No devices yet</div>}
              {devices.map((d, i) => {
                const info = stats?.devices.find((x) => x.deviceId === d);
                return (
                  <div key={d} style={{ animationDelay: `${i * 50}ms` }} className={`fade-up ${card} flex items-center gap-4 p-4 transition hover:border-cyan-400/30`}>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10"><Smartphone className="h-5 w-5 text-cyan-300" /></div>
                    <div className="min-w-0 flex-1"><p className="truncate font-mono text-sm">{d}</p><p className="text-xs text-slate-500">{info ? `${info.count.toLocaleString()} messages · ${ago(info.lastAt)}` : "No messages yet"}</p></div>
                    <button onClick={() => copy(d, d)} className="p-2 text-slate-500 transition hover:text-cyan-300"><Copy className="h-4 w-4" /></button>
                    <button disabled={busy} onClick={() => { if (confirm("Remove this device? It will stop syncing.")) act({ action: "remove-device", deviceId: d }, "Device removed"); }} className="p-2 text-slate-500 transition hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {tab === "connect" && (
          <div className="fade-up mx-auto max-w-3xl space-y-6">
            <section className={`${card} p-6`}>
              <h2 className="font-semibold">Your User ID</h2>
              <p className="mt-1 text-sm text-slate-400">Paste this into the Android app to link it to your account.</p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-[#080f1c] p-3">
                <code className="min-w-0 flex-1 truncate px-2 font-mono text-sm text-cyan-200">{user.id}</code><CopyBtn text={user.id} id="uid" />
              </div>
            </section>

            <section className={`${card} p-6`}>
              <h2 className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4 text-cyan-300" />API key</h2>
              <p className="mt-1 text-sm text-slate-400">Use as a Bearer token to read or delete your messages via <code className="text-slate-300">/api/messages</code>.</p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#080f1c] p-3">
                <code className="min-w-0 flex-1 truncate px-2 font-mono text-sm text-slate-300">{apiKey || "Not generated yet"}</code>
                {apiKey && <CopyBtn text={apiKey} id="key" />}
              </div>
              <button disabled={busy} onClick={() => { if (!apiKey || confirm("Rotate key? The old one stops working.")) act({ action: "rotate-api-key" }, "New API key generated"); }} className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium transition hover:border-cyan-400/40 active:scale-95"><RefreshCw className="h-4 w-4" />{apiKey ? "Rotate key" : "Generate key"}</button>
              <Link href="/docs" className="ml-3 inline-block text-sm font-medium text-cyan-300 hover:underline">Read the API docs →</Link>
            </section>

            <section className={`${card} p-6`}>
              <h2 className="mb-4 font-semibold">Get started in 3 steps</h2>
              {["Install the Android app and grant SMS permission", "Paste your User ID in the app", "Add the app's device ID under Devices, then tap Sync"].map((s, i) => (
                <div key={s} className="flex items-center gap-4 py-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-300">{i + 1}</span><span className="text-sm text-slate-300">{s}</span></div>
              ))}
            </section>
          </div>
        )}
      </main>

      {toast && (
        <div className={`toast-in fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur lg:bottom-8 ${toast.ok ? "border-cyan-400/30 bg-[#0b1a26]/95 text-cyan-200" : "border-red-400/30 bg-[#260b11]/95 text-red-200"}`}>{toast.text}</div>
      )}
    </div>
  );
}

function MessageList({ msgs, loading }: { msgs: Msg[]; loading: boolean }) {
  if (loading) return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}</div>;
  if (!msgs.length) return <div className="py-12 text-center text-sm text-slate-500"><MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-700" />No messages found</div>;
  return (
    <ul className="divide-y divide-white/[0.05]">
      {msgs.map((m, i) => (
        <li key={m._id} style={{ animationDelay: `${i * 30}ms` }} className="fade-up flex gap-4 py-3.5">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${m.type === "outgoing" ? "bg-violet-400/10 text-violet-300" : "bg-cyan-400/10 text-cyan-300"}`}>
            {m.type === "outgoing" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3"><p className="truncate text-sm font-semibold">{m.sender || "Unknown"}</p><span className="shrink-0 text-xs text-slate-500">{ago(m.receivedAt)}</span></div>
            <p className="mt-0.5 line-clamp-2 break-words text-sm text-slate-400">{m.body}</p>
            <p className="mt-1 truncate font-mono text-[10px] text-slate-600">{m.deviceId} · SIM {Number(m.simSlot) + 1 || "?"}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
