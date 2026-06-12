import { Cloud, KeyRound, Printer, RefreshCw } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";

const topics = [
  { icon: KeyRound, title: "Activation", text: "Enter the restaurant code and password on the new computer. The device appears in Owner Console and remains pending until approved." },
  { icon: Printer, title: "Printing", text: "Choose printers in POS Settings, run a test print, and keep working even if a printer is offline. Failed jobs remain available for retry." },
  { icon: Cloud, title: "Backups", text: "RestroZapp syncs local changes while online and creates recovery snapshots on schedule. The POS remains usable when the internet is unavailable." },
  { icon: RefreshCw, title: "Recovery", text: "Use Pull Data only on an approved computer. RestroZapp verifies ownership, checksum, database integrity, and schema compatibility before replacing local data." },
];

export default function HelpPage() {
  return <main className="public-site"><PublicHeader /><section className="public-page wide"><div className="section-heading"><p className="eyebrow">Help Center</p><h1>Clear answers for daily operations</h1><p>Start with the common workflows below. Send a support request when the issue needs account-level help.</p></div><div className="help-grid">{topics.map(({ icon: Icon, title, text }) => <article key={title}><Icon /><h2>{title}</h2><p>{text}</p></article>)}</div></section><PublicFooter /></main>;
}
