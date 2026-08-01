import { useState, useRef, useEffect } from 'react';

export default function Cart({ cart, products, addToCart, updateCartQuantity, removeFromCart, handleCheckout, loadingCheckout }) {
  const [barcode, setBarcode] = useState('');
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cart]);

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const foundProduct = products.find(p => p.barcode === barcode.trim());
    if (!foundProduct) {
      alert('المنتج غير موجود!');
    } else {
      addToCart(foundProduct);
    }
    setBarcode('');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span>🛒</span> فاتورة البيع
      </h2>

      {/* مسح الباركوود */}
      <form onSubmit={handleBarcodeSubmit} className="mb-6">
        <div className="relative">
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="امسح الباركوود هنا..."
            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition bg-slate-50/50"
          />
          <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
        </div>
      </form>

      {/* عناصر السلة */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-1">
        {cart.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">السلة فارغة حالياً</div>
        ) : (
          cart.map(item => (
            <div key={item.$id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">{item.name}</h4>
                <p className="text-xs text-slate-500">{item.price} د.ج × {item.quantity}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                  <button onClick={() => updateCartQuantity(item.$id, -1)} className="px-2 py-1 hover:bg-slate-100 text-xs font-bold text-slate-600">-</button>
                  <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.$id, 1)} className="px-2 py-1 hover:bg-slate-100 text-xs font-bold text-slate-600">+</button>
                </div>
                <button onClick={() => removeFromCart(item.$id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg text-xs transition cursor-pointer">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* إجمالي الفاتورة والزر */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-slate-500">الإجمالي النهائي</span>
          <span className="text-2xl font-black text-slate-900">{calculateTotal()} <span className="text-xs font-normal text-slate-500">د.ج</span></span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loadingCheckout || cart.length === 0}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
        >
          {loadingCheckout ? 'جاري إتمام الفاتورة والتسجيل...' : 'إتمام البيع (Checkout)'}
        </button>
      </div>
    </div>
  );
}