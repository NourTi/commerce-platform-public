import ProductArt from "@/components/ProductArt";
import ShopShell from "@/components/ShopShell";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { money } from "@/lib/commerce";
import { commerceCopy } from "@/lib/commerceCopy";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";

export default function CartPage() {
  const { cart, itemCount, updateItem, applyCode } = useCart();
  const { locale } = useLanguage();
  const copy = commerceCopy[locale].cart;
  const [code, setCode] = useState("");
  async function submitPromotion(event: FormEvent) { event.preventDefault(); if (code.trim()) await applyCode(code); }
  return <ShopShell><main className="cart-page"><header className="page-heading"><p className="eyebrow">{copy.eyebrow(itemCount)}</p><h1>{copy.heading}</h1></header>{!cart?.lines.length ? <section className="catalog-empty"><h2>{copy.emptyTitle}</h2><p>{copy.emptyBody}</p><Link href="/store" className="button-primary">{copy.exploreStore} <ArrowRight size={17} /></Link></section> : <section className="cart-layout"><div className="cart-lines">{cart.lines.map(line => <article className="cart-line" key={line.id}><ProductArt handle={line.handle} label={line.title} size="line" /><div><p>{line.title}</p><span>{line.variantTitle} / {line.sku}</span><strong>{money(line.unitPriceCents, locale)}</strong></div><div className="quantity-control"><button type="button" aria-label={copy.decrease(line.title)} onClick={() => updateItem(line.id, line.quantity - 1)}><Minus size={14} /></button><span>{line.quantity}</span><button type="button" aria-label={copy.increase(line.title)} onClick={() => updateItem(line.id, line.quantity + 1)}><Plus size={14} /></button></div><button className="remove-line" type="button" aria-label={copy.remove(line.title)} onClick={() => updateItem(line.id, 0)}><Trash2 size={17} /></button></article>)}</div><aside className="cart-summary"><p className="eyebrow">{copy.summary}</p><form onSubmit={submitPromotion}><label htmlFor="promotion">{copy.promotionCode}</label><div><input id="promotion" value={code} onChange={event => setCode(event.target.value)} placeholder="WELCOME15" /><button type="submit">{copy.apply}</button></div></form>{cart.promotion ? <p className="promotion-applied">{cart.promotion.code} {copy.applied}</p> : null}<dl><div><dt>{copy.subtotal}</dt><dd>{money(cart.totals.subtotalCents, locale)}</dd></div><div><dt>{copy.discount}</dt><dd>−{money(cart.totals.discountCents, locale)}</dd></div><div><dt>{copy.shipping}</dt><dd>{copy.shippingNext}</dd></div><div className="cart-total"><dt>{copy.estimatedTotal}</dt><dd>{money(cart.totals.totalCents, locale)}</dd></div></dl><Link href="/checkout" className="button-primary wide">{copy.checkout} <ArrowRight size={17} /></Link><small>{copy.paymentNote}</small></aside></section>}</main></ShopShell>;
}
