import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Loader2, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import "../merchant-store.css";

function currency(value: number, locale: string) { return new Intl.NumberFormat(locale === "ar" ? "ar" : locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value / 100); }

function SectionCopy({ section }: { section: { type: string; settings: Record<string, unknown> } }) {
  const string = (key: string, fallback: string) => typeof section.settings[key] === "string" ? section.settings[key] : fallback;
  if (section.type === "HERO") return <section className="merchant-store-hero"><div><small>{string("eyebrow", "New collection")}</small><h1>{string("heading", "Design a storefront that keeps moving.")}</h1><p>{string("body", "A visual system connected to your real catalog.")}</p><a href="#catalog">{string("actionLabel", "Shop the collection")} <ArrowRight size={15} /></a></div><aside className="merchant-store-packshot"><img src="/media/metallic-pouch-storefront-hero_2b535031.png" alt="Unbranded metallic food pouch packaging mockup" /></aside></section>;
  if (section.type === "STORY") return <section className="merchant-store-story"><small>{string("eyebrow", "Built for the work")}</small><h2>{string("heading", "Merchandising without the handoff.")}</h2><p>{string("body", "Make an edit, see it at desktop and mobile, then publish a coherent storefront.")}</p></section>;
  if (section.type === "NEWSLETTER") return <section className="merchant-store-capture"><small>STAY CLOSE</small><div><h2>{string("heading", "Stay in the loop")}</h2><p>{string("body", "Collect launch interest and campaign subscribers.")}</p></div><form onSubmit={event => event.preventDefault()}><input aria-label="Email" type="email" placeholder="email@example.com" /><button type="submit">→</button></form></section>;
  return null;
}

export default function PublicMerchantStore() {
  const [, params] = useRoute("/s/:handle");
  const { locale, direction } = useLanguage();
  const { addItem, activateStore, itemCount } = useCart();
  const storefront = trpc.commerce.publicStorefront.useQuery({ handle: params?.handle ?? "store" });
  const data = storefront.data;
  useEffect(() => { if (data) activateStore(data.store.id); }, [activateStore, data]);
  if (storefront.isLoading) return <main className="merchant-store-loading"><Loader2 className="animate-spin" /></main>;
  if (!data) return <main className="merchant-store-loading"><h1>Storefront unavailable</h1><Link href="/">Return to platform</Link></main>;
  const theme = data.theme?.preset?.toLowerCase() ?? "editorial";
  const hero = data.sections.find(section => section.type === "HERO");
  const collection = data.sections.find(section => section.type === "FEATURED_COLLECTION");
  return <main className={`merchant-store merchant-store--${theme}`} dir={direction} style={Object.fromEntries(Object.entries(data.theme?.tokens ?? {}).map(([key, value]) => [`--store-${key}`, value])) as React.CSSProperties}>
    <header className="merchant-store-header"><Link href="/" className="merchant-store-wordmark">{data.store.name}</Link><nav><a href="#catalog">Catalog</a><a href="#story">Story</a><Link href="/cart"><ShoppingBag size={16} /><span>{itemCount}</span></Link></nav></header>
    {hero ? <SectionCopy section={hero} /> : null}
    {collection ? <section className="merchant-store-catalog" id="catalog"><header><small>{typeof collection.settings.heading === "string" ? collection.settings.heading : "Featured collection"}</small><span>{data.products.length} objects</span></header><div>{data.products.map((product, index) => { const primary = product.media.find(media => media.kind === "GALLERY"); const hover = product.variants.flatMap(variant => variant.media).find(media => media.kind === "HOVER"); return <article key={product.id}><Link href={`/store/products/${product.handle}`} className={`merchant-product-visual product-${index % 4}${primary ? " merchant-product-visual--mockup" : ""}${hover ? " merchant-product-visual--has-hover" : ""}`}>{primary ? <img className="merchant-product-media-primary" src={primary.url} alt={primary.altText} style={{ objectPosition: `${primary.cropX}% ${primary.cropY}%` }} /> : <><i /><b /><em /></>}{hover ? <img className="merchant-product-media-hover" src={hover.url} alt="" style={{ objectPosition: `${hover.cropX}% ${hover.cropY}%` }} /> : null}</Link><div><Link href={`/store/products/${product.handle}`}><h2>{product.title}</h2><p>{product.subtitle}</p></Link><span>{currency(product.variants[0]?.priceCents ?? 0, locale)}</span><button type="button" disabled={!product.variants[0]} onClick={() => product.variants[0] && addItem(product.variants[0].id)}><ShoppingBag size={15} /> Add</button></div></article>; })}</div></section> : null}
    {data.sections.filter(section => section.type === "STORY" || section.type === "NEWSLETTER").map(section => <div id={section.type === "STORY" ? "story" : undefined} key={section.id}><SectionCopy section={section} /></div>)}
    <footer className="merchant-store-footer"><b>{data.store.name}</b><span>{data.store.handle}</span><Link href="/">Built with commerce</Link></footer>
  </main>;
}
