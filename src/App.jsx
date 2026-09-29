import { useEffect, useRef, useState } from "react";
import "./App.css";
import businessConfig from "../shared/business.json";
import productAvailability from "../shared/productAvailability.json";

const phone = "919639630828";
const upiId = "9993265857@ybl";
const API_URL = "https://satvapusti-website.onrender.com";

const navItems = [
  { view: "home", label: "Home" },
  { view: "shop", label: "Shop" },
  { view: "about", label: "About Us" },
  { view: "ingredients", label: "Ingredients" },
  { view: "contact", label: "Contact" },
];

// Storefront pages live inside App (so the cart survives navigation) and are
// addressed as /?page=<view>. Admin and Track Order stay routed by main.jsx.
const STOREFRONT_VIEWS = new Set(["home", "shop", "product", "about", "ingredients", "contact"]);
// Links from the previous one-page layout keep working.
const LEGACY_HASH_VIEWS = {
  top: "home",
  products: "shop",
  about: "about",
  ingredients: "ingredients",
  contact: "contact",
  faq: "contact",
};
const PAGE_TITLES = {
  home: "SatvaPusti Nutrition | Premium Family Wellness Powder",
  shop: "Shop | SatvaPusti Nutrition",
  about: "About Us | SatvaPusti Nutrition",
  ingredients: "Ingredients | SatvaPusti Nutrition",
  contact: "Contact | SatvaPusti Nutrition",
};

const viewUrl = (view, productId = "") => {
  if (view === "home") return "/";
  return `/?page=${view}${productId ? `&id=${encodeURIComponent(productId)}` : ""}`;
};

const readRoute = () => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");
  if (STOREFRONT_VIEWS.has(page)) return { view: page, productId: params.get("id") || "" };
  return { view: LEGACY_HASH_VIEWS[window.location.hash.replace("#", "")] || "home", productId: "" };
};

const PRODUCT_CATEGORIES = {
  family: "Family Nutrition",
  kids: "Kids Nutrition",
  active: "Fitness Nutrition",
};
const categoryOf = (product) => PRODUCT_CATEGORIES[product.id] || product.theme || "Nutrition";

const defaultProducts = [
  {
    id: "family",
    name: "SatvaPusti Family Nutrition Formula",
    theme: "Family Wellness",
    subtitle: "Everyday Nutrition Powder with Nuts & Seeds",
    desc: "An everyday family blend of 12 recognisable ingredients, including badam, kaju, akhrot, makhana, seeds and banana powder, sweetened with traditional mishri.",
    bestFor: ["Real Nuts & Seeds", "12 Recognisable Ingredients", "Everyday Family Routine"],
    accent: {
      primary: "#178a52",
      secondary: "#0f6f45",
      soft: "#eaf8ef",
      warm: "#d67a15",
      text: "#06411f",
    },
    badges: [
      { label: "No Artificial Colours", color: "#178a52" },
      { label: "No Preservatives", color: "#0f6f45" },
    ],
    benefits: [
      "Family Wellness Support",
      "Real Dry Fruits & Seeds",
      "Daily Energy & Stamina",
      "Brain & Focus Support",
      "Immunity Support",
      "No Artificial Colours",
    ],
    ingredients: [
      "Roasted Chana",
      "Roasted Peanut",
      "Kaju",
      "Badam",
      "Akhrot",
      "Makhana",
      "Banana Powder",
      "Traditional Mishri",
      "Pumpkin Seeds",
      "Watermelon Seeds",
      "Saunf",
      "Elaichi",
    ],
    usage: "Mix 2 spoons with 200 ml milk or warm water and consume daily.",
    nutrition: [
      ["Energy", "513.56 kcal / 100g"],
      ["Protein", "17.75 g / 100g"],
      ["Total Carbohydrates", "58.92 g / 100g"],
      ["Total Fat", "27.68 g / 100g"],
      ["Dietary Fiber", "8.27 g / 100g"],
      ["Total Sugars", "12.36 g / 100g"],
      ["Added Sugars", "10.12 g / 100g"],
      ["Sodium", "27.42 mg / 100g"],
      ["Saturated Fat", "4.68 g / 100g"],
      ["Trans Fat", "Not detected"],
      ["Cholesterol", "Below quantification limit"],
    ],
    images: {
      "1KG": "/products/family-1kg.webp",
      "500G": "/products/family-500g.webp",
      "250G": "/products/family-250g.webp",
    },
    prices: {
      "1KG": {
        mrp: 1999, offer: 1799, mrpPaise: 199900, sellingPricePaise: 179900,
        gstRateBasisPoints: 500, taxInclusive: true, hsnCode: "1106",
        discountLabel: "10% OFF", packSize: "1 Kg",
      },
      "500G": { mrp: 1099, offer: 999 },
      "250G": { mrp: 599, offer: 499 },
    },
  },
  {
    id: "kids",
    name: "SatvaPusti+ Active Kids",
    theme: "Growing Champions",
    subtitle: "Cocoa, Nuts & Seeds Blend for Kids",
    desc: "A kids' blend of badam, kaju, akhrot, makhana and seeds with cocoa powder, banana powder, ragi and roasted chana, sweetened with dates powder.",
    bestFor: ["Cocoa + Nuts & Seeds", "With Ragi & Roasted Chana", "Adjustable Serve"],
    accent: {
      primary: "#e0a713",
      secondary: "#f28c18",
      soft: "#fff4dc",
      warm: "#ffbd2e",
      text: "#7a3f00",
    },
    badges: [
      { label: "Sweetened with Dates Powder", color: "#e0a713" },
    ],
    benefits: [
      "Brain Development Support",
      "Growth & Bone Support",
      "Real Banana Nutrition",
      "Immunity Support",
      "School & Play Energy",
      "No Artificial Colours",
    ],
    ingredients: [
      "Roasted Chana",
      "Roasted Peanut",
      "Kaju",
      "Badam",
      "Akhrot",
      "Makhana",
      "Banana Powder",
      "Dates Powder",
      "Pumpkin Seeds",
      "Watermelon Seeds",
      "Saunf",
      "Elaichi",
      "Cocoa Powder",
      "Ragi",
      "No Added Sugar",
    ],
    usage: "Mix 1-2 spoons with milk daily. Adjust quantity based on age and appetite.",
    nutrition: [
      ["Energy", "Approx. 513.56 kcal / 100g"],
      ["Protein", "Approx. 17.75 g / 100g"],
      ["Total Carbohydrates", "Approx. 58.92 g / 100g"],
      ["Total Fat", "Approx. 27.68 g / 100g"],
      ["Dietary Fiber", "Approx. 8.27 g / 100g"],
      ["Total Sugars", "From ingredients"],
      ["Added Sugar", "0 g"],
      ["Sweetener", "Dates powder"],
      ["Sodium", "Approx. 27.42 mg / 100g"],
      ["Trans Fat", "Not detected"],
    ],
    images: {
      "1KG": "/products/active-kids-1kg.webp",
      "500G": "/products/active-kids-500g.webp",
      "250G": "/products/active-kids-250g.webp",
    },
    prices: {
      "1KG": { mrp: 2099, offer: 1999 },
      "500G": { mrp: 1199, offer: 1099 },
      "250G": { mrp: 649, offer: 549 },
    },
  },
  {
    id: "active",
    name: "SatvaPusti+ Active",
    theme: "Fitness & Recovery",
    subtitle: "Soy Protein, Nuts & Seeds Blend",
    desc: "A soy protein blend with badam, kaju, akhrot, peanut, makhana and seeds, sweetened with dates powder, listed at 30 g protein per 100 g.",
    bestFor: ["Soy Protein Blend", "Nuts & Seeds", "30 g Protein / 100 g"],
    accent: {
      primary: "#0f4f3f",
      secondary: "#c99a2e",
      soft: "#eef7ef",
      warm: "#d7a438",
      text: "#07372d",
    },
    badges: [
      { label: "No Refined Sugar", color: "#c99a2e" },
    ],
    benefits: [
      "Protein Rich Blend",
      "Workout Recovery",
      "Performance Support",
      "Premium Nut & Seed Formula",
      "No Refined Sugar",
      "Naturally Sweetened",
    ],
    ingredients: [
      "Roasted Chana",
      "Roasted Peanut",
      "Kaju",
      "Badam",
      "Akhrot",
      "Makhana",
      "Soy Protein",
      "Banana Powder",
      "Pumpkin Seeds",
      "Watermelon Seeds",
      "Saunf",
      "Elaichi",
      "Cocoa Powder",
      "Ragi",
      "Dates Powder",
      "No Added Sugar",
    ],
    usage: "Mix 2 spoons with 200 ml milk or water daily. Use after workouts or as part of your morning routine.",
    nutrition: [
      ["Energy", "Approx. 513.56 kcal / 100g"],
      ["Protein", "30 g / 100g"],
      ["Total Carbohydrates", "Approx. 58.92 g / 100g"],
      ["Total Fat", "Approx. 27.68 g / 100g"],
      ["Dietary Fiber", "Approx. 8.27 g / 100g"],
      ["Total Sugars", "From ingredients"],
      ["Added Sugar", "0 g"],
      ["Sweetener", "Dates powder"],
      ["Sodium", "Approx. 27.42 mg / 100g"],
      ["Trans Fat", "Not detected"],
    ],
    images: {
      "1KG": "/products/active-1kg.webp",
      "500G": "/products/active-500g.webp",
      "250G": "/products/active-250g.webp",
    },
    prices: {
      "1KG": { mrp: 2299, offer: 2099 },
      "500G": { mrp: 1249, offer: 1199 },
      "250G": { mrp: 699, offer: 599 },
    },
  },
];

// Product-page USPs: a relatable customer problem, then the SatvaPusti answer. Every line
// restates a fact from that product's own ingredients, usage, nutrition or pack claims above.
const PRODUCT_USPS = {
  family: [
    { problem: "Dry fruits often get skipped?", title: "Dry Fruits & Seeds, Made Easier", text: "Badam, kaju, akhrot, makhana, pumpkin and watermelon seeds in one blend." },
    { problem: "Hard-to-read labels?", title: "12 Ingredients You Can Recognise", text: "From roasted chana and peanut to banana powder, saunf and elaichi." },
    { problem: "Wary of additives?", title: "No Artificial Colours or Preservatives", text: "As stated on the pack, sweetened with traditional mishri." },
    { problem: "Short on time?", title: "Two Spoons, One Glass", text: "Mix into 200\u00a0ml milk or warm water and enjoy daily." },
    { problem: "Separate products for everyone?", title: "One Family Formula to Share", text: "Made for the whole family's routine, alongside regular meals." },
    { problem: "Want to know what's inside?", title: "Every Nutrition Value Listed", text: "Including 17.75\u00a0g protein and 8.27\u00a0g fibre per 100\u00a0g." },
  ],
  kids: [
    { problem: "Kids skip nuts and seeds?", title: "Nuts & Seeds in a Cocoa Blend", text: "Badam, kaju, akhrot and seeds with cocoa and banana powder." },
    { problem: "Watching the sweetness?", title: "Sweetened with Dates Powder", text: "Dates powder is the listed sweetener in this formula." },
    { problem: "Every child eats differently?", title: "A Serve You Can Adjust", text: "Mix 1–2 spoons with milk, adjusted to age and appetite." },
    { problem: "Prefer traditional staples?", title: "With Ragi & Roasted Chana", text: "Ragi and roasted chana, blended in alongside the nuts and seeds." },
  ],
  active: [
    { problem: "Want protein from familiar foods?", title: "Soy Protein with Nuts & Seeds", text: "Blended with badam, kaju, akhrot, peanut and makhana." },
    { problem: "Counting your protein?", title: "30\u00a0g Protein per 100\u00a0g", text: "As listed in this formula's nutrition facts." },
    { problem: "Avoiding refined sugar?", title: "Sweetened with Dates Powder", text: "No refined sugar; dates powder is the listed sweetener." },
    { problem: "Fitting it into training days?", title: "Post-Workout or Morning Routine", text: "Mix 2 spoons into 200\u00a0ml milk or water." },
  ],
};

