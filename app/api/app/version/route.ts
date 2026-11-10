import { NextRequest, NextResponse } from "next/server";

import release from "@/lib/appRelease.json";

// Public (no API key): the Android app calls this on every launch to learn the latest build.
// To publish a new build: replace public/SMS_Sync.apk, then bump versionCode / versionName
// in lib/appRelease.json (versionCode must match android { defaultConfig { versionCode } }).
export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "") || "https";
  const downloadUrl = `${proto}://${host}${release.apkPath}`;

  return NextResponse.json(
    {
      success: true,
      versionCode: release.versionCode,
      versionName: release.versionName,
      downloadUrl,
      mandatory: release.mandatory,
      releasedAt: release.releasedAt,
      changelog: release.changelog,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
