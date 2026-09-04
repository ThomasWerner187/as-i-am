/**
 * Synthetic product catalog for the demo shop. All data is fictional.
 * Prices include the raw components needed for explain_price and
 * calculate_total_cost: original price, discount, shipping, fees, coupons.
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  /** Short marketing description (original voice). */
  description: string;
  /** Plain-language version used by reading mode. */
  plain_description: string;
  /** Three key points for key_points reading mode. */
  key_points: string[];
  price: number;
  original_price?: number;
  shipping: number;
  fee?: number;
  rating: number;
  reviews: number;
  stock: "in_stock" | "low_stock" | "out_of_stock";
  color: string;
  tags: string[];
  /** SVG illustration reference (inline component id). */
  art: string;
  specs: Record<string, string>;
}

export interface Coupon {
  code: string;
  description: string;
  kind: "percent" | "fixed" | "shipping";
  value: number;
  min_cart?: number;
  applies_to_category?: string;
  expires: string;
  valid: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: "aurora-anc",
    name: "Aurora H7 Wireless Headphones",
    category: "Headphones",
    description:
      "Flagship hybrid active noise cancellation with adaptive transparency, 40h battery and memory-foam earcups.",
    plain_description:
      "Big over-ear headphones. They lower outside noise. The battery lasts 40 hours. The ear cushions are soft.",
    key_points: [
      "Strong noise cancellation",
      "40 hours of battery",
      "Very comfortable ear cushions",
    ],
    price: 229.0,
    original_price: 279.0,
    shipping: 4.95,
    rating: 4.6,
    reviews: 1284,
    stock: "in_stock",
    color: "#3d5a80",
    tags: ["noise-cancelling", "wireless", "over-ear"],
    art: "headphones-1",
    specs: { Weight: "268 g", Battery: "40 h", "Noise cancelling": "Hybrid ANC", Bluetooth: "5.3", Codecs: "aptX, AAC" },
  },
  {
    id: "northline-q2",
    name: "Northline QuietPro 2",
    category: "Headphones",
    description:
      "Travel-focused ANC headphones with 45h battery, foldable hinge and multipoint pairing for two devices.",
    plain_description:
      "Foldable travel headphones. They lower outside noise. They work with two devices at the same time.",
    key_points: ["Foldable for travel", "Pairs with two devices", "45 hours of battery"],
    price: 199.0,
    original_price: 249.0,
    shipping: 0,
    fee: 2.0,
    rating: 4.4,
    reviews: 903,
    stock: "in_stock",
    color: "#6b4f3a",
    tags: ["noise-cancelling", "wireless", "travel"],
    art: "headphones-2",
    specs: { Weight: "255 g", Battery: "45 h", "Noise cancelling": "ANC 2.0", Bluetooth: "5.2", Codecs: "AAC, SBC" },
  },
  {
    id: "vellum-studio",
    name: "Vellum Studio Monitor Buds",
    category: "Headphones",
    description:
      "In-ear monitors with triple drivers, -32dB isolation and an audiophile-tuned signature. Cable or wireless.",
    plain_description:
      "Small in-ear headphones with very good sound. You can use a cable or wireless.",
    key_points: ["Very detailed sound", "Blocks noise passively", "Works with or without cable"],
    price: 179.0,
    shipping: 4.95,
    rating: 4.7,
    reviews: 512,
    stock: "low_stock",
    color: "#5a7247",
    tags: ["in-ear", "audiophile", "wired-or-wireless"],
    art: "earbuds-1",
    specs: { Weight: "48 g", Battery: "12 h (buds)", Isolation: "-32 dB passive", Cable: "2 m detachable", Case: "Included" },
  },
  {
    id: "cascade-air",
    name: "Cascade Air Lite",
    category: "Headphones",
    description:
      "Featherweight open-ear buds for running, with sweat resistance and a transparency-first sound profile.",
    plain_description:
      "Small sports headphones that do not cover your ears. Good for running. They resist sweat.",
    key_points: ["Very light", "You stay aware of traffic", "Sweat resistant"],
    price: 89.0,
    original_price: 119.0,
    shipping: 4.95,
    rating: 4.1,
    reviews: 2210,
    stock: "in_stock",
    color: "#b5654a",
    tags: ["open-ear", "sport", "wireless"],
    art: "earbuds-2",
    specs: { Weight: "9 g", Battery: "8 h", Water: "IPX5", Bluetooth: "5.3", Charging: "USB-C" },
  },
  {
    id: "meridian-desk",
    name: "Meridian Desk Lamp Halo",
    category: "Lighting",
    description:
      "Flicker-free desk lamp with tunable white 2700–6500K, ambient sensor and matte anti-glare diffuser.",
    plain_description:
      "A desk lamp. The light does not flicker. You can make it warmer or colder. It does not dazzle you.",
    key_points: ["No flicker", "Warm to cool white", "Anti-glare diffuser"],
    price: 129.0,
    shipping: 6.95,
    rating: 4.5,
    reviews: 340,
    stock: "in_stock",
    color: "#8a6d3b",
    tags: ["desk", "eye-comfort"],
    art: "lamp",
    specs: { Power: "12 W", Color: "2700–6500 K", CRI: "> 95", Sensor: "Ambient", Finish: "Matte" },
  },
  {
    id: "orbital-clock",
    name: "Orbital Sunrise Alarm",
    category: "Sleep",
    description:
      "Wake-up light with gradual sunrise simulation, red night mode and vibration-free chime.",
    plain_description:
      "An alarm clock. It gets slowly bright like a sunrise. At night it shows dim red light.",
    key_points: ["Gentle sunrise wake-up", "Dim red night light", "Quiet chime"],
    price: 74.0,
    original_price: 89.0,
    shipping: 4.95,
    rating: 4.2,
    reviews: 780,
    stock: "in_stock",
    color: "#a1824a",
    tags: ["alarm", "sunrise"],
    art: "clock",
    specs: { Light: "20 lux sunrise", Modes: "Sunrise, sunset, night", Sound: "Chime, radio", Power: "Mains", Backup: "Battery" },
  },
  {
    id: "quill-eink",
    name: "Quill 7 E-Ink Reader",
    category: "Reading",
    description:
      "7-inch e-ink reader with warm front-light, physical page buttons and months of battery life.",
    plain_description:
      "An e-book reader. The screen looks like paper. You can adjust the light. The battery lasts months.",
    key_points: ["Paper-like screen", "Physical page buttons", "Months of battery"],
    price: 149.0,
    shipping: 0,
    rating: 4.8,
    reviews: 1560,
    stock: "in_stock",
    color: "#4a4a52",
    tags: ["e-ink", "reading"],
    art: "reader",
    specs: { Screen: "7\" E-Ink", Light: "Warm front-light", Battery: "10 weeks", Storage: "32 GB", Buttons: "2 page buttons" },
  },
  {
    id: "atlas-magnifier",
    name: "Atlas Fold Magnifier Lamp",
    category: "Vision",
    description:
      "Foldable 3× magnifier with integrated even-diffuse LED ring for reading printed text comfortably.",
    plain_description:
      "A foldable magnifier with light. It makes small print three times bigger. Good for reading.",
    key_points: ["3× magnification", "Even LED light", "Folds flat"],
    price: 59.0,
    original_price: 79.0,
    shipping: 4.95,
    rating: 4.3,
    reviews: 210,
    stock: "low_stock",
    color: "#7a6c5d",
    tags: ["magnifier", "vision", "reading"],
    art: "magnifier",
    specs: { Magnification: "3×", Light: "LED ring", Power: "USB-C", Fold: "Flat", Lens: "110 mm" },
  },
];

