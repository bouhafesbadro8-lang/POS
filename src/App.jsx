import { useEffect, useState } from 'react';
import { databases } from './appwrite';
import { ID } from 'appwrite';
import ProductForm from './components/ProductForm';
import Cart from './components/Cart';
import Inventory from './components/Inventory';
import SalesHistory from './components/SalesHistory'; // 👈 استيراد مكون الأرشيف

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [salesRefresh, setSalesRefresh] = useState(0); // trigger لتحديث الأرشيف تلقائياً

  const DATABASE_ID = '6a6df9bc0037d08df2c3';
  const PRODUCTS_COLLECTION_ID = 'products';
  const SALES_COLLECTION_ID = 'sales';

  const fetchProducts = async () => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID);
      setProducts(response.documents);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.$id === product.$id);
      if (index > -1) {
        if (prev[index].quantity + 1 > product.stock_quantity) {
          alert('نفدت الكمية المتاحة بالمخزن!');
          return prev;
        }
        const updated = [...prev];
        updated[index].quantity += 1;
        return updated;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.$id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.$id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoadingCheckout(true);

    try {
      const zeroStockItems = [];

      for (const item of cart) {
        const updatedStock = Math.max(0, item.stock_quantity - item.quantity);

        await databases.updateDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, item.$id, {
          stock_quantity: updatedStock,
        });

        if (updatedStock === 0) {
          zeroStockItems.push(item.name);
        }
      }

      const itemsSummary = cart.map(item => `${item.name} (${item.quantity}x)`).join(', ');
      const totalAmount = parseFloat(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));

      // تسجيل الفاتورة في جدول sales
      await databases.createDocument(
        DATABASE_ID,
        SALES_COLLECTION_ID,
        ID.unique(),
        {
          total_amount: totalAmount,
          items_summary: itemsSummary,
          created_at: new Date().toISOString()
        }
      );

      setCart([]);
      fetchProducts();
      setSalesRefresh(prev => prev + 1); // 👈 تحديث أرشيف الفواتير فورياً

      if (zeroStockItems.length > 0) {
        alert(`تمت عملية البيع وحفظ الفاتورة بنجاح! ✨\n\n⚠️ تنبيه: المنتجات التالية أصبحت الآن 0 في المخزن:\n- ${zeroStockItems.join('\n- ')}`);
      } else {
        alert('تمت الفاتورة وحفظها في الأرشيف بنجاح! ✨');
      }

    } catch (error) {
      console.error("خطأ أثناء معالجة الفاتورة:", error);
      alert('حدث خطأ! تأكد من إعدادات جدول sales.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-black text-indigo-600 flex items-center gap-2">
            <span>⚡</span> POS Express
          </h1>
          <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-full font-medium">
            Appwrite Cloud Active
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cart Side */}
        <div className="lg:col-span-5 h-[calc(100vh-120px)] sticky top-24">
          <Cart
            cart={cart}
            products={products}
            addToCart={addToCart}
            updateCartQuantity={updateCartQuantity}
            removeFromCart={removeFromCart}
            handleCheckout={handleCheckout}
            loadingCheckout={loadingCheckout}
          />
        </div>

        {/* Right Side: Inventory, Form & Sales Archive */}
        <div className="lg:col-span-7 space-y-6">
          <Inventory products={products} addToCart={addToCart} />
          
          {/* 📜 أرشيف الفواتير المباعة */}
          <SalesHistory
            DATABASE_ID={DATABASE_ID}
            SALES_COLLECTION_ID={SALES_COLLECTION_ID}
            refreshTrigger={salesRefresh}
          />

          <ProductForm
            DATABASE_ID={DATABASE_ID}
            COLLECTION_ID={PRODUCTS_COLLECTION_ID}
            onProductAdded={fetchProducts}
          />
        </div>
      </main>
    </div>
  );
}

export default App;