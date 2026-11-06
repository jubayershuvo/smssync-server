"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, isLoading, signout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Welcome to SMSync
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              Sync your SMS messages across all your devices.
            </p>
            <div className="space-y-3">
              <Link
                href="/signin"
                className="block w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="block w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-white bg-zinc-200 dark:bg-zinc-800 rounded-lg shadow-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 transition-all"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Hello, {user.name}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
            </div>
            <button
              onClick={signout}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline transition-colors"
            >
              Sign out
            </button>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 mb-6 border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
              Your account
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Username: <span className="font-mono">{user.username}</span>
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
