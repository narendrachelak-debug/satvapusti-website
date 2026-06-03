import { useState } from "react";
import "./App.css";

const phone = "919639630828";
const upiId = "9993265857@ybl";

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
  const [selected, setSelected] = useState({});
  const [qty, setQty] = useState({});
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [paymentMode, setPaymentMode] = useState("");
  const [orders, setOrders] = useState([]);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [address, setAddress] = useState({
    name: "",
    mobile: "",
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

  const openCheckout = (product) => {
    setCheckoutProduct(product);
    setPaymentMode("");
    setOrderSuccess(false);
    setAddress({
      name: "",
      mobile: "",
      fullAddress: "",
      city: "",
      pincode: "",
    });
  };

  const closeCheckout = () => {
    setCheckoutProduct(null);
    setPaymentMode("");
    setOrderSuccess(false);
  };

  const submitOrder = () => {
    if (
      !address.name ||
      !address.mobile ||
      !address.fullAddress ||
      !address.city ||
      !address.pincode
    ) {
      alert("Please shipping address complete karo.");
      return;
    }

    if (!paymentMode) {
      alert("Please COD ya UPI payment select karo.");
      return;
    }

    const product = checkoutProduct;
    const weight = getWeight(product);
    const quantity = getQty(product);
    const mrp = product.prices[weight].mrp;
    const offer = product.prices[weight].offer;
    const save = (mrp - offer) * quantity;
    const total = offer * quantity;
    const shipping = paymentMode === "UPI" ? "Free Shipping" : "Shipping charges as applicable";

    const order = {
      id: Date.now(),
      product: product.name,
      weight,
      quantity,
      mrp,
      offer,
      save,
      total,
      paymentMode,
      shipping,
      customer: { ...address },
      status: "Order Placed Successfully",
    };

    setOrders([order, ...orders]);
    setOrderSuccess(true);

    const message =
      `🛒 New SatvaPusti Order%0A%0A` +
      `Product: ${product.name}%0A` +
      `Pack Size: ${weight}%0A` +
      `Quantity: ${quantity}%0A` +
      `MRP: ₹${mrp}%0A` +
      `Offer Price: ₹${offer}%0A` +
      `You Save: ₹${save}%0A` +
      `Total Amount: ₹${total}%0A` +
      `Payment Method: ${paymentMode}%0A` +
      `Shipping: ${shipping}%0A%0A` +
      `Customer Name: ${address.name}%0A` +
      `Mobile: ${address.mobile}%0A` +
      `Address: ${address.fullAddress}%0A` +
      `City: ${address.city}%0A` +
      `Pincode: ${address.pincode}%0A%0A` +
      `Please confirm this order.`;

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");

    if (paymentMode === "UPI") {
      const upiLink =
        `upi://pay?pa=${upiId}` +
        `&pn=SatvaPusti%20Nutrition` +
        `&am=${total}` +
        `&cu=INR` +
        `&tn=${encodeURIComponent(product.name + " " + weight)}`;

      setTimeout(() => {
        window.location.href = upiLink;
      }, 1200);
    }
  };

  return (
    <div>
      <header className="header">
        <div className="logo">🌿 SatvaPusti Nutrition</div>

        <nav>
          <a href="#products">Products</a>
          <a href="#ingredients">Ingredients</a>
          <a href="#orders">Orders</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="btn" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      </header>

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
        <p className="sectionText">Product select karo, address bharo, COD ya UPI choose karo.</p>

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

                <button className="placeBtn" onClick={() => openCheckout(product)}>
                  Place Order
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {checkoutProduct && (
        <div className="modalBg">
          <div className="checkoutBox">
            <button className="closeBtn" onClick={closeCheckout}>×</button>

            {orderSuccess ? (
              <div className="successBox">
                <h2>✅ Order Placed Successfully</h2>
                <p>Order details company WhatsApp par send ho gaye hain.</p>
                {paymentMode === "UPI" && (
                  <p>UPI payment window open ho gayi hai. Payment complete karo.</p>
                )}
              </div>
            ) : (
              <>
                <h2>Shipping Address</h2>

                <input
                  placeholder="Full Name"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
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
                  <p className="freeShipping">UPI Payment पर Shipping Free</p>
                )}

                <button className="submitOrderBtn" onClick={submitOrder}>
                  Confirm Order
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <section id="orders" className="section ordersSection">
        <h2>Order Records</h2>
        <p className="sectionText">Latest orders placed from this device.</p>

        {orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <div className="ordersGrid">
            {orders.map((order) => (
              <div className="orderCard" key={order.id}>
                <h3>{order.status}</h3>
                <p><b>Product:</b> {order.product}</p>
                <p><b>Pack:</b> {order.weight}</p>
                <p><b>Qty:</b> {order.quantity}</p>
                <p><b>Total:</b> ₹{order.total}</p>
                <p><b>Payment:</b> {order.paymentMode}</p>
                <p><b>Customer:</b> {order.customer.name}</p>
                <p><b>Mobile:</b> {order.customer.mobile}</p>
              </div>
            ))}
          </div>
        )}
      </section>

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
        <p><strong>FSSAI License No:</strong> XXXXXXXX</p>
        <p><strong>UPI ID:</strong> 9993265857@ybl</p>

        <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
          Contact on WhatsApp
        </a>

        <p className="footerText">© 2026 SatvaPusti Nutrition. All Rights Reserved.</p>
      </section>
    </div>
  );
}