import { useEffect, useRef, useState } from "react";
import "./App.css";

const phone = "919639630828";
const upiId = "9993265857@ybl";
const API_URL = "https://satvapusti-website.onrender.com";

const banners = [
  "/banners/wide/banner-family-wide.png",
  "/banners/wide/banner-active-kids-wide.png",
  "/banners/wide/banner-active-wide.png",
];

const defaultProducts = [
  {
    id: "family",
    name: "SatvaPusti+ Family",
    subtitle: "Premium Nutrition Powder",
    desc: "A wholesome daily nutrition blend for the whole family, made to support energy, immunity, brain health and balanced routines.",
    bestFor: ["Family Nutrition", "Daily Energy", "Balanced Routine"],
    benefits: [
      "👨‍👩‍👧 Complete Family Nutrition",
      "🥜 Real Dry Fruits & Seeds",
      "⚡ Daily Energy & Stamina",
      "🧠 Supports Brain Health",
      "🛡️ Daily Immunity Support",
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
    images: {
      "1KG": "/products/family-1kg.png",
      "500G": "/products/family-500g.png",
      "250G": "/products/family-250g.png",
    },
    prices: {
      "1KG": { mrp: 1999, offer: 1799 },
      "500G": { mrp: 1099, offer: 999 },
      "250G": { mrp: 599, offer: 499 },
    },
  },
  {
    id: "kids",
    name: "SatvaPusti+ Active Kids",
    subtitle: "Premium Kids Nutrition Powder",
    desc: "A tasty kids-focused nutrition drink designed for growing champions, school energy, brain development and daily immunity.",
    bestFor: ["Kids Growth", "Brain Support", "Daily Immunity"],
    benefits: [
      "📚 Brain Development Support",
      "🦴 Growth & Bone Health",
      "🛡️ Daily Immunity Support",
      "🍌 Real Banana & Nut Formula",
      "⚡ School & Playtime Energy",
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
      "Cocoa Powder",
      "Ragi",
      "Dry Dates",
    ],
    usage: "Mix 1-2 spoons with milk daily. Adjust quantity based on age and appetite.",
    images: {
      "1KG": "/products/active-kids-1kg.png",
      "500G": "/products/active-kids-500g.png",
      "250G": "/products/active-kids-250g.png",
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
    subtitle: "Premium Natural Protein Formula",
    desc: "A performance nutrition formula for fitness users and active lifestyles, crafted to support strength, recovery and clean daily energy.",
    bestFor: ["Protein Support", "Recovery", "Active Lifestyle"],
    benefits: [
      "💪 Protein Rich Formula",
      "⚡ Workout Recovery Support",
      "🔥 Strength & Performance",
      "🥜 Premium Dry Fruits & Seeds",
      "🚫 No Refined Sugar",
      "🌿 Naturally Sweetened Formula",
    ],
    ingredients: [
      "Roasted Chana",
      "Roasted Peanut",
      "Kaju",
      "Badam",
      "Akhrot",
      "Makhana",
      "Banana Powder",
      "Pumpkin Seeds",
      "Watermelon Seeds",
      "Saunf",
      "Elaichi",
      "Cocoa Powder",
      "Ragi",
      "Dry Dates Sweetener",
      "No Added Sugar",
    ],
    usage: "Mix 2 spoons with 200 ml milk or water daily. Use after workouts or as part of your morning routine.",
    images: {
      "1KG": "/products/active-1kg.png",
      "500G": "/products/active-500g.png",
      "250G": "/products/active-250g.png",
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

const ingredients = [
  ["roasted-chana.png", "Roasted Chana"],
  ["peanut.png", "Peanut"],
  ["almond.png", "Almond"],
  ["cashew.png", "Cashew"],
  ["walnut.png", "Walnut"],
  ["makhana.png", "Makhana"],
  ["pumpkin-seed.png", "Pumpkin Seed"],
  ["watermelon-seed.png", "Watermelon Seed"],
  ["banana-power.png", "Banana Powder"],
  ["dhaga-mishri.png", "Dhaga Mishri"],
  ["saunf.png", "Saunf"],
  ["elaichi.png", "Elaichi"],
  ["cocoa-powder.png", "Cocoa Powder"],
  ["date-powder.png", "Date Powder"],
  ["soy-protein.png", "Soy Protein"],
  ["ragi.png", "Ragi"],
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
  const [products, setProducts] = useState(defaultProducts);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [showHomeMenu, setShowHomeMenu] = useState(false);
  const [activeProductTabs, setActiveProductTabs] = useState({});
  const paymentModeRef = useRef("");

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
    city: "",
    pincode: "",
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
    return Number(item?.stock ?? 0);
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
        };
      }

      return {
        id: productId,
        name: product.name || fallbackProduct.name,
        subtitle: product.subtitle || fallbackProduct.subtitle,
        desc: fallbackProduct.desc || product.desc || "",
        bestFor: Array.isArray(product.bestFor) && product.bestFor.length > 0
          ? product.bestFor
          : fallbackProduct.bestFor,
        benefits: fallbackProduct.benefits,
        ingredients: Array.isArray(product.ingredients) && product.ingredients.length > 0
          ? product.ingredients
          : fallbackProduct.ingredients,
        usage: product.usage || fallbackProduct.usage,
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
      }
    };

    loadProducts();
    loadInventory();
  }, []);

  const changeQty = (product, value) => {
    const nextQty = Math.max(1, getQty(product) + value);
    setQty({ ...qty, [product.id]: nextQty });
  };

  const addToCart = (product) => {
    const weight = getWeight(product);
    const quantity = getQty(product);
    const stock = getStock(product.id, weight);
    const price = product.prices[weight];
    const cartId = `${product.id}-${weight}`;
    const existing = cart.find((item) => item.cartId === cartId);
    const existingQty = existing?.quantity || 0;

    if (stock <= 0) {
      alert("This pack is currently out of stock.");
      return;
    }

    if (existingQty + quantity > stock) {
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
        if (item.cartId !== cartId) return item;

        const stock = getStock(item.productId, item.weight);
        const nextQuantity = Math.max(1, item.quantity + value);

        if (nextQuantity > stock) {
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

    setShowCart(false);
    setShowCheckout(true);
    setOrderSuccess(false);
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

  const submitOrderOld = async () => {
    if (
      !address.name ||
      !address.email ||
      !address.mobile ||
      !address.fullAddress ||
      !address.city ||
      !address.pincode
    ) {
      alert("Please complete full shipping address.");
      return;
    }

    if (!paymentMode) {
      alert("Please select COD or UPI payment.");
      return;
    }

    const shipping =
      paymentMode === "UPI" ? "Free Shipping" : "Shipping charges as applicable";

    let orderId = `SP${Date.now()}`;

    const order = {
      id: orderId,
      items: cart,
      total: cartTotal,
      saving: cartSaving,
      paymentMode,
      shipping,
      customer: { ...address },
      status: "Order Created Successfully",

orderStatus: "Received",

paymentStatus: paymentMode === "UPI" ? "Awaiting Verification" : "Pending",
      createdAt: new Date().toLocaleString(),
    };

    const itemsMessage = cart
      .map(
        (item, index) =>
          `${index + 1}) ${item.name}%0A` +
          `Pack: ${item.weight}%0A` +
          `Qty: ${item.quantity}%0A` +
          `Price: â‚¹${item.offer}%0A` +
          `Amount: â‚¹${item.offer * item.quantity}%0A`
      )
      .join("%0A");

    const message =
      `New SatvaPusti Order%0A%0A` +
      `Order ID: ${orderId}%0A%0A` +
      `${itemsMessage}%0A` +
      `----------------------%0A` +
      `Total Amount: â‚¹${cartTotal}%0A` +
      `You Save: â‚¹${cartSaving}%0A` +
      `Payment Method: ${paymentMode}%0A` +
      `Payment Status: ${order.paymentStatus}%0A` +
      `Order Status: ${order.orderStatus}%0A` +
      `UPI Note: ${orderId}|${cartTotal}%0A` +
      `Shipping: ${shipping}%0A%0A` +
      `Customer Name: ${address.name}%0A` +
      `Email: ${address.email}%0A` +
      `Mobile: ${address.mobile}%0A` +
      `Address: ${address.fullAddress}%0A` +
      `City: ${address.city}%0A` +
      `Pincode: ${address.pincode}%0A%0A` +
      `Please confirm this order.`;

    order.whatsappMessage = message;

    const initialOrders = [order, ...myOrders];
    setLastOrder(order);
    setMyOrders(initialOrders);
    setOrderSuccess(true);
    localStorage.setItem("satvapustiOrders", JSON.stringify(initialOrders));

    if (paymentMode === "COD") {
      const whatsappLink = `https://wa.me/${phone}?text=${message}`;
      setTimeout(() => {
        window.location.href = whatsappLink;
      }, 300);
    }

    if (paymentMode === "UPI") {
      const upiLink = makeUpiLink(orderId, cartTotal);
      setTimeout(() => {
        window.location.href = upiLink;
      }, 300);
    }

    try {
      const res = await fetch(`${API_URL}/api/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          customerName: address.name,
          email: address.email,
          mobile: address.mobile,
          address: address.fullAddress,
          city: address.city,
          pincode: address.pincode,
          items: cart,
          totalAmount: cartTotal,
          saving: cartSaving,
          paymentMethod: paymentMode,
          shipping,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
        }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("Order response:", data);
      console.log("STEP 2 response received", data);

      const findSavedOrder = async () => {
        try {
          const customerRes = await fetch(
            `${API_URL}/api/orders/customer/${encodeURIComponent(address.mobile)}`
          );
          const customerOrders = await customerRes.json();

          if (!Array.isArray(customerOrders)) return null;

          return customerOrders.find(
            (saved) =>
              Number(saved.totalAmount) === Number(cartTotal) &&
              saved.paymentMethod === paymentMode &&
              saved.mobile === address.mobile
          );
        } catch (error) {
          console.log("Saved order recovery error:", error);
          return null;
        }
      };

      // Treat order as successful if res.ok OR data.success OR data.order exists
      const isSuccess =
  res.ok ||
  data?.success === true ||
  !!data?.order ||
  !!data?.savedOrder ||
  !!data?.data;
      let recoveredOrder = null;

      if (!isSuccess) {
        recoveredOrder = await findSavedOrder();

        if (!recoveredOrder) {
          alert(data?.message || "Order could not be placed.");
          return;
        }
      }

      // Extract actual order ID from response
      const savedOrder =
        data?.order || data?.savedOrder || data?.newOrder || data?.data || recoveredOrder;
      const savedOrderId =
        savedOrder?.orderId ||
        savedOrder?.id ||
        data?.orderId ||
        data?.id;

      if (savedOrderId) {
        order.id = savedOrderId;
        orderId = savedOrderId;
      }
    } catch (error) {
      console.log("Backend order save error:", error);
    }

    const legacyItemsMessage = cart
      .map(
        (item, index) =>
          `${index + 1}) ${item.name}%0A` +
          `Pack: ${item.weight}%0A` +
          `Qty: ${item.quantity}%0A` +
          `Price: ₹${item.offer}%0A` +
          `Amount: ₹${item.offer * item.quantity}%0A`
      )
      .join("%0A");

    const legacyMessage =
      `🛒 New SatvaPusti Order%0A%0A` +
      `Order ID: ${orderId}%0A%0A` +
      `${itemsMessage}%0A` +
      `----------------------%0A` +
      `Total Amount: ₹${cartTotal}%0A` +
      `You Save: ₹${cartSaving}%0A` +
      `Total Amount: ₹${cartTotal}%0A` +
`You Save: ₹${cartSaving}%0A` +
`Payment Method: ${paymentMode}%0A` +
`Payment Status: ${order.paymentStatus}%0A` +
`Order Status: ${order.orderStatus}%0A` +
`UPI Note: ${orderId}|${cartTotal}%0A` +
`Shipping: ${shipping}%0A%0A` +
`Customer Name: ${address.name}%0A` +
      `Email: ${address.email}%0A` +
      `Mobile: ${address.mobile}%0A` +
      `Address: ${address.fullAddress}%0A` +
      `City: ${address.city}%0A` +
      `Pincode: ${address.pincode}%0A%0A` +
      `Please confirm this order.`;

    order.whatsappMessage = message;

    const updatedOrders = [order, ...myOrders];
    setMyOrders(updatedOrders);
    localStorage.setItem("satvapustiOrders", JSON.stringify(updatedOrders));

    // Set state to show success modal - DO NOT redirect page
    console.log("STEP 3 before success state", order);

setLastOrder(order);
setOrderSuccess(true);

if (false && paymentMode === "COD") {
  const whatsappLink = `https://wa.me/${phone}?text=${message}`;

  setTimeout(() => {
    window.open(
      whatsappLink,
      "_blank",
      "noopener,noreferrer"
    );
  }, 500);
}

if (paymentMode === "UPI") {
  console.log("UPI order ready. Customer can pay from success screen.");
}

console.log("STEP 4 after success state");
console.log("Order Success");
console.log("Order ID:", orderId);
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
      !address.pincode
    ) {
      alert("Please complete full shipping address.");
      return;
    }

    if (!selectedPaymentMode) {
      alert("Please select COD or UPI payment.");
      return;
    }

    setIsSubmittingOrder(true);

    const orderId = `SP${Date.now()}`;
    const shipping =
      selectedPaymentMode === "UPI" ? "Free Shipping" : "Shipping charges as applicable";
    const paymentStatus =
      selectedPaymentMode === "UPI" ? "Awaiting Verification" : "Pending";
    const orderStatus = "Received";

    const itemsText = cart
      .map(
        (item, index) =>
          `${index + 1}) ${item.name}\n` +
          `Pack: ${item.weight}\n` +
          `Qty: ${item.quantity}\n` +
          `Price: Rs. ${item.offer}\n` +
          `Amount: Rs. ${item.offer * item.quantity}`
      )
      .join("\n\n");

    const whatsappText =
      `New SatvaPusti Order\n\n` +
      `Order ID: ${orderId}\n\n` +
      `${itemsText}\n\n` +
      `----------------------\n` +
      `Total Amount: Rs. ${cartTotal}\n` +
      `You Save: Rs. ${cartSaving}\n` +
      `Payment Method: ${selectedPaymentMode}\n` +
      `Payment Status: ${paymentStatus}\n` +
      `Order Status: ${orderStatus}\n` +
      `UPI Note: ${orderId}|${cartTotal}\n` +
      `Shipping: ${shipping}\n\n` +
      `Customer Name: ${address.name}\n` +
      `Email: ${address.email}\n` +
      `Mobile: ${address.mobile}\n` +
      `Address: ${address.fullAddress}\n` +
      `City: ${address.city}\n` +
      `Pincode: ${address.pincode}\n\n` +
      `Please confirm this order.`;

    let finalOrderId = orderId;
    let finalWhatsappText = whatsappText;
    let whatsappMessage = encodeURIComponent(finalWhatsappText);

    const order = {
      id: orderId,
      items: cart,
      total: cartTotal,
      saving: cartSaving,
      paymentMode: selectedPaymentMode,
      shipping,
      customer: { ...address },
      status: "Order Created Successfully",
      orderStatus,
      paymentStatus,
      whatsappMessage,
      createdAt: new Date().toLocaleString(),
    };

    const updatedOrders = [order, ...myOrders];
    setLastOrder(order);
    setMyOrders(updatedOrders);
    setOrderSuccess(true);
    localStorage.setItem("satvapustiOrders", JSON.stringify(updatedOrders));

    const orderPayload = {
      orderId,
      customerName: address.name,
      email: address.email,
      mobile: address.mobile,
      address: address.fullAddress,
      city: address.city,
      pincode: address.pincode,
      items: cart,
      totalAmount: cartTotal,
      saving: cartSaving,
      paymentMethod: selectedPaymentMode,
      shipping,
      orderStatus,
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
        const savedOrder = data?.order || data?.savedOrder || data?.newOrder || data?.data;
        const savedOrderId = savedOrder?.orderId || savedOrder?.id || data?.orderId || data?.id;

      if (savedOrderId && savedOrderId !== orderId) {
        finalOrderId = savedOrderId;
        finalWhatsappText = whatsappText.replace(orderId, savedOrderId);
        whatsappMessage = encodeURIComponent(finalWhatsappText);

        const syncedOrder = {
          ...order,
          id: savedOrderId,
          whatsappMessage,
        };
        const syncedOrders = [syncedOrder, ...myOrders];
        setLastOrder(syncedOrder);
        setMyOrders(syncedOrders);
        localStorage.setItem("satvapustiOrders", JSON.stringify(syncedOrders));
      }
    } catch (error) {
      console.log("Backend order save error:", error);
      alert("Order could not be saved right now. Please try again.");
      setIsSubmittingOrder(false);
      return;
    }

    if (selectedPaymentMode === "COD") {
      window.location.href = `https://wa.me/${phone}?text=${whatsappMessage}`;
      setIsSubmittingOrder(false);
      return;
    }

    const upiLink = makeUpiLink(finalOrderId, cartTotal);
    window.location.href = upiLink;
    setIsSubmittingOrder(false);
  };

  const continueShopping = () => {
    setCart([]);
    setShowCheckout(false);
    setOrderSuccess(false);
    setLastOrder(null);
  };

  return (
    <div>
      <header className="header">
        <div className="logo">
          <span className="logoMark">SP</span>
          <span>SatvaPusti Nutrition</span>
        </div>

        <div className="headerActions">
          <div className="menuDropdown">
            <button
              className="menuToggleBtn"
              onClick={() => setShowHomeMenu((prev) => !prev)}
              aria-expanded={showHomeMenu}
              aria-controls="homeMenuPanel"
            >
              Menu
            </button>
            {showHomeMenu && (
              <nav className="homeMenuPanel" id="homeMenuPanel">
                <a href="#products" onClick={() => setShowHomeMenu(false)}>Products</a>
                <a href="#ingredients" onClick={() => setShowHomeMenu(false)}>Ingredients</a>
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
                <a href="#about" onClick={() => setShowHomeMenu(false)}>About</a>
                <a href="#contact" onClick={() => setShowHomeMenu(false)}>Contact</a>
              </nav>
            )}
          </div>

          <a className="btn" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </div>
      </header>

      <button className="cartFloatBtn" onClick={() => setShowCart(true)}>
        Cart ({cartCount})
      </button>

      <section className="hero">
        <div className="heroFrame">
          <div className="slider">
            {banners.map((banner) => (
              <img key={banner} src={banner} alt="SatvaPusti Banner" />
            ))}
          </div>
          <div className="heroDots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
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
          <b>🌿 Premium Natural Nutrition</b>
          <span>Made with real dry fruits, seeds and wholesome ingredients</span>
        </div>
        <div>
          <b>🚚 Fast &amp; Secure Delivery</b>
          <span>Pan India shipping with trusted delivery partners</span>
        </div>
        <div>
          <b>⭐ Trusted by Families &amp; Fitness Users</b>
          <span>Daily nutrition support for kids, adults and active lifestyles</span>
        </div>
      </section>

      <section id="products" className="section premiumProductsSection">
        <h2>Shop SatvaPusti Nutrition</h2>
        <p className="sectionText">Premium nutrition powders with real ingredients, family-friendly formulas, and fast checkout.</p>

        <div className="premiumProductStack">
          {products.map((product) => {
            const weight = getWeight(product);
            const quantity = getQty(product);
            const mrp = product.prices[weight].mrp;
            const offer = product.prices[weight].offer;
            const save = (mrp - offer) * quantity;
            const total = offer * quantity;
            const savePercent = mrp > 0 ? Math.round(((mrp - offer) / mrp) * 100) : 0;
            const stock = getStock(product.id, weight);
            const isOutOfStock = stock <= 0;
            const isLowStock = stock > 0 && stock < 10;
            const activeTab = activeProductTabs[product.id] || "description";
            const whatsappText = encodeURIComponent(
              `Hi, I want to buy ${product.name} ${weight}. Quantity: ${quantity}.`
            );
            const tabs = [
              ["description", "Description"],
              ["ingredients", "Ingredients"],
              ["howToUse", "How To Use"],
              ["nutrition", "Nutrition Facts"],
            ];
            const premiumBenefits = product.benefits?.length
              ? product.benefits
              : ["Real Ingredients", "Daily Nutrition Support", "No Artificial Colours"];

            return (
              <article className="premiumProductDetail" key={product.id}>
                <div className="premiumGallery">
                  <span className="imageBadge imageBadgePrimary">Best Seller</span>
                  <span className="imageBadge imageBadgeSecondary">Real Ingredients</span>
                  <div className="premiumImageStage">
                    <img src={product.images[weight]} alt={product.name} />
                  </div>
                  <div className="premiumThumbs">
                    {["1KG", "500G", "250G"].map((w) => (
                      <button
                        key={w}
                        className={weight === w ? "activeThumb" : ""}
                        onClick={() => setSelected({ ...selected, [product.id]: w })}
                      >
                        <img src={product.images[w]} alt={`${product.name} ${w}`} />
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
                    <strong>Save {savePercent}%</strong>
                  </div>

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
                    <div className="premiumQty">
                      <button onClick={() => changeQty(product, -1)}>-</button>
                      <span>{quantity}</span>
                      <button onClick={() => changeQty(product, 1)}>+</button>
                    </div>
                    <p className={isOutOfStock ? "stockOut" : isLowStock ? "stockLow" : "stockOk"}>
                      {isOutOfStock ? "Out of stock" : isLowStock ? `Only ${stock} left` : "In Stock"}
                    </p>
                  </div>

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
                        <div><b>Energy</b><span>Daily activity support</span></div>
                        <div><b>Protein</b><span>Growth and strength support</span></div>
                        <div><b>Fiber</b><span>Fullness and digestion support</span></div>
                        <div><b>Natural Mix</b><span>Dry fruits, seeds and grains</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

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

      {showProfile && (
        <div className="modalBg">
          <div className="checkoutBox">
            <button className="closeBtn" onClick={() => setShowProfile(false)}>×</button>

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

                <div className="policyLinks legalPolicyBox">
  <h3>Legal Agreement</h3>

  <p>
  SatvaPusti Nutrition is registered under FSSAI Registration No.
  <b> 20526034000204</b>, issued under the Food Safety and Standards Act, 2006.
</p>
  

  <details>
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

  <details>
    <summary>Privacy Policy</summary>
    <p>
      We collect customer name, mobile number, email address, shipping address,
      order details, and payment mode only for order processing, delivery,
      customer support, and communication. We do not sell customer personal data.
      Customer information may be shared only with delivery partners, payment
      service providers, or legal authorities when required by law.
    </p>
  </details>

  <details>
    <summary>Product Disclaimer</summary>
    <p>
      SatvaPusti products are food and nutrition products, not medicines. They
      are not intended to diagnose, treat, cure, or prevent any disease. Results
      may vary from person to person. Pregnant women, nursing mothers, children,
      elderly persons, and people with medical conditions should consult a doctor
      before use. Please read ingredients carefully before consumption.
    </p>
  </details>

  <details>
    <summary>Return & Refund Policy</summary>
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

      {showCart && (
        <div className="modalBg">
          <div className="checkoutBox">
            <button className="closeBtn" onClick={() => setShowCart(false)}>×</button>

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
                        <p>{item.weight} | ₹{item.offer}</p>

                        <div className="cartQty">
                          <button onClick={() => updateCartQty(item.cartId, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.cartId, 1)}>+</button>
                        </div>

                        <p><b>Amount:</b> ₹{item.offer * item.quantity}</p>
                      </div>

                      <button className="removeBtn" onClick={() => removeFromCart(item.cartId)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cartTotalBox">
                  <p><b>You Save:</b> ₹{cartSaving}</p>
                  <h3>Total: ₹{cartTotal}</h3>
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
            <button className="closeBtn" onClick={closeCheckout}>×</button>

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
                    <p><b>Payment:</b> {lastOrder?.paymentMode}</p>
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
                  <h3>Total: ₹{cartTotal}</h3>
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
                  value={address.mobile}
                  onChange={(e) => setAddress({ ...address, mobile: e.target.value })}
                />

                <textarea
                  placeholder="Full Shipping Address"
                  value={address.fullAddress}
                  onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
                />

                <input
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />

                <input
                  placeholder="Pincode"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                />

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
                </div>

                {paymentMode === "UPI" && (
  <>
    <p className="freeShipping">
      UPI Payment = Free Shipping
    </p>
  </>
)}

<button
  type="button"
  className="submitOrderBtn"
  disabled={isSubmittingOrder}
  onClick={() => {
    submitOrder();
  }}
>
  {isSubmittingOrder ? "Placing Order..." : "Confirm Order"}
</button>
                 
              </>
            )}
          </div>
        </div>
      )}

      <section id="ingredients" className="section cream">
        <h2>Real Ingredients We Use</h2>

        <div className="ingredientGrid">
          {ingredients.map(([img, name]) => (
            <div className="ingredientCard" key={img}>
              <img src={`/ingridients/${img}`} alt={name} />
              <b>{name}</b>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="section about">
        <h2>About SatvaPusti Nutrition</h2>
        <p>
  SatvaPusti Nutrition is a registered food business under FSSAI Registration
  No. <b>20526034000204</b>, approved for General Manufacturing.
</p>

        <div className="aboutText">
          <p>
            SatvaPusti Nutrition provides premium, natural and wholesome nutrition
            for families, children and fitness users.
          </p>
          <p>
            Our products are made with real ingredients, dry fruits, seeds,
            banana powder, dates powder and carefully selected natural ingredients.
          </p>
        </div>

        <div className="whyGrid">
          <div>🌿 Made with Real Ingredients</div>
          <div>🚫 No Artificial Colours</div>
          <div>🚫 No Added Preservatives</div>
          <div>🍌 Real Banana Powder</div>
          <div>💪 Daily Nutrition Support</div>
          <div>✅ Direct WhatsApp Ordering</div>
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
        <h2>Contact SatvaPusti Nutrition</h2>
        <p><strong>Brand:</strong> SatvaPusti Nutrition</p>
        <p><strong>Phone:</strong> +91 96396 30828</p>
        <p><strong>Email:</strong> info@satvapusti.com</p>
        <p><strong>Website:</strong> www.satvapusti.com</p>
        <p><strong>FSSAI Registration No:</strong> 20526034000204</p>
<p><strong>FBO Name:</strong> Satvapusti Nutrition</p>
<p><strong>Business Type:</strong> General Manufacturing</p>
<p><strong>Registered Address:</strong> H No 59, Pendri, Pandri, Berla, Bemetara, Chhattisgarh - 491335</p>
        <p><strong>UPI ID:</strong> 9993265857@ybl</p>

        <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
          Contact on WhatsApp
        </a>

        <p className="footerText">© 2026 SatvaPusti Nutrition. All Rights Reserved.</p>
      </section>
    </div>
  );
}
