/** Hearth & Signal — dense, realistic electronics comparison shop. */

import { useEffect, useState } from "react";
import { Artwork } from "../components/Artwork";
import { IconSearch, IconHeart, IconUser, IconCart, IconSpark } from "../components/Icons";
import { MainNav, ReadingText } from "../components/SiteChrome";
import { Price, StatusPill, useEngineState } from "../components/Primitives";
import { CATEGORIES, money, priceBreakdown, findProduct, COUPONS } from "../data/products";
import {
  FOCUS_TASK_LABELS,
  filteredProducts,
  focusRegionForTask,
  focusStore,
  shopStore,
  useFocusedTask,
  useShopState,
} from "../data/shopState";
import { activity } from "../data/activityStore";
import type { Route } from "../App";

const DEALS = [
  "Deal of the day: Aurora H7 — 18% off, only until midnight",
  "Free shipping over €50 with code SHIPFREE",
  "Noise-cancelling week: extra 10% with QUIET10",
  "Flash sale ends in 03:12:44 — up to 40% off selected audio",
];

function useRotatingDeal(active: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setI((v) => (v + 1) % DEALS.length), 3500);
    return () => clearInterval(t);
  }, [active]);
  return DEALS[i];
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ));
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function ShopPage({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const snap = useEngineState();
  const shop = useShopState();
  const focused = useFocusedTask();
  const focusRegion = focusRegionForTask(focused);
  const shopFocus = focusRegion && ["catalog", "comparison", "cart", "coupons"].includes(focusRegion)
    ? focusRegion
    : null;
  const autoplayOff = snap.active.motion_media?.disable_autoplay === true || snap.active.motion_media?.reduce_motion === true;
  const systemReducedMotion = usePrefersReducedMotion();
  const [tickerManuallyPaused, setTickerManuallyPaused] = useState(false);
  const tickerMotionLocked = autoplayOff || systemReducedMotion;
  const tickerPaused = tickerMotionLocked || tickerManuallyPaused;
  const deal = useRotatingDeal(!tickerPaused);
  const stepsOn = snap.active.cognitive?.step_by_step === true;
  const [step, setStep] = useState(1);
  const [confirmSecond, setConfirmSecond] = useState(false);
  const confirmAll = snap.active.cognitive?.confirmation_level === "confirm-all";

  const stagedProduct = shop.staged ? findProduct(shop.staged.product_id) : null;
  const activeCoupon = shop.active_coupon ? COUPONS.find((coupon) => coupon.code === shop.active_coupon) : undefined;
  const stagedBreakdown = shop.staged && stagedProduct
    ? priceBreakdown(stagedProduct, activeCoupon, shop.staged.qty)
    : null;
  const cartLines = shop.cart.flatMap((item) => {
    const product = findProduct(item.product_id);
    return product ? [{ item, product, breakdown: priceBreakdown(product, activeCoupon, item.qty) }] : [];
  });
  const cartQuantity = shop.cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotals = cartLines.reduce(
    (totals, line) => ({
      items: totals.items + line.breakdown.item_price,
      shipping: totals.shipping + line.breakdown.shipping,
      fees: totals.fees + line.breakdown.fees,
      coupon: totals.coupon + line.breakdown.coupon_savings,
      total: totals.total + line.breakdown.total,
    }),
    { items: 0, shipping: 0, fees: 0, coupon: 0, total: 0 },
  );
  const compareProducts = shop.compare.map((id) => findProduct(id)).filter(Boolean);
  const visibleProducts = filteredProducts(shop);
  const density = snap.active.cognitive?.information_density;
  const hasFilters = Boolean(shop.query || shop.category || shop.max_price !== null || shop.tag || shop.sort !== "relevance");
  const showCatalog = shopFocus === null || shopFocus === "catalog" || focused === "add_to_cart";
  const showComparison = shopFocus === null || shopFocus === "comparison";
  const showCoupons = shopFocus === null || shopFocus === "coupons";
  const showCart = shopFocus === null || shopFocus === "cart" || shopFocus === "coupons";

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
      {/* Deal ticker: pause is always visible; OS and contract motion settings win. */}
      <section
        className={`aia-ticker${tickerPaused ? " is-paused" : ""}`}
        aria-labelledby="ticker-title"
        hidden={shopFocus !== null}
      >
        <h2 id="ticker-title" className="visually-hidden">Store announcements</h2>
        <div className="wrap">
          <button
            type="button"
            className="ticker-toggle"
            data-testid="ticker-toggle"
            aria-pressed={tickerPaused}
            disabled={tickerMotionLocked}
            onClick={() => setTickerManuallyPaused((paused) => !paused)}
          >
            {tickerMotionLocked ? "Paused by motion preference" : tickerManuallyPaused ? "Resume announcements" : "Pause announcements"}
          </button>
          <div className="ticker-viewport" aria-live="off">
            <span className="ticker-track" aria-hidden="true">{`${deal}  ·  `.repeat(6)}</span>
            <span className="visually-hidden">{deal}</span>
          </div>
        </div>
      </section>

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
            <a href="#shop-search" aria-label="Search products">
              <IconSearch size={16} /><span className="aia-label-always">Search</span>
            </a>
            <a href="#" aria-label="Wishlist" onClick={(e) => e.preventDefault()}>
              <IconHeart size={16} /><span className="aia-label-always">Wishlist</span>
            </a>
            <a href="#" aria-label="Account" onClick={(e) => e.preventDefault()}>
              <IconUser size={16} /><span className="aia-label-always">Account</span>
            </a>
            <a href={cartQuantity > 0 ? "#cart-preview" : "#catalog"} data-testid="cart-button" aria-label={`Cart, ${cartQuantity} ${cartQuantity === 1 ? "item" : "items"}`}>
              <IconCart size={16} /><span className="aia-label-always">Cart</span> ({cartQuantity})
            </a>
          </div>
        </div>
      </header>

      {/* Promo banner */}
      <div className="aia-promo" data-aia-essential="false" hidden={shopFocus !== null}>
        <div className="wrap">
          <span className="deal-flash" style={{ display: "inline-flex", alignItems: "center", gap: "0.4em" }}><IconSpark size={15} /> {deal}</span>
          <span style={{ marginInlineStart: "auto" }}>
            Students save extra 5% · <a href="#" onClick={(e) => e.preventDefault()}>details</a>
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="wrap hero" aria-labelledby="hero-title" hidden={shopFocus !== null}>
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
            {tickerPaused ? "Announcements are paused — a static view is shown." : "Announcements rotate every few seconds and can be paused above."}
          </p>
        </div>
      </section>

      {shop.staged && stagedProduct && stagedBreakdown && (
        <div className="wrap staged-cart" data-testid="staged-preview" aria-live="polite">
          <div className="card cart-confirmation">
            <div>
              <span className="cart-eyebrow">Waiting for your confirmation</span>
              <h2>Review this cart change</h2>
              <p>{shop.staged.qty}× {stagedProduct.name}</p>
              <dl className="price-breakdown" aria-label="Staged price breakdown">
                <div><dt>Items</dt><dd>{money(stagedBreakdown.item_price)}</dd></div>
                <div><dt>Shipping</dt><dd>{stagedBreakdown.shipping === 0 ? "Free" : money(stagedBreakdown.shipping)}</dd></div>
                <div><dt>Handling fee</dt><dd>{stagedBreakdown.fees === 0 ? "None" : money(stagedBreakdown.fees)}</dd></div>
                <div><dt>Coupon{stagedBreakdown.coupon_code ? ` (${stagedBreakdown.coupon_code})` : ""}</dt><dd>{stagedBreakdown.coupon_savings > 0 ? `−${money(stagedBreakdown.coupon_savings)}` : "None"}</dd></div>
                <div className="price-breakdown__total"><dt>Total</dt><dd data-aia="price">{money(stagedBreakdown.total)}</dd></div>
              </dl>
            </div>
            <div className="panel-actions cart-confirmation__actions">
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

      {focused && shopFocus && (
        <div className="wrap" data-testid="focus-banner">
          <div className="card focus-banner">
            <span data-aia="focus-note">
              Focused on task: <strong>{FOCUS_TASK_LABELS[focused]}</strong> — unrelated sections are temporarily collapsed, never deleted.
            </span>
            <button type="button" className="btn btn--small" onClick={() => focusStore.set(null)}>
              Exit focus
            </button>
          </div>
        </div>
      )}

      {/* Catalog */}
      <main className="wrap catalog-layout" aria-labelledby="catalog-title" hidden={!showCatalog}>
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
            <output className="count" data-testid="product-count" aria-live="polite">
              {visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"} shown · free returns 30 days
            </output>
            <form className="catalog-search" role="search" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="shop-search">Search</label>
              <input
                id="shop-search"
                type="search"
                value={shop.query}
                placeholder="Name, category or feature"
                onChange={(event) => shopStore.setQuery(event.target.value)}
              />
            </form>
            {hasFilters && (
              <button type="button" className="btn btn--small" onClick={() => shopStore.clearFilters()}>
                Clear filters
              </button>
            )}
            <label htmlFor="sort">Sort</label>
            <select id="sort" value={shop.sort} onChange={(e) => shopStore.setSort(e.target.value as never)}>
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <div className="product-grid" data-testid="product-grid">
            {visibleProducts.map((p) => {
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
                      <IconCart size={15} /><span className="aia-label-always"> Add to cart</span>
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
            {visibleProducts.length === 0 && (
              <div className="card empty-catalog" role="status">
                <h3>No matching products</h3>
                <p>Try a different search or clear the current filters. Nothing has been removed from the catalog.</p>
                <button type="button" className="btn" onClick={() => shopStore.clearFilters()}>Show all products</button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Comparison */}
      <section
        id="comparison"
        className="wrap compare-section aia-step-panel"
        hidden={!showComparison || (stepsOn && step < 2 && shopFocus !== "comparison")}
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
        hidden={!showCoupons || (stepsOn && step < 3 && shopFocus !== "coupons")}
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
                  aria-pressed={shop.active_coupon === c.code}
                  onClick={() => { shopStore.setActiveCoupon(c.code); activity.push("ui", `Coupon ${c.code} applied.`); }}
                >
                  {shop.active_coupon === c.code ? "Applied" : "Apply"}
                </button>
              )}
            </span>
          ))}
        </div>
      </section>

      {(shop.cart.length > 0 || shopFocus === "cart" || shopFocus === "coupons") && (
        <section
          id="cart-preview"
          className="wrap cart-preview"
          aria-labelledby="cart-preview-title"
          data-testid="cart-preview"
          hidden={!showCart}
        >
          <div className="cart-preview__heading">
            <div>
              <span className="cart-eyebrow">Transparent cart simulation</span>
              <h2 id="cart-preview-title">Cart preview</h2>
            </div>
            {shop.cart.length > 0 && (
              <button
                type="button"
                className="btn btn--small"
                onClick={() => {
                  const removed = shopStore.undoLastCartChange();
                  activity.push("ui", removed ? `Undid ${removed.qty}× ${findProduct(removed.product_id)?.name ?? "item"}.` : "Nothing to undo in the cart.");
                }}
              >
                Undo last cart change
              </button>
            )}
          </div>

          {cartLines.length === 0 ? (
            <div className="card empty-cart" role="status">
              <h3>Your cart is empty</h3>
              <p>Choose a product above. Every change is staged for your confirmation before it appears here.</p>
            </div>
          ) : (
            <div className="cart-preview__layout">
              <div className="cart-lines">
                {cartLines.map(({ item, product, breakdown }) => (
                  <article className="card cart-line" key={product.id}>
                    <div>
                      <span className="cart-eyebrow">{product.category}</span>
                      <h3>{product.name}</h3>
                      <p data-testid={`cart-qty-${product.id}`}>{item.qty} × {money(product.price)}</p>
                    </div>
                    <dl className="price-breakdown" aria-label={`${product.name} price breakdown`}>
                      <div><dt>Items</dt><dd>{money(breakdown.item_price)}</dd></div>
                      <div><dt>Shipping</dt><dd>{breakdown.shipping === 0 ? "Free" : money(breakdown.shipping)}</dd></div>
                      <div><dt>Handling fee</dt><dd>{breakdown.fees === 0 ? "None" : money(breakdown.fees)}</dd></div>
                      <div><dt>Coupon{breakdown.coupon_code ? ` (${breakdown.coupon_code})` : ""}</dt><dd>{breakdown.coupon_savings > 0 ? `−${money(breakdown.coupon_savings)}` : "None"}</dd></div>
                      <div className="price-breakdown__total"><dt>Line total</dt><dd data-aia="price">{money(breakdown.total)}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
              <aside className="card cart-summary" aria-label="Cart total">
                <h3>Complete total</h3>
                <dl className="price-breakdown">
                  <div><dt>Items</dt><dd>{money(cartTotals.items)}</dd></div>
                  <div><dt>Shipping</dt><dd>{cartTotals.shipping === 0 ? "Free" : money(cartTotals.shipping)}</dd></div>
                  <div><dt>Handling fees</dt><dd>{cartTotals.fees === 0 ? "None" : money(cartTotals.fees)}</dd></div>
                  <div><dt>Coupon{shop.active_coupon ? ` (${shop.active_coupon})` : ""}</dt><dd>{cartTotals.coupon > 0 ? `−${money(cartTotals.coupon)}` : "None"}</dd></div>
                  <div className="price-breakdown__total"><dt>Grand total</dt><dd data-aia="price" data-testid="cart-grand-total">{money(cartTotals.total)}</dd></div>
                </dl>
                {shop.active_coupon && cartTotals.coupon === 0 && (
                  <p className="coupon-note">Coupon {shop.active_coupon} is active but does not apply to the current cart.</p>
                )}
                <p className="cart-safety">Demo only. No checkout exists and no payment can be made.</p>
              </aside>
            </div>
          )}
        </section>
      )}

      {stepsOn && (
        <section className="wrap guided-shop" aria-label="Guided shop steps" hidden={shopFocus !== null}>
          <div className="progress-line">
            <span data-testid="guide-progress">Guided mode: step {step} of 3</span>
            <span className="bar" role="progressbar" aria-label="Guided shop progress" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step}>
              <span className="fill" style={{ width: `${(step / 3) * 100}%` }} />
            </span>
          </div>
          <p>
            {step === 1 && "Step 1: search, filter and select products."}
            {step === 2 && "Step 2: compare the selected products side by side."}
            {step === 3 && "Step 3: review only valid coupon codes and your complete cart total."}
          </p>
          <div data-aia="actions">
            {step > 1 && (
              <button type="button" className="btn" onClick={() => setStep((current) => current - 1)}>
                Back to step {step - 1}
              </button>
            )}
            {step < 3 ? (
              <button type="button" className="btn btn--primary" onClick={() => setStep((current) => current + 1)} data-testid="guide-next">
                {step === 1 ? "Next: comparison (step 2 of 3)" : "Next: coupons (step 3 of 3)"}
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => setStep(1)}>
                Start guided flow again
              </button>
            )}
          </div>
        </section>
      )}

      <footer className="site-footer" hidden={shopFocus !== null}>
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
