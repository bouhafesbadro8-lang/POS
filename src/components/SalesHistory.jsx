import { useEffect, useState } from 'react';
import { databases } from '../appwrite';
import { Query } from 'appwrite';

export default function SalesHistory({ DATABASE_ID, SALES_COLLECTION_ID, refreshTrigger }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    setLoading(true);
    try {
      // جلب الفواتير مرتبة من الأحدث إلى الأقدم
      const response = await databases.listDocuments(
        DATABASE_ID,
        SALES_COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );
      setSales(response.documents);
    } catch (error) {
      console.error("خطأ في جلب أرشيف الفواتير:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [refreshTrigger]); // تحديث القائمة تلقائياً عند إتمام أي عملية بيع جديدة

  // حساب إجمالي كل المبيعات في الأرشيف
  const totalRevenue = sales.reduce((sum, item) => sum + (item.total_amount || 0), 0).toFixed(2);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span>📜</span> أرشيف الفواتير المباعة
        </h3>
        <div className="text-left">
          <span className="block text-[10px] text-slate-400 font-semibold">إجمالي الإيرادات</span>
          <span className="text-base font-black text-emerald-600">{totalRevenue} د.ج</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400 text-sm">جاري تحميل الأرشيف...</div>
      ) : sales.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">لا توجد فواتير مسجلة حتى الآن</div>
      ) : (
        <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
          <table className="w-full text-right text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-slate-400 border-b border-slate-100 font-medium">
                <th className="pb-3 font-semibold">التاريخ والوقت</th>
                <th className="pb-3 font-semibold">العناصر المباعة</th>
                <th className="pb-3 font-semibold text-left">المبلغ الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.map((sale) => {
                const dateFormatted = sale.created_at
                  ? new Date(sale.created_at).toLocaleString('ar-EG', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : 'غير محدد';

                return (
                  <tr key={sale.$id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 text-xs text-slate-500 font-medium">{dateFormatted}</td>
                    <td className="py-3 text-slate-700 text-xs font-semibold max-w-[220px] truncate" title={sale.items_summary}>
                      {sale.items_summary}
                    </td>
                    <td className="py-3 text-left font-bold text-slate-900">
                      {sale.total_amount?.toFixed(2)} د.ج
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}