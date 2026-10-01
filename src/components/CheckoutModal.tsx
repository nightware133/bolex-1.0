import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Crown, 
  Flame, 
  Ticket, 
  FileText, 
  Download, 
  Check, 
  AlertCircle,
  Smartphone,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PlanTier, useAuth } from '../context/AuthContext';
import { validateAndRedeemKey } from '../lib/founder';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTier: PlanTier;
  onSuccess?: (tier: PlanTier) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  targetTier,
  onSuccess
}: CheckoutModalProps) {
  const { user, profile, setPlanTier } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'wallets' | 'code'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(profile?.displayName || user?.displayName || '');
  const [zipCode, setZipCode] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    txId: string;
    date: string;
    amount: string;
    method: string;
    tier: PlanTier;
  } | null>(null);

  if (!isOpen) return null;

  // Plan pricing
  const planInfo = {
    free: { name: 'Free Starter', price: '$0.00', num: 0 },
    plus: { name: 'Bolex Plus', price: '$12.00', num: 12 },
    ultra: { name: 'Bolex Ultra Titanium', price: '$29.00', num: 29 },
    quantum: { name: 'Bolex Quantum VIP', price: '$49.00', num: 49 },
  }[targetTier] || { name: 'Bolex Plus', price: '$12.00', num: 12 };

  // Detect card type
  const getCardType = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    if (/^6(?:011|5)/.test(clean)) return 'Discover';
    return 'Card';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    // Format in groups of 4
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(val);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExpiry(val);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(val);
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s+/g, '').length < 15) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }
    if (cardExpiry.length < 5) {
      alert('Please enter a valid expiration date (MM/YY).');
      return;
    }
    if (cardCvc.length < 3) {
      alert('Please enter a valid 3-digit security code (CVC).');
      return;
    }

    setIsProcessing(true);
    // Simulate secure 256-bit gateway handshake
    setTimeout(async () => {
      const txId = `TX-BLX-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const receipt = {
        txId,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        amount: planInfo.price,
        method: `${getCardType(cardNumber)} ending in ${cardNumber.slice(-4) || '8842'}`,
        tier: targetTier,
      };

      try {
        await setPlanTier(targetTier);
        setReceiptData(receipt);
        setOrderComplete(true);
        if (onSuccess) onSuccess(targetTier);
      } catch (err) {
        console.error('Failed to activate tier:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  const handleWalletPayment = (walletType: string) => {
    setIsProcessing(true);
    setTimeout(async () => {
      const txId = `TX-${walletType.toUpperCase().slice(0, 3)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const receipt = {
        txId,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        amount: planInfo.price,
        method: walletType,
        tier: targetTier,
      };

      try {
        await setPlanTier(targetTier);
        setReceiptData(receipt);
        setOrderComplete(true);
        if (onSuccess) onSuccess(targetTier);
      } catch (err) {
        console.error('Failed to activate tier:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 1400);
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    setPromoSuccess(null);

    if (!redeemCode.trim()) {
      setPromoError('Please enter a license key or gift code.');
      return;
    }

    setIsProcessing(true);
    setTimeout(async () => {
      const email = user?.email || profile?.email || 'user@bolex.ai';
      const result = validateAndRedeemKey(redeemCode, email);

      if (!result.success || !result.key) {
        setPromoError(result.error || 'Invalid code.');
        setIsProcessing(false);
        return;
      }

      const unlockedTier = result.key.planTier;
      setPromoSuccess(`Code successfully validated! Unlocked ${unlockedTier.toUpperCase()} (${result.key.duration}).`);

      try {
        await setPlanTier(unlockedTier);
        const txId = `TX-GIFT-${redeemCode.toUpperCase()}`;
        setReceiptData({
          txId,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          amount: '$0.00 (100% Gift Code)',
          method: `Founder License Key (${result.key.duration})`,
          tier: unlockedTier,
        });
        setOrderComplete(true);
        if (onSuccess) onSuccess(unlockedTier);
      } catch (err) {
        setPromoError('Failed to apply plan tier to account.');
      } finally {
        setIsProcessing(false);
      }
    }, 900);
  };

  const downloadReceipt = () => {
    if (!receiptData) return;
    const content = `================================================
BOLEX AI ASSISTANT - OFFICIAL BILLING RECEIPT
================================================
Transaction ID : ${receiptData.txId}
Date           : ${receiptData.date}
Plan Subscribed: ${receiptData.tier.toUpperCase()}
Amount Paid    : ${receiptData.amount}
Payment Method : ${receiptData.method}
Account Holder : ${cardName || user?.email || 'Valued Member'}
Status         : PAID & ACTIVE
Merchant       : Bolex AI Technologies Inc.
Support        : tayden.simon@2hourlearning.com
================================================
Thank you for supporting Bolex AI!
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolex_receipt_${receiptData.txId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Bolex Pay Checkout</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  256-Bit Encrypted
                </span>
              </div>
              <p className="text-xs text-neutral-400">Secure subscription checkout & code redemption</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {orderComplete && receiptData ? (
          /* Order Complete / Receipt Screen */
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Subscription Confirmed!</h3>
              <p className="text-sm text-neutral-400">
                Your account has been upgraded to <strong className="text-amber-400 uppercase">{receiptData.tier}</strong>.
              </p>
            </div>

            {/* Receipt Box */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                <span className="text-neutral-500">Order Reference</span>
                <span className="font-mono text-neutral-200">{receiptData.txId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Billing Plan</span>
                <span className="font-semibold text-white uppercase">{receiptData.tier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Amount Billed</span>
                <span className="font-bold text-emerald-400">{receiptData.amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Payment Channel</span>
                <span className="text-neutral-300">{receiptData.method}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-neutral-850">
                <span className="text-neutral-500">Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active & Ready
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={downloadReceipt}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Receipt (.txt)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 text-xs font-bold hover:brightness-110 flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20"
              >
                <span>Start Using Bolex AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Payment Form */
          <div className="p-5 sm:p-6 space-y-6">
            {/* Plan Summary Card */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  targetTier === 'quantum' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : targetTier === 'ultra' 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {targetTier === 'quantum' ? <Sparkles className="w-5 h-5" /> : targetTier === 'ultra' ? <Flame className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{planInfo.name}</h4>
                  <p className="text-xs text-neutral-400">Unlimited questions, neural speech, zero latency</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-amber-400">{planInfo.price}</div>
                <div className="text-[10px] text-neutral-500">billed monthly</div>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-850">
              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === 'card'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('wallets')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === 'wallets'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Wallets</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('code')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === 'code'
                    ? 'bg-neutral-800 text-amber-300 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Redeem Code</span>
              </button>
            </div>

            {/* 1. CREDIT CARD FORM */}
            {selectedMethod === 'card' && (
              <form onSubmit={handleCardPayment} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300 flex justify-between">
                    <span>Card Number</span>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">{getCardType(cardNumber)}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-xs font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <CreditCard className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Expiration (MM/YY)</label>
                    <input
                      type="text"
                      required
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-xs font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">CVC / CVV</label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      value={cardCvc}
                      onChange={handleCvcChange}
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-xs font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Billing ZIP</label>
                    <input
                      type="text"
                      required
                      placeholder="90210"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Processing Secure Transaction...' : `Pay ${planInfo.price} & Upgrade Now`}</span>
                </button>
              </form>
            )}

            {/* 2. WALLETS (APPLE PAY / GOOGLE PAY / PAYPAL) */}
            {selectedMethod === 'wallets' && (
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleWalletPayment('Apple Pay')}
                  className="w-full py-3 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="font-bold tracking-tight">Pay with  Apple Pay</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleWalletPayment('Google Pay')}
                  className="w-full py-3 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-white font-semibold text-xs border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="font-bold tracking-wide">G Pay (Google Pay)</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleWalletPayment('PayPal')}
                  className="w-full py-3 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="font-bold">PayPal Checkout</span>
                </button>
              </div>
            )}

            {/* 3. REDEEM CODE / FOUNDER KEY */}
            {selectedMethod === 'code' && (
              <form onSubmit={handleRedeemCode} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
                  Have a license key, gift code, or won a community giveaway from Founder Tayden Simon? Enter your code below for 100% free VIP activation!
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">License Key or Gift Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BOLEX-ULTRA-LAUNCH"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-xs font-mono uppercase focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {promoError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{promoError}</span>
                  </div>
                )}

                {promoSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{promoSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Verifying Code...' : 'Validate & Activate License'}</span>
                </button>
              </form>
            )}

            <div className="pt-2 text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Simulated PCI-DSS Level 1 Compliant. Cancel anytime in profile settings.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
