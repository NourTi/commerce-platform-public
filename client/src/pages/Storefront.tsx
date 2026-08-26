import ProductArt from "@/components/ProductArt";
import ShopShell from "@/components/ShopShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { money } from "@/lib/commerce";
import { commerceCopy } from "@/lib/commerceCopy";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { ArrowRight, Loader2, Search, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import "../storefront-discovery.css";

export default function Storefront() {
  const catalog = trpc.commerce.listProducts.useQuery();
  const { locale } = useLanguage();
  const copy = commerceCopy[locale].store;
  const productCopy = commerceCopy[locale].product;
  const { addItem, isLoading: cartLoading } = useCart();
  const [activeCategory, setActiveCategory] = useState("__all__");
  const [searchQuery, setSearchQuery] = useState("");
  const products = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase(locale);
    return catalog.data?.filter(product => (activeCategory === "__all__" || product.category === activeCategory) && (!query || [product.title, product.subtitle, product.category].some(value => value.toLocaleLowerCase(locale).includes(query)))) ?? [];
  }, [activeCategory, catalog.data, locale, searchQuery]);
  const categories = ["__all__"].concat(Array.from(new Set(catalog.data?.map(product => product.category) ?? [])));
  return <ShopShell><main className="store-page">
    <section className="store-hero"><div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.heroBefore} <em>{copy.heroEmphasis}</em> {copy.heroAfter}</h1><p>{copy.heroBody}</p><a href="#collection" className="text-arrow">{copy.heroLink} <ArrowRight size={16} /></a></div><div className="store-hero-object" aria-hidden="true"><span /><i /><b /></div></section>
    <section className="store-toolbar" id="collection"><div><p className="eyebrow">{copy.collectionEyebrow}</p><h2>{copy.collectionTitle}</h2></div><div className="store-toolbar-controls"><label className="store-search"><Search size={15} /><span>{copy.searchLabel}</span><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder={copy.searchPlaceholder} /></label><p className="store-result-count" aria-live="polite">{copy.productCount(products.length)}</p><div className="category-tabs" role="tablist" aria-label={copy.categoriesAria}>{categories.map(category => <button key={category} type="button" role="tab" aria-selected={category === activeCategory} className={category === activeCategory ? "active" : ""} onClick={() => setActiveCategory(category)}>{category === "__all__" ? copy.all : category}</button>)}</div></div></section>
    {catalog.isLoading ? <div className="state-box"><Loader2 className="animate-spin" /> {copy.loading}</div> : null}
    {!catalog.isLoading && catalog.data?.length === 0 ? <section className="catalog-empty"><p className="eyebrow">{copy.emptyEyebrow}</p><h2>{copy.emptyTitle}</h2><p>{copy.emptyBody}</p><Link href="/admin" className="button-primary">{copy.emptyCta} <ArrowRight size={17} /></Link></section> : null}
    {catalog.data?.length && !products.length ? <section className="store-filter-empty"><p>{copy.noMatches}</p><button type="button" onClick={() => { setActiveCategory("__all__"); setSearchQuery(""); }}>{copy.resetFilters}</button></section> : null}
    <section className="product-grid">{products.map((product, index) => { const defaultVariant = product.variants[0]; const price = defaultVariant?.priceCents ?? 0; const canAdd = Boolean(defaultVariant && defaultVariant.inventoryQty > 0); return <article className="store-product-card" key={product.id}><Link href={`/store/products/${product.handle}`}><ProductArt handle={product.handle} label={product.title} /><div className="product-card-meta"><span>0{index + 1} / {product.category}</span><b>{product.title}</b><p>{product.subtitle}</p><strong>{money(price, locale)}</strong></div></Link><button type="button" className="store-quick-add" disabled={!canAdd || cartLoading} onClick={() => defaultVariant && void addItem(defaultVariant.id)}><ShoppingBag size={14} />{canAdd ? productCopy.addToCart : productCopy.unavailableCta}</button></article>; })}</section>
    <section className="promo-note"><p>{copy.promotionNote}</p><span>{copy.promotionMeta}</span></section>
  </main></ShopShell>;
}
