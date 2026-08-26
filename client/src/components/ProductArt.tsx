import "../product-mockup.css";

export default function ProductArt({ handle, label, size = "card" }: { handle: string; label: string; size?: "card" | "large" | "line" }) {
  const candyMockup = label.toLowerCase().includes("candy");
  if (candyMockup) return <div className={`product-art product-art--mockup product-art--${size}`} role="img" aria-label={`${label} product mockup`}><img src="/media/candy-product-mockup_e8a2731b.png" alt="" /></div>;
  return <div className={`product-art product-art--${handle} product-art--${size}`} role="img" aria-label={`${label} product illustration`}>
    <span className="product-art-grid" aria-hidden="true" />
    <span className="product-art-object" aria-hidden="true" />
    <span className="product-art-shadow" aria-hidden="true" />
  </div>;
}
