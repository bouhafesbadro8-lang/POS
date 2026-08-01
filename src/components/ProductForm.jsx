import { useState } from 'react';
import { databases } from '../appwrite';
import { ID, Query } from 'appwrite';

export default function ProductForm({ DATABASE_ID, COLLECTION_ID, onProductAdded }) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const inputBarcode = barcode.trim();
    const addedQty = parseInt(stockQuantity, 10);
    const newPrice = parseFloat(price);

    try {
      // 1. البحث هل الباركوود موجود مسبقاً في قاعدة البيانات؟
      const existingDoc = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('barcode', inputBarcode)]
      );

      if (existingDoc.documents.length > 0) {
        // 🔄 المنتج موجود سلفاً! سنقوم بتحديث كميته الحالية وسعره
        const existingProduct = existingDoc.documents[0];
        const currentStock = Math.max(0, existingProduct.stock_quantity);
        const updatedStock = currentStock + addedQty;

        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          existingProduct.$id,
          {
            stock_quantity: updatedStock,
            price: newPrice, // تحديث السعر أيضاً في حال تغيره
            name: name || existingProduct.name, // تحديث الاسم إن وجد
          }
        );

        alert(`تمت زيادة كمية المنتج "${existingProduct.name}" المتاح بالمخزن أصبح: ${updatedStock} قطعة! 📦✨`);
      } else {
        // ➕ المنتج غير موجود، سنقوم بإنشاء منتج جديد
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          {
            name,
            barcode: inputBarcode,
            price: newPrice,
            stock_quantity: addedQty,
          }
        );

        alert('تمت إضافة المنتج الجديد بنجاح! 🎉');
      }

      // إعادة إعادة تعيين حقول النموذج
      setName('');
      setBarcode('');
      setPrice('');
      setStockQuantity('');
      
      // تحديث واجهة المخزون
      onProductAdded();
    } catch (error) {
      console.error("خطأ في حفظ البيانات:", error);
      alert('حدث خطأ أثناء حفظ المنتج. تأكد من إعدادات الفهارس (Indexes) أو الصلاحيات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span>➕</span> إضافة / إعادة تزويد كمية منتج
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">اسم المنتج</label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="مثال: حليب المراعي"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">الباركوود</label>
            <input
              type="text" required value={barcode} onChange={(e) => setBarcode(e.target.value)}
              placeholder="123456"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">السعر</label>
            <input
              type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">الكمية المضافة للمخزن</label>
          <input
            type="number" required value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)}
            placeholder="10"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition"
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'جاري الفحص والحفظ...' : 'حفظ / تحديث الكمية'}
        </button>
      </form>
    </div>
  );
}