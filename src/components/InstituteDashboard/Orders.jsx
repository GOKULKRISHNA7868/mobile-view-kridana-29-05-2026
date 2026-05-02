import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

const DELIVERY_STATUSES = [
  "",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const ProductsOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const currentUser = auth.currentUser;

  // Search / Filters
  const [searchText, setSearchText] = useState("");
  const [filterOrderStatus, setFilterOrderStatus] = useState("");
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    // 1️⃣ Fetch all products created by this user
    const productsQuery = query(
      collection(db, "products"),
      where("instituteUID", "==", currentUser.uid),
    );
    const unsubProducts = onSnapshot(productsQuery, (snap) => {
      const myProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(myProducts);
    });

    // 2️⃣ Fetch all orders
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(allOrders);
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [currentUser]);

  // Update order fields
  const updateOrder = async (orderId, updates) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update order");
    }
  };

  // Build a set of your product IDs
  const myProductIds = new Set(products.map((p) => p.id));

  // Filter orders to only those containing your products
  const filteredOrders = orders
    .map((order) => ({
      ...order,
      items: order.items.filter((item) => myProductIds.has(item.productId)),
    }))
    .filter((order) => order.items.length > 0)
    .filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchText.toLowerCase()) ||
        order.userEmail?.toLowerCase().includes(searchText.toLowerCase());

      const matchesOrderStatus =
        !filterOrderStatus || order.orderStatus === filterOrderStatus;
      const matchesDeliveryStatus =
        !filterDeliveryStatus ||
        (order.deliveryStatus || "") === filterDeliveryStatus;

      return matchesSearch && matchesOrderStatus && matchesDeliveryStatus;
    });

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        Please login to view orders
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-700 font-medium">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-orange-500">
        Orders for My Products
      </h1>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="Search by Order ID or Buyer Email"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded w-full md:w-1/2 text-sm"
        />
        <select
          value={filterOrderStatus}
          onChange={(e) => setFilterOrderStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">All Order Status</option>
          <option value="placed">Placed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterDeliveryStatus}
          onChange={(e) => setFilterDeliveryStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">All Delivery Status</option>
          {DELIVERY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || "Not Set"}
            </option>
          ))}
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-gray-600">No orders found for your products.</p>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-300 rounded-xl bg-white shadow-md p-5 text-gray-900"
            >
              {/* HEADER */}
              <div className="flex justify-between flex-wrap gap-3 mb-3">
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">Order ID:</span>{" "}
                    <span className="font-mono">{order.id}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Buyer:</span>{" "}
                    {order.userEmail}
                  </p>
                </div>
                <div className="text-sm">
                  <p>
                    <span className="font-semibold">Order Status:</span>{" "}
                    {order.orderStatus}
                  </p>
                  <p>
                    <span className="font-semibold">Payment:</span>{" "}
                    {order.paymentMethod} ({order.paymentStatus})
                  </p>
                </div>
              </div>

              {/* ITEMS */}
              <div className="border rounded-lg p-3 bg-gray-50 mb-4">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center border-b last:border-none py-2"
                  >
                    <div>
                      <p className="font-semibold text-sm">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-600">
                        Qty: {item.quantity}
                        {item.selectedSize && ` · Size: ${item.selectedSize}`}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      ₹{" "}
                      {(item.productPrice * item.quantity).toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* DELIVERY UPDATE */}
              {/* DELIVERY UPDATE - ONLY ADMIN UPDATES THESE FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                {/* Delivery Status */}
                <div>
                  <label className="font-semibold block mb-1">
                    Delivery Status
                  </label>
                  <select
                    value={order.deliveryStatus || ""}
                    onChange={(e) =>
                      updateOrder(order.id, { deliveryStatus: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    {DELIVERY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s || "Not Set"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Partner */}
                <div>
                  <label className="font-semibold block mb-1">
                    Delivery Partner
                  </label>
                  <input
                    placeholder="Not Set"
                    defaultValue={order.deliveryPartner || ""}
                    onBlur={(e) =>
                      updateOrder(order.id, { deliveryPartner: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                  />
                </div>

                {/* Tracking Number */}
                <div>
                  <label className="font-semibold block mb-1">
                    Tracking Number
                  </label>
                  <input
                    placeholder="Not Set"
                    defaultValue={order.trackingNumber || ""}
                    onBlur={(e) =>
                      updateOrder(order.id, { trackingNumber: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                  />
                </div>

                {/* Expected Delivery */}
                <div>
                  <label className="font-semibold block mb-1">
                    Expected Delivery
                  </label>
                  <input
                    type="date"
                    defaultValue={
                      order.expectedDeliveryDate
                        ? order.expectedDeliveryDate.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      updateOrder(order.id, {
                        expectedDeliveryDate: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-3 font-semibold text-sm">
                Grand Total: ₹ {order.grandTotal?.toLocaleString("en-IN")}
              </div>

              {/* DELIVERY ADDRESS */}
              {order.deliveryAddress && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  <p className="font-semibold mb-1">Delivery Address</p>
                  <p>{order.deliveryAddress}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsOrders;
