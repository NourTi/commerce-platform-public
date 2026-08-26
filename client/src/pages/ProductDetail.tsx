import ProductArt from "@/components/ProductArt";
import ShopShell from "@/components/ShopShell";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { money } from "@/lib/commerce";
import { commerceCopy } from "@/lib/commerceCopy";
import { trpc } from "@/lib/trpc";
import { Check, ChevronLeft, Loader2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import "../product-gallery.css";

export default function ProductDetail() {
  const [, params] = useRoute("/store/products/:handle");
  const product = trpc.commerce.getProduct.useQuery({ handle: params?.handle ?? "unknown" });
  const { addItem, isLoading } = useCart();
  const { locale } = useLanguage();
  const copy = commerceCopy[locale].product;
  const [variantId, setVariantId] = useState<string | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);

  useEffect(() => { if (product.data && !variantId) setVariantId(product.data.variants.find(variant => variant.isDefault)?.id ?? product.data.variants[0]?.id ?? null); }, [product.data, variantId]);
  useEffect(() => { setMediaId(null); }, [variantId]);
  if (product.isLoading) return <ShopShell><div className="state-box"><Loader2 className="animate-spin" /> {copy.loading}</div></ShopShell>;
  if (!product.data) return <ShopShell><div className="state-box">{copy.unavailable} <Link href="/store">{copy.returnToStore}</Link></div></ShopShell>;
  const selected = product.data.variants.find(variant => variant.id === variantId) ?? product.data.variants[0];
  const gallery = [...product.data.media.filter(media => media.kind === "GALLERY"), ...(selected?.media ?? []).filter(media => media.kind === "GALLERY" || media.kind === "HOVER")];
  const activeMedia = gallery.find(media => media.id === mediaId) ?? gallery[0];
  const selectedOptions = Object.entries(selected?.options ?? {}).filter(([, value]) => value);
  const optionLabel = (key: string) => key === "color" ? copy.color : key === "finish" ? copy.finish : key.replace(/[-_]/g, " ");
  return <ShopShell><main className="product-page"><Link href="/store" className="back-nav"><ChevronLeft size={16} /> {copy.allProducts}</Link><section className="product-detail-grid"><div className="product-media-gallery"><div className="product-media-stage">{activeMedia ? <img src={activeMedia.url} alt={activeMedia.altText} style={{ objectPosition: `${activeMedia.cropX}% ${activeMedia.cropY}%` }} /> : <ProductArt handle={product.data.handle} label={product.data.title} size="large" />}</div>{gallery.length > 1 ? <div className="product-media-thumbs">{gallery.map(media => <button key={media.id} type="button" className={activeMedia?.id === media.id ? "active" : ""} onClick={() => setMediaId(media.id)}><img src={media.url} alt="" style={{ objectPosition: `${media.cropX}% ${media.cropY}%` }} /><span>{media.kind === "HOVER" ? "Alternate view" : "Gallery view"}</span></button>)}</div> : null}</div><div className="product-detail-content"><p className="eyebrow">{product.data.category} / {copy.detail}</p><h1>{product.data.title}</h1><p className="product-subtitle">{product.data.subtitle}</p><p className="product-description">{product.data.description}</p><div className="variant-picker"><span>{copy.finish}</span><div>{product.data.variants.map(variant => <button key={variant.id} type="button" className={variant.id === selected?.id ? "active" : ""} onClick={() => setVariantId(variant.id)}>{variant.title}</button>)}</div></div>{selectedOptions.length ? <div className="variant-option-list" aria-label={copy.options}><span>{copy.options}</span>{selectedOptions.map(([key, value]) => <p key={key}><b>{optionLabel(key)}</b><em>{value}</em></p>)}</div> : null}<div className="detail-price"><strong>{money(selected?.priceCents ?? 0, locale)}</strong><span>{copy.available(selected?.inventoryQty ?? 0)}</span></div><button type="button" className="button-primary wide" disabled={!selected || selected.inventoryQty === 0 || isLoading} onClick={() => selected && addItem(selected.id)}><ShoppingBag size={17} /> {selected?.inventoryQty === 0 ? copy.unavailableCta : copy.addToCart}</button><div className="detail-points"><p><Check size={16} /> {copy.inventoryValidated}</p><p><Check size={16} /> {copy.totalsCalculated}</p></div></div></section></main></ShopShell>;
}
