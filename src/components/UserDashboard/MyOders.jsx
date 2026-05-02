import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  /* ===============================
     FETCH USER ORDERS (LIVE)
  =============================== */
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "orders"), where("userUID", "==", user.uid));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setOrders(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  /* ===============================
     CANCEL ORDER + RESTORE STOCK
  =============================== */
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await transaction.get(orderRef);

        if (!orderSnap.exists()) throw new Error("Order not found");

        const orderData = orderSnap.data();

        if (orderData.orderStatus !== "placed") {
          throw new Error("Order cannot be cancelled");
        }

        // Restore stock
        for (const item of orderData.items) {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) continue;

          const productData = productSnap.data();

          transaction.update(productRef, {
            stockAvailable: (productData.stockAvailable || 0) + item.quantity,
          });
        }

        transaction.update(orderRef, {
          orderStatus: "cancelled",
          cancelledAt: serverTimestamp(),
        });
      });

      alert("Order cancelled successfully");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  /* ===============================
     STATES
  =============================== */
  if (!user) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold bg-white rounded-xl shadow">
        Please login to view your orders
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-black font-medium bg-white rounded-xl shadow">
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-orange-600">My Orders</h1>

      {orders.length === 0 ? (
        <div className="p-6 bg-white rounded-xl shadow text-black font-medium">
          You have no orders yet.
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white/95 border border-black/10 rounded-2xl p-6 shadow-lg text-black"
            >
              {/* HEADER */}
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">
                    Order ID:
                    <span className="ml-2 font-mono bg-black/5 px-2 py-0.5 rounded">
                      {order.id}
                    </span>
                  </p>

                  <span
                    className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                      order.orderStatus === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {order.orderStatus.toUpperCase()}
                  </span>
                </div>

                {order.orderStatus === "placed" && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              {/* ITEMS */}
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 border-b border-black/10 pb-4"
                  >
                    <img
                      src={item.productImage || "/placeholder.jpg"}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-lg border"
                    />

                    <div className="flex-1">
                      <p className="font-semibold text-base">
                        {item.productName}
                      </p>
                      {item.selectedSize && (
                        <p className="text-sm text-black/70">
                          Size: {item.selectedSize}
                        </p>
                      )}
                      <p className="text-sm text-black/70">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <p className="font-semibold text-base">
                      ₹{" "}
                      {(item.productPrice * item.quantity).toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="flex flex-wrap justify-between items-center gap-3 mt-5 text-sm">
                <p className="font-semibold">
                  Total: ₹ {order.grandTotal.toLocaleString("en-IN")}
                </p>
                <p className="text-black/70">
                  Payment Method: {order.paymentMethod}
                </p>
              </div>

              {/* DELIVERY STATUS */}
              <div className="mt-4 p-4 bg-black/5 rounded-lg text-sm space-y-2">
                <p className="font-semibold mb-1">Delivery Details</p>
                <p>
                  <span className="font-medium">Status: </span>
                  {order.deliveryStatus || "Not Set"}
                </p>
                <p>
                  <span className="font-medium">Delivery Partner: </span>
                  {order.deliveryPartner || "Not Set"}
                </p>
                <p>
                  <span className="font-medium">Tracking Number: </span>
                  {order.trackingNumber || "Not Set"}
                </p>
                <p>
                  <span className="font-medium">Expected Delivery: </span>
                  {order.expectedDeliveryDate
                    ? new Date(order.expectedDeliveryDate).toLocaleDateString(
                        "en-IN",
                      )
                    : "Not Set"}
                </p>
              </div>

              {/* ADDRESS */}
              <div className="mt-4 p-4 bg-black/5 rounded-lg text-sm">
                <p className="font-semibold mb-1">Delivery Address</p>
                <p className="whitespace-pre-line text-black/80">
                  {order.deliveryAddress}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrders;
