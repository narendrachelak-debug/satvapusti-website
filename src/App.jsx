import { useEffect, useRef, useState } from "react";
import "./App.css";
import businessConfig from "../shared/business.json";
import productAvailability from "../shared/productAvailability.json";

const phone = "919639630828";
const upiId = "9993265857@ybl";
const API_URL = "https://satvapusti-website.onrender.com";

const banners = [
  "/banners/wide/banner-family-wide.webp",
  "/banners/wide/banner-active-kids-wide.webp",
  "/banners/wide/banner-active-wide.webp",
];

const navItems = [
  { id: "top", label: "Home", href: "#top" },
  { id: "products", label: "Shop", href: "#products" },
  { id: "about", label: "About Us", href: "#about" },
  { id: "ingredients", label: "Ingredients", href: "#ingredients" },
  { id: "contact", label: "Contact", href: "#contact" },
];

const defaultProducts = [
  {
    id: "family",
    name: "SatvaPusti Family Nutrition Formula",
    theme: "Family Wellness",
    subtitle: "Complete Daily Nutrition For The Whole Family",
    desc: "A family wellness blend made for everyday routines, with real dry fruits and seeds to support energy, focus and immunity for all ages.",
    bestFor: ["Family Wellness", "Daily Energy", "Immunity Support"],
    accent: {
      primary: "#178a52",
      secondary: "#0f6f45",
      soft: "#eaf8ef",
      warm: "#d67a15",
      text: "#06411f",
    },
    badges: [
      { label: "Family Favourite", color: "#178a52" },
      { label: "Quality Tested", color: "#0f6f45" },
    ],
    benefits: [
      "👨‍👩‍👧 Family Wellness Support",
      "🥜 Real Dry Fruits & Seeds",
      "⚡ Daily Energy & Stamina",
      "🧠 Brain & Focus Support",
      "🛡️ Immunity Support",
      "🌿 No Artificial Colours",
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
    subtitle: "Nutrition For Growing Champions",
    desc: "A kid-focused nutrition formula with real banana goodness, crafted to support growth, brain development, school energy and daily immunity.",
    bestFor: ["Growing Champions", "Brain Support", "Growth Support"],
    accent: {
      primary: "#e0a713",
      secondary: "#f28c18",
      soft: "#fff4dc",
      warm: "#ffbd2e",
      text: "#7a3f00",
    },
    badges: [
      { label: "Growing Champions Formula", color: "#f28c18" },
      { label: "0g Added Sugar", color: "#e0a713" },
    ],
    benefits: [
      "📚 Brain Development Support",
      "🦴 Growth & Bone Support",
      "🍌 Real Banana Nutrition",
      "🛡️ Immunity Support",
      "⚡ School & Play Energy",
      "🌿 No Artificial Colours",
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
    subtitle: "Natural Strength & Recovery Formula",
    desc: "A fitness and recovery blend for active lifestyles, built around protein-rich natural ingredients to support strength, performance and post-workout recovery.",
    bestFor: ["Fitness & Recovery", "Strength Support", "Protein Rich"],
    accent: {
      primary: "#0f4f3f",
      secondary: "#c99a2e",
      soft: "#eef7ef",
      warm: "#d7a438",
      text: "#07372d",
    },
    badges: [
      { label: "Performance Formula", color: "#0f4f3f" },
      { label: "0g Added Sugar", color: "#c99a2e" },
    ],
    benefits: [
      "💪 Protein Rich Blend",
      "⚡ Workout Recovery",
      "🔥 Performance Support",
      "🥜 Premium Nut & Seed Formula",
      "🚫 No Refined Sugar",
      "🌿 Naturally Sweetened",
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
  ["saunf.webp", "Saunf"],
  ["elaichi.webp", "Elaichi"],
  ["cocoa-powder.webp", "Cocoa Powder"],
  ["date-powder.webp", "Date Powder"],
  ["soy-protein.webp", "Soy Protein"],
  ["ragi.webp", "Ragi"],
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
  const [activeSection, setActiveSection] = useState("top");
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
      const weights = product.weights || {};
      const images = {};
      const prices = {};

      for (const weight of ["1KG", "500G", "250G"]) {
        images[weight] = weights[weight]?.image || fallbackProduct.images[weight];
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
        name: product.name || fallbackProduct.name,
        theme: product.theme || fallbackProduct.theme,
        subtitle: product.subtitle || fallbackProduct.subtitle,
        desc: fallbackProduct.desc || product.desc || "",
        bestFor: Array.isArray(product.bestFor) && product.bestFor.length > 0
          ? product.bestFor
          : fallbackProduct.bestFor,
        accent: product.accent || fallbackProduct.accent,
        badges: Array.isArray(product.badges) && product.badges.length > 0
          ? product.badges
          : fallbackProduct.badges,
        benefits: fallbackProduct.benefits,
        ingredients: Array.isArray(product.ingredients) && product.ingredients.length > 0
          ? product.ingredients
          : fallbackProduct.ingredients,
        usage: product.usage || fallbackProduct.usage,
        nutrition: fallbackProduct.nutrition,
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
    const sectionIds = navItems.map((item) => item.id);

    const scrollToHashSection = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;

      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ block: "start" });
      }, 120);
    };

    const updateActiveSection = () => {
      const headerHeight = document.querySelector(".site-header")?.offsetHeight || 0;
      const marker = headerHeight + window.innerHeight * 0.28;
      let current = "top";

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        if (rect.top <= marker && rect.bottom > headerHeight + 24) {
          current = id;
        }
      }

      if (window.scrollY < 80) {
        current = "top";
      }

      setActiveSection(current);
    };

    updateActiveSection();
    scrollToHashSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

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

  return (
    <div className="siteShell">
      <header className="site-header" id="top">
        <div className="main-header">
          <img
            src="/banners/logo-banner.webp"
            alt="Satvapusti Branding"
            className="brand-ribbon"
          />

          <nav className="nav-links" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={activeSection === item.id ? "active" : ""}
                aria-current={activeSection === item.id ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="header-icons">
          <a className="headerIconBtn" href="#products" aria-label="Search products" title="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M10.8 4a6.8 6.8 0 0 1 5.3 11.1l3.4 3.4-1.4 1.4-3.4-3.4A6.8 6.8 0 1 1 10.8 4Zm0 2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Z" />
            </svg>
          </a>
          <button className="headerIconBtn" onClick={() => setShowProfile(true)} aria-label="Open profile" title="Profile">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 12.2a4.4 4.4 0 1 1 0-8.8 4.4 4.4 0 0 1 0 8.8Zm0-6.8a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Zm8 15.2H4v-1.3c0-3.4 3.5-5.6 8-5.6s8 2.2 8 5.6v1.3Zm-13.8-2h11.6c-.5-1.8-2.8-2.9-5.8-2.9s-5.3 1.1-5.8 2.9Z" />
            </svg>
          </button>
          <button className="headerIconBtn cartHeaderBtn" onClick={() => setShowCart(true)} aria-label={`Open cart with ${cartCount} items`} title="Cart">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M7 19.5A1.8 1.8 0 1 1 3.5 19.5 1.8 1.8 0 0 1 7 19.5Zm11.5 0A1.8 1.8 0 1 1 15 19.5a1.8 1.8 0 0 1 3.5 0ZM6.6 6l.5 2h12.6l-1.8 6.5H8.4L6 4H3V2h4.6l.5 2h13.5l-.5 2H6.6Zm1 4 .6 2.5h8.2l.7-2.5H7.6Z" />
            </svg>
            <span>{cartCount}</span>
          </button>
          <div className="menuDropdown">
            <button
              className="menuToggleBtn"
              onClick={() => setShowHomeMenu((prev) => !prev)}
              aria-expanded={showHomeMenu}
              aria-controls="homeMenuPanel"
            >
              <span>Menu</span>
            </button>
            {showHomeMenu && (
              <nav className="homeMenuPanel" id="homeMenuPanel">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className={activeSection === item.id ? "active" : ""}
                    aria-current={activeSection === item.id ? "page" : undefined}
                    onClick={() => setShowHomeMenu(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <a href="/?page=track-order" onClick={() => setShowHomeMenu(false)}>Track Order</a>
                <a href="#faq" onClick={() => setShowHomeMenu(false)}>FAQ</a>
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
        Cart ({cartCount})
      </button>

      <section className="hero">
        <div className="heroFrame">
          <div className="slider">
            {banners.map((banner, index) => (
              <img
                key={banner}
                src={banner}
                alt="SatvaPusti Banner"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "low"}
              />
            ))}
          </div>
          <div className="heroDots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <a className="heroShopRail" href="#products">
          Shop best sellers
        </a>
      </section>

      <section className="trust">
        <div className="trustItem">
          <b>Real Ingredients</b>
          <span>Made with familiar kitchen nutrition</span>
        </div>
        <div className="trustItem">
          <b>No Artificial Colours</b>
          <span>Clean daily nutrition for families</span>
        </div>
        <div className="trustItem">
          <b>No Added Preservatives</b>
          <span>Fresh batch production process</span>
        </div>
        <div className="trustItem">
          <b>FSSAI Registered</b>
          <span>FSSAI No. 20526034000204</span>
        </div>
      </section>

      <section className="customerAssurance">
        <div>
          <b>Premium Natural Nutrition</b>
          <span>Made with real dry fruits, seeds and wholesome ingredients</span>
        </div>
        <div>
          <b>Fast &amp; Secure Delivery</b>
          <span>Pan India shipping with trusted delivery partners</span>
        </div>
        <div>
          <b>Trusted by Families &amp; Fitness Users</b>
          <span>Daily nutrition support for kids, adults and active lifestyles</span>
        </div>
      </section>

      <section id="products" className="section premiumProductsSection">
        <h2>Shop SatvaPusti Nutrition</h2>
        <p className="sectionText">Premium nutrition powders with real ingredients, family-friendly formulas, and fast checkout.</p>

        <div className="premiumProductStack">
          {products.map((product, productIndex) => {
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
            const tabs = [
              ["description", "Description"],
              ["ingredients", "Ingredients"],
              ["howToUse", "How To Use"],
              ["nutrition", "Nutrition Facts"],
              ["safetyInfo", "Product & Safety Info"],
            ];
            const premiumBenefits = product.benefits?.length
              ? product.benefits
              : ["Real Ingredients", "Daily Nutrition Support", "No Artificial Colours"];
            const productBadges = product.badges?.length
              ? product.badges
              : [
                  { label: "Real Ingredients", color: "#e58b1b" },
                  { label: "Daily Nutrition", color: "#178a52" },
                ];
            const productAccent = product.accent || {
              primary: "#178a52",
              secondary: "#0f6f45",
              soft: "#eaf8ef",
              warm: "#d67a15",
              text: "#06411f",
            };
            const productAccentStyle = {
              "--product-primary": productAccent.primary,
              "--product-secondary": productAccent.secondary,
              "--product-soft": productAccent.soft,
              "--product-warm": productAccent.warm,
              "--product-text": productAccent.text,
            };

            return (
              <article className="premiumProductDetail" key={product.id} style={productAccentStyle}>
                <div className="premiumGallery">
                  <span
                    className="imageBadge imageBadgePrimary"
                    style={{ "--badge-color": productBadges[0].color }}
                  >
                    {productBadges[0].label}
                  </span>
                  <span
                    className="imageBadge imageBadgeSecondary"
                    style={{ "--badge-color": productBadges[1].color }}
                  >
                    {productBadges[1].label}
                  </span>
                  <div className="premiumImageStage">
                    <img
                      src={product.images[weight]}
                      alt={product.name}
                      loading={productIndex === 0 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={productIndex === 0 ? "high" : "auto"}
                    />
                  </div>
                  <div className="premiumThumbs">
                    {["1KG", "500G", "250G"].map((w) => (
                      <button
                        key={w}
                        className={weight === w ? "activeThumb" : ""}
                        onClick={() => setSelected({ ...selected, [product.id]: w })}
                      >
                        <img
                          src={product.images[w]}
                          alt={`${product.name} ${w}`}
                          loading="lazy"
                          decoding="async"
                        />
                        <span>{w}</span>
                      </button>
                    ))}
                  </div>
                  <div className="premiumBenefitGrid">
                    {premiumBenefits.map((benefit) => (
                      <span key={benefit}>{benefit}</span>
                    ))}
                  </div>
                </div>

                <div className="premiumBuyPanel">
                  <div className="premiumBadgeRow">
                    {comingSoon && <span className="comingSoonBadge">COMING SOON</span>}
                    {product.theme && <span className="themeBadge">{product.theme}</span>}
                    {product.bestFor.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>

                  <h3>{product.name}</h3>
                  <h4>{product.subtitle || "Premium Nutrition Powder"}</h4>
                  <p className="premiumLead">{product.desc}</p>

                  <div className="premiumPriceBox">
                    <div>
                      <span>MRP</span>
                      <b className="cutPrice">₹{mrp}</b>
                    </div>
                    <div>
                      <span>Offer Price</span>
                      <b className="offerPrice">₹{offer}</b>
                    </div>
                    <div>
                      <span>You Save</span>
                      <b className="saveText">₹{save}</b>
                    </div>
                    <strong>{priceMeta.discountLabel || `Save ${savePercent}%`}</strong>
                  </div>
                  {priceMeta.taxInclusive && <p className="taxInclusiveText">Inclusive of all taxes</p>}

                  <div className="premiumPackBlock">
                    <b>Pack Size</b>
                    <div className="premiumPackButtons">
                      {["1KG", "500G", "250G"].map((w) => (
                        <button
                          key={w}
                          className={weight === w ? "activeWeight" : ""}
                          onClick={() => setSelected({ ...selected, [product.id]: w })}
                        >
                          <span>{w}</span>
                          <small>₹{product.prices[w].offer}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="premiumPurchaseRow">
                    {!comingSoon && (
                      <div className="premiumQty">
                        <button onClick={() => changeQty(product, -1)}>-</button>
                        <span>{quantity}</span>
                        <button onClick={() => changeQty(product, 1)}>+</button>
                      </div>
                    )}
                    {comingSoon ? (
                      <p className="stockOut">Coming Soon</p>
                    ) : (
                      <p className={isOutOfStock ? "stockOut" : isLowStock ? "stockLow" : "stockOk"}>
                        {isOutOfStock ? "Out of stock" : isLowStock ? `Only ${stock} left` : "In Stock"}
                      </p>
                    )}
                  </div>

                  {comingSoon ? (
                    <button className="premiumCartBtn" disabled aria-disabled="true">
                      Coming Soon
                    </button>
                  ) : (
                    <>
                      <button
                        className="premiumCartBtn"
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                      >
                        {isOutOfStock ? "Out of Stock" : `Add To Cart - ₹${total}`}
                      </button>

                      <a
                        className="premiumWhatsappBtn"
                        href={`https://wa.me/${phone}?text=${whatsappText}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Buy on WhatsApp
                      </a>
                    </>
                  )}
                  <div className="mobileTrustStrip" aria-label="Checkout trust badges">
                    <span>✓ FSSAI</span>
                    <span>✓ Delivery</span>
                    <span>✓ Secure</span>
                  </div>
                </div>

                <div className="premiumTabs">
                  <div className="premiumTabButtons">
                    {tabs.map(([id, label]) => (
                      <button
                        key={id}
                        className={activeTab === id ? "activeProductTab" : ""}
                        onClick={() => setActiveProductTabs({ ...activeProductTabs, [product.id]: id })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="premiumTabPanel">
                    {activeTab === "description" && (
                      <div>
                        <h4>Premium daily nutrition</h4>
                        <p>{product.desc}</p>
                        <p>{product.usage}</p>
                      </div>
                    )}
                    {activeTab === "ingredients" && (
                      <div className="premiumIngredientGrid">
                        {(product.ingredients || []).map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    )}
                    {activeTab === "howToUse" && (
                      <div className="premiumSteps">
                        <span>1. Add 2 spoons to warm milk or water.</span>
                        <span>2. Stir well until smooth.</span>
                        <span>3. Use daily as part of a balanced routine.</span>
                      </div>
                    )}
                    {activeTab === "nutrition" && (
                      <div className="premiumNutritionTable">
                        {(product.nutrition || []).map(([label, value], index) => (
                          <div className={`nutritionFactCard nutritionTone${(index % 8) + 1}`} key={label}>
                            <b>{label}</b>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "safetyInfo" && (
                      <div className="premiumSafetyInfo">
                        <p><b>Net Quantity:</b> {priceMeta.packSize}</p>
                        <p><b>FSSAI Registration No:</b> 20526034000204</p>
                        <p><b>HSN Code:</b> {priceMeta.hsnCode}</p>
                        {product.compliance?.vegetarian !== undefined && (
                          <p><b>Vegetarian:</b> {product.compliance.vegetarian ? "Yes" : "No"}</p>
                        )}
                        {product.compliance?.allergens && (
                          <p><b>Allergen Information:</b> {product.compliance.allergens}</p>
                        )}
                        {product.compliance?.shelfLife && (
                          <p><b>Best Before / Shelf Life:</b> {product.compliance.shelfLife}</p>
                        )}
                        {product.compliance?.storageInstructions && (
                          <p><b>Storage Instructions:</b> {product.compliance.storageInstructions}</p>
                        )}
                        {product.compliance?.manufacturedBy && (
                          <p><b>Manufactured By:</b> {product.compliance.manufacturedBy}</p>
                        )}
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
          })}
        </div>
      </section>

      {false && (
      <section id="productsLegacy" className="section legacyProductsSection">
        <h2>Order SatvaPusti Products</h2>
        <p className="sectionText">Select products, add them to cart, and place one combined order.</p>

        <div className="productSlider">
          {products.map((product) => {
            const weight = getWeight(product);
            const quantity = getQty(product);
            const mrp = product.prices[weight].mrp;
            const offer = product.prices[weight].offer;
            const save = (mrp - offer) * quantity;
            const total = offer * quantity;
            const stock = getStock(product.id, weight);
            const isOutOfStock = stock <= 0;
            const isLowStock = stock > 0 && stock < 10;

            return (
              <div className="productCard" key={product.id}>
                <div className="productBadgeRow">
                  {product.bestFor.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <h3>{product.name}</h3>
                <h4>{product.subtitle}</h4>
                <p>{product.desc}</p>

                <img className="mainProductImg" src={product.images[weight]} alt={product.name} />

                <p className="packLabel">Choose Pack Size</p>
                <div className="weightButtons">
                  {["1KG", "500G", "250G"].map((w) => (
                    <button
                      key={w}
                      className={weight === w ? "activeWeight" : ""}
                      onClick={() => setSelected({ ...selected, [product.id]: w })}
                    >
                      <b>{w}</b>
                      <small>₹{product.prices[w].offer}</small>
                      {w === "1KG" && <em>Best Value</em>}
                    </button>
                  ))}
                </div>

                <div className="productBenefitGrid">
                  {product.benefits.map((benefit) => (
                    <span key={benefit}>{benefit}</span>
                  ))}
                </div>

                <div className="usageBox">
                  <b>How to Use</b>
                  <span>{product.usage}</span>
                </div>

                <div className="priceBox">
                  <p>MRP: <span className="cutPrice">₹{mrp}</span></p>
                  <p>Offer Price: <span className="offerPrice">₹{offer}</span></p>
                  <p className="saveText">You Save ₹{save}</p>
                  <p>Total: <span className="offerPrice">₹{total}</span></p>
                  <p className={isOutOfStock ? "stockOut" : isLowStock ? "stockLow" : "stockOk"}>
                    {isOutOfStock ? "Out of stock" : isLowStock ? `Low stock: ${stock} left` : `In stock: ${stock}`}
                  </p>
                </div>

                <p className="productTrustLine">
                  FSSAI registered food product. Not a medicine.
                </p>

                <div className="qtyBox">
                  <button onClick={() => changeQty(product, -1)}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => changeQty(product, 1)}>+</button>
                </div>

                <button
                  className="placeBtn"
                  onClick={() => addToCart(product)}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {showProfile && (
        <div className="modalBg">
          <div className="checkoutBox">
            <button className="closeBtn" onClick={() => setShowProfile(false)} aria-label="Close">×</button>

            <h2>👤 My Profile</h2>

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

            <h2>🛒 Your Cart</h2>

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
                <h2>✅ Order Placed Successfully</h2>

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
      ✅ I Have Completed Payment
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

      <section id="about" className="section about trustAboutSection">
        <p className="sectionEyebrow">Premium Nutrition, Built On Trust</p>
        <h2>Why Families Trust SatvaPusti</h2>
        <p className="sectionText">
          Made with carefully selected dry fruits, seeds and real ingredients for daily family nutrition.
        </p>

        <div className="trustStats">
          <div className="trustStatCard trustStatFamily">
            <span>👨‍👩‍👧</span>
            <b>Family Focused</b>
            <small>Made for everyday family wellness</small>
          </div>
          <div className="trustStatCard trustStatIngredients">
            <span>🌿</span>
            <b>12 Real Ingredients</b>
            <small>Carefully selected natural ingredients</small>
          </div>
          <div className="trustStatCard trustStatFssai">
            <span>🏅</span>
            <b>FSSAI Registered</b>
            <small>Certified food business</small>
          </div>
          <div className="trustStatCard trustStatClean">
            <span>🚫</span>
            <b>No Artificial Colours</b>
            <small>Clean and simple nutrition</small>
          </div>
        </div>

        <div className="brandStory">
          <div>
            <h3>Daily nutrition should come from real ingredients, not artificial formulas.</h3>
            <p>
              At SatvaPusti, we believe everyday nutrition should feel familiar, wholesome and trustworthy.
              Our products are prepared using carefully selected dry fruits, seeds, banana powder and dates
              powder to support families, children and active lifestyles.
            </p>
            <p>
              Every batch is produced with a focus on quality, purity and traditional nutrition values.
            </p>
          </div>
          <div className="fssaiHighlight">
            <span>FSSAI</span>
            <b>Registered Food Business</b>
            <small>Registration No. 20526034000204</small>
          </div>
        </div>

        <div className="aboutFeatureGrid">
          <article>
            <span>🌿</span>
            <h3>Real Ingredients</h3>
            <p>Only carefully selected dry fruits, seeds and natural ingredients.</p>
          </article>
          <article>
            <span>🍌</span>
            <h3>Real Banana Powder</h3>
            <p>Made with real banana powder, not artificial flavours.</p>
          </article>
          <article>
            <span>🥜</span>
            <h3>Dry Fruits & Seeds</h3>
            <p>Rich blend of nuts, seeds and wholesome ingredients.</p>
          </article>
          <article>
            <span>🚫</span>
            <h3>No Artificial Colours</h3>
            <p>No synthetic colours added.</p>
          </article>
          <article>
            <span>🚫</span>
            <h3>0g Added Sugar Options</h3>
            <p>Kids and Active formulas use dates powder as the sweetener.</p>
          </article>
          <article>
            <span>💪</span>
            <h3>Daily Nutrition Support</h3>
            <p>Designed for everyday family wellness.</p>
          </article>
        </div>

        <div className="trustBanner">
          Made for Families <span>•</span> Designed for Kids <span>•</span> Trusted by Active Lifestyles
        </div>
      </section>

      <section id="ingredients" className="section cream ingredientsSection">
        <p className="sectionEyebrow">Our Ingredients</p>
        <h2>Real Ingredients We Use</h2>
        <p className="sectionText">
          See the dry fruits, seeds and natural ingredients that make SatvaPusti feel honest and wholesome.
        </p>

        <div className="ingredientGrid">
          {ingredients.map(([img, name]) => (
            <div className="ingredientCard" key={img}>
              <img src={`/ingridients/${img}`} alt={name} />
              <b>{name}</b>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="section faqSection">
        <h2>Frequently Asked Questions</h2>
        <p className="sectionText">
          Find common answers about ordering, payment, and product usage here.
        </p>

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
      </section>

      <section id="contact" className="contact">
        <div className="footerBrand">
          <img src="/banners/logo-banner.webp" alt="SatvaPusti Nutrition" />
          <p>
            Premium family nutrition made with real dry fruits, seeds, banana powder and clean everyday ingredients.
          </p>
          <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
            Contact on WhatsApp
          </a>
        </div>

        <div className="footerColumn">
          <h2>Helpful Links</h2>
          <a href="#products">Shop Products</a>
          <a href="#about">About Us</a>
          <a href="#ingredients">Ingredients</a>
          <a href="#faq">FAQ</a>
          <a href="/?page=track-order">Track Order</a>
        </div>

        <div className="footerColumn">
          <h2>Policies</h2>
          <a href="#faq" onClick={(e) => { e.preventDefault(); openPolicy("privacy"); }}>Privacy Policy</a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); openPolicy("terms"); }}>Terms of Service</a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); openPolicy("shipping"); }}>Shipping Policy</a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); openPolicy("refund"); }}>Refund Policy</a>
        </div>

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

        <p className="footerText">© 2026 SatvaPusti Nutrition. All Rights Reserved.</p>
      </section>
    </div>
  );
}
