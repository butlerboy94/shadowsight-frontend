"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getBillingStatus, createCheckoutSession, createPortalSession } from "@/lib/api";
import { Check, CreditCard, Users, Building2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price_monthly: number | null;
  price_annual: number | null;
  seats: number | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
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

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400",
  trialing: "text-blue-400",
  past_due: "text-red-400",
  canceled: "text-gray-400",
  incomplete: "text-yellow-400",
};

const PLAN_ORDER = ["small_firm", "medium_firm", "large_firm", "enterprise", "nationwide"];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [sub, setSub] = useState<SubData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [annual, setAnnual] = useState(false);
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
        // Sort plans in defined order
        const sorted = [...res.data.plans].sort(
          (a: Plan, b: Plan) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id)
        );
        setPlans(sorted);
      })
      .catch(() => toast.error("Failed to load billing info."))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    const priceId = annual ? plan.stripe_price_id_annual : plan.stripe_price_id_monthly;
    if (!priceId) {
      if (plan.id === "nationwide") {
        toast("Contact us at sales@shadowsight.io for Nationwide / Government pricing.");
      } else {
        toast.error("Price not configured yet. Contact support.");
      }
      return;
    }
    setCheckoutLoading(plan.id);
    try {
      const res = await createCheckoutSession(priceId);
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

  const currentPlan = org?.plan || "small_firm";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your subscription and plan</p>
        </div>
        {sub && (
          <button
            type="button"
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
          <div className="flex flex-wrap gap-8 items-start">
            <div>
              <div className="text-gray-400 text-xs mb-1">Organization</div>
              <div className="text-white font-medium">{org.name}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Plan</div>
              <div className="text-[#C4922A] font-semibold capitalize">
                {plans.find((p) => p.id === currentPlan)?.name || currentPlan}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Seats Used</div>
              <div className="flex items-center gap-1.5 text-white font-medium">
                <Users className="w-3.5 h-3.5 text-gray-500" />
                {org.member_count} / {org.seat_limit ?? "Custom"}
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

      {/* Billing toggle + plans */}
      <div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-white font-semibold">Plans</h2>
          {/* Monthly / Annual toggle */}
          <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !annual ? "bg-[#C4922A] text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                annual ? "bg-[#C4922A] text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              Annual
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${annual ? "bg-black/20 text-black" : "bg-green-500/20 text-green-400"}`}>
                Save 10%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isCustom = plan.price_monthly === null;
            const price = annual ? plan.price_annual : plan.price_monthly;

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
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Building2 className="w-4 h-4 text-[#C4922A]" />
                      {plan.name}
                    </div>
                    {plan.seats && (
                      <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                        <Users className="w-3 h-3" />
                        Up to {plan.seats} users
                      </div>
                    )}
                  </div>
                  {isCurrent && (
                    <span className="text-xs bg-[#C4922A]/20 text-[#C4922A] px-2 py-0.5 rounded font-medium shrink-0">
                      Current
                    </span>
                  )}
                </div>

                {/* Price */}
                <div>
                  {isCustom ? (
                    <div className="text-white text-2xl font-bold">Custom</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-white text-2xl font-bold">
                        ${price?.toLocaleString()}
                      </span>
                      <span className="text-gray-400 text-sm">/month</span>
                    </div>
                  )}
                  {annual && !isCustom && (
                    <div className="text-green-400 text-xs mt-0.5">
                      Billed annually — save ${((plan.price_monthly! - plan.price_annual!) * 12).toLocaleString()}/yr
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-[#C4922A] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="text-center text-gray-500 text-sm py-2 border border-[#2a2a2a] rounded-lg">
                    Current plan
                  </div>
                ) : isCustom ? (
                  <a
                    href="mailto:sales@shadowsight.io"
                    className="block text-center bg-[#222] hover:bg-[#2a2a2a] border border-[#333] hover:border-[#C4922A] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Contact Sales
                  </a>
                ) : (
                  <button
                    type="button"
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

        <p className="text-gray-500 text-xs mt-4">
          All plans include core investigative tools, OSINT suite, PDF report generation, and case management.
          Add-ons available: advanced data integrations, additional seats, API access, enterprise onboarding, and enhanced monitoring.
          Contact <a href="mailto:sales@shadowsight.io" className="text-[#C4922A] hover:underline">sales@shadowsight.io</a> for custom pricing.
        </p>
      </div>
    </div>
  );
}
