import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { FeedbackForm } from "./FeedbackForm";

export default function FeedbackPage() {
  return <main className="public-site"><PublicHeader /><section className="public-page wide"><div className="section-heading"><p className="eyebrow">Support and feedback</p><h1>Tell us what you need</h1><p>Send a product question, report a problem, or share an improvement. Requests are tracked in the RestroZapp Owner Console.</p></div><FeedbackForm /></section><PublicFooter /></main>;
}
