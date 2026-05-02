import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function InstituteRegisterSettings() {
  const { user } = useAuth();

  const [inputValue, setInputValue] = useState("");
  const [prefix, setPrefix] = useState("");
  const [counter, setCounter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ---------------- LOAD EXISTING ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDoc(doc(db, "trainers", user.uid));

      if (snap.exists()) {
        const data = snap.data();

        if (data.registerConfig) {
          setPrefix(data.registerConfig.prefix || "");
          setCounter(data.registerConfig.counter || "");
          setInputValue(
            `${data.registerConfig.prefix}${data.registerConfig.counter}`,
          );
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user.uid]);

  /* ---------------- SPLIT FUNCTION ---------------- */
  const splitValue = (value) => {
    const match = value.match(/^([a-zA-Z0-9]+?)(\d+)$/);

    if (!match) return null;

    return {
      prefix: match[1],
      counter: Number(match[2]),
    };
  };

  /* ---------------- HANDLE INPUT ---------------- */
  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const result = splitValue(value);

    if (result) {
      setPrefix(result.prefix);
      setCounter(result.counter);
    }
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!prefix || !counter) {
      alert("Please enter valid register number");
      return;
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, "trainers", user.uid), {
        registerConfig: {
          prefix,
          counter: Number(counter),
        },
      });

      alert("Register settings saved successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8">
        {/* TITLE */}
        <h2 className="text-2xl font-bold text-orange-500 mb-4">
          Register Number Settings
        </h2>

        {/* DESCRIPTION */}
        <p className="text-gray-600 mb-6">
          Set your institute register number format. This will automatically
          increase for each new student.
        </p>

        {/* INPUT */}
        <div className="flex flex-col gap-2 mb-6">
          <label className="font-semibold">
            Enter Starting Register Number
          </label>

          <input
            value={inputValue}
            onChange={handleChange}
            placeholder="Example: 222691a3220"
            className="h-12 px-4 border rounded-lg focus:outline-none focus:border-orange-500"
          />

          <p className="text-xs text-gray-500">
            Example: 222691a3220 → next will be 222691a3221
          </p>
        </div>

        {/* PREVIEW */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h4 className="font-semibold mb-2">Preview</h4>

          <p>
            <strong>Prefix:</strong> {prefix || "-"}
          </p>
          <p>
            <strong>Current Number:</strong> {counter || "-"}
          </p>
          <p className="mt-2 text-green-600 font-semibold">
            Next Register Number:{" "}
            {prefix && counter ? `${prefix}${Number(counter) + 1}` : "-"}
          </p>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-lg text-white font-semibold 
            ${saving ? "bg-gray-400" : "bg-orange-500 hover:bg-orange-600"}`}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {/* EXAMPLE BOX */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p className="font-semibold mb-2">How it works:</p>

          <ul className="list-disc ml-5 space-y-1">
            <li>
              You enter: <b>222691a3220</b>
            </li>
            <li>
              System stores prefix: <b>222691a</b>
            </li>
            <li>
              System stores counter: <b>3220</b>
            </li>
            <li>
              Next student gets: <b>222691a3221</b>
            </li>
            <li>
              Next → <b>222691a3222</b>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
