import React from "react";

export default function PayTest() {
  const handlePay = async () => {
    try {
      const response = await fetch(
        "https://backendpaymentserver.onrender.com/api/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();

      console.log("Backend Data:", data);

      if (!data.encRequest || !data.access_code) {
        alert("Invalid payment data from server");
        return;
      }

      // ✅ Official CCAvenue PROD URL
      const CCAVENUE_URL =
        "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

      // Create dynamic form
      const form = document.createElement("form");
      form.method = "POST";
      form.action = CCAVENUE_URL;

      const encInput = document.createElement("input");
      encInput.type = "hidden";
      encInput.name = "encRequest";
      encInput.value = data.encRequest;

      const accInput = document.createElement("input");
      accInput.type = "hidden";
      accInput.name = "access_code";
      accInput.value = data.access_code;

      form.appendChild(encInput);
      form.appendChild(accInput);
      document.body.appendChild(form);

      console.log("Submitting form to CCAvenue...");
      form.submit();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment initialization failed");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Test Payment</h2>
      <button onClick={handlePay} style={{ padding: 12 }}>
        Pay ₹1
      </button>
    </div>
  );
}
