"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, MessageSquare } from "lucide-react";
import docs from "@/lib/apiDocs.json";

const PLACEHOLDER = "https://YOUR-DOMAIN";
const color: Record<string, string> = {
  GET: "bg-emerald-400/15 text-emerald-300",
  POST: "bg-cyan-400/15 text-cyan-300",
  DELETE: "bg-red-400/15 text-red-300",
};

function Code({ code }: { code: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#050a12] p-4 text-xs leading-relaxed text-slate-300"><code>{code}</code></pre>
      <button
        onClick={async () => { try { await navigator.clipboard.writeText(code); } catch {} setOk(true); setTimeout(() => setOk(false), 1400); }}
        className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] text-slate-300 opacity-0 transition hover:bg-white/20 group-hover:opacity-100"
      >
        {ok ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{ok ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function DocsPage() {
  const [origin, setOrigin] = useState(PLACEHOLDER);
  useEffect(() => setOrigin(window.location.origin), []);
  const fix = (s: string) => s.split(PLACEHOLDER).join(origin);

  const nav = [
    ["auth", "Authentication"], ["endpoints", "Endpoints"], ["params", "Parameters"],
    ["syntax", "Query syntax"], ["recipes", "Recipes"], ["errors", "Errors & limits"],
  ];

  return (
    <div className="relative min-h-screen text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute -right-40 bottom-0 h-[480px] w-[480px] rounded-full bg-indigo-600/10 blur-[130px]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#070b14]/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10"><MessageSquare className="h-4 w-4 text-cyan-400" /></div>
            <span className="font-bold">SMS<span className="text-cyan-400">Sync</span> <span className="text-slate-500">API</span></span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-10 px-5 py-10 sm:px-8">
        <aside className="sticky top-24 hidden h-fit w-48 shrink-0 lg:block">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="block rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-300">{label}</a>
          ))}
          <a href="/API.md" download className="mt-4 block rounded-lg border border-white/10 px-3 py-2 text-center text-xs text-slate-300 transition hover:border-cyan-400/40">Download API.md</a>
        </aside>

        <main className="min-w-0 flex-1 space-y-14">
          <section className="fade-up">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Messages API</h1>
            <p className="mt-3 max-w-2xl text-slate-400">Search, filter, group, export and safely delete the SMS messages synced to your account — with a Gmail-style query language and every filter you can think of.</p>
          </section>

          <section id="auth" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold">Authentication</h2>
            <p className="text-sm text-slate-400">Get your key from <Link href="/dashboard" className="text-cyan-300 hover:underline">Dashboard → Connect</Link> and send it on every request. Everything is scoped to your account.</p>
            <Code code={`Authorization: Bearer <apiKey>\n# or\nX-API-Key: <apiKey>`} />
          </section>

          <section id="endpoints" className="scroll-mt-24 space-y-8">
            <h2 className="text-xl font-semibold">Endpoints</h2>
            {docs.endpoints.map((e) => (
              <article key={e.method + e.path + e.title} className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${color[e.method]}`}>{e.method}</span>
                  <code className="break-all font-mono text-sm text-slate-200">{e.path}</code>
                </div>
                <h3 className="font-semibold">{e.title}</h3>
                <p className="text-sm text-slate-400">{e.desc}</p>
                <Code code={fix(e.curl)} />
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Response</p>
                <Code code={e.response} />
              </article>
            ))}
          </section>

          <section id="params" className="scroll-mt-24 space-y-8">
            <h2 className="text-xl font-semibold">Parameters <span className="text-sm font-normal text-slate-500">GET /api/messages</span></h2>
            {docs.params.map((g) => (
              <div key={g.group}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan-300">{g.group}</h3>
                <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-white/[0.05]">
                      {g.items.map((p) => (
                        <tr key={p.name} className="align-top transition hover:bg-white/[0.02]">
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-cyan-200">{p.name}</td>
                          <td className="px-2 py-3 text-xs text-slate-500">{p.type}</td>
                          <td className="px-4 py-3 text-slate-400">{p.desc}</td>
                          <td className="hidden px-4 py-3 font-mono text-[11px] text-slate-500 md:table-cell">{p.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>

          <section id="syntax" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold">Query syntax <span className="font-mono text-sm font-normal text-slate-500">q=</span></h2>
            <Code code={`q=from:bank has:otp -promo after:2026-11-01 "your code"`} />
            <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
              <table className="w-full text-left text-sm"><tbody className="divide-y divide-white/[0.05]">
                {docs.operators.map((o) => (
                  <tr key={o.op}><td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-cyan-200">{o.op}</td><td className="px-4 py-3 text-slate-400">{o.desc}</td></tr>
                ))}
              </tbody></table>
            </div>
            <p className="text-sm text-slate-500">All conditions are ANDed. Operators and plain parameters can be mixed. Remember to URL-encode <code>q</code> (use <code>curl -G --data-urlencode</code>).</p>
          </section>

          <section id="recipes" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold">Recipes</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {docs.examples.map((x) => (
                <div key={x.title} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <p className="mb-2 text-sm font-medium">{x.title}</p>
                  <code className="break-all font-mono text-xs text-cyan-200">?{x.query}</code>
                </div>
              ))}
            </div>
          </section>

          <section id="errors" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold">Errors &amp; limits</h2>
            <p className="text-sm text-slate-400">Errors look like <code className="text-slate-300">{`{ "success": false, "error": "…" }`}</code>. Limit: 120 requests/minute per account (see <code className="text-slate-300">X-RateLimit-*</code> headers).</p>
            <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
              <table className="w-full text-left text-sm"><tbody className="divide-y divide-white/[0.05]">
                {docs.errors.map((x) => (
                  <tr key={x.code}><td className="px-4 py-3 font-mono text-xs text-amber-300">{x.code}</td><td className="px-4 py-3 text-slate-400">{x.desc}</td></tr>
                ))}
              </tbody></table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
