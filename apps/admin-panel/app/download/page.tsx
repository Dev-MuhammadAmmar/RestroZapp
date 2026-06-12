import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
const GITHUB_INSTALLER_URL =
  "https://github.com/Dev-MuhammadAmmar/RestroZapp/releases/latest/download/RestroZapp-POS-Setup.exe";

async function latestVersion() {
  if (!hasSupabaseAdminEnv()) return null;
  const { data } = await createSupabaseAdminClient().from("app_versions").select("*").eq("status", "published").eq("is_latest", true).maybeSingle();
  return data;
}

export default async function DownloadPage() {
  const version = await latestVersion();
  const downloadUrl = version?.download_url || GITHUB_INSTALLER_URL;
  return <main className="public-site"><PublicHeader /><section className="public-page"><div className="download-panel"><span className="large-icon"><Download /></span><p className="eyebrow">Windows desktop application</p><h1>Download RestroZapp POS</h1><p>Install the offline-first restaurant client. A restaurant code, activation password, and owner device approval are required before billing begins.</p><div className="download-meta"><span>Version <b>{version?.version || "1.0.0"}</b></span><span><ShieldCheck /> Secure device activation</span></div><a className="public-button primary" href={downloadUrl} rel="noopener noreferrer">Download for Windows <Download /></a><small>Windows 10 or later. Device activation is required before billing begins.</small></div><Link className="text-link" href="/help">Need installation help?</Link></section><PublicFooter /></main>;
}
