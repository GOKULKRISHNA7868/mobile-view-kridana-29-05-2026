import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";

const SubscriptionPage = () => {
  const { user, institute } = useAuth();
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      const ref = doc(db, "plans", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPlanData(snap.data());
      }
      setLoading(false);
    };
    fetchPlan();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-semibold">
        Loading subscription details...
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="text-center mt-20 text-red-500 font-semibold">
        No subscription data found
      </div>
    );
  }

  const { currentPlan, history, status, freeTrialUsed } = planData;

  const start = dayjs(currentPlan.startDate.toDate());
  const end = dayjs(currentPlan.endDate.toDate());
  const remainingDays = end.diff(dayjs(), "day");

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Current Plan */}
        <div className="bg-white text-gray-900 rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-orange-500 mb-4">Current Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info label="Plan Type" value={currentPlan.planType} />
            <Info label="Status" value={status} />
            <Info
              label="Free Trial Used"
              value={freeTrialUsed ? "Yes" : "No"}
            />
            <Info label="Start Date" value={start.format("DD MMM YYYY")} />
            <Info label="End Date" value={end.format("DD MMM YYYY")} />
            <Info
              label="Days Remaining"
              value={remainingDays > 0 ? `${remainingDays} days` : "Expired"}
              highlight={remainingDays <= 5}
            />
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white text-gray-900 rounded-2xl shadow p-6">
          <h3 className="font-semibold mb-3">Plan Usage Timeline</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="h-4 rounded-full bg-green-500"
              style={{
                width: `${Math.min(
                  100,
                  (dayjs().diff(start, "day") / end.diff(start, "day")) * 100,
                )}%`,
              }}
            />
          </div>
        </div>

        {/* History */}
        <div className="bg-white text-gray-900 rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-orange-500 mb-4">Subscription History</h2>
          {history?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Plan</Th>
                    <Th>Role</Th>
                    <Th>Start</Th>
                    <Th>End</Th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-t text-center">
                      <Td>{h.planType}</Td>
                      <Td>{h.role}</Td>
                      <Td>
                        {dayjs(h.startDate.toDate()).format("DD MMM YYYY")}
                      </Td>
                      <Td>{dayjs(h.endDate.toDate()).format("DD MMM YYYY")}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No history available</p>
          )}
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow p-6 flex flex-col md:flex-row justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Upgrade Your Plan</h3>
            <p className="text-sm opacity-90">
              Unlock trainers, students, salary & payment automation
            </p>
          </div>
          <button className="mt-4 md:mt-0 bg-white text-indigo-600 font-semibold px-6 py-2 rounded-xl shadow">
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value, highlight }) => (
  <div
    className={`p-4 rounded-xl border ${
      highlight ? "bg-red-50 border-red-400" : "bg-gray-50"
    }`}
  >
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-lg">{value}</p>
  </div>
);

const Th = ({ children }) => (
  <th className="px-4 py-2 text-sm font-semibold border text-gray-900">
    {children}
  </th>
);

const Td = ({ children }) => (
  <td className="px-4 py-2 text-sm border text-gray-800">{children}</td>
);

export default SubscriptionPage;
