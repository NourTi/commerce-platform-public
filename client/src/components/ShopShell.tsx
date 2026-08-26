import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { commerceCopy } from "@/lib/commerceCopy";
import { CUSTOMER_AUTH0_LOGIN_HREF } from "@/lib/customerAuth";
import { Blocks, Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import LanguageSwitcher from "./LanguageSwitcher";

export default function ShopShell({ children }: { children: React.ReactNode }) {
  const { itemCount } = useCart();
  const { direction, locale } = useLanguage();
  const copy = commerceCopy[locale].shell;
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="shop-shell" dir={direction}>
    <header className="shop-header">
      <Link href="/" className="brand-lockup" aria-label={copy.homeAria}><Blocks size={20} /><span>{copy.brandPrimary}</span><small>{copy.brandSecondary}</small></Link>
      <nav className="shop-nav" aria-label={copy.navAria}><Link href="/store">{copy.store}</Link><Link href="/account">Account</Link><Link href="/docs">{copy.builders}</Link><Link href="/admin">{copy.console}</Link></nav>
      <a className="shop-customer-sign-in" href={CUSTOMER_AUTH0_LOGIN_HREF}>{copy.customerSignIn}</a>
      <LanguageSwitcher className="shell-language" />
      <Link href="/cart" className="cart-link"><ShoppingBag size={17} /><span>{copy.cart}</span><b>{itemCount}</b><em>{itemCount}</em></Link>
      <button className="mobile-menu" type="button" onClick={() => setMenuOpen(open => !open)} aria-label={copy.toggleNav} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
      {menuOpen ? <nav className="mobile-shop-nav" aria-label={copy.mobileNavAria}><a href={CUSTOMER_AUTH0_LOGIN_HREF}>{copy.customerSignIn}</a><Link href="/store" onClick={() => setMenuOpen(false)}>{copy.store}</Link><Link href="/account" onClick={() => setMenuOpen(false)}>Account</Link><Link href="/docs" onClick={() => setMenuOpen(false)}>{copy.builders}</Link><Link href="/admin" onClick={() => setMenuOpen(false)}>{copy.console}</Link><Link href="/cart" onClick={() => setMenuOpen(false)}>{copy.cart} ({itemCount})</Link><LanguageSwitcher /></nav> : null}
    </header>
    {children}
    <footer className="shop-footer"><div className="brand-lockup"><Blocks size={18} /><span>{copy.brandPrimary}</span><small>{copy.brandSecondary}</small></div><p>{copy.footer}</p><Link href="/docs">{copy.exploreContracts}</Link></footer>
  </div>;
}
