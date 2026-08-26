import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { publicCopy } from "@/lib/publicCopy";
import { CUSTOMER_AUTH0_LOGIN_HREF } from "@/lib/customerAuth";
import { ArrowRight, Check, ChevronDown, LayoutTemplate, Menu, MousePointer2, PackageCheck, Smartphone, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

function ReferenceVideo({ className, poster, src }: { className: string; poster?: string; src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const play = () => { if (ref.current) { ref.current.muted = true; void ref.current.play().catch(() => undefined); } };
    play();
    const retry = window.setInterval(play, 1000);
    document.addEventListener("pointerdown", play, { once: true });
    return () => { window.clearInterval(retry); document.removeEventListener("pointerdown", play); };
  }, []);
  return <video className={className} ref={ref} autoPlay muted loop playsInline preload="auto" poster={poster} aria-hidden="true"><source src={src} type="video/mp4" /></video>;
}

type LandingCopy = (typeof publicCopy)["en"];

function StorefrontCanvas({ copy }: { copy: LandingCopy }) {
  return <div className="studio-canvas" aria-label="Storefront studio preview">
    <div className="studio-canvas-toolbar"><span><MousePointer2 size={14} /> {copy.studio.desktop}</span><span className="studio-status"><Check size={13} /> {copy.studio.publish}</span></div>
    <div className="studio-desktop-frame">
      <div className="mock-store-nav"><b>OBJECTS</b><span>Shop</span><span>Journal</span><i /></div>
      <div className="mock-store-hero"><div><small>AW / 26</small><strong>Objects<br />with intent.</strong><button type="button">Explore <ArrowRight size={12} /></button></div><div className="mock-arch-object"><i /><b /><em /></div></div>
      <div className="mock-store-collection"><small>SELECTED FOR THE WEEK</small><div><span /><span /><span /></div></div>
    </div>
    <div className="studio-phone-frame"><div className="studio-phone-top"><Smartphone size={12} /> {copy.studio.mobile}</div><div className="studio-phone-screen"><small>OBJECTS</small><b>Objects<br />with intent.</b><span /><button type="button">Shop</button></div></div>
  </div>;
}

function OperationsMockup({ copy }: { copy: LandingCopy }) {
  return <div className="operations-mockup" aria-label="Merchant operations preview">
    <div className="operations-sidebar"><b>●</b><span className="active">{copy.operations.labels.catalog}</span><span>{copy.operations.labels.orders}</span><span>{copy.operations.labels.campaigns}</span><span>{copy.operations.labels.extensions}</span></div>
    <div className="operations-main"><div className="operations-topline"><small>STORE / OVERVIEW</small><span>{copy.operations.labels.conversion} <b>3.8%</b></span></div><div className="operations-metrics"><article><small>{copy.operations.labels.revenue}</small><strong>$18,420</strong><i>+18.2%</i></article><article><small>{copy.operations.labels.orders}</small><strong>128</strong><i>+12 today</i></article></div><div className="operations-feed"><div><b>Arc Lamp / Graphite</b><span>Order #1028 <i>Paid</i></span></div><div><b>Field Pack / Olive</b><span>Order #1027 <i>Processing</i></span></div><div><b>Form Vessel / Clear</b><span>Order #1026 <i>Pending</i></span></div></div></div>
  </div>;
}

