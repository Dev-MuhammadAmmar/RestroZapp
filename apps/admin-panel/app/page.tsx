import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, ChefHat, CloudCog, PackageCheck, Printer, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";

const capabilities = [
  { icon: Printer, title: "Fast restaurant billing", text: "Orders save locally first while KOTs and bills print through a durable background queue." },
  { icon: ChefHat, title: "Kitchen-ready workflow", text: "Split tickets by kitchen, manage pending orders, halls, tokens, and reprints without slowing the cashier." },
  { icon: PackageCheck, title: "Complete operations", text: "Inventory, customers, grocery purchasing, vendors, orders, and settings stay connected in one desktop app." },
  { icon: BarChart3, title: "Useful reporting", text: "Professional summaries, charts, exports, and printable operational reports." },
  { icon: CloudCog, title: "Offline first, cloud protected", text: "Keep billing without internet, sync changes when online, and recover from verified cloud snapshots." },
  { icon: ShieldCheck, title: "Secure device activation", text: "Every computer requires owner approval and receives encrypted device credentials with an offline lease." },
];

export default function Home() {
  return (
    <main className="public-site">
      <PublicHeader />
      <section className="hero">
        <div className="hero-copy">
          <Image src="/restrozapp-mark.png" alt="RestroZapp" width={86} height={86} priority />
          <p className="eyebrow">Restaurant operations, properly connected</p>
          <h1>RestroZapp</h1>
          <p className="hero-lead">A fast Windows restaurant POS built for dependable billing, quick kitchen printing, inventory control, and secure recovery.</p>
          <div className="hero-actions">
            <Link className="public-button primary" href="/download">Download for Windows <ArrowRight /></Link>
            <Link className="public-button secondary" href="/help">Visit Help Center</Link>
          </div>
        </div>
        <div className="product-scene" aria-label="RestroZapp point of sale preview">
          <div className="scene-sidebar">
            <Image src="/restrozapp-icon.png" alt="" width={42} height={42} />
            {["POS", "Orders", "Inventory", "Customers", "Reports"].map((item, index) => <span className={index === 0 ? "active" : ""} key={item}>{item}</span>)}
          </div>
          <div className="scene-main">
            <div className="scene-top"><b>New Order</b><span>Online</span></div>
            <div className="scene-categories"><span>All Items</span><span>Pizza</span><span>Burgers</span><span>Drinks</span></div>
            <div className="scene-products">{["Chicken Tikka", "Zinger Burger", "Creamy Pasta", "Club Sandwich", "Hot Wings", "Cold Drink"].map((item, index) => <div key={item}><i style={{ background: ["#f4a261", "#e76f51", "#e9c46a", "#2a9d8f", "#d97706", "#457b9d"][index] }} /><b>{item}</b><small>Rs. {300 + index * 90}</small></div>)}</div>
          </div>
          <div className="scene-cart"><b>Current order</b><p><span>2 x Zinger Burger</span><strong>Rs. 760</strong></p><p><span>1 x Cold Drink</span><strong>Rs. 750</strong></p><div><small>Total</small><strong>Rs. 1,510</strong></div><button>Send to Kitchen</button></div>
        </div>
      </section>
      <section className="capability-band">
        <div className="public-inner">
          <div className="section-heading"><p className="eyebrow">Built for daily service</p><h2>Everything the restaurant team needs. Nothing noisy.</h2></div>
          <div className="capability-grid">{capabilities.map(({ icon: Icon, title, text }) => <article key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>
      <section className="public-cta"><div><h2>Ready for a faster counter?</h2><p>Install RestroZapp POS or get help from the product team.</p></div><div><Link className="public-button primary" href="/download">Download</Link><Link className="public-button secondary" href="/feedback">Contact support</Link></div></section>
      <PublicFooter />
    </main>
  );
}
