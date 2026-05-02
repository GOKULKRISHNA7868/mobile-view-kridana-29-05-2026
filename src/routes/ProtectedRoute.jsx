import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ProtectedRoute({ children, role }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      // 🔹 ROLE CHECK
      let hasRole = false;

      if (role === "trainer") {
        const snap = await getDoc(doc(db, "trainers", user.uid));
        hasRole = snap.exists();
      }

      if (role === "institute") {
        const snap = await getDoc(doc(db, "institutes", user.uid));
        hasRole = snap.exists();
      }

      if (!hasRole) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      // 🔹 PLAN CHECK
      const planSnap = await getDoc(doc(db, "plans", user.uid));
      if (!planSnap.exists()) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const plan = planSnap.data();
      const now = Date.now();

      if (
        plan.currentPlan?.status !== "active" ||
        plan.currentPlan?.endDate?.toMillis() < now
      ) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      // ✅ ALL CHECKS PASSED
      setAllowed(true);
      setLoading(false);
    });

    return () => unsub();
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking access...
      </div>
    );
  }

  return allowed ? children : <Navigate to="/plans" replace />;
}
