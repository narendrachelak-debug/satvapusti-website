import { useEffect, useState } from "react";
import "./App.css";

const phone = "919639630828";
const upiId = "9993265857@ybl";
const API_URL = "https://satvapusti-website.onrender.com";

const banners = [
  "/banners/banner-family.png",
  "/banners/banner-active-kids.png",
  "/banners/banner-active.png",
];

const products = [
  {
    id: "family",
    name: "SatvaPusti+ Family",
    subtitle: "Premium Nutrition Powder",
    desc: "Complete nutrition for every member of your family.",
    bestFor: ["Family Nutrition", "Daily Energy", "Balanced Routine"],
    benefits: ["Real dry fruits and seeds", "Daily nutrition support", "No artificial colours"],
    usage: "Daily 2 spoon ko 200 ml milk ya warm water me mix karke piyein.",
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
    desc: "Growth, brain, immunity and daily energy support.",
    bestFor: ["Kids Growth", "Brain Support", "Daily Immunity"],
    benefits: ["Kids-focused nutrition", "Real banana and nuts", "Tasty daily drink"],
    usage: "Daily 1-2 spoon ko milk me mix karke dein. Age/appetite ke hisaab se quantity adjust karein.",
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
    desc: "Fuel your strength, boost recovery and achieve your best.",
    bestFor: ["Protein Support", "Recovery", "Active Lifestyle"],
    benefits: ["Strength routine support", "Natural protein formula", "Energy and recovery"],
    usage: "Daily 2 spoon ko 200 ml milk ya water me mix karein. Workout ke baad ya morning routine me le sakte hain.",
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
  const getStock = (productId, weight) => {
    const item = inventory.find(
      (stockItem) => stockItem.productId === productId && stockItem.weight === weight
    );
    return Number(item?.stock ?? 0);
  };

  useEffect(() => {
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

 const makeUpiLink = (currentOrderId = lastOrder?.id) => {
  const note = currentOrderId
    ? `${currentOrderId}|${cartTotal}`
    : `SatvaPusti|${cartTotal}`;

  return (
    `upi://pay?pa=${upiId}` +
    `&pn=SatvaPusti%20Nutrition` +
    `&am=${cartTotal}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(note)}`
  );
};

  const saveProfile = () => {
    if (!profile.name || !profile.email || !profile.mobile) {
      alert("Name, email aur mobile fill karo.");
      return;
    }

    if (!profile.acceptedTerms) {
      alert("Terms, Disclaimer, Privacy Policy aur Return Policy accept karna zaroori hai.");
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
      alert("Cart empty hai. Pehle product add karo.");
      return;
    }

    setShowCart(false);
    setShowCheckout(true);
    setOrderSuccess(false);
    setPaymentMode("");

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
    setPaymentMode("");
    setOrderSuccess(false);
  };

  const submitOrder = async () => {
    console.log("STEP 1 submit clicked");

    if (
      !address.name ||
      !address.email ||
      !address.mobile ||
      !address.fullAddress ||
      !address.city ||
      !address.pincode
    ) {
      alert("Please name, email, mobile aur shipping address complete karo.");
      return;
    }

    if (!paymentMode) {
      alert("Please COD ya UPI payment select karo.");
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
      const isSuccess = res.ok || data?.success || data?.order;
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
      alert("Order could not be saved right now. Please try again.");
      return;
    }

    const itemsMessage = cart
      .map(
        (item, index) =>
          `${index + 1}) ${item.name}%0A` +
          `Pack: ${item.weight}%0A` +
          `Qty: ${item.quantity}%0A` +
          `Price: ₹${item.offer}%0A` +
          `Amount: ₹${item.offer * item.quantity}%0A`
      )
      .join("%0A");

    const message =
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
    console.log("STEP 4 after success state");

    // Handle payment method flow AFTER success modal is set
    if (paymentMode === "COD") {
      const whatsappLink = `https://wa.me/${phone}?text=${message}`;

      try {
        window.open(whatsappLink, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.log("WhatsApp window error:", error);
        // Still show success modal even if window.open fails
      }
    }

    if (paymentMode === "UPI") {
      const upiLink = makeUpiLink(orderId);
      console.log("Generated UPI link:", upiLink);

      try {
        // Open UPI in new window, don't redirect main page
        window.open(upiLink, "_blank");
      } catch (error) {
        console.log("UPI window error:", error);
        // Still show success modal even if window.open fails
      }
    }
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

        <nav>
          <a href="#products">Products</a>
          <a href="#ingredients">Ingredients</a>
          <a href="/?page=track-order">Track Order</a>
          <a href="#faq">FAQ</a>
          <button className="profileNavBtn" onClick={() => setShowProfile(true)}>
            Profile
          </button>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="btn" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
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
          <b>Fresh Manufacturing</b>
          <span>Prepared by Satvapusti Nutrition, General Manufacturing FBO.</span>
        </div>
        <div>
          <b>COD + UPI Prepaid</b>
          <span>Choose cash on delivery or UPI payment with quick support.</span>
        </div>
        <div>
          <b>Order Tracking</b>
          <span>Track with Order ID and mobile number after placing order.</span>
        </div>
      </section>

      <section id="products" className="section">
        <h2>Order SatvaPusti Products</h2>
        <p className="sectionText">Product select karo, cart me add karo, ek saath order karo.</p>

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
              <p className="sectionText">Cart empty hai.</p>
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

                <button className="submitOrderBtn" onClick={openCheckout}>
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
                  <p>Order ID save kar lijiye. Dispatch updates WhatsApp/order tracking par milenge.</p>
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
        const upiUrl = makeUpiLink(lastOrder?.id);
        try {
          window.open(upiUrl, "_blank");
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
                    className={paymentMode === "COD" ? "selectedPay" : ""}
                    onClick={() => setPaymentMode("COD")}
                  >
                    <b>COD</b>
                    <span>Pay when order is delivered</span>
                  </button>

                  <button
                    className={paymentMode === "UPI" ? "selectedPay" : ""}
                    onClick={() => setPaymentMode("UPI")}
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
  className="submitOrderBtn"
  onClick={submitOrder}
>
  Confirm Order
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
          Ordering, payment and product use ke common answers yahan mil jayenge.
        </p>

        <div className="faqGrid">
          <details>
            <summary>SatvaPusti products kaise use karein?</summary>
            <p>
              Product ko milk ya warm water ke saath daily routine me use kar sakte hain.
              Children, elderly, pregnant women ya medical condition wale customers doctor
              se advice lekar use karein.
            </p>
          </details>

          <details>
            <summary>COD available hai?</summary>
            <p>
              Haan, COD available hai. COD orders me payment delivery ke time collect hota hai.
            </p>
          </details>

          <details>
            <summary>UPI prepaid ka kya benefit hai?</summary>
            <p>
              UPI prepaid orders me free shipping benefit milta hai. Payment ke baad WhatsApp
              confirmation bhej dein, admin verification ke baad order process hota hai.
            </p>
          </details>

          <details>
            <summary>Order track kaise karein?</summary>
            <p>
              Header me Track Order par click karke Order ID aur mobile number se latest order
              status dekh sakte hain.
            </p>
          </details>

          <details>
            <summary>FSSAI registration hai?</summary>
            <p>
              Haan. Satvapusti Nutrition ka FSSAI Registration No. 20526034000204 hai.
            </p>
          </details>

          <details>
            <summary>Return ya replacement kab milega?</summary>
            <p>
              Food safety ke karan opened product returnable nahi hai. Wrong, damaged,
              expired ya manufacturing defect product ke case me 48 hours ke andar clear
              photo/video proof ke saath report karein.
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