// Label facts that conflict with the pack artwork stay in the data but are not shown until
// confirmed: the Active Kids pack panel prints "Added Sugars 4.00 g" against 0 g here.
const UNCONFIRMED_NUTRITION_ROWS = { kids: ["Added Sugar"] };
// A sugar claim, not an ingredient, so it is not listed as one.
const isIngredient = (item) => !/^no added sugar$/i.test(String(item).trim());

const defaultProductById = Object.fromEntries(
  defaultProducts.map((product) => [product.id, product])
);

// Shown on the storefront with full details, but not yet purchasable.
// The same list is enforced by the backend on order creation.
const COMING_SOON_PRODUCT_IDS = new Set(productAvailability.comingSoonProductIds);
const isComingSoon = (productId) => COMING_SOON_PRODUCT_IDS.has(productId);
const COMING_SOON_MESSAGE = productAvailability.comingSoonMessage;

// Razorpay Standard Checkout, loaded only when a customer pays online.
const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayCheckoutPromise = null;
const loadRazorpayCheckout = () => {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!razorpayCheckoutPromise) {
    razorpayCheckoutPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_CHECKOUT_URL;
      script.async = true;
      script.onload = () => (window.Razorpay
        ? resolve(window.Razorpay)
        : reject(new Error("Online payment could not be loaded. Please try again.")));
      script.onerror = () => {
        razorpayCheckoutPromise = null;
        script.remove();
        reject(new Error("Online payment could not be loaded. Please check your connection and try again."));
      };
      document.body.appendChild(script);
    });
  }
  return razorpayCheckoutPromise;
};

const ingredients = [
  ["roasted-chana.webp", "Roasted Chana"],
  ["peanut.webp", "Peanut"],
  ["almond.webp", "Almond"],
  ["cashew.webp", "Cashew"],
  ["walnut.webp", "Walnut"],
  ["makhana.webp", "Makhana"],
  ["pumpkin-seed.webp", "Pumpkin Seed"],
  ["watermelon-seed.webp", "Watermelon Seed"],
  ["banana-power.webp", "Banana Powder"],
  ["dhaga-mishri.webp", "Dhaga Mishri"],
  ["saunf.webp", "Saunf (Fennel Seeds)"],
  ["elaichi.webp", "Elaichi (Cardamom)"],
  ["cocoa-powder.webp", "Cocoa Powder"],
  ["date-powder.webp", "Date Powder"],
  ["soy-protein.webp", "Soy Protein"],
  ["ragi.webp", "Ragi"],
];

// Ingredient cards use 4:3 crops of the photographed ingredient, cut from the
// lossless originals (public/ingridients/cards/<name>-<width>.webp). The large
// size is 720px wide unless the original's photo area is smaller.
const INGREDIENT_CARD_LARGE_WIDTH = {
  "cocoa-powder": 685,
  "date-powder": 699,
  ragi: 494,
  "soy-protein": 699,
};
const INGREDIENT_CARD_SIZES = "(min-width: 1200px) 170px, (min-width: 769px) 24vw, 48vw";
const ingredientCardImage = (img) => {
  const base = img.replace(/\.webp$/, "");
  const large = INGREDIENT_CARD_LARGE_WIDTH[base] || 720;
  return {
    src: `/ingridients/cards/${base}-360.webp`,
    srcSet: `/ingridients/cards/${base}-360.webp 360w, /ingridients/cards/${base}-${large}.webp ${large}w`,
  };
};

// One line-icon set (24px grid, 1.6 stroke) used across the storefront.
const iconPaths = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1-3.8 4-5.5 7.5-5.5s6.5 1.7 7.5 5.5" /></>,
  bag: <><path d="M5 8h14l-1 12.5H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  leaf: <><path d="M5 19c0-8 5.5-13 14-14-.5 8.5-5.5 14-14 14Z" /><path d="m5 19 8-8" /></>,
  family: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><circle cx="17" cy="9.5" r="2.3" /><path d="M15.8 14.2c2.4-.2 4.2 1.3 4.7 4.3" /></>,
  award: <><circle cx="12" cy="9" r="5.5" /><path d="m9.8 9 1.6 1.6 2.9-3" /><path d="m8.5 13.8-1.5 6.7 5-2.5 5 2.5-1.5-6.7" /></>,
  noColour: <><path d="M12 3.5s-5.5 6-5.5 10a5.5 5.5 0 0 0 11 0c0-4-5.5-10-5.5-10Z" /><path d="m4 4 16 16" /></>,
  noPreservative: <><rect x="6" y="7.5" width="12" height="13" rx="2.5" /><path d="M8 3.5h8v4H8z" /><path d="m4 4 16 16" /></>,
  seed: <><path d="M12 3c3.5 3 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 1.5-7 5-10Z" /><path d="M12 8v9" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  flask: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" /><path d="M7.5 15h9" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  cash: <><rect x="3" y="6.5" width="18" height="11" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
  chat: <path d="M4.5 19.5 5.6 16A7.5 7.5 0 1 1 8.4 18.6Z" />,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  truck: <><path d="M3 6.5h11v9H3z" /><path d="M14 9.5h3.5L21 13v2.5h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

function Icon({ name, className = "icon" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths[name]}
    </svg>
  );
}

const heroTrustPoints = [
  ["leaf", "100% Natural Ingredients"],
  ["noColour", "No Artificial Colours or Preservatives"],
  ["award", "FSSAI Registered"],
  ["family", "Made for Families"],
];

const trustCards = [
  ["family", "Family Focused", "Made for everyday family wellness"],
  ["leaf", "12 Real Ingredients", "Carefully selected natural ingredients"],
  ["award", "FSSAI Registered", "Certified food business"],
  ["noColour", "No Artificial Colours", "Clean and simple nutrition"],
];

// Shown on every product page, so each point holds for all three formulas: dry fruits and
// seeds, banana powder, plain-named ingredients, a mix-with-milk-or-water serve and a
// Nutrition Facts table are common to all of them.
const goodnessPoints = [
  ["seed", "Real Dry Fruits & Seeds"],
  ["search", "Recognisable Ingredients"],
  ["leaf", "Real Banana Powder"],
  ["check", "Simple Everyday Preparation"],
  ["menu", "Nutrition Facts Listed"],
  ["award", "FSSAI Registered"],
];

