import Image from "next/image";
import Link from "next/link";

export function PublicHeader() {
  return <header className="public-header"><Link className="public-brand" href="/"><Image src="/restrozapp-icon.png" alt="" width={38} height={38} /><b>RestroZapp</b></Link><nav><Link href="/download">Download</Link><Link href="/help">Help</Link><Link href="/feedback">Feedback</Link><Link className="owner-link" href="/admin/login">Owner Console</Link></nav></header>;
}

export function PublicFooter() {
  return <footer className="public-footer"><span>RestroZapp POS</span><span>Professional restaurant software</span><span>restrozapp.vercel.app</span></footer>;
}
