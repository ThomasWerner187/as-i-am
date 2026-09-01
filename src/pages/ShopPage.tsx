/** Hearth & Signal — dense, realistic electronics comparison shop. */

import { useEffect, useState } from "react";
import { Artwork } from "../components/Artwork";
import { MainNav, ReadingText } from "../components/SiteChrome";
import { Price, StatusPill, useEngineState } from "../components/Primitives";
import { CATEGORIES, money, priceBreakdown, PRODUCTS, findProduct, COUPONS } from "../data/products";
import { shopStore, useShopState, useFocusedTask, focusStore } from "../data/shopState";
import { activity } from "../data/activityStore";
import type { Route } from "../App";

const DEALS = [
  "🔥 Deal of the day: Aurora H7 — 18% off, only until midnight",
  "🚚 Free shipping over €50 with code SHIPFREE",
  "🎧 Noise-cancelling week: extra 10% with QUIET10",
  "⚡ Flash sale ends in 03:12:44 — up to 40% off selected audio",
];

function useRotatingDeal(active: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setI((v) => (v + 1) % DEALS.length), 3500);
    return () => clearInterval(t);
  }, [active]);
  return active ? DEALS[i] : DEALS[0];
}

export default function ShopPage({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const snap = useEngineState();
  const shop = useShopState();
  const focused = useFocusedTask();
  const autoplayOff = snap.active.motion_media?.disable_autoplay === true || snap.active.motion_media?.reduce_motion === true;
  const deal = useRotatingDeal(!autoplayOff);
  const stepsOn = snap.active.cognitive?.step_by_step === true;
  const [step, setStep] = useState(1);
  const [confirmSecond, setConfirmSecond] = useState(false);
  const confirmAll = snap.active.cognitive?.confirmation_level === "confirm-all";

  const stagedProduct = shop.staged ? findProduct(shop.staged.product_id) : null;
  const compareProducts = shop.compare.map((id) => findProduct(id)).filter(Boolean);
  const density = snap.active.cognitive?.information_density;
  const labelsOn = snap.active.cognitive?.persistent_labels === true;

  function stageAdd(id: string, qty = 1) {
    const staged = shopStore.stageAdd(id, qty);
    if (staged) activity.push("ui", `You clicked “Add to cart” — ${qty}× ${findProduct(id)?.name} staged for confirmation.`);
  }

  function confirmStaged() {
    if (confirmAll && !confirmSecond) {
      setConfirmSecond(true);
      return;
    }
    setConfirmSecond(false);
    shopStore.confirmStaged();
    activity.push("ui", "Cart change confirmed by you.");
  }

  return (
    <div id="main" tabIndex={-1}>
      {/* Deal ticker (autoplay media; stopped by disable_autoplay/motion) */}
      <div className="aia-ticker" aria-label="Store announcements" role="marquee">
        <div className="wrap">
          <span className="ticker-track" aria-hidden="true">{`${deal} · `.repeat(6)}</span>
          <span className="visually-hidden">{deal}</span>
        </div>
      </div>

      {/* Masthead */}
      <header className="masthead">
        <div className="wrap">
          <a className="brand" href="/" onClick={(e) => { e.preventDefault(); onNavigate("home"); }}>
            Hearth &amp; Signal <small>electronics</small>
          </a>
          <MainNav
            label="Shop main"
            items={[
              { label: "Deals", href: "#" },
              { label: "Audio", href: "#", onClick: () => shopStore.setCategory("Headphones") },
              { label: "Lighting", href: "#", onClick: () => shopStore.setCategory("Lighting") },
              { label: "Reading", href: "#", onClick: () => shopStore.setCategory("Reading") },
              { label: "Vision", href: "#", onClick: () => shopStore.setCategory("Vision") },
              { label: "Brands A–Z", href: "#" },
              { label: "Outlet", href: "#" },
              { label: "Gift ideas", href: "#" },
              { label: "Service", href: "#" },
              { label: "Magazine", href: "#" },
            ]}
          />
          <div className="utility-nav" data-aia="actions">
            <a href="#" onClick={(e) => e.preventDefault()}>
              🔍<span className="aia-label-always">Search</span>
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              ♥<span className="aia-label-always">Wishlist</span>
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              👤<span className="aia-label-always">Account</span>
            </a>
            <a href="#" data-testid="cart-button" onClick={(e) => e.preventDefault()}>
              🛒<span className="aia-label-always">Cart</span> ({shop.cart.length})
            </a>
          </div>
        </div>
      </header>

      {/* Promo banner */}
      <div className="aia-promo" data-aia-essential="false">
        <div className="wrap">
          <span className="deal-flash">⚡ {deal}</span>
          <span style={{ marginInlineStart: "auto" }}>
            Students save extra 5% · <a href="#" onClick={(e) => e.preventDefault()}>details</a>
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="wrap hero" aria-labelledby="hero-title">
        <div>
          <h1 id="hero-title">Sound you can measure. Service you can feel.</h1>
          <p className="lede">
            Independent comparisons, honest totals including shipping, and no dark patterns —
            this week: noise-cancelling headphones under €250.
          </p>
          <div className="price-row" data-aia="actions">
            <a className="btn btn--primary" href="#catalog">Shop the catalog</a>
            <a className="btn" href="#comparison">Compare picks</a>
          </div>
        </div>
        <div className="hero-art card" data-aia-essential="false">
          <Artwork id="headphones-1" title="Aurora H7 headphones" />
          <p className="autoplay-note">
            {autoplayOff ? "Autoplay stopped by your preferences — static view shown." : "Rotating deals every few seconds."}
          </p>
        </div>
      </section>

      {shop.staged && stagedProduct && (
        <div className="wrap" data-testid="staged-preview">
          <div className="card" style={{ padding: "0.8rem 1rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", borderColor: "var(--accent)" }}>
            <strong>Staged:</strong>
            <span>
              {shop.staged.qty}× {stagedProduct.name} — {money(shop.staged.total)} + shipping
            </span>
            <div className="panel-actions" style={{ marginInlineStart: "auto" }}>
              <button type="button" className="btn btn--small btn--primary" data-testid="confirm-staged" onClick={confirmStaged}>
                {confirmAll && !confirmSecond ? "Confirm add to cart" : confirmAll ? "Really confirm?" : "Confirm add to cart"}
              </button>
              <button type="button" className="btn btn--small" data-testid="cancel-staged" onClick={() => { shopStore.cancelStaged(); setConfirmSecond(false); activity.push("ui", "Staged cart change cancelled."); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {focused && (
        <div className="wrap" data-testid="focus-banner">
          <div className="card" style={{ padding: "0.7rem 1rem", borderColor: "var(--accent)", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <span data-aia="focus-note">
              Focused on task: <strong>{focused === "comparison" ? "compare products" : focused}</strong> — everything else is temporarily collapsed (nothing deleted).
            </span>
            <button type="button" className="btn btn--small" style={{ marginInlineStart: "auto" }} onClick={() => focusStore.set(null)}>
              Exit focus
            </button>
          </div>
        </div>
      )}

      {/* Catalog */}
      <main className="wrap catalog-layout" aria-labelledby="catalog-title" hidden={focused === "comparison"}>
        <aside className="filters" aria-labelledby="filters-title" data-aia-essential={density === "minimal" ? "false" : "true"}>
          <h2 id="filters-title" className="visually-hidden">Filters</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset>
              <legend>Category</legend>
              <label>
                <input type="radio" name="cat" checked={shop.category === null} onChange={() => shopStore.setCategory(null)} />
                All
              </label>
              {CATEGORIES.map((c) => (
                <label key={c}>
                  <input type="radio" name="cat" checked={shop.category === c} onChange={() => shopStore.setCategory(c)} />
                  {c}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Max price</legend>
              {[100, 150, 250, null].map((p) => (
                <label key={String(p)}>
                  <input
                    type="radio"
                    name="maxp"
                    checked={shop.max_price === p}
                    onChange={() => shopStore.setMaxPrice(p)}
                  />
                  {p === null ? "Any" : `up to €${p}`}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Highlights</legend>
              {["noise-cancelling", "wireless", "e-ink", "reading", "sport"].map((t) => (
                <label key={t}>
                  <input type="checkbox" checked={shop.tag === t} onChange={(e) => shopStore.setTag(e.target.checked ? t : null)} />
                  {t}
                </label>
              ))}
            </fieldset>
          </form>
        </aside>

        <section id="catalog" aria-labelledby="catalog-title">
          <div className="toolbar">
            <h2 id="catalog-title" style={{ margin: 0, fontSize: "1.3rem" }}>Catalog</h2>
            <span className="count">{PRODUCTS.length} products · free returns 30 days</span>
            <label className="visually-hidden" htmlFor="sort">Sort</label>
            <select id="sort" value={shop.sort} onChange={(e) => shopStore.setSort(e.target.value as never)}>
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <div className="product-grid" data-testid="product-grid">
            {PRODUCTS.map((p) => {
              const b = priceBreakdown(p, shop.active_coupon ? COUPONS.find((c) => c.code === shop.active_coupon) : undefined);
              const delta = p.original_price ? `−${Math.round((1 - p.price / p.original_price) * 100)}%` : undefined;
              return (
                <article className="card product-card" key={p.id} data-product={p.id} aria-label={p.name}>
                  <div className="art"><Artwork id={p.art} title={p.name} /></div>
                  <div className="badges" data-aia-essential="false">
                    {p.original_price && <span className="badge badge--deal">Deal −{Math.round((1 - p.price / p.original_price) * 100)}%</span>}
                    {p.stock === "low_stock" && <span className="badge badge--low">Last 3 pieces</span>}
                    <span className="badge badge--eco">Climate neutral</span>
                  </div>
                  <span className="cat">{p.category}</span>
                  <h3>{p.name}</h3>
                  <ReadingText original={p.description} plain={p.plain_description} keyPoints={p.key_points} />
                  <Price total={money(b.total)} old={p.original_price ? money(p.original_price) : undefined} delta={delta} />
                  <span className="ship-note">
                    {p.shipping === 0 ? "Free shipping" : `+ ${money(p.shipping)} shipping`} incl. VAT
                  </span>
                  <span className="rating">
                    <span className="stars" aria-hidden="true">★★★★★</span> {p.rating} ({p.reviews})
                  </span>
                  <StatusPill status={p.stock} label={p.stock === "in_stock" ? "In stock" : p.stock === "low_stock" ? "Low stock" : "Sold out"} />
                  <div data-aia="actions">
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "0.3em", fontSize: "0.8rem" }}>
                      <input
                        type="checkbox"
                        checked={shop.compare.includes(p.id)}
                        onChange={() => shopStore.toggleCompare(p.id)}
                        data-testid={`compare-${p.id}`}
                      />
                      Compare
                    </label>
                    <button type="button" className="btn btn--small btn--primary aia-icon-only" data-testid={`add-${p.id}`} onClick={() => stageAdd(p.id)} aria-label={`Add ${p.name} to cart`}>
                      🛒<span className="aia-label-always"> Add to cart</span>
                    </button>
                  </div>
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: "0.8rem" }}>Details</summary>
                    <dl style={{ fontSize: "0.78rem", margin: "0.3em 0 0" }}>
                      {Object.entries(p.specs).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "0.5em" }}>
                          <dt style={{ color: "var(--ink-soft)" }}>{k}</dt>
                          <dd style={{ margin: 0 }}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* Comparison */}
      <section
        id="comparison"
        className="wrap compare-section aia-step-panel"
        hidden={(stepsOn && step < 2) || (focused !== null && focused !== "comparison")}
        aria-labelledby="compare-title"
        data-testid="comparison"
      >
        <h2 id="compare-title">Side-by-side comparison</h2>
        {compareProducts.length < 2 ? (
          <p style={{ color: "var(--ink-soft)" }}>
            Select 2–4 products with the “Compare” checkbox to see differences in words, not colours.
          </p>
        ) : (
          <div className="compare-table">
            <table>
              <caption className="visually-hidden">Comparison of selected products</caption>
              <thead>
                <tr>
                  <th scope="col">Criterion</th>
                  {compareProducts.map((p) => <th scope="col" key={p!.id}>{p!.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Total incl. shipping</th>
                  {compareProducts.map((p) => {
                    const b = priceBreakdown(p!);
                    const min = Math.min(...compareProducts.map((q) => priceBreakdown(q!).total));
                    return (
                      <td key={p!.id} className={b.total === min ? "best-cell" : undefined} data-aia="price">
                        {money(b.total)}{b.total === min ? " (cheapest)" : ""}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th scope="row">Shipping</th>
                  {compareProducts.map((p) => {
                    const s = p!.shipping;
                    return <td key={p!.id}>{s === 0 ? "Free" : money(s)}</td>;
                  })}
                </tr>
                <tr>
                  <th scope="row">Rating</th>
                  {compareProducts.map((p) => <td key={p!.id}>{p!.rating} / 5</td>)}
                </tr>
                {Object.keys(compareProducts[0]!.specs).map((spec) => (
                  <tr key={spec}>
                    <th scope="row">{spec}</th>
                    {compareProducts.map((p) => <td key={p!.id}>{p!.specs[spec] ?? "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Coupons */}
      <section
        className="wrap aia-step-panel"
        hidden={(stepsOn && step < 3) || focused === "comparison"}
        aria-labelledby="coupons-title"
        data-testid="coupons"
      >
        <h2 id="coupons-title">Valid coupons</h2>
        <div className="coupon-strip">
          {COUPONS.map((c) => (
            <span key={c.code} className={`coupon-chip ${c.valid ? "" : "expired"}`}>
              <code>{c.code}</code> — {c.description}
              {c.valid && (
                <button
                  type="button"
                  className="btn btn--small"
                  style={{ marginInlineStart: "0.5em" }}
                  onClick={() => { shopStore.setActiveCoupon(c.code); activity.push("ui", `Coupon ${c.code} applied.`); }}
                >
                  Apply
                </button>
              )}
            </span>
          ))}
        </div>
        {stepsOn && step < 3 && (
          <button type="button" className="btn" onClick={() => setStep(3)}>
            Next: coupons (step 3 of 3)
          </button>
        )}
      </section>

      {stepsOn && (
        <section className="wrap" aria-label="Guided steps" style={{ paddingBlockEnd: "3rem" }}>
          <div className="progress-line">
            <span>Guided mode: step {Math.min(step + 1, 3)} of 3</span>
            <span className="bar" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1}>
              <span className="fill" style={{ width: `${(Math.min(step + 1, 3) / 3) * 100}%` }} />
            </span>
          </div>
          {step === 1 && (
            <button type="button" className="btn btn--primary" onClick={() => setStep(2)} data-testid="guide-next">
              Next: comparison (step 2 of 3)
            </button>
          )}
        </section>
      )}

      <footer className="site-footer">
        <div className="wrap cols">
          <div>
            <h3>Shop</h3>
            <a href="#" onClick={(e) => e.preventDefault()}>All products</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Deals</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Gift cards</a>
          </div>
          <div>
            <h3>Service</h3>
            <a href="#" onClick={(e) => e.preventDefault()}>Shipping &amp; returns</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Warranty</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Contact</a>
          </div>
          <div>
            <h3>Company</h3>
            <a href="#" onClick={(e) => e.preventDefault()}>About us</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Sustainability</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Press</a>
          </div>
          <div>
            <h3>Fine print</h3>
            <p style={{ fontSize: "0.72rem" }}>
              Synthetic demo shop for the As I Am WebMCP demo. No real products, no real purchases.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