export default function App() {
  const savedProfile = JSON.parse(localStorage.getItem("satvapustiProfile") || "null");
  const savedOrders = JSON.parse(localStorage.getItem("satvapustiOrders") || "[]");

  const [selected, setSelected] = useState({});
  const [qty, setQty] = useState({});
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [products, setProducts] = useState(defaultProducts);
  const [gstStates, setGstStates] = useState([]);
  const [checkoutQuote, setCheckoutQuote] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [showHomeMenu, setShowHomeMenu] = useState(false);
  const [route, setRoute] = useState(readRoute);
  const [productFilter, setProductFilter] = useState("All Products");
  const [searchTerm, setSearchTerm] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [activeProductTabs, setActiveProductTabs] = useState({});
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyModalSection, setPolicyModalSection] = useState("terms");
  const [checkoutTermsAccepted, setCheckoutTermsAccepted] = useState(false);
  const [onlinePayment, setOnlinePayment] = useState({ enabled: false, testMode: false });
  const paymentModeRef = useRef("");

  const openPolicy = (section) => {
    setPolicyModalSection(section);
    setShowPolicyModal(true);
  };

  const [profile, setProfile] = useState(
    savedProfile || {
      name: "",
      email: "",
      mobile: "",
      acceptedTerms: false,
      guest: true,
    }
  );

  const [myOrders, setMyOrders] = useState(savedOrders);

  const [address, setAddress] = useState({
    name: savedProfile?.name || "",
    email: savedProfile?.email || "",
    mobile: savedProfile?.mobile || "",
    fullAddress: "",
    addressLine2: "",
    city: "",
    district: "",
    stateCode: "",
    pincode: "",
    billingSameAsShipping: true,
    billingAddress: "",
    billingCity: "",
    billingStateCode: "",
    billingPincode: "",
    businessCustomer: false,
    customerGstin: "",
    customerLegalName: "",
    customerTradeName: "",
  });

  const getWeight = (product) => selected[product.id] || "1KG";
  const getQty = (product) => qty[product.id] || 1;
  const selectPaymentMode = (mode) => {
    paymentModeRef.current = mode;
    setPaymentMode(mode);
  };

  const getStock = (productId, weight) => {
    const item = inventory.find(
      (stockItem) => stockItem.productId === productId && stockItem.weight === weight
    );
    return item ? Number(item.stock ?? 0) : null;
  };

  useEffect(() => {
    const normalizeProduct = (product) => {
      const productId = product.productId || product.id;
      const fallbackProduct = defaultProductById[productId] || defaultProducts[0];
      // Descriptive content comes only from this product's own record or its
      // own defaults, so one product can never show another product's text.
      const ownDefaults = defaultProductById[productId] || {};
      const weights = product.weights || {};
      const images = {};
      const prices = {};

      for (const weight of ["1KG", "500G", "250G"]) {
        // The database stores the PNG masters; the same-resolution WebP twin is ~10x lighter.
        const storedImage = weights[weight]?.image;
        const webpTwin = ownDefaults.images?.[weight];
        images[weight] = storedImage && storedImage.replace(/\.png$/i, ".webp") === webpTwin
          ? webpTwin
          : storedImage || fallbackProduct.images[weight];
        prices[weight] = {
          mrp: Number(weights[weight]?.mrp || 0),
          offer: Number(weights[weight]?.offer || 0),
          mrpPaise: Number(weights[weight]?.mrpPaise ?? Number(weights[weight]?.mrp || 0) * 100),
          sellingPricePaise: Number(weights[weight]?.sellingPricePaise ?? Number(weights[weight]?.offer || 0) * 100),
          gstRateBasisPoints: Number(weights[weight]?.gstRateBasisPoints ?? fallbackProduct.prices[weight]?.gstRateBasisPoints ?? 500),
          taxInclusive: weights[weight]?.taxInclusive !== false,
          hsnCode: weights[weight]?.hsnCode || fallbackProduct.prices[weight]?.hsnCode || "1106",
          discountLabel: weights[weight]?.discountLabel || fallbackProduct.prices[weight]?.discountLabel || "",
          packSize: weights[weight]?.packSize || fallbackProduct.prices[weight]?.packSize || weight,
        };
      }

      return {
        id: productId,
        name: product.name || ownDefaults.name || "",
        theme: product.theme || ownDefaults.theme || "",
        // Marketing copy (subtitle, description, chips, badges, benefits) comes from the
        // reviewed storefront defaults first, so every claim on a page matches its USPs.
        subtitle: ownDefaults.subtitle || product.subtitle || "",
        desc: ownDefaults.desc || product.desc || "",
        bestFor: ownDefaults.bestFor?.length
          ? ownDefaults.bestFor
          : Array.isArray(product.bestFor) ? product.bestFor : [],
        accent: product.accent || ownDefaults.accent,
        badges: ownDefaults.badges?.length
          ? ownDefaults.badges
          : Array.isArray(product.badges) ? product.badges : [],
        benefits: ownDefaults.benefits || (Array.isArray(product.benefits) ? product.benefits : []),
        ingredients: Array.isArray(product.ingredients) && product.ingredients.length > 0
          ? product.ingredients
          : ownDefaults.ingredients || [],
        usage: product.usage || ownDefaults.usage || "",
        nutrition: ownDefaults.nutrition || [],
        images,
        prices,
      };
    };

    const loadProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products`);
        const data = await res.json();
        const apiProducts = Array.isArray(data.products) ? data.products : [];

        if (apiProducts.length > 0) {
          setProducts(apiProducts.map(normalizeProduct));
        }
      } catch (error) {
        console.log("Products load error:", error);
      }
    };

    const loadInventory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/inventory`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setInventory(data);
        }
      } catch (error) {
        console.log("Inventory load error:", error);
      } finally {
        setInventoryLoaded(true);
      }
    };

    const loadGstStates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/gst-states`);
        const data = await res.json();
        setGstStates(Array.isArray(data.states) ? data.states : []);
      } catch (error) {
        console.log("GST state master load error:", error);
      }
    };

    const loadPaymentOptions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders/payment-options`);
        const data = await res.json();
        setOnlinePayment({
          enabled: data?.razorpay?.enabled === true,
          testMode: data?.razorpay?.testMode === true,
        });
      } catch (error) {
        console.log("Payment options load error:", error);
      }
    };

    loadProducts();
    loadInventory();
    loadGstStates();
    loadPaymentOptions();
  }, []);

  useEffect(() => {
    // An old in-page link such as /#faq still scrolls to its section.
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }), 120);
    }
    const onPopState = () => setRoute(readRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const routeProduct = route.view === "product"
    ? products.find((product) => product.id === route.productId)
    : null;

  useEffect(() => {
    document.title = routeProduct
      ? `${routeProduct.name} | SatvaPusti Nutrition`
      : PAGE_TITLES[route.view] || PAGE_TITLES.home;
  }, [route.view, routeProduct]);

  // Shop toolbar: sticky below the site header while the product list is browsed.
  const shopBrowseRef = useRef(null);
  const shopToolbarRef = useRef(null);
  const [toolbarStuck, setToolbarStuck] = useState(false);

  // Scroll position at which the toolbar sticks, i.e. where the product list starts.
  const shopBrowseTop = () => {
    const stickyTop = parseFloat(getComputedStyle(shopToolbarRef.current).top) || 0;
    return shopBrowseRef.current.getBoundingClientRect().top + window.scrollY - stickyTop;
  };

  useEffect(() => {
    if (route.view !== "shop") return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (shopBrowseRef.current && shopToolbarRef.current) setToolbarStuck(window.scrollY >= shopBrowseTop() - 1);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [route.view]);

  // Changing category while scrolled into the list brings the new results to the top of
  // the list instead of leaving the reader stranded below a shorter page.
  const selectFilter = (category) => {
    setProductFilter(category);
    window.requestAnimationFrame(() => {
      if (!shopBrowseRef.current || !shopToolbarRef.current) return;
      const top = shopBrowseTop();
      if (window.scrollY > top) window.scrollTo({ top });
    });
  };

  const navigate = (view, productId = "", anchor = "") => {
    const url = viewUrl(view, productId);
    if (`${window.location.pathname}${window.location.search}` !== url || window.location.hash) {
      window.history.pushState({}, "", url);
    }
    setRoute({ view, productId });
    setShowHomeMenu(false);
    window.setTimeout(() => {
      const target = anchor && document.getElementById(anchor);
      if (target) target.scrollIntoView({ block: "start" });
      else window.scrollTo({ top: 0 });
    }, 0);
  };

  // Real links (open in new tab, copy link) that switch pages in place on a normal click.
  const linkTo = (view, productId = "", anchor = "") => ({
    href: viewUrl(view, productId),
    onClick: (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(view, productId, anchor);
    },
  });

  const openSearch = () => {
    navigate("shop");
    window.setTimeout(() => document.getElementById("productSearch")?.focus(), 50);
  };

  const sendContactMessage = (event) => {
    event.preventDefault();
    const subject = `Website enquiry from ${contactForm.name}`;
    const body = `${contactForm.message}\n\nName: ${contactForm.name}\nEmail: ${contactForm.email}`;
    window.location.href = `mailto:${businessConfig.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const changeQty = (product, value) => {
    const nextQty = Math.max(1, getQty(product) + value);
    setQty({ ...qty, [product.id]: nextQty });
  };

  const addToCart = (product) => {
    if (isComingSoon(product.id)) {
      alert(COMING_SOON_MESSAGE);
      return;
    }

    const weight = getWeight(product);
    const quantity = getQty(product);
    const stock = getStock(product.id, weight);
    const price = product.prices[weight];
    const cartId = `${product.id}-${weight}`;
    const existing = cart.find((item) => item.cartId === cartId);
    const existingQty = existing?.quantity || 0;

    if (stock !== null && stock <= 0) {
      alert("This pack is currently out of stock.");
      return;
    }

    if (stock !== null && existingQty + quantity > stock) {
      alert(`Only ${stock} item(s) available for this pack.`);
      return;
    }

    if (existing) {
      setCart(
        cart.map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          cartId,
          productId: product.id,
          name: product.name,
          weight,
          quantity,
          mrp: price.mrp,
          offer: price.offer,
          image: product.images[weight],
        },
      ]);
    }

    setShowCart(true);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter((item) => item.cartId !== cartId));
  };

  const updateCartQty = (cartId, value) => {
    setCart(
      cart.map((item) => {
        if (item.cartId !== cartId || isComingSoon(item.productId)) return item;

        const stock = getStock(item.productId, item.weight);
        const nextQuantity = Math.max(1, item.quantity + value);

        if (stock !== null && nextQuantity > stock) {
          alert(`Only ${stock} item(s) available for this pack.`);
          return item;
        }

        return { ...item, quantity: nextQuantity };
      })
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.offer * item.quantity, 0);
  const cartSaving = cart.reduce(
    (sum, item) => sum + (item.mrp - item.offer) * item.quantity,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    setCart((currentCart) => {
      let changed = false;
      const repriced = currentCart.map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        const currentPrice = product?.prices?.[item.weight];
        if (!currentPrice || (item.offer === currentPrice.offer && item.mrp === currentPrice.mrp)) {
          return item;
        }
        changed = true;
        return { ...item, mrp: currentPrice.mrp, offer: currentPrice.offer };
      });
      return changed ? repriced : currentCart;
    });
  }, [products]);

  useEffect(() => {
    if (!address.stateCode || cart.length === 0) {
      setCheckoutQuote(null);
      return;
    }
    const controller = new AbortController();
    fetch(`${API_URL}/api/checkout/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map(({ productId, weight, quantity }) => ({ productId, weight, quantity })),
        shippingStateCode: address.stateCode,
        billingStateCode: address.billingSameAsShipping
          ? address.stateCode
          : address.billingStateCode,
      }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => setCheckoutQuote(data.success ? data.quote : null))
      .catch((error) => {
        if (error.name !== "AbortError") console.log("Checkout quote error:", error);
      });
    return () => controller.abort();
  }, [address.stateCode, address.billingStateCode, address.billingSameAsShipping, cart]);

 const makeUpiLink = (orderId, amount) => {
  return (
    `upi://pay?pa=${upiId}` +
    `&pn=${encodeURIComponent("SatvaPusti Nutrition")}` +
    `&am=${amount}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(`${orderId}|${amount}`)}`
  );
};

  const saveProfile = () => {
    if (!profile.name || !profile.email || !profile.mobile) {
      alert("Please enter your name, email, and mobile number.");
      return;
    }

    if (!profile.acceptedTerms) {
      alert("Please accept the Terms, Disclaimer, Privacy Policy, and Return Policy.");
      return;
    }

    const finalProfile = { ...profile, guest: false };
    setProfile(finalProfile);
    localStorage.setItem("satvapustiProfile", JSON.stringify(finalProfile));

    setAddress({
      ...address,
      name: finalProfile.name,
      email: finalProfile.email,
      mobile: finalProfile.mobile,
    });

    alert("Profile saved successfully.");
  };

  const continueAsGuest = () => {
    const guestProfile = {
      name: "",
      email: "",
      mobile: "",
      acceptedTerms: false,
      guest: true,
    };

    setProfile(guestProfile);
    localStorage.setItem("satvapustiProfile", JSON.stringify(guestProfile));
    setShowProfile(false);
  };

  const logoutProfile = () => {
    localStorage.removeItem("satvapustiProfile");
    setProfile({
      name: "",
      email: "",
      mobile: "",
      acceptedTerms: false,
      guest: true,
    });
    setAddress({
      name: "",
      email: "",
      mobile: "",
      fullAddress: "",
      city: "",
      pincode: "",
    });
  };

  const openCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty. Please add a product first.");
      return;
    }

    if (cart.some((item) => isComingSoon(item.productId))) {
      setCart(cart.filter((item) => !isComingSoon(item.productId)));
      alert(COMING_SOON_MESSAGE);
      return;
    }

    setShowCart(false);
    setShowCheckout(true);
    setOrderSuccess(false);
    setCheckoutTermsAccepted(false);
    selectPaymentMode("");

    setAddress({
      name: profile?.name || "",
      email: profile?.email || "",
      mobile: profile?.mobile || "",
      fullAddress: "",
      city: "",
      pincode: "",
    });
  };

  const closeCheckout = () => {
    setShowCheckout(false);
    selectPaymentMode("");
    setOrderSuccess(false);
  };

  const submitOrder = async () => {
    if (isSubmittingOrder) return;
    const selectedPaymentMode = paymentModeRef.current || paymentMode;

    if (
      !address.name ||
      !address.email ||
      !address.mobile ||
      !address.fullAddress ||
      !address.city ||
      !address.stateCode ||
      !address.pincode
    ) {
      alert("Please complete full shipping address.");
      return;
    }

    if (!/^\d{6}$/.test(address.pincode)) {
      alert("Please enter a valid six-digit Indian PIN code.");
      return;
    }

    if (
      !address.billingSameAsShipping &&
      (!address.billingAddress || !address.billingCity || !address.billingStateCode ||
        !/^\d{6}$/.test(address.billingPincode))
    ) {
      alert("Please complete the billing address with a valid six-digit PIN code.");
      return;
    }

    if (address.businessCustomer && (!address.customerGstin || !address.customerLegalName)) {
      alert("Enter the registered legal name and GSTIN for a GST invoice.");
      return;
    }

    if (
      address.businessCustomer &&
      String(address.customerGstin).trim().slice(0, 2) !==
        (address.billingSameAsShipping ? address.stateCode : address.billingStateCode)
    ) {
      alert("GSTIN state code must match the selected billing state.");
      return;
    }

    if (!selectedPaymentMode) {
      alert("Please select COD or UPI payment.");
      return;
    }

    if (!checkoutTermsAccepted) {
      alert("Please accept the Terms & Conditions, Privacy Policy and Refund/Cancellation Policy to place your order.");
      return;
    }

    if (cart.length === 0 || cart.some((item) => isComingSoon(item.productId))) {
      alert(COMING_SOON_MESSAGE);
      return;
    }

    setIsSubmittingOrder(true);

    const shipping = "₹0 (no configured shipping charge)";
    const paymentStatus =
      selectedPaymentMode === "UPI" ? "Awaiting Verification" : "Pending";

    const orderPayload = {
      customerName: address.name,
      email: address.email,
      mobile: address.mobile,
      address: address.fullAddress,
      addressLine2: address.addressLine2,
      city: address.city,
      district: address.district,
      pincode: address.pincode,
      shippingAddress: address.fullAddress,
      billingAddress: address.billingSameAsShipping
        ? `${address.fullAddress}, ${address.city} - ${address.pincode}`
        : `${address.billingAddress}, ${address.billingCity} - ${address.billingPincode}`,
      shippingStateCode: address.stateCode,
      billingStateCode: address.billingSameAsShipping ? address.stateCode : address.billingStateCode,
      businessCustomer: address.businessCustomer,
      customerGstin: address.businessCustomer ? address.customerGstin : "",
      customerLegalName: address.businessCustomer ? address.customerLegalName : "",
      customerTradeName: address.businessCustomer ? address.customerTradeName : "",
      items: cart.map(({ productId, weight, quantity }) => ({ productId, weight, quantity })),
      paymentMethod: selectedPaymentMode,
      paymentStatus,
    };

    try {
      const res = await fetch(`${API_URL}/api/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.message || "Order could not be created");
      }
      const savedOrder = data.order;
      const authoritativeTotal = Number(savedOrder.totalAmountPaise || 0) / 100;
      const snapshot = savedOrder.pricingSnapshot || data.quote;
      setCheckoutQuote(snapshot);
      const itemsText = (snapshot?.lines || []).map((item, index) =>
        `${index + 1}) ${item.productName}\nPack: ${item.packSize}\nQty: ${item.quantity}\n` +
        `Price: Rs. ${(item.sellingPricePaise / 100).toFixed(2)}\n` +
        `Amount: Rs. ${(item.lineInclusivePaise / 100).toFixed(2)}`
      ).join("\n\n");
      const buildLocalOrder = (paymentStatus) => {
        const whatsappText = `New SatvaPusti Order\n\nOrder ID: ${savedOrder.orderId}\n\n${itemsText}\n\n` +
          `Total Amount: Rs. ${authoritativeTotal.toFixed(2)}\nPayment Method: ${selectedPaymentMode}\n` +
          `Payment Status: ${paymentStatus}\nShipping: ${shipping}\n` +
          `Place of Supply: ${snapshot.placeOfSupplyState} (${snapshot.placeOfSupplyStateCode})\n` +
          `Prices are inclusive of GST.\n\nCustomer: ${address.name}\n${address.fullAddress}, ${address.city} - ${address.pincode}`;
        return {
          id: savedOrder.orderId,
          items: savedOrder.items,
          total: authoritativeTotal,
          saving: (snapshot.productDiscountPaise || 0) / 100,
          paymentMode: selectedPaymentMode,
          shipping,
          customer: { ...address },
          orderStatus: savedOrder.orderStatus,
          paymentStatus,
          whatsappMessage: encodeURIComponent(whatsappText),
          createdAt: new Date(savedOrder.createdAt).toLocaleString(),
        };
      };
      const recordPlacedOrder = (localOrder) => {
        const updatedOrders = [localOrder, ...myOrders];
        setLastOrder(localOrder);
        setMyOrders(updatedOrders);
        setOrderSuccess(true);
        localStorage.setItem("satvapustiOrders", JSON.stringify(updatedOrders));
      };

      if (selectedPaymentMode === "RAZORPAY") {
        if (!data.razorpay?.orderId || !data.razorpay?.keyId) {
          throw new Error("Online payment could not be started. Please try again.");
        }
        await payWithRazorpay({ razorpay: data.razorpay, orderId: savedOrder.orderId, buildLocalOrder, recordPlacedOrder });
        return;
      }

      const localOrder = buildLocalOrder(savedOrder.paymentStatus);
      const { whatsappMessage } = localOrder;
      recordPlacedOrder(localOrder);

      if (selectedPaymentMode === "COD") {
        window.location.href = `https://wa.me/${phone}?text=${whatsappMessage}`;
        return;
      }

      window.location.href = makeUpiLink(savedOrder.orderId, authoritativeTotal);
    } catch (error) {
      console.log("Backend order save error:", error);
      alert(error.message || "Order could not be saved right now. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Opens Razorpay Checkout for an order the backend has already priced and
  // saved. The order is shown as paid only after the backend verifies the
  // payment signature; closing or failing the payment leaves it unpaid.
  const payWithRazorpay = async ({ razorpay, orderId, buildLocalOrder, recordPlacedOrder }) => {
    const Razorpay = await loadRazorpayCheckout();

    await new Promise((resolve) => {
      let paymentSubmitted = false;
      const checkout = new Razorpay({
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        order_id: razorpay.orderId,
        name: razorpay.name,
        description: razorpay.description,
        prefill: { name: address.name, email: address.email, contact: address.mobile },
        notes: { orderId },
        theme: { color: "#178a52" },
        handler: async (response) => {
          paymentSubmitted = true;
          try {
            const res = await fetch(`${API_URL}/api/orders/razorpay/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const result = await res.json().catch(() => ({}));
            if (res.ok && result.success) {
              recordPlacedOrder(buildLocalOrder("Paid"));
            } else if (res.status === 202 && result.pending) {
              recordPlacedOrder(buildLocalOrder("Pending"));
              alert(result.message);
            } else {
              alert(`${result.message || "Payment could not be verified."} Order ID: ${orderId}`);
            }
          } catch (error) {
            console.log("Payment verification error:", error);
            alert(`Payment could not be verified right now. If money was debited, please contact us with Order ID ${orderId}.`);
          } finally {
            resolve();
          }
        },
        modal: {
          ondismiss: () => {
            if (!paymentSubmitted) {
              alert(`Payment was not completed. Order ${orderId} is saved but unpaid. Press Confirm Order to try again, or choose another payment option.`);
              resolve();
            }
          },
        },
      });
      checkout.on("payment.failed", (response) => {
        console.log("Razorpay payment failed:", response?.error?.code, response?.error?.reason);
      });
      checkout.open();
    });
  };

  const continueShopping = () => {
    setCart([]);
    setShowCheckout(false);
    setOrderSuccess(false);
    setLastOrder(null);
  };

  const policyContent = (
    <div className="policyLinks legalPolicyBox">
      <h3>Legal Agreement</h3>

      <p>
        SatvaPusti Nutrition is registered under FSSAI Registration No.
        <b> 20526034000204</b>, issued under the Food Safety and Standards Act, 2006.
      </p>

      <details open={policyModalSection === "terms"}>
        <summary>Terms & Conditions</summary>
        <p>
          SatvaPusti Nutrition provides food and nutrition products through this
          website. Product prices, offers, availability, packaging, and delivery
          timelines may change without prior notice. Orders are accepted only after
          confirmation by SatvaPusti Nutrition. Customers must provide correct name,
          mobile number, email address, and shipping address. Any misuse of the
          website, false order, fake information, or fraudulent activity may result
          in order cancellation.
        </p>
      </details>

      <details open={policyModalSection === "privacy"}>
        <summary>Privacy Policy</summary>
        <p>
          We collect customer name, mobile number, email address, shipping address,
          order details, and payment mode only for order processing, delivery,
          customer support, and communication. We do not sell customer personal data.
          Customer information may be shared only with delivery partners, payment
          service providers, or legal authorities when required by law.
        </p>
      </details>

      <details open={policyModalSection === "shipping"}>
        <summary>Shipping Policy</summary>
        <p>
          SatvaPusti Nutrition's detailed shipping policy (delivery timelines,
          serviceable areas, and courier partners) is being finalized and will be
          published here once confirmed. For any delivery question about an order,
          please contact us on WhatsApp.
        </p>
      </details>

      <details open={policyModalSection === "disclaimer"}>
        <summary>Product Disclaimer</summary>
        <p>
          SatvaPusti products are food and nutrition products, not medicines. They
          are not intended to diagnose, treat, cure, or prevent any disease. Results
          may vary from person to person. Pregnant women, nursing mothers, children,
          elderly persons, and people with medical conditions should consult a doctor
          before use. Please read ingredients carefully before consumption.
        </p>
      </details>

      <details open={policyModalSection === "refund"}>
        <summary>Return &amp; Refund Policy</summary>
        <p>
          Due to food safety reasons, opened or used products are not returnable.
          Return or replacement may be accepted only if the customer receives a
          damaged product, wrong product, expired product, or manufacturing defect.
          The customer must report the issue within 48 hours of delivery with clear
          photo or video proof. Refund approval is subject to verification by
          SatvaPusti Nutrition.
        </p>
      </details>
    </div>
  );

  const activeNav = route.view === "product" ? "shop" : route.view;
  const productCategories = [...new Set(products.map(categoryOf))];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    if (productFilter !== "All Products" && categoryOf(product) !== productFilter) return false;
    if (!normalizedSearch) return true;
    return [product.name, product.subtitle, product.desc, categoryOf(product), ...(product.ingredients || [])]
      .some((text) => String(text || "").toLowerCase().includes(normalizedSearch));
  });

  // variant "featured" is the wide layout used when a Shop filter matches a single product.
  const renderProductCard = (product, variant) => {
    const weight = getWeight(product);
    const { mrp, offer, discountLabel } = product.prices[weight];
    const savePercent = mrp > 0 ? Math.round(((mrp - offer) / mrp) * 100) : 0;
    const stock = getStock(product.id, weight);
    const isOutOfStock = inventoryLoaded && stock !== null && stock <= 0;
    const comingSoon = isComingSoon(product.id);

    return (
      <li className={variant === "featured" ? "productCard productCardFeatured" : "productCard"} key={product.id}>
        <a className="productCardMedia" {...linkTo("product", product.id)} tabIndex={-1} aria-hidden="true">
          <img
            src={product.images["1KG"]}
            alt=""
            width="1536"
            height="1024"
            loading="lazy"
            decoding="async"
          />
          {comingSoon && <span className="statusBadge">Coming Soon</span>}
        </a>
        <div className="productCardBody">
          <p className="eyebrow">{categoryOf(product)}</p>
          <h3>
            <a {...linkTo("product", product.id)}>{product.name}</a>
          </h3>
          <p className="productCardDesc">{product.desc}</p>
          <div className="productCardPrice">
            <span className="offerPrice">₹{offer}</span>
            <span className="mrpPrice">MRP <s>₹{mrp}</s></span>
            <span className="discountBadge">{discountLabel || `${savePercent}% OFF`}</span>
          </div>
          <p className="productCardPack">{weight} pack · Inclusive of all taxes</p>
          {comingSoon ? (
            <a className="btn btnTertiary btnBlock" {...linkTo("product", product.id)}>
              View Details
            </a>
          ) : (
            <button
              className="btn btnPrimary btnBlock"
              onClick={() => addToCart(product)}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
          )}
        </div>
      </li>
    );
  };

  const renderProductDetail = (product) => {
    const weight = getWeight(product);
    const quantity = getQty(product);
    const mrp = product.prices[weight].mrp;
    const offer = product.prices[weight].offer;
    const priceMeta = product.prices[weight];
    const save = (mrp - offer) * quantity;
    const total = offer * quantity;
    const savePercent = mrp > 0 ? Math.round(((mrp - offer) / mrp) * 100) : 0;
    const stock = getStock(product.id, weight);
    const hasKnownStock = inventoryLoaded && stock !== null;
    const isOutOfStock = hasKnownStock && stock <= 0;
    const isLowStock = hasKnownStock && stock > 0 && stock < 10;
    const comingSoon = isComingSoon(product.id);
    const activeTab = activeProductTabs[product.id] || "description";
    const whatsappText = encodeURIComponent(
      `Hi, I want to buy ${product.name} ${weight}. Quantity: ${quantity}.`
    );
    const notifyText = encodeURIComponent(
      `Hi, please notify me when ${product.name} is available.`
    );
    const tabs = [
      ["description", "Description"],
      ["ingredients", "Ingredients"],
      ["howToUse", "How To Use"],
      ["nutrition", "Nutrition Facts"],
      ["safetyInfo", "Product & Safety Info"],
    ];
    const productBenefits = product.benefits?.length ? product.benefits : [];
    const productUsps = PRODUCT_USPS[product.id];
    const productBadges = product.badges?.length ? product.badges : [];
    const benefitChips = (product.bestFor || []).filter((tag) => tag !== product.theme);

    return (
      <article className="productDetail" aria-labelledby={`product-${product.id}`}>
        <div className="productTop">
          <div className="productGallery">
            <div className="productImageStage">
              <img
                src={product.images[weight]}
                alt={`${product.name} ${weight} pack`}
                width="1536"
                height="1024"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <div className="productThumbs" aria-label="Pack images">
              {["1KG", "500G", "250G"].map((w) => (
                <button
                  key={w}
                  className={weight === w ? "activeThumb" : ""}
                  onClick={() => setSelected({ ...selected, [product.id]: w })}
                  aria-pressed={weight === w}
                  aria-label={`Show ${w} pack`}
                >
                  <img
                    src={product.images[w]}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{w}</span>
                </button>
              ))}
            </div>
            {benefitChips.length > 0 && (
              <ul className="productChips" aria-label="Best for">
                {benefitChips.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="productInfo">
            <div className="productStatusRow">
              <span className="eyebrow">{categoryOf(product)}</span>
              {comingSoon && <span className="statusBadge">Coming Soon</span>}
              {productBadges.slice(0, 2).map((badge) => (
                <span className="productBadge" key={badge.label}>{badge.label}</span>
              ))}
            </div>

            <h1 id={`product-${product.id}`}>{product.name}</h1>
            <p className="productSubtitle">{product.subtitle || "Premium Nutrition Powder"}</p>
            <p className="productLead">{product.desc}</p>

            {productUsps ? (
              <ul className={`productBenefits productUsps${productUsps.length % 2 ? " isOdd" : ""}`}>
                {productUsps.map((usp) => (
                  <li key={usp.title}>
                    <Icon name="check" />
                    <span className="uspCopy">
                      <span className="uspProblem">{usp.problem}</span>
                      <strong className="uspTitle">{usp.title}</strong>
                      <span className="uspText">{usp.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : productBenefits.length > 0 && (
              <ul className={`productBenefits${productBenefits.length % 2 ? " isOdd" : ""}`}>
                {productBenefits.map((benefit) => (
                  <li key={benefit}>
                    <Icon name="check" />
                    {benefit}
                  </li>
                ))}
              </ul>
            )}

            <div className="priceBlock">
              <div className="priceMain">
                <span className="offerPrice">₹{offer}</span>
                <span className="mrpPrice">
                  MRP <s>₹{mrp}</s>
                </span>
                <span className="discountBadge">{priceMeta.discountLabel || `${savePercent}% OFF`}</span>
              </div>
              <p className="priceNote">
                You save <b>₹{save}</b>
                {priceMeta.taxInclusive && <> · Inclusive of all taxes</>}
              </p>
            </div>

            <div className="optionGroup">
              <span className="optionLabel" id={`pack-${product.id}`}>Pack Size</span>
              <div className="packButtons" role="group" aria-labelledby={`pack-${product.id}`}>
                {["1KG", "500G", "250G"].map((w) => (
                  <button
                    key={w}
                    className={weight === w ? "activeWeight" : ""}
                    onClick={() => setSelected({ ...selected, [product.id]: w })}
                    aria-pressed={weight === w}
                  >
                    <span>{w}</span>
                    <small>₹{product.prices[w].offer}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="purchaseRow">
              {!comingSoon && (
                <div className="qtyControl">
                  <button onClick={() => changeQty(product, -1)} aria-label="Decrease quantity">−</button>
                  <span aria-live="polite" aria-label={`Quantity ${quantity}`}>{quantity}</span>
                  <button onClick={() => changeQty(product, 1)} aria-label="Increase quantity">+</button>
                </div>
              )}
              {comingSoon ? (
                <p className="stockStatus stockSoon">Not yet available to order</p>
              ) : (
                <p className={`stockStatus ${isOutOfStock ? "stockOut" : isLowStock ? "stockLow" : "stockOk"}`}>
                  {isOutOfStock ? "Out of stock" : isLowStock ? `Only ${stock} left` : "In Stock"}
                </p>
              )}
            </div>

            <div className="ctaGroup">
              {comingSoon ? (
                <a
                  className="btn btnPrimary btnBlock"
                  href={`https://wa.me/${phone}?text=${notifyText}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Notify Me When Available
                </a>
              ) : (
                <>
                  <button
                    className="btn btnPrimary btnBlock"
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                  >
                    {isOutOfStock ? "Out of Stock" : `Add To Cart — ₹${total}`}
                  </button>

                  <a
                    className="btn btnTertiary btnBlock"
                    href={`https://wa.me/${phone}?text=${whatsappText}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="chat" />
                    Buy on WhatsApp
                  </a>
                </>
              )}
            </div>

            <ul className="assuranceRow" aria-label="Checkout assurances">
              <li><Icon name="award" />FSSAI Registered</li>
              <li><Icon name="cash" />Cash on Delivery</li>
              <li><Icon name="lock" />Secure Checkout</li>
            </ul>
          </div>
        </div>

        <div className="productTabs">
          <div className="tabList" role="tablist" aria-label={`${product.name} details`}>
            {tabs.map(([id, label]) => (
              <button
                key={id}
                id={`tab-${product.id}-${id}`}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`panel-${product.id}`}
                className={activeTab === id ? "activeProductTab" : ""}
                onClick={() => setActiveProductTabs({ ...activeProductTabs, [product.id]: id })}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="tabPanel"
            role="tabpanel"
            id={`panel-${product.id}`}
            aria-labelledby={`tab-${product.id}-${activeTab}`}
            key={activeTab}
          >
            {activeTab === "description" && (
              <div className="tabText">
                <h2>Premium daily nutrition</h2>
                <p>{product.desc}</p>
                <p>{product.usage}</p>
              </div>
            )}
            {activeTab === "ingredients" && (
              <ul className="ingredientTags">
                {(product.ingredients || []).filter(isIngredient).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {activeTab === "howToUse" && (
              <ol className="usageSteps">
                <li>{product.usage}</li>
                <li>Stir well until smooth.</li>
                <li>Use daily as part of a balanced routine.</li>
              </ol>
            )}
            {activeTab === "nutrition" && (
              <dl className="factTable">
                {(product.nutrition || [])
                  .filter(([label]) => !UNCONFIRMED_NUTRITION_ROWS[product.id]?.includes(label))
                  .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {activeTab === "safetyInfo" && (
              <div className="safetyInfo">
                <dl className="factTable">
                  <div><dt>Net Quantity</dt><dd>{priceMeta.packSize}</dd></div>
                  <div><dt>FSSAI Registration No</dt><dd>20526034000204</dd></div>
                  <div><dt>HSN Code</dt><dd>{priceMeta.hsnCode}</dd></div>
                  {product.compliance?.vegetarian !== undefined && (
                    <div><dt>Vegetarian</dt><dd>{product.compliance.vegetarian ? "Yes" : "No"}</dd></div>
                  )}
                  {product.compliance?.allergens && (
                    <div><dt>Allergen Information</dt><dd>{product.compliance.allergens}</dd></div>
                  )}
                  {product.compliance?.shelfLife && (
                    <div><dt>Best Before / Shelf Life</dt><dd>{product.compliance.shelfLife}</dd></div>
                  )}
                  {product.compliance?.storageInstructions && (
                    <div><dt>Storage Instructions</dt><dd>{product.compliance.storageInstructions}</dd></div>
                  )}
                  {product.compliance?.manufacturedBy && (
                    <div><dt>Manufactured By</dt><dd>{product.compliance.manufacturedBy}</dd></div>
                  )}
                </dl>
                {(product.compliance?.vegetarian === undefined ||
                  !product.compliance?.allergens ||
                  !product.compliance?.shelfLife ||
                  !product.compliance?.storageInstructions ||
                  !product.compliance?.manufacturedBy) && (
                  <p className="safetyInfoPending">
                    Vegetarian mark, allergen declaration, best-before/shelf-life and storage
                    instructions for this pack will be published here once confirmed by
                    SatvaPusti Nutrition.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    );
  };

  const renderGoodness = () => (
    <div className="goodnessStrip">
      <p className="eyebrow">Goodness in Every Scoop</p>
      <ul>
        {goodnessPoints.map(([icon, label]) => (
          <li key={label}>
            <span className="iconMedallion"><Icon name={icon} /></span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );

  const renderTrustCards = () => (
    <ul className="trustCards">
      {trustCards.map(([icon, title, text]) => (
        <li className="trustCard" key={title}>
          <span className="iconMedallion"><Icon name={icon} /></span>
          <h3>{title}</h3>
          <p>{text}</p>
        </li>
      ))}
    </ul>
  );

  const renderIngredientGrid = (list) => (
    <ul className="ingredientGrid">
      {list.map(([img, name]) => (
        <li className="ingredientCard" key={img}>
          <img
            {...ingredientCardImage(img)}
            sizes={INGREDIENT_CARD_SIZES}
            alt={name}
            width="360"
            height="270"
            loading="lazy"
            decoding="async"
          />
          <span>{name}</span>
        </li>
      ))}
    </ul>
  );

  const renderPageIntro = (eyebrow, title, text) => (
    <section className="pageIntro">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {text && <p className="sectionText">{text}</p>}
      </div>
    </section>
  );

  const renderHome = () => (
    <>
      <section className="hero" aria-labelledby="heroTitle">
        <div className="container heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">Natural Family Nutrition</p>
            <h1 id="heroTitle">Real Nutrition for Stronger Families</h1>
            <p className="heroLead">
              Wholesome nutrition powders made with real dry fruits, seeds and traditional
              ingredients, crafted for children, parents and grandparents alike.
            </p>
            <a className="btn btnPrimary btnLarge" {...linkTo("shop")}>
              Shop Best Sellers
              <Icon name="arrow" />
            </a>
            <ul className="heroTrust">
              {heroTrustPoints.map(([icon, label]) => (
                <li key={label}>
                  <Icon name={icon} />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="heroMedia">
            <img
              src="/banners/banner-family.webp"
              alt="A family enjoying SatvaPusti nutrition drinks with real dry fruits and seeds"
              width="1920"
              height="1080"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="rangeTitle">
        <div className="container">
          <header className="sectionHead">
            <p className="eyebrow">Our Range</p>
            <h2 id="rangeTitle">Nutrition for the Whole Family</h2>
            <p className="sectionText">
              Premium nutrition powders with real ingredients, family-friendly formulas, and fast checkout.
            </p>
          </header>
          <ul className="productGrid">{products.map(renderProductCard)}</ul>
          <div className="sectionAction">
            <a className="btn btnTertiary" {...linkTo("shop")}>
              View All Products
              <Icon name="arrow" />
            </a>
          </div>
          {renderGoodness()}
        </div>
      </section>

      <section className="section homeStory" aria-labelledby="storyTitle">
        <div className="container homeStoryGrid">
          <div className="brandStatement">
            <p className="eyebrow">Our Story</p>
            <h2 id="storyTitle">Daily nutrition should come from real ingredients, not artificial formulas.</h2>
            <span className="goldRule" aria-hidden="true" />
            <p className="homeStoryText">
              Our products are prepared using carefully selected dry fruits, seeds, banana powder and
              dates powder to support families, children and active lifestyles.
            </p>
            <a className="btn btnTertiary" {...linkTo("about")}>
              Read Our Story
              <Icon name="arrow" />
            </a>
          </div>
          {renderTrustCards()}
        </div>
      </section>

      <section className="section" aria-labelledby="homeIngredientsTitle">
        <div className="container">
          <header className="sectionHead">
            <p className="eyebrow">Our Ingredients</p>
            <h2 id="homeIngredientsTitle">Real Ingredients We Use</h2>
          </header>
          {renderIngredientGrid(ingredients.slice(0, 8))}
          <div className="sectionAction">
            <a className="btn btnTertiary" {...linkTo("ingredients")}>
              See All Ingredients
              <Icon name="arrow" />
            </a>
          </div>
        </div>
      </section>
    </>
  );

  const renderShop = () => (
    <>
      {renderPageIntro(
        "Shop",
        "Shop SatvaPusti Nutrition",
        "Premium nutrition powders with real ingredients, family-friendly formulas, and fast checkout."
      )}
      <section className="section shopSection">
        <div className="container">
          <div className="shopBrowse" ref={shopBrowseRef}>
            <div className={toolbarStuck ? "shopToolbar isStuck" : "shopToolbar"} ref={shopToolbarRef}>
              <div className="filterChips" role="group" aria-label="Filter by category">
                {["All Products", ...productCategories].map((category) => (
                  <button
                    key={category}
                    className={productFilter === category ? "activeFilter" : ""}
                    aria-pressed={productFilter === category}
                    onClick={() => selectFilter(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <label className="searchField">
                <Icon name="search" />
                <span className="visuallyHidden">Search products</span>
                <input
                  id="productSearch"
                  type="search"
                  placeholder="Search products or ingredients"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
            </div>
            {visibleProducts.length === 1 ? (
              <ul className="productGrid productGridSingle">{renderProductCard(visibleProducts[0], "featured")}</ul>
            ) : visibleProducts.length > 0 ? (
              <ul className={visibleProducts.length === 2 ? "productGrid productGridPair" : "productGrid"}>
                {visibleProducts.map((product) => renderProductCard(product))}
              </ul>
            ) : (
              <div className="emptyState">
                <p>No products match your search.</p>
                <button
                  className="btn btnTertiary"
                  onClick={() => {
                    setSearchTerm("");
                    selectFilter("All Products");
                  }}
                >
                  Show All Products
                </button>
              </div>
            )}
          </div>
          {renderGoodness()}
        </div>
      </section>
    </>
  );

  const renderProductPage = () => {
    if (!routeProduct) {
      return (
        <>
          {renderPageIntro("Shop", "Product not found", "This product is not available. Browse our full range instead.")}
          <section className="section">
            <div className="container sectionAction">
              <a className="btn btnPrimary" {...linkTo("shop")}>Go to Shop</a>
            </div>
          </section>
        </>
      );
    }
    const otherProducts = products.filter((product) => product.id !== routeProduct.id);

    return (
      <section className="section productPage">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <a {...linkTo("home")}>Home</a>
            <span aria-hidden="true">/</span>
            <a {...linkTo("shop")}>Shop</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{routeProduct.name}</span>
          </nav>
          {renderProductDetail(routeProduct)}
          {renderGoodness()}
          {otherProducts.length > 0 && (
            <section className="relatedProducts" aria-labelledby="relatedTitle">
              <h2 id="relatedTitle">More from SatvaPusti</h2>
              <ul className="productGrid">{otherProducts.map(renderProductCard)}</ul>
            </section>
          )}
        </div>
      </section>
    );
  };

  const renderAbout = () => (
    <>
      <section className="aboutHero" aria-labelledby="aboutTitle">
        <div className="container aboutHeroGrid">
          <div className="aboutHeroCopy">
            <p className="eyebrow">Our Story</p>
            <h1 id="aboutTitle">Daily nutrition should come from real ingredients, not artificial formulas.</h1>
            <span className="goldRule" aria-hidden="true" />
            <p>
              At SatvaPusti, we believe everyday nutrition should feel familiar, wholesome and trustworthy.
              Our products are prepared using carefully selected dry fruits, seeds, banana powder and dates
              powder to support families, children and active lifestyles.
            </p>
            <p>
              Every batch is produced with a focus on quality, purity and traditional nutrition values.
            </p>
          </div>
          <img
            className="aboutMedia"
            src="/banners/about-family-600.webp"
            srcSet="/banners/about-family-600.webp 600w, /banners/about-family-883.webp 883w"
            sizes="(min-width: 900px) 46vw, 100vw"
            alt="Three generations of a family enjoying SatvaPusti nutrition drinks together"
            width="883"
            height="662"
            decoding="async"
          />
        </div>
      </section>

      <section className="section aboutSection" aria-labelledby="trustTitle">
        <div className="container">
          <header className="sectionHead">
            <p className="eyebrow">Premium Nutrition, Built On Trust</p>
            <h2 id="trustTitle">Why Families Trust SatvaPusti</h2>
            <p className="sectionText">
              Made with carefully selected dry fruits, seeds and real ingredients for daily family nutrition.
            </p>
          </header>

          {renderTrustCards()}

          <div className="aboutDetails">
            <ul className="featureList">
              <li>
                <Icon name="leaf" />
                <div>
                  <h3>Real Ingredients</h3>
                  <p>Only carefully selected dry fruits, seeds and natural ingredients.</p>
                </div>
              </li>
              <li>
                <Icon name="heart" />
                <div>
                  <h3>Real Banana Powder</h3>
                  <p>Made with real banana powder, not artificial flavours.</p>
                </div>
              </li>
              <li>
                <Icon name="seed" />
                <div>
                  <h3>Dry Fruits &amp; Seeds</h3>
                  <p>Rich blend of nuts, seeds and wholesome ingredients.</p>
                </div>
              </li>
              <li>
                <Icon name="noColour" />
                <div>
                  <h3>No Artificial Colours</h3>
                  <p>No synthetic colours added.</p>
                </div>
              </li>
              <li>
                <Icon name="flask" />
                <div>
                  <h3>Different Formulas, Clearly Explained</h3>
                  <p>Each formula lists its own ingredients, nutrition facts and preparation guidance.</p>
                </div>
              </li>
              <li>
                <Icon name="family" />
                <div>
                  <h3>Daily Nutrition Support</h3>
                  <p>Designed for everyday family wellness.</p>
                </div>
              </li>
            </ul>

            <aside className="fssaiPanel" aria-label="FSSAI registration">
              <div className="fssaiPanelInner">
                <span className="iconMedallion"><Icon name="award" /></span>
                <p className="eyebrow">FSSAI</p>
                <h3>Registered Food Business</h3>
                <p className="fssaiNumber">Registration No. {businessConfig.fssai}</p>
                <dl>
                  <div><dt>FBO Name</dt><dd>Satvapusti Nutrition</dd></div>
                  <div><dt>Business Type</dt><dd>General Manufacturing</dd></div>
                </dl>
                <small>Issued under the Food Safety and Standards Act, 2006.</small>
              </div>
            </aside>
          </div>

          <p className="trustBanner">
            Made for Families <span aria-hidden="true">·</span> Designed for Kids <span aria-hidden="true">·</span> Trusted by Active Lifestyles
          </p>
        </div>
      </section>
    </>
  );

  const renderIngredients = () => (
    <>
      {renderPageIntro(
        "Our Ingredients",
        "Real Ingredients We Use",
        "See the dry fruits, seeds and natural ingredients that make SatvaPusti feel honest and wholesome."
      )}
      <section className="section ingredientsSection">
        <div className="container">
          {renderIngredientGrid(ingredients)}
          {renderGoodness()}
        </div>
      </section>
    </>
  );

  const renderFaq = () => (
    <section id="faq" className="section faqSection" aria-labelledby="faqTitle">
      <div className="container">
        <header className="sectionHead">
          <p className="eyebrow">Help</p>
          <h2 id="faqTitle">Frequently Asked Questions</h2>
          <p className="sectionText">
            Find common answers about ordering, payment, and product usage here.
          </p>
        </header>

        <div className="faqGrid">
          <details>
            <summary>How should I use SatvaPusti products?</summary>
            <p>
              Use the product with milk or warm water as part of your daily routine.
              Children, elderly customers, pregnant women, or customers with medical
              conditions should consult a doctor before use.
            </p>
          </details>

          <details>
            <summary>Is COD available?</summary>
            <p>
              Yes, COD is available. Payment for COD orders is collected at the time of delivery.
            </p>
          </details>

          <details>
            <summary>What is the benefit of UPI prepaid?</summary>
            <p>
              UPI prepaid orders get free shipping. After payment, send WhatsApp
              confirmation. The order will be processed after admin verification.
            </p>
          </details>

          <details>
            <summary>How can I track my order?</summary>
            <p>
              Click Track Order in the header and enter your Order ID and mobile number
              to view the latest order status.
            </p>
          </details>

          <details>
            <summary>Do you have FSSAI registration?</summary>
            <p>
              Yes. SatvaPusti Nutrition's FSSAI Registration No. is 20526034000204.
            </p>
          </details>

          <details>
            <summary>When can I get a return or replacement?</summary>
            <p>
              Due to food safety reasons, opened products are not returnable. For wrong,
              damaged, expired, or manufacturing defect products, report within 48 hours
              with clear photo/video proof.
            </p>
          </details>
        </div>
      </div>
    </section>
  );

  const renderContact = () => (
    <>
      {renderPageIntro(
        "Contact",
        "Get in Touch",
        "We are here to help you with your orders, products and any questions."
      )}
      <section className="section contactSection">
        <div className="container contactGrid">
          <ul className="contactList">
            <li>
              <span className="iconMedallion"><Icon name="chat" /></span>
              <div>
                <h2>WhatsApp</h2>
                <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">{businessConfig.phone}</a>
              </div>
            </li>
            <li>
              <span className="iconMedallion"><Icon name="mail" /></span>
              <div>
                <h2>Email</h2>
                <a href={`mailto:${businessConfig.email}`}>{businessConfig.email}</a>
              </div>
            </li>
            <li>
              <span className="iconMedallion"><Icon name="pin" /></span>
              <div>
                <h2>Address</h2>
                <p>H No 59, Pendri, Pandri, Berla, Bemetara, Chhattisgarh - 491335</p>
              </div>
            </li>
            <li>
              <span className="iconMedallion"><Icon name="truck" /></span>
              <div>
                <h2>Order Status</h2>
                <a href="/?page=track-order">Track your order</a>
              </div>
            </li>
          </ul>

          <form className="contactForm" onSubmit={sendContactMessage}>
            <h2>Send us a message</h2>
            <label>
              <span>Name</span>
              <input
                name="name"
                autoComplete="name"
                required
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </label>
            <label>
              <span>Message</span>
              <textarea
                name="message"
                rows="5"
                required
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              />
            </label>
            <button type="submit" className="btn btnPrimary btnBlock">Send Message</button>
            <p className="formNote">This opens your email app with your message addressed to {businessConfig.email}.</p>
          </form>
        </div>
      </section>
      {renderFaq()}
    </>
  );

  const pageViews = {
    home: renderHome,
    shop: renderShop,
    product: renderProductPage,
    about: renderAbout,
    ingredients: renderIngredients,
    contact: renderContact,
  };

  return (
    <div className="siteShell">
      <a className="skipLink" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="main-header container">
          <a className="brandLink" {...linkTo("home")} aria-label="SatvaPusti Nutrition home">
            <img
              src="/banners/logo-banner.webp"
              alt="Satvapusti Branding"
              className="brand-ribbon"
              width="1780"
              height="560"
            />
          </a>

          <nav className="nav-links" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a
                key={item.view}
                {...linkTo(item.view)}
                className={activeNav === item.view ? "active" : ""}
                aria-current={activeNav === item.view ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="header-icons">
            <button className="headerIconBtn" onClick={openSearch} aria-label="Search products" title="Search">
              <Icon name="search" />
            </button>
            <button className="headerIconBtn" onClick={() => setShowProfile(true)} aria-label="Open profile" title="Profile">
              <Icon name="user" />
            </button>
            <button className="headerIconBtn cartHeaderBtn" onClick={() => setShowCart(true)} aria-label={`Open cart with ${cartCount} items`} title="Cart">
              <Icon name="bag" />
              <span className="cartCount">{cartCount}</span>
            </button>
            <div className="menuDropdown">
              <button
                className="headerIconBtn menuToggleBtn"
                onClick={() => setShowHomeMenu((prev) => !prev)}
                aria-expanded={showHomeMenu}
                aria-controls="homeMenuPanel"
                aria-label="Menu"
              >
                <Icon name="menu" />
              </button>
              {showHomeMenu && (
                <nav className="homeMenuPanel" id="homeMenuPanel" aria-label="Mobile navigation">
                  {navItems.map((item) => (
                    <a
                      key={item.view}
                      {...linkTo(item.view)}
                      className={activeNav === item.view ? "active" : ""}
                      aria-current={activeNav === item.view ? "page" : undefined}
                    >
                      {item.label}
                    </a>
                  ))}
                  <a href="/?page=track-order" onClick={() => setShowHomeMenu(false)}>Track Order</a>
                  <a {...linkTo("contact", "", "faq")}>FAQ</a>
                  <button
                    className="profileNavBtn"
                    onClick={() => {
                      setShowProfile(true);
                      setShowHomeMenu(false);
                    }}
                  >
                    Profile
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </header>

      <button className="cartFloatBtn" onClick={() => setShowCart(true)}>
        <Icon name="bag" />
        Cart ({cartCount})
      </button>

      <main id="main">{(pageViews[route.view] || renderHome)()}</main>

      <footer className="contact">
        <div className="container footerGrid">
          <div className="footerBrand">
            <img src="/banners/logo-banner.webp" alt="SatvaPusti Nutrition" width="1780" height="560" loading="lazy" />
            <p>
              Premium family nutrition made with real dry fruits, seeds, banana powder and clean everyday ingredients.
            </p>
            <a className="btn btnPrimary" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
              <Icon name="chat" />
              Contact on WhatsApp
            </a>
          </div>

          <nav className="footerColumn" aria-label="Helpful links">
            <h2>Helpful Links</h2>
            <a {...linkTo("shop")}>Shop Products</a>
            <a {...linkTo("about")}>About Us</a>
            <a {...linkTo("ingredients")}>Ingredients</a>
            <a {...linkTo("contact", "", "faq")}>FAQ</a>
            <a href="/?page=track-order">Track Order</a>
          </nav>

          <nav className="footerColumn" aria-label="Policies">
            <h2>Policies</h2>
            <a href="#privacy" onClick={(e) => { e.preventDefault(); openPolicy("privacy"); }}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => { e.preventDefault(); openPolicy("terms"); }}>Terms of Service</a>
            <a href="#shipping" onClick={(e) => { e.preventDefault(); openPolicy("shipping"); }}>Shipping Policy</a>
            <a href="#refund" onClick={(e) => { e.preventDefault(); openPolicy("refund"); }}>Refund Policy</a>
          </nav>

          <div className="footerColumn contactDetails">
            <h2>Contact Us</h2>
            <p><strong>Brand:</strong> SatvaPusti Nutrition</p>
            <p><strong>Phone:</strong> {businessConfig.phone}</p>
            <p><strong>Email:</strong> {businessConfig.email}</p>
            <p><strong>Website:</strong> {businessConfig.website}</p>
            <p><strong>FSSAI No:</strong> {businessConfig.fssai}</p>
            <p><strong>FBO Name:</strong> Satvapusti Nutrition</p>
            <p><strong>Business Type:</strong> General Manufacturing</p>
            <p><strong>Address:</strong> H No 59, Pendri, Pandri, Berla, Bemetara, Chhattisgarh - 491335</p>
            <p><strong>UPI ID:</strong> {upiId}</p>
          </div>
        </div>

        <div className="footerBottom">
          <p className="container footerText">© 2026 SatvaPusti Nutrition. All Rights Reserved.</p>
        </div>
      </footer>

      {showProfile && (
        <div className="modalBg">
          <div className="checkoutBox">
            <button className="closeBtn" onClick={() => setShowProfile(false)} aria-label="Close">×</button>

            <h2>My Profile</h2>

            {profile?.guest ? (
              <>
                <input
                  placeholder="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />

                <input
                  placeholder="Email Address"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />

                <input
                  placeholder="Mobile Number"
                  value={profile.mobile}
                  onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                />

                <label className="termsBox">
                  <input
                    type="checkbox"
                    checked={profile.acceptedTerms}
                    onChange={(e) =>
                      setProfile({ ...profile, acceptedTerms: e.target.checked })
                    }
                  />
                  <span>
                    I agree to Terms of Use, Disclaimer, Privacy Policy and Return Policy.
                  </span>
                </label>

                {policyContent}


                <button className="guestBtn" onClick={continueAsGuest}>
                  Skip / Continue as Guest
                </button>
              </>
            ) : (
              <>
                <div className="successDetails">
                  <p><b>Name:</b> {profile.name}</p>
                  <p><b>Email:</b> {profile.email}</p>
                  <p><b>Mobile:</b> {profile.mobile}</p>
                </div>

                <button className="guestBtn" onClick={logoutProfile}>
                  Logout
                </button>
              </>
            )}

            <h3>My Orders</h3>

            {myOrders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              <div className="myOrdersBox">
                {myOrders.map((order) => (
                  <div className="myOrderCard" key={order.id}>
                    <p><b>Order ID:</b> {order.id}</p>
                    <p><b>Total:</b> ₹{order.total}</p>
                    <p><b>Payment:</b> {order.paymentMode}</p>
                    <p><b>Status:</b> {order.orderStatus}</p>
                    <p><b>Date:</b> {order.createdAt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showPolicyModal && (
        <div className="modalBg" role="dialog" aria-modal="true" aria-label="Site policies">
          <div className="checkoutBox">
            <button
              className="closeBtn"
              onClick={() => setShowPolicyModal(false)}
              aria-label="Close policy details"
            >
              ×
            </button>
            <h2>Our Policies</h2>
            {policyContent}
          </div>
        </div>
      )}

      {showCart && (
        <div className="modalBg">
          <div className="checkoutBox">
            <button className="closeBtn" onClick={() => setShowCart(false)} aria-label="Close">×</button>

            <h2>Your Cart</h2>

            {cart.length === 0 ? (
              <p className="sectionText">Your cart is empty.</p>
            ) : (
              <>
                <div className="cartItems">
                  {cart.map((item) => (
                    <div className="cartItem" key={item.cartId}>
                      <img src={item.image} alt={item.name} />
                      <div>
                        <h4>{item.name}</h4>
                        <p>{item.weight} | Unit price: ₹{item.offer}</p>

                        <div className="cartQty">
                          <button onClick={() => updateCartQty(item.cartId, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.cartId, 1)}>+</button>
                        </div>

                        <p><b>Line total:</b> ₹{item.offer * item.quantity}</p>
                      </div>

                      <button className="removeBtn" onClick={() => removeFromCart(item.cartId)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cartTotalBox">
                  <p><b>MRP total:</b> ₹{cartTotal + cartSaving}</p>
                  <p><b>Product discount:</b> -₹{cartSaving}</p>
                  <p><b>Selling-price total:</b> ₹{cartTotal}</p>
                  <p><b>Coupon discount:</b> ₹0</p>
                  <p><b>Shipping:</b> ₹0</p>
                  <p>Prices are inclusive of GST.</p>
                  <h3>Grand total: ₹{cartTotal}</h3>
                </div>

               <button
  type="button"
  className="submitOrderBtn"
  onClick={openCheckout}
>
  Proceed to Checkout
</button>
              </>
            )}
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="modalBg">
          <div className="checkoutBox">
            <button className="closeBtn" onClick={closeCheckout} aria-label="Close">×</button>

            {orderSuccess ? (
              <div className="successBox">
                <h2>Order Placed Successfully</h2>

                {lastOrder && (
                  <div className="successDetails">
                    <p><b>Order ID:</b> {lastOrder?.id}</p>
                    {lastOrder?.items?.map((item) => (
                      <p key={item?.cartId}>
                        <b>{item?.name}</b> - {item?.weight} × {item?.quantity} = ₹
                        {item?.offer * item?.quantity}
                      </p>
                    ))}
                    <hr />
                    <p><b>Total:</b> ₹{lastOrder?.total}</p>
                    <p>
                      <b>Payment:</b>{" "}
                      {lastOrder?.paymentMode === "RAZORPAY"
                        ? `Online (Razorpay) - ${lastOrder?.paymentStatus}`
                        : lastOrder?.paymentMode}
                    </p>
                    <p><b>Status:</b> {lastOrder?.orderStatus}</p>
                  </div>
                )}

                <div className="nextStepsBox">
                  <h3>Next Steps</h3>
                  <p>Save your Order ID. Dispatch updates will be available on WhatsApp and order tracking.</p>
                  <div className="successActionRow">
                    <a href="/?page=track-order">Track Order</a>
                    <a
                      href={`https://wa.me/${phone}?text=${lastOrder?.whatsappMessage || ""}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Send Order on WhatsApp
                    </a>
                  </div>
                </div>

                {paymentMode === "UPI" && (
  <div className="upiBox">
    <button
      className="upiPayBtn"
      onClick={() => {
        const upiUrl = makeUpiLink(
          lastOrder?.id,
          lastOrder?.total
        );
        try {
          window.location.href = upiUrl;
        } catch (error) {
          console.log("UPI open error:", error);
        }
      }}
    >
      Pay Now via UPI App
    </button>
    <a
      className="submitOrderBtn"
      href={`https://wa.me/${phone}?text=${lastOrder?.whatsappMessage || ""}`}
      target="_blank"
      rel="noreferrer"
    >
      I Have Completed Payment
    </a>
  </div>
)}
              </div>
            ) : (
              <>
                <h2>Shipping Address</h2>

                <div className="checkoutSummary">
                  {cart.map((item) => (
                    <p key={item.cartId}>
                      {item.name} - {item.weight} × {item.quantity} = ₹
                      {item.offer * item.quantity}
                    </p>
                  ))}
                  <p>MRP total: ₹{cartTotal + cartSaving}</p>
                  <p>Product discount: -₹{cartSaving}</p>
                  <p>Coupon discount: ₹0</p>
                  <p>Shipping: ₹0</p>
                  <p>Prices are inclusive of GST.</p>
                  {checkoutQuote && (
                    <>
                      <p><b>Place of Supply:</b> {checkoutQuote.placeOfSupplyState} ({checkoutQuote.placeOfSupplyStateCode})</p>
                      {checkoutQuote.supplyType === "INTRA_STATE" ? (
                        <p>Included CGST @ 2.5%: ₹{(checkoutQuote.cgstAmountPaise / 100).toFixed(2)} | Included SGST @ 2.5%: ₹{(checkoutQuote.sgstAmountPaise / 100).toFixed(2)}</p>
                      ) : (
                        <p>Included IGST @ 5%: ₹{(checkoutQuote.igstAmountPaise / 100).toFixed(2)}</p>
                      )}
                    </>
                  )}
                  <h3>Grand total: ₹{checkoutQuote ? (checkoutQuote.finalPayablePaise / 100).toFixed(2) : cartTotal}</h3>
                </div>

                <input
                  placeholder="Full Name"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                />

                <input
                  placeholder="Email Address"
                  type="email"
                  value={address.email}
                  onChange={(e) => setAddress({ ...address, email: e.target.value })}
                />

                <input
                  placeholder="Mobile Number"
                  inputMode="numeric"
                  maxLength={10}
                  value={address.mobile}
                  onChange={(e) => setAddress({ ...address, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                />

                <textarea
                  placeholder="Shipping address line 1"
                  value={address.fullAddress}
                  onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
                />

                <input
                  placeholder="Shipping address line 2 (optional)"
                  value={address.addressLine2}
                  onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                />

                <input
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />

                <input
                  placeholder="District (optional)"
                  value={address.district}
                  onChange={(e) => setAddress({ ...address, district: e.target.value })}
                />

                <select
                  value={address.stateCode}
                  onChange={(e) => setAddress({ ...address, stateCode: e.target.value })}
                  required
                >
                  <option value="">Select shipping State / UT</option>
                  {gstStates.map((state) => (
                    <option key={state.gst_state_code} value={state.gst_state_code}>
                      {state.state_name} ({state.gst_state_code})
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })}
                />

                <input value="India" readOnly aria-label="Country" />

                <label className="checkoutCheckRow">
                  <input
                    type="checkbox"
                    checked={address.billingSameAsShipping}
                    onChange={(e) => setAddress({ ...address, billingSameAsShipping: e.target.checked })}
                  />
                  Billing address is the same as shipping address
                </label>

                {!address.billingSameAsShipping && (
                  <>
                    <h3>Billing Address</h3>
                    <textarea
                      placeholder="Complete billing address"
                      value={address.billingAddress}
                      onChange={(e) => setAddress({ ...address, billingAddress: e.target.value })}
                    />
                    <input
                      placeholder="Billing city"
                      value={address.billingCity}
                      onChange={(e) => setAddress({ ...address, billingCity: e.target.value })}
                    />
                    <select
                      value={address.billingStateCode}
                      onChange={(e) => setAddress({ ...address, billingStateCode: e.target.value })}
                    >
                      <option value="">Select billing State / UT</option>
                      {gstStates.map((state) => (
                        <option key={state.gst_state_code} value={state.gst_state_code}>
                          {state.state_name} ({state.gst_state_code})
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Billing PIN code"
                      inputMode="numeric"
                      maxLength={6}
                      value={address.billingPincode}
                      onChange={(e) => setAddress({ ...address, billingPincode: e.target.value.replace(/\D/g, "") })}
                    />
                  </>
                )}

                <label className="checkoutCheckRow">
                  <input
                    type="checkbox"
                    checked={address.businessCustomer}
                    onChange={(e) => setAddress({ ...address, businessCustomer: e.target.checked })}
                  />
                  Buying for a business / GST invoice required
                </label>

                {address.businessCustomer && (
                  <>
                    <input
                      placeholder="Registered legal name"
                      value={address.customerLegalName}
                      onChange={(e) => setAddress({ ...address, customerLegalName: e.target.value })}
                    />
                    <input
                      placeholder="Trade name (optional)"
                      value={address.customerTradeName}
                      onChange={(e) => setAddress({ ...address, customerTradeName: e.target.value })}
                    />
                    <input
                      placeholder="Customer GSTIN"
                      maxLength={15}
                      value={address.customerGstin}
                      onChange={(e) => setAddress({ ...address, customerGstin: e.target.value.toUpperCase().replace(/\s/g, "") })}
                    />
                  </>
                )}

                <h3>Select Payment Option</h3>

                <div className="paymentOptions">
                  <button
                    type="button"
                    className={paymentMode === "COD" ? "selectedPay" : ""}
                    onClick={() => selectPaymentMode("COD")}
                  >
                    <b>COD</b>
                    <span>Pay when order is delivered</span>
                  </button>

                  <button
                    type="button"
                    className={paymentMode === "UPI" ? "selectedPay" : ""}
                    onClick={() => selectPaymentMode("UPI")}
                  >
                    <b>UPI Prepaid</b>
                    <span>Free shipping after verification</span>
                  </button>

                  {onlinePayment.enabled && (
                    <button
                      type="button"
                      className={paymentMode === "RAZORPAY" ? "selectedPay" : ""}
                      onClick={() => selectPaymentMode("RAZORPAY")}
                    >
                      <b>Pay Online{onlinePayment.testMode ? " (Test Mode)" : ""}</b>
                      <span>UPI, cards &amp; netbanking via Razorpay</span>
                    </button>
                  )}
                </div>

                {paymentMode === "UPI" && (
  <>
    <p className="freeShipping">
      UPI Payment = Free Shipping
    </p>
  </>
)}

<label className="checkoutCheckRow">
  <input
    type="checkbox"
    checked={checkoutTermsAccepted}
    onChange={(e) => setCheckoutTermsAccepted(e.target.checked)}
    aria-required="true"
  />
  <span>
    I agree to the{" "}
    <button type="button" className="policyInlineLink" onClick={() => openPolicy("terms")}>
      Terms &amp; Conditions
    </button>
    ,{" "}
    <button type="button" className="policyInlineLink" onClick={() => openPolicy("privacy")}>
      Privacy Policy
    </button>{" "}
    and{" "}
    <button type="button" className="policyInlineLink" onClick={() => openPolicy("refund")}>
      Refund/Cancellation Policy
    </button>
    .
  </span>
</label>

<button
  type="button"
  className="submitOrderBtn"
  disabled={isSubmittingOrder}
  onClick={() => {
    submitOrder();
  }}
>
  {isSubmittingOrder
    ? paymentMode === "RAZORPAY" ? "Waiting for payment..." : "Placing Order..."
    : "Confirm Order"}
</button>
                 
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