export default function PlatformHome() {
  const { locale, direction } = useLanguage();
  const copy = publicCopy[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  return <main className={`reference-landing platform-journey ${direction === "rtl" ? "reference-landing--rtl" : ""}`} dir={direction}>
    <section className="reference-hero" id="home">
      <ReferenceVideo className="reference-hero-video" poster="/media/hero-frame-3s_4f31c8b0.png" src="/media/rivet-hero-motion_25aa1119.mp4" />
      <div className="reference-hero-scrim" aria-hidden="true" />
      <header className="reference-header"><Link href="/" className="reference-logo" aria-label={copy.logo}><i aria-hidden="true" /><span>{copy.logo}</span></Link><nav className="reference-nav" aria-label="Primary navigation"><a href="#home">{copy.nav.home}</a><a href="#foundation">{copy.nav.about}</a><a href="#product">{copy.nav.product}</a><a href="#studio">{copy.nav.studio}</a><Link href="/store">{copy.nav.store}</Link></nav><div className="reference-header-actions"><a className="reference-customer-sign-in" href={CUSTOMER_AUTH0_LOGIN_HREF}>{copy.nav.signIn}</a><LanguageSwitcher /></div><button type="button" className="reference-menu-button" onClick={() => setMenuOpen(open => !open)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button></header>
      {menuOpen ? <nav className="reference-mobile-nav" aria-label="Mobile navigation"><a className="reference-mobile-sign-in" href={CUSTOMER_AUTH0_LOGIN_HREF}>{copy.nav.signIn}</a><a href="#home" onClick={() => setMenuOpen(false)}>{copy.nav.home}</a><a href="#foundation" onClick={() => setMenuOpen(false)}>{copy.nav.about}</a><a href="#product" onClick={() => setMenuOpen(false)}>{copy.nav.product}</a><a href="#studio" onClick={() => setMenuOpen(false)}>{copy.nav.studio}</a><Link href="/store" onClick={() => setMenuOpen(false)}>{copy.nav.store}</Link><LanguageSwitcher /></nav> : null}
      <div className="reference-hero-content"><p>{copy.hero.eyebrow}</p><h1>{copy.hero.lines.map((line, index) => <span className={index >= 3 ? "reference-indent" : ""} key={line}>{line}</span>)}</h1><a href="#studio" className="reference-cta">{copy.hero.cta}<ArrowRight size={18} /><i /></a></div>
      <a className="hero-scroll-cue" href="#foundation"><span>{copy.nav.about}</span><ChevronDown size={16} /></a>
    </section>

    <section className="reference-about" id="foundation"><div className="reference-about-copy"><p>{copy.about.eyebrow}</p><h2><span>{copy.about.lines[0]}</span><span>{copy.about.lines[1]}</span></h2><div className="reference-about-detail"><p>{copy.about.body}</p><a href="#product" className="reference-cta">{copy.about.cta}<ArrowRight size={18} /><i /></a></div></div><div className="reference-about-media"><ReferenceVideo className="reference-about-video" src="/media/rivet-merchant-motion_10210d40.mp4" /><div aria-hidden="true" /></div></section>

    <section className="platform-product" id="product"><div className="platform-section-intro"><p>{copy.product.eyebrow}</p><h2>{copy.product.title}</h2><div><span>{copy.product.body}</span><LayoutTemplate size={28} /></div></div><div className="platform-product-manifest">{copy.product.items.map((item, index) => <article key={item.number} className={`platform-product-manifest-item item-${index}`}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.body}</p></div><ArrowRight size={20} /></article>)}</div></section>

    <section className="platform-studio" id="studio"><div className="platform-studio-copy"><p>{copy.studio.eyebrow}</p><h2>{copy.studio.title}</h2><p>{copy.studio.body}</p><div className="platform-studio-controls"><article><span>{copy.studio.themes}</span><b><i /><i /><i /></b></article><article><span>{copy.studio.sections}</span><b>04 <PackageCheck size={16} /></b></article></div><Link href="/workspace" className="platform-text-link">{copy.studio.action} <ArrowRight size={18} /></Link></div><StorefrontCanvas copy={copy} /></section>

    <section className="platform-operations"><div className="platform-operations-copy"><p>{copy.operations.eyebrow}</p><h2>{copy.operations.title}</h2><p>{copy.operations.body}</p><Link href="/workspace" className="reference-cta">{copy.operations.action}<ArrowRight size={18} /><i /></Link></div><OperationsMockup copy={copy} /></section>

    <section className="platform-extensions"><header><p>{copy.extensions.eyebrow}</p><h2>{copy.extensions.title}</h2><p>{copy.extensions.body}</p></header><div>{copy.extensions.cards.map((card, index) => <article key={card.title}><span>{String(index + 1).padStart(2, "0")}</span><small>{card.state}</small><h3>{card.title}</h3><p>{card.body}</p><Sparkles size={18} /></article>)}</div></section>

    <section className="platform-launch"><div><p>{copy.launch.eyebrow}</p><h2>{copy.launch.title}</h2></div><div><p>{copy.launch.body}</p><div className="platform-launch-actions"><Link href="/workspace" className="reference-cta">{copy.launch.primary}<ArrowRight size={18} /><i /></Link><Link href="/store" className="platform-text-link">{copy.launch.secondary} <ArrowRight size={18} /></Link></div></div></section>
  </main>;
}
