"use client";


import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Cloud,
  Lock,
  MessageSquare,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Zap,
  House,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const features = [
  {
    icon: Zap,
    title: "Instant Synchronization",
    description:
      "Automatically sync newly received SMS messages to your cloud account in near real-time.",
  },
  {
    icon: Radio,
    title: "Background Sync",
    description:
      "Keep synchronization running even when the app is minimized or your screen is turned off.",
  },
  {
    icon: Smartphone,
    title: "Multiple Devices",
    description:
      "Connect and manage authorized devices from a single user account.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Focused",
    description:
      "Your messages are transmitted securely with user-controlled synchronization.",
  },
  {
    icon: Wifi,
    title: "Any Network",
    description:
      "Synchronize over Wi-Fi or mobile data without depending on a specific connection.",
  },
  {
    icon: RefreshCw,
    title: "Automatic Delivery",
    description:
      "Automatically retry synchronization when network connectivity becomes available.",
  },
];

const steps = [
  {
    number: "01",
    title: "Install the app",
    description:
      "Install SMS Sync on your Android device and grant the necessary SMS permissions.",
    icon: Smartphone,
  },
  {
    number: "02",
    title: "Connect your account",
    description:
      "Enter your unique User ID to connect your device to your account.",
    icon: Lock,
  },
  {
    number: "03",
    title: "Enable synchronization",
    description:
      "Turn on Sync Now. Your newly received SMS messages will automatically synchronize.",
    icon: Zap,
  },
];

const technologies = [
  "Kotlin",
  "Jetpack Compose",
  "Next.js",
  "MongoDB",
  "Vercel",
];

function DownloadButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="/SMS_Sync.apk"
      download
      className={className}
    >
      <Smartphone className="h-4 w-4" />
      Download APK
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const loggedIn = !!user;
  const guest = !isLoading && !user; // hide both states until auth is known (no flicker)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] text-white selection:bg-cyan-400/30 selection:text-cyan-200">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.08] blur-[130px]" />
        <div className="absolute -right-40 top-[400px] h-[500px] w-[500px] rounded-full bg-blue-600/[0.08] blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "55px 55px",
          }}
        />
      </div>

      {/* Navbar */}
      <header className="relative z-20 border-b border-white/[0.07]">
        <nav className="mx-auto flex min-h-[76px] max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
              {/* <MessageSquare className="h-5 w-5 text-cyan-400" /> */}
              <img src="./icon.png" alt="" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">
                SMS<span className="text-cyan-400">Sync</span>
              </span>
              <p className="text-[10px] tracking-[0.2em] text-slate-500">
                SMART MESSAGE SYNC
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-slate-400 lg:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#security" className="transition hover:text-white">
              Security
            </a>
            <a href="#technology" className="transition hover:text-white">
              Technology
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {loggedIn && (
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20 sm:flex"
              >
                <House className="h-4 w-4" /> Dashboard
              </Link>
            )}

            {guest && (
              <>
            <Link
              href="/signin"
              className="hidden rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-white sm:block"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="hidden rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20 sm:block"
            >
              Sign Up
            </Link>
              </>
            )}


            <a
              href="/SMS_Sync.apk"
              download
              className="flex items-center gap-2 rounded-xl bg-cyan-400 px-3 py-2.5 text-xs font-bold text-[#07101a] transition hover:bg-cyan-300 sm:px-4 sm:text-sm"
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden xs:inline">Download APK</span>
              <span className="xs:hidden">Download</span>
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-5 pb-28 pt-24 sm:px-8 md:grid-cols-2 md:pt-32">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-4 py-2 text-xs font-medium text-cyan-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            YOUR MESSAGES, SYNCHRONIZED
          </div>

          <h1 className="max-w-2xl text-5xl font-bold leading-[1.12] tracking-tight sm:text-6xl lg:text-[70px]">
            Your SMS.
            <br />
            Everywhere.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Automatically.
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-8 text-slate-400 sm:text-lg">
            Keep your incoming SMS messages synchronized with the cloud.
            Connect your Android device once and let SMS Sync handle the rest.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <DownloadButton className="flex items-center gap-3 rounded-xl bg-cyan-400 px-6 py-4 text-sm font-bold text-[#07101a] shadow-lg shadow-cyan-500/10 transition hover:-translate-y-1 hover:bg-cyan-300" />

            {loggedIn && (
              <Link href="/dashboard" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-white/[0.06]">
                Open Dashboard
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
            {guest && (
              <Link href="/signup" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-white/[0.06]">
                Create Account
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-cyan-400" />
              Android compatible
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-cyan-400" />
              Automatic sync
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-cyan-400" />
              Cloud powered
            </div>
          </div>

          {guest && (
          <div className="mt-7 flex items-center gap-4 text-sm">
            <span className="text-slate-500">Already have an account?</span>
            <Link
              href="/signin"
              className="font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Sign in <ArrowUpRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>
          )}
        </div>

        {/* Product Dashboard Illustration */}
        <div className="relative mx-auto w-full max-w-[500px]">
          <div className="absolute inset-10 rounded-full bg-cyan-500/10 blur-[90px]" />

          <div className="relative rounded-[30px] border border-white/10 bg-[#0c1422] p-5 shadow-2xl shadow-black/40 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">SMS Sync</p>
                  <p className="text-xs text-slate-500">Device dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Connected
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.12] to-blue-500/[0.04] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Synchronization</p>
                  <p className="mt-2 text-2xl font-bold">Active</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                  <RefreshCw className="h-7 w-7 animate-[spin_8s_linear_infinite] text-cyan-400" />
                </div>
              </div>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
              </div>
              <div className="mt-3 flex justify-between text-[11px] text-slate-500">
                <span>Device connected</span>
                <span>Auto sync enabled</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">Recent activity</p>
                <span className="text-xs text-slate-500">Preview</span>
              </div>

              {[
                {
                  sender: "Bank Notification",
                  message: "Your transaction notification has arrived.",
                  time: "Just now",
                  color: "bg-blue-500/15 text-blue-400",
                  icon: "B",
                },
                {
                  sender: "Messages",
                  message: "You have received a new message.",
                  time: "Recently",
                  color: "bg-purple-500/15 text-purple-400",
                  icon: "M",
                },
                {
                  sender: "Service Alert",
                  message: "A new notification was received.",
                  time: "Recently",
                  color: "bg-emerald-500/15 text-emerald-400",
                  icon: "S",
                },
              ].map((item) => (
                <div
                  key={item.sender}
                  className="mb-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${item.color}`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{item.sender}</p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {item.message}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] py-3 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5 text-cyan-400" />
              Secure device connection
            </div>
          </div>

          <div className="absolute -left-5 top-24 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#111c2c] p-4 shadow-xl sm:flex">
            <div className="rounded-xl bg-cyan-400/10 p-2.5">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-bold">Automatic Sync</p>
              <p className="mt-1 text-[10px] text-slate-500">Always connected</p>
            </div>
          </div>

          <div className="absolute -right-4 bottom-24 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#111c2c] p-4 shadow-xl sm:flex">
            <div className="rounded-xl bg-emerald-400/10 p-2.5">
              <Cloud className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold">Cloud Sync</p>
              <p className="mt-1 text-[10px] text-slate-500">Connected</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative z-10 border-y border-white/[0.07] bg-white/[0.015]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-9 sm:px-8 md:grid-cols-4">
          {[
            { icon: Smartphone, title: "Android", sub: "Mobile application" },
            { icon: Zap, title: "Near real-time", sub: "Automatic delivery" },
            { icon: Cloud, title: "Cloud based", sub: "Centralized storage" },
            { icon: ShieldCheck, title: "User controlled", sub: "Permission based" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <item.icon className="h-6 w-6 shrink-0 text-cyan-400" />
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
            Powerful capabilities
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
            Everything you need.
            <br />
            <span className="text-slate-500">Nothing complicated.</span>
          </h2>
          <p className="mt-5 leading-7 text-slate-400">
            A simple, reliable way to synchronize your incoming SMS messages
            from Android to your cloud account.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-7 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[0.035]"
            >
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] transition group-hover:bg-cyan-400/15">
                <feature.icon className="h-6 w-6 text-cyan-400" />
              </div>
              <p className="mb-2 text-xs font-medium text-slate-600">
                0{index + 1}
              </p>
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 border-y border-white/[0.07] bg-[#0a101d] py-28"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Simple workflow
            </span>
            <h2 className="mt-5 text-3xl font-bold sm:text-5xl">
              Three steps. That&apos;s it.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              Get your SMS synchronization up and running in just a few
              moments.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className="relative mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06]">
                  <step.icon className="h-8 w-8 text-cyan-400" />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400 text-xs font-bold text-[#07101a]">
                    {index + 1}
                  </span>
                </div>
                <p className="text-xs font-bold tracking-widest text-cyan-400">
                  STEP {step.number}
                </p>
                <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="relative z-10 mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Privacy matters
            </span>
            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
              Your messages.
              <br />
              Your control.
            </h2>
            <p className="mt-6 max-w-lg leading-8 text-slate-400">
              SMS Sync is designed around user-controlled synchronization.
              You decide which device connects and when synchronization is
              enabled.
            </p>

            <div className="mt-8 space-y-5">
              {[
                "Explicit SMS permission and user consent",
                "Authorized device management",
                "Secure HTTPS communication",
                "Controlled account access",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                    <Check className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-[90px]" />
            <div className="relative rounded-3xl border border-white/10 bg-[#0c1422] p-8 sm:p-12">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-cyan-400/20 bg-cyan-400/[0.08]">
                <ShieldCheck className="h-12 w-12 text-cyan-400" />
              </div>
              <h3 className="mt-7 text-center text-2xl font-bold">
                Built with privacy in mind
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-7 text-slate-400">
                Your device, your permissions, your synchronization settings.
                You stay in control.
              </p>
              <div className="mt-9 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Connection</span>
                  <span className="text-xs font-semibold text-emerald-400">HTTPS</span>
                </div>
                <div className="my-4 h-px bg-white/[0.07]" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Device access</span>
                  <span className="text-xs font-semibold text-cyan-400">Controlled</span>
                </div>
                <div className="my-4 h-px bg-white/[0.07]" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Sync permission</span>
                  <span className="text-xs font-semibold text-cyan-400">User enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="relative z-10 border-y border-white/[0.07] bg-[#0a101d] py-20">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-8">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
            Under the hood
          </span>
          <h2 className="mt-5 text-3xl font-bold">
            Powered by modern technology.
          </h2>
          <p className="mt-4 text-sm text-slate-400">
            Built with reliable technologies for mobile and cloud infrastructure.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {technologies.map((tech) => (
              <div
                key={tech}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id="download" className="relative z-10 px-5 py-28 sm:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-cyan-400/20 bg-gradient-to-br from-[#10263b] via-[#0d192b] to-[#10152b] px-7 py-16 text-center sm:px-16">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />

          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
              <MessageSquare className="h-8 w-8 text-cyan-400" />
            </div>
            <h2 className="mt-7 text-3xl font-bold sm:text-5xl">
              Ready to sync?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
              Take control of your incoming SMS messages. Connect your Android
              device and experience automatic cloud synchronization.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <DownloadButton className="flex items-center gap-3 rounded-xl bg-cyan-400 px-7 py-4 text-sm font-bold text-[#07101a] transition hover:-translate-y-1 hover:bg-cyan-300" />

              {loggedIn ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-xl border border-cyan-400/30 px-7 py-4 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                >
                  <House className="h-4 w-4" /> Dashboard
                </Link>
              ) : guest ? (
                <>
                  <Link
                    href="/signin"
                    className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-semibold transition hover:bg-white/[0.08]"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/signup"
                    className="flex items-center gap-2 rounded-xl border border-cyan-400/30 px-7 py-4 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                  >
                    Sign Up
                  </Link>
                </>
              ) : null}
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Android application · Cloud synchronization
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="font-bold">
              SMS<span className="text-cyan-400">Sync</span>
            </span>
          </Link>

          <p className="text-xs text-slate-500">
            © 2026 SMS Sync. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-6 text-xs text-slate-500">
            {loggedIn ? (
              <Link href="/dashboard" className="transition hover:text-cyan-400">
                Dashboard
              </Link>
            ) : guest ? (
              <>
                <Link href="/signin" className="transition hover:text-cyan-400">
                  Sign In
                </Link>
                <Link href="/signup" className="transition hover:text-cyan-400">
                  Sign Up
                </Link>
              </>
            ) : null}
            <a href="#security" className="transition hover:text-cyan-400">
              Privacy
            </a>
            <a href="mailto:support@example.com" className="transition hover:text-cyan-400">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
