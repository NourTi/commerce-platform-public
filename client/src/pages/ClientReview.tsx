import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { workspaceCopy } from "@/lib/workspaceCopy";
import { ArrowLeft, Check, Eye, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import "../client-review.css";

function sectionText(section: { settings: Record<string, unknown> }, key: string, fallback: string) {
  return typeof section.settings[key] === "string" ? section.settings[key] as string : fallback;
}

type ReviewMedia = { id: string; url: string; altText: string; kind: "GALLERY" | "HOVER"; cropX: number; cropY: number };
type ReviewProduct = { id: string; title: string; subtitle: string; media: ReviewMedia[]; variants: Array<{ media: ReviewMedia[] }> };

function ReadOnlyStorefrontSection({ section, products }: { section: { id: string; type: string; settings: Record<string, unknown> }; products: ReviewProduct[] }) {
  if (section.type === "HERO") return <section className="client-review-hero"><div><small>{sectionText(section, "eyebrow", "New collection")}</small><h1>{sectionText(section, "heading", "Storefront review")}</h1><p>{sectionText(section, "body", "A visual system connected to your real catalog.")}</p><a href="#review-catalog">{sectionText(section, "actionLabel", "See the collection")}</a></div><div className="client-review-object"><img src="/media/metallic-pouch-storefront-hero_2b535031.png" alt="Unbranded metallic food pouch packaging mockup" /></div></section>;
  if (section.type === "FEATURED_COLLECTION") return <section className="client-review-catalog" id="review-catalog"><header><small>{sectionText(section, "heading", "Featured collection")}</small><span>{products.length} objects</span></header><div>{products.map((product, index) => { const primary = product.media.find(media => media.kind === "GALLERY"); return <article key={product.id}><i className={`review-product-${index % 4}${primary ? " review-product--mockup" : ""}`}>{primary ? <img src={primary.url} alt={primary.altText} style={{ objectPosition: `${primary.cropX}% ${primary.cropY}%` }} /> : <b />}</i><h2>{product.title}</h2><p>{product.subtitle}</p></article>; })}</div></section>;
  if (section.type === "STORY") return <section className="client-review-story"><small>{sectionText(section, "eyebrow", "Built for the work")}</small><h2>{sectionText(section, "heading", "Merchandising without the handoff.")}</h2><p>{sectionText(section, "body", "Make an edit, see it at desktop and mobile, then publish a coherent storefront.")}</p></section>;
  if (section.type === "NEWSLETTER") return <section className="client-review-capture"><small>STAY CLOSE</small><div><h2>{sectionText(section, "heading", "Stay in the loop")}</h2><p>{sectionText(section, "body", "Collect launch interest and campaign subscribers.")}</p></div><span aria-label="Read-only email capture preview">email@example.com →</span></section>;
  return null;
}

export default function ClientReview() {
  const [, params] = useRoute("/review/:token");
  const { locale, direction } = useLanguage();
  const copy = workspaceCopy[locale].handoff;
  const review = trpc.commerce.publicHandoff.useQuery({ token: params?.token ?? "missing" });
  if (review.isLoading) return <main className="client-review-loading"><Loader2 className="animate-spin" /></main>;
  if (!review.data) return <main className="client-review-loading"><h1>Review unavailable</h1><Link href="/">Return to platform</Link></main>;
  const { handoff, store, theme, sections, products } = review.data;
  return <main className="client-review" dir={direction} style={Object.fromEntries(Object.entries(theme?.tokens ?? {}).map(([key, value]) => [`--review-${key}`, value])) as React.CSSProperties}>
    <header className="client-review-top"><Link href="/" aria-label="Return to commerce platform"><ArrowLeft size={16} /></Link><div><small>{copy.eyebrow}</small><b>{handoff.label}</b></div><span><Eye size={15} />{handoff.status === "APPROVED" ? copy.approved : copy.shared}</span></header>
    <section className="client-review-system"><div><span>01</span><h2>Theme</h2><p>{theme?.name ?? "No active theme"}</p></div><div><span>02</span><h2>Visible sections</h2><p>{sections.length} active blocks</p></div><div><span>03</span><h2>Catalogue</h2><p>{products.length} published products</p></div></section>
    {sections.map(section => <ReadOnlyStorefrontSection key={section.id} section={section} products={products} />)}
    <footer className="client-review-footer"><div><Check size={17} /><span>{copy.note}</span></div><Link href={`/s/${store.handle}`}>{copy.review}</Link></footer>
  </main>;
}
