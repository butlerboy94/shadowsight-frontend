"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getBillingStatus, createCheckoutSession, createPortalSession } from "@/lib/api";
import { CreditCard, Check, Zap, Building2, Crown } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number | null;
  interval: string | null;
  stripe_price_id: string | null;
  features: string[];
}

interface OrgData {
  id: number;
  name: string;
  slug: string;
  plan: string;
  member_count: number;
  seat_limit: number | null;
  can_add_member: boolean;
}

interface SubData {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  is_active: boolean;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="w-5 h-5" />,
  pro: <Crown className="w-5 h-5" />,
  enterprise: <Building2 className="w-5 h-5" />,
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400",
  trialing: "text-blue-400",
  past_due: "text-red-400",
  canceled: "text-gray-400",
  incomplete: "text-yellow-400",
};

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [sub, setSub] = useState<SubData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Subscription activated! Welcome to your new plan.");
    } else if (searchParams.get("canceled") === "1") {
      toast("Checkout canceled. Your plan was not changed.");
    }
  }, [searchParams]);

  useEffect(() => {
    getBillingStatus()
      .then((res) => {
        setOrg(res.data.organization);
        setSub(res.data.subscription);
        setPlans(res.data.plans);
      })
      .catch(() => toast.error("Failed to load billing info."))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    if (!plan.stripe_price_id) {
      toast("Contact sales for Enterprise pricing.");
      return;
    }
    setCheckoutLoading(plan.id);
    try {
      const res = await createCheckoutSession(plan.stripe_price_id);
      window.location.href = res.data.checkout_url;
    } catch {
      toast.error("Failed to start checkout.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await createPortalSession();
      window.location.href = res.data.portal_url;
    } catch {
      toast.error("Failed to open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400 text-sm p-4">Loading...</p>;
  }

  const currentPlan = org?.plan || "free";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your subscription and plan</p>
        </div>
        {sub && (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-2 border border-[#333] hover:border-[#C4922A] text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            {portalLoading ? "Opening..." : "Manage Billing"}
          </button>
        )}
      </div>

      {/* Current Status */}
      {org && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Current Plan</h2>
          <div className="flex flex-wrap gap-6 items-start">
            <div>
              <div className="text-gray-400 text-xs mb-1">Organization</div>
              <div className="text-white font-medium">{org.name}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Plan</div>
              <div className="flex items-center gap-2 text-[#C4922A] font-semibold capitalize">
                {PLAN_ICONS[currentPlan]}
                {currentPlan}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Seats</div>
              <div className="text-white font-medium">
                {org.member_count} / {org.seat_limit ?? "∞"}
              </div>
            </div>
            {sub && (
              <>
                <div>
                  <div className="text-gray-400 text-xs mb-1">Status</div>
                  <div className={`font-medium capitalize ${STATUS_COLORS[sub.status] || "text-white"}`}>
                    {sub.status.replace("_", " ")}
                  </div>
                </div>
                {sub.current_period_end && (
                  <div>
                    <div className="text-gray-400 text-xs mb-1">
                      {sub.cancel_at_period_end ? "Cancels on" : "Renews on"}
                    </div>
                    <div className="text-white font-medium">
                      {new Date(sub.current_period_end).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-white font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={`bg-[#1a1a1a] border rounded-xl p-6 flex flex-col gap-5 transition-all ${
                  isCurrent
                    ? "border-[#C4922A] ring-1 ring-[#C4922A]/30"
                    : "border-[#2a2a2a] hover:border-[#444]"
                }`}
              >
                {/* Plan header */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isCurrent ? "bg-[#C4922A]/20 text-[#C4922A]" : "bg-[#222] text-gray-400"}`}>
                    {PLAN_ICONS[plan.id]}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{plan.name}</div>
                    {isCurrent && (
                      <div className="text-[#C4922A] text-xs font-medium">Current plan</div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div>
                  {plan.price === null ? (
                    <div className="text-white text-2xl font-bold">Custom</div>
                  ) : plan.price === 0 ? (
                    <div className="text-white text-2xl font-bold">Free</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-white text-2xl font-bold">${plan.price}</span>
                      <span className="text-gray-400 text-sm">/{plan.interval}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-[#C4922A] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="text-center text-gray-500 text-sm py-2">Current plan</div>
                ) : plan.price === null ? (
                  <a
                    href="mailto:sales@shadowsight.io"
                    className="block text-center bg-[#222] hover:bg-[#2a2a2a] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Contact Sales
                  </a>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={checkoutLoading === plan.id}
                    className="bg-[#C4922A] hover:bg-[#a87820] disabled:opacity-50 text-black font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    {checkoutLoading === plan.id ? "Redirecting..." : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
