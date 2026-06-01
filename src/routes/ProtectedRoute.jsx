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

      let hasRole = false;

      if (role === "trainer") {
        const snap = await getDoc(doc(db, "trainers", user.uid));
        hasRole = snap.exists();
      }

      if (role === "institute") {
        const snap = await getDoc(doc(db, "institutes", user.uid));
        hasRole = snap.exists();
      }

      setAllowed(hasRole);
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

  return allowed ? children : <Navigate to="/" replace />;
}
