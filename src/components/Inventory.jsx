export default function Inventory({ products, addToCart }) {
    // تصفية المنتجات التي أصبحت كميتها 0 أو أقل
    const outOfStockProducts = products.filter(
      (p) => Math.max(0, p.stock_quantity) === 0
    );
  
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        {/* العنون وعداد المنتجات المنتهية */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>📦</span> حالة المخزون
          </h3>
  
          {outOfStockProducts.length > 0 && (
            <span className="text-xs bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-full animate-pulse">
              ⚠️ {outOfStockProducts.length} منتج نفد!
            </span>
          )}
        </div>
  
        {/* شريط تنبيه عند وجود منتجات منتهية بالمخزن */}
        {outOfStockProducts.length > 0 && (
          <div className="bg-amber-50 border-r-4 border-amber-500 p-4 rounded-xl text-xs text-amber-900 font-medium">
            <p className="font-bold mb-1">⚠️ تنبيه نقص المخزون:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {outOfStockProducts.map((item) => (
                <li key={item.$id}>
                  المنتج <span className="font-bold underline">{item.name}</span>{" "}
                  وصل إلى 0 في المخزن. يرجى إعادة التزويد!
                </li>
              ))}
            </ul>
          </div>
        )}
  
        {/* جدول المخزون */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 font-medium">
                <th className="pb-3 font-semibold">المنتج</th>
                <th className="pb-3 font-semibold">الباركوود</th>
                <th className="pb-3 font-semibold">السعر</th>
                <th className="pb-3 font-semibold">المتاح</th>
                <th className="pb-3 font-semibold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((prod) => {
                // اعتبر القيمة 0 إذا كانت أقل من أو تساوي الصفر لمنع الأرقام السالبة
                const currentStock = Math.max(0, prod.stock_quantity);
                const isOutOfStock = currentStock === 0;
  
                return (
                  <tr
                    key={prod.$id}
                    className={`transition ${
                      isOutOfStock ? "bg-rose-50/50" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <td className="py-3 font-medium text-slate-800">
                      {prod.name}
                      {isOutOfStock && (
                        <span className="mr-2 text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded">
                          نفد
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-500 font-mono text-xs">
                      {prod.barcode}
                    </td>
                    <td className="py-3 text-slate-800 font-semibold">
                      {prod.price} د.ج
                    </td>
                    <td className="py-3">
                      <span
                        dir="ltr" // منع انقلاب النص والشرطة في اللغة العربية
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block ${
                          isOutOfStock
                            ? "bg-rose-100 text-rose-700 font-bold border border-rose-200"
                            : currentStock <= 5
                            ? "bg-amber-50 text-amber-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {isOutOfStock ? "0 قطعة (غير متوفر)" : `${currentStock} قطعة`}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => addToCart(prod)}
                        disabled={isOutOfStock}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isOutOfStock ? "غير متاح" : "+ للسلة"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }