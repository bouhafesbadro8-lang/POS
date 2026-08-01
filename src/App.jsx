import { useEffect, useState } from 'react';
import { databases } from './appwrite';
import { ID } from 'appwrite';
import ProductForm from './components/ProductForm';
import Cart from './components/Cart';
import Inventory from './components/Inventory';
import SalesHistory from './components/SalesHistory';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [salesRefresh, setSalesRefresh] = useState(0);
  
  // تبويب محلي للشاشات الصغيرة (الهواتف)
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'inventory' | 'history'

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
      setSalesRefresh(prev => prev + 1);

      if (zeroStockItems.length > 0) {
        alert(`تمت عملية البيع بنجاح! ✨\n\n⚠️ منتجات أصبحت 0 بالمخزن:\n- ${zeroStockItems.join('\n- ')}`);
      } else {
        alert('تمت الفاتورة بنجاح! ✨');
      }

    } catch (error) {
      console.error("خطأ الفاتورة:", error);
      alert('حدث خطأ أثناء معالجة الفاتورة.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  // إجمالي عدد العناصر بالسلة للشارة (Badge)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 lg:pb-6" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-black text-indigo-600 flex items-center gap-2">
            <span>⚡</span> POS Express
          </h1>
          <span className="text-[11px] sm:text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full font-medium">
            متصل بالسحابة ☁️
          </span>
        </div>
      </header>

      {/* Navigation Tabs for Mobile Only */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-2 sticky top-[57px] z-10 flex gap-2">
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex justify-center items-center gap-1.5 ${
            activeTab === 'cart' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <span>🛒 السلة</span>
          {cartItemsCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {cartItemsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600'
          }`}
        >
          📦 المخزون والمنتجات
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600'
          }`}
        >
          📜 الأرشيف
        </button>
      </div>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cart Section: يظهر دائمًا في الشاشات الكبيرة، وفي الهواتف حسب التبويب النشط */}
        <div className={`lg:col-span-5 lg:block ${activeTab === 'cart' ? 'block' : 'hidden'}`}>
          <div className="lg:sticky lg:top-24">
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
        </div>

        {/* Inventory & Form Section */}
        <div className={`lg:col-span-7 space-y-6 ${activeTab === 'inventory' ? 'block' : activeTab === 'cart' ? 'hidden lg:block' : 'hidden'}`}>
          <Inventory products={products} addToCart={addToCart} />
          <ProductForm
            DATABASE_ID={DATABASE_ID}
            COLLECTION_ID={PRODUCTS_COLLECTION_ID}
            onProductAdded={fetchProducts}
          />
        </div>

        {/* History Section */}
        <div className={`lg:col-span-7 lg:col-start-6 space-y-6 ${activeTab === 'history' ? 'block' : 'hidden'}`}>
          <SalesHistory
            DATABASE_ID={DATABASE_ID}
            SALES_COLLECTION_ID={SALES_COLLECTION_ID}
            refreshTrigger={salesRefresh}
          />
        </div>

      </main>
    </div>
  );
}

export default App;