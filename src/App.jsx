import { useState } from "react";
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

  const changeQty = (product, value) => {
    const nextQty = Math.max(1, getQty(product) + value);
    setQty({ ...qty, [product.id]: nextQty });
  };

  const addToCart = (product) => {
    const weight = getWeight(product);
    const quantity = getQty(product);
    const price = product.prices[weight];
    const cartId = `${product.id}-${weight}`;
    const existing = cart.find((item) => item.cartId === cartId);

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
      cart.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity: Math.max(1, item.quantity + value) }
          : item
      )
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

    const orderId = `SP${Date.now()}`;

    const order = {
      id: orderId,
      items: cart,
      total: cartTotal,
      saving: cartSaving,
      paymentMode,
      shipping,
      customer: { ...address },
      status: "Order Placed Successfully",

orderStatus: "Received",

paymentStatus: paymentMode === "UPI" ? "Awaiting Verification" : "Pending",
      createdAt: new Date().toLocaleString(),
    };

    try {
      await fetch(`${API_URL}/api/orders/create`, {
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
    } catch (error) {
      console.log("Backend order save error:", error);
    }

    const updatedOrders = [order, ...myOrders];
    setMyOrders(updatedOrders);
    localStorage.setItem("satvapustiOrders", JSON.stringify(updatedOrders));

    setLastOrder(order);
    setOrderSuccess(true);

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
      `Payment Method: ${paymentMode}%0A` +
Payment Status: ${order.paymentStatus}%0A +
Order Status: ${order.orderStatus}%0A +
UPI Note: ${orderId}|${cartTotal}%0A +
Shipping: ${shipping}%0A%0A +
      `Customer Name: ${address.name}%0A` +
      `Email: ${address.email}%0A` +
      `Mobile: ${address.mobile}%0A` +
      `Address: ${address.fullAddress}%0A` +
      `City: ${address.city}%0A` +
      `Pincode: ${address.pincode}%0A%0A` +
      `Please confirm this order.`;

    if (paymentMode === "COD") {
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
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
        <div className="logo">🌿 SatvaPusti Nutrition</div>

        <nav>
          <a href="#products">Products</a>
          <a href="#ingredients">Ingredients</a>
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
        🛒 Cart ({cartCount})
      </button>

      <section className="hero">
        <div className="slider">
          {banners.map((banner) => (
            <img key={banner} src={banner} alt="SatvaPusti Banner" />
          ))}
        </div>
      </section>

      <section className="trust">
        <div>🌿 Real Ingredients</div>
        <div>🚫 No Artificial Colours</div>
        <div>✅ No Added Preservatives</div>
        <div>📦 Fresh Batch Production</div>
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

            return (
              <div className="productCard" key={product.id}>
                <h3>{product.name}</h3>
                <h4>{product.subtitle}</h4>
                <p>{product.desc}</p>

                <img className="mainProductImg" src={product.images[weight]} alt={product.name} />

                <div className="weightButtons">
                  {["1KG", "500G", "250G"].map((w) => (
                    <button
                      key={w}
                      className={weight === w ? "activeWeight" : ""}
                      onClick={() => setSelected({ ...selected, [product.id]: w })}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                <div className="priceBox">
                  <p>MRP: <span className="cutPrice">₹{mrp}</span></p>
                  <p>Offer Price: <span className="offerPrice">₹{offer}</span></p>
                  <p className="saveText">You Save ₹{save}</p>
                  <p>Total: <span className="offerPrice">₹{total}</span></p>
                </div>

                <div className="qtyBox">
                  <button onClick={() => changeQty(product, -1)}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => changeQty(product, 1)}>+</button>
                </div>

                <button className="placeBtn" onClick={() => addToCart(product)}>
                  Add to Cart
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

                <button className="submitOrderBtn" onClick={saveProfile}>
                  Login / Save Profile
                </button>

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
                    <p><b>Order ID:</b> {lastOrder.id}</p>
                    {lastOrder.items.map((item) => (
                      <p key={item.cartId}>
                        <b>{item.name}</b> - {item.weight} × {item.quantity} = ₹
                        {item.offer * item.quantity}
                      </p>
                    ))}
                    <hr />
                    <p><b>Total:</b> ₹{lastOrder.total}</p>
                    <p><b>Payment:</b> {lastOrder.paymentMode}</p>
                    <p><b>Status:</b> {lastOrder.orderStatus}</p>
                  </div>
                )}

                {paymentMode === "UPI" && (
                  <div className="upiBox">
                    <a className="upiPayBtn" href={makeUpiLink(lastOrder?.id)}>
  Pay Now via UPI App
</a>
                    <p><b>UPI ID:</b> {upiId}</p>
                    <p><b>Amount:</b> ₹{cartTotal}</p>
                    <p>Desktop par UPI app open na ho to UPI ID copy karke payment karo.</p>
                  </div>
                )}

                <p className="successNote">Order successfully place ho gaya hai.</p>
                <p className="successNote">Customer ko email confirmation bheja jayega.</p>

                <button className="submitOrderBtn" onClick={continueShopping}>
                  Continue Shopping
                </button>
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
                    COD
                  </button>

                  <button
                    className={paymentMode === "UPI" ? "selectedPay" : ""}
                    onClick={() => setPaymentMode("UPI")}
                  >
                    UPI Payment
                  </button>
                </div>

                {paymentMode === "UPI" && (
                  <>
                    <p className="freeShipping">UPI Payment पर Shipping Free</p>
                    <a className="upiPayBtn" href={makeUpiLink()}>
                      Pay Now via UPI
                    </a>
                  </>
                )}

                <button className="submitOrderBtn" onClick={submitOrder}>
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