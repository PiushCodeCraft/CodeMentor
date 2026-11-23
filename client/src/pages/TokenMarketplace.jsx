import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchTokenPackages, initiatePurchase, verifyPayment } from '../api/tokens.js';
import { useAuth } from '../hooks/useAuth.js';

export default function TokenMarketplace() {
  const { user, fetchMe } = useAuth();
  const [packages, setPackages] = useState([]);
  const [gatewayConfig, setGatewayConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [error, setError] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchTokenPackages();
        setPackages(res.packages || []);
        if (res.gateway) {
          setGatewayConfig(res.gateway);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load token packages.');
      } finally {
        setLoading(false);
      }
    };
    loadPackages();
  }, []);

  // Helper to load Razorpay Checkout Script if not already loaded in DOM
  const ensureRazorpayLoaded = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => resolve(false);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (pkg) => {
    if (purchasingId) return;
    setPurchasingId(pkg._id);
    setError('');
    setSuccessReceipt(null);

    const idempotencyKey = `idem_${user?._id || 'anon'}_${pkg._id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      // 1. Create order on backend with unique idempotency key
      const orderData = await initiatePurchase(pkg._id, idempotencyKey);

      // 2. If sandbox test mode without Razorpay API keys configured in server/.env
      if (orderData.isSandboxMode || !orderData.keyId) {
        // Complete simulated verification
        const verifyRes = await verifyPayment({
          razorpayOrderId: orderData.order.razorpayOrderId,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpaySignature: 'simulated_signature_sandbox',
        });

        setSuccessReceipt({
          packageName: pkg.name,
          tokens: pkg.tokens,
          amount: pkg.price,
          currency: pkg.currency,
          orderId: orderData.order.razorpayOrderId,
          paymentId: `sim_${Date.now()}`,
          newBalance: verifyRes.newBalance,
          isSandbox: true,
        });

        await fetchMe();
        setPurchasingId(null);
        return;
      }

      // 3. Razorpay keys are configured: load checkout script and launch modal
      const isLoaded = await ensureRazorpayLoaded();
      if (!isLoaded || !window.Razorpay) {
        throw new Error(
          'Razorpay Checkout script could not be loaded. Please disable any ad-blockers or check your internet connection.'
        );
      }

      const options = {
        key: orderData.keyId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || 'INR',
        name: 'CodeMentor Live',
        description: `Token Package: ${pkg.name} (${pkg.tokens} tokens)`,
        image: `${window.location.origin}/logo.png`,
        order_id: orderData.order.razorpayOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4F46E5',
        },
        handler: async (response) => {
          try {
            const verifyRes = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setSuccessReceipt({
              packageName: pkg.name,
              tokens: pkg.tokens,
              amount: pkg.price,
              currency: pkg.currency,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              newBalance: verifyRes.newBalance,
              isSandbox: false,
            });

            await fetchMe();
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment signature verification failed.');
          } finally {
            setPurchasingId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPurchasingId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failRes) => {
        setError(`Payment failed: ${failRes.error?.description || 'Transaction declined.'}`);
        setPurchasingId(null);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to initiate purchase.');
      setPurchasingId(null);
    }
  };

  const isRazorpayActive = Boolean(gatewayConfig?.isConfigured);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 pb-6 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
          <span>💳</span>
          <span>Instant Token Refill</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight">
          Token Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Need tokens immediately for priority code reviews and senior mentor sessions? Choose a package below with instant wallet crediting.
        </p>
      </div>

      {/* Gateway Status Banner */}
      {gatewayConfig && (
        <div
          className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isRazorpayActive
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{isRazorpayActive ? '🟢' : '⚡'}</span>
            <div>
              <span className="font-bold block">
                {isRazorpayActive
                  ? `Razorpay Gateway Connected (${gatewayConfig.mode.toUpperCase()} Mode)`
                  : 'Razorpay Gateway Status: Awaiting API Keys in server/.env'}
              </span>
              <span className="text-slate-400 text-[11px]">
                {isRazorpayActive
                  ? `Key ID: ${gatewayConfig.keyId} • Official Razorpay modal will open on purchase.`
                  : 'Add RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET to server/.env to launch the live/test Razorpay modal. Purchases currently run in sandbox mode.'}
              </span>
            </div>
          </div>

          {!isRazorpayActive && (
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-700 font-bold rounded-lg text-[10px] uppercase tracking-wider shrink-0">
              Sandbox Simulator Ready
            </span>
          )}
        </div>
      )}

      {/* Wallet Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl text-amber-600">
            🪙
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Your Wallet</span>
            <span className="text-sm font-bold text-slate-100">
              {user?.credits ?? 0} tokens available
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs hidden sm:inline">Short on tokens?</span>
          <Link
            to="/earn"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚡</span>
            <span>Earn Free Tokens Instead</span>
          </Link>
          <Link
            to="/wallet"
            className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            View Wallet
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* Success Receipt Modal */}
      {successReceipt && (
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl space-y-3 shadow-md animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h3 className="text-lg font-bold text-emerald-800">
                  {successReceipt.isSandbox
                    ? 'Sandbox Refill Completed & Verified!'
                    : 'Razorpay Payment Successful & Verified!'}
                </h3>
                <p className="text-xs text-emerald-700">
                  +{successReceipt.tokens} tokens have been credited to your wallet balance.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSuccessReceipt(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-2xl border border-emerald-500/20 text-xs mt-3">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Package</span>
              <span className="font-bold text-slate-100">{successReceipt.packageName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Amount Paid</span>
              <span className="font-bold text-slate-100">
                ₹{successReceipt.amount} {successReceipt.currency}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Reference</span>
              <span className="font-mono text-slate-300 text-[10px]">{successReceipt.orderId?.slice(-12)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">New Balance</span>
              <span className="font-bold text-emerald-600 text-sm">{successReceipt.newBalance} tokens</span>
            </div>
          </div>
        </div>
      )}

      {/* Packages Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading marketplace packages...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {packages.map((pkg, idx) => {
            const isFeatured = idx === 1 || pkg.badge?.includes('Popular');
            return (
              <div
                key={pkg._id}
                className={`relative flex flex-col justify-between bg-slate-900 border rounded-3xl p-6 sm:p-8 space-y-6 transition shadow-sm hover:shadow-lg ${
                  isFeatured
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                    {pkg.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-100">{pkg.name}</h3>
                    <p className="text-xs text-slate-400 min-h-[32px]">{pkg.description}</p>
                  </div>

                  {/* Token Count Pill */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🪙</span>
                      <div>
                        <span className="text-2xl font-black text-amber-600">{pkg.tokens}</span>
                        <span className="text-xs font-semibold text-slate-400 ml-1">tokens</span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Instant Delivery
                    </span>
                  </div>

                  {/* Price */}
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-100">₹{pkg.price}</span>
                      <span className="text-xs text-slate-400 font-semibold">{pkg.currency}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">One-time payment &bull; Tokens never expire</span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Post code review bounty requests</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Priority matching with top mentors</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Full real-time Monaco sync workspace</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Permanent ledger audit transaction record</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasingId === pkg._id}
                    className={`w-full py-3.5 px-4 font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                      isFeatured
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-100'
                    }`}
                  >
                    {purchasingId === pkg._id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Securing Order...</span>
                      </>
                    ) : (
                      <>
                        <span>💳</span>
                        <span>
                          {isRazorpayActive
                            ? `Pay ₹${pkg.price} via Razorpay`
                            : `Purchase ${pkg.tokens} Tokens (₹${pkg.price})`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Security & Guarantee Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-2xl">🔒</span>
          <div>
            <strong className="text-slate-200 block text-xs">256-bit Secure Gateway</strong>
            <span className="text-[11px]">Server-side signature verified transactions via Razorpay.</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-2xl">⚡</span>
          <div>
            <strong className="text-slate-200 block text-xs">Instant Credit Guarantee</strong>
            <span className="text-[11px]">Tokens are credited atomically with automatic duplicate protection.</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-2xl">🎓</span>
          <div>
            <strong className="text-slate-200 block text-xs">Never Forced to Pay</strong>
            <span className="text-[11px]">Earn free tokens anytime by solving challenges &amp; assignments.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