export const COUPONS: Coupon[] = [
  {
    code: "QUIET10",
    description: "10% off noise-cancelling headphones",
    kind: "percent",
    value: 10,
    applies_to_category: "Headphones",
    expires: "2026-12-31",
    valid: true,
  },
  {
    code: "SHIPFREE",
    description: "Free shipping on any order",
    kind: "shipping",
    value: 0,
    min_cart: 50,
    expires: "2026-10-31",
    valid: true,
  },
  {
    code: "WELCOME5",
    description: "€5 off orders over €40",
    kind: "fixed",
    value: 5,
    min_cart: 40,
    expires: "2027-01-31",
    valid: true,
  },
  {
    code: "SUMMER25",
    description: "Expired summer promotion",
    kind: "percent",
    value: 25,
    expires: "2026-07-31",
    valid: false,
  },
];

export const CATEGORIES = ["Headphones", "Lighting", "Sleep", "Reading", "Vision"];

export function money(n: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);
}

export interface PriceBreakdown {
  item_price: number;
  original_price: number | null;
  discount: number;
  shipping: number;
  fees: number;
  coupon_code: string | null;
  coupon_savings: number;
  total: number;
}

/** Deterministic price math — the single source of truth for all tools. */
export function priceBreakdown(
  product: Product,
  coupon?: Coupon | null,
  quantity = 1,
): PriceBreakdown {
  const item = product.price * quantity;
  const original = product.original_price ? product.original_price * quantity : null;
  const discount = original ? Math.round((original - item) * 100) / 100 : 0;
  const shipping = product.shipping;
  const fees = product.fee ?? 0;
  let couponSavings = 0;
  if (coupon && coupon.valid) {
    if (coupon.kind === "percent" && (!coupon.applies_to_category || product.category === coupon.applies_to_category)) {
      couponSavings = Math.round(item * (coupon.value / 100) * 100) / 100;
    } else if (coupon.kind === "fixed" && (!coupon.min_cart || item >= coupon.min_cart)) {
      couponSavings = coupon.value;
    } else if (coupon.kind === "shipping" && shipping > 0 && (!coupon.min_cart || item >= coupon.min_cart)) {
      couponSavings = shipping;
    }
  }
  const total = Math.round((item + shipping + fees - couponSavings) * 100) / 100;
  return {
    item_price: item,
    original_price: original,
    discount,
    shipping,
    fees,
    coupon_code: couponSavings > 0 ? (coupon?.code ?? null) : null,
    coupon_savings: couponSavings,
    total,
  };
}

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function findCoupon(code: string): Coupon | undefined {
  return COUPONS.find((c) => c.code.toLowerCase() === code.toLowerCase());
}
