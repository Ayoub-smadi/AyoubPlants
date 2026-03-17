import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'ar';

interface I18nStore {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const translations = {
  en: {
    // Navigation
    home: "Home",
    plants: "Plants",
    categories: "Categories",
    about: "About Us",
    contact: "Contact",
    dashboard: "Dashboard",
    myOrders: "My Orders",
    login: "Sign In",
    logout: "Sign Out",
    register: "Create Account",
    
    // Actions
    search: "Search...",
    addToCart: "Add to Cart",
    orderNow: "Order Now",
    checkout: "Checkout",
    viewDetails: "View Details",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    
    // Plant Info
    price: "Price",
    height: "Height",
    category: "Category",
    stock: "Stock",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    description: "Description",
    
    // Home Page
    heroTitle: "Bring Nature Into Your Space",
    heroSubtitle: "Discover our premium collection of indoor and outdoor plants, nurtured with care to transform your environment.",
    shopNow: "Shop Collection",
    featuredPlants: "Featured Plants",
    newArrivals: "New Arrivals",
    
    // Cart & Order
    cart: "Shopping Cart",
    emptyCart: "Your cart is empty",
    total: "Total",
    subtotal: "Subtotal",
    customerInfo: "Customer Information",
    fullName: "Full Name",
    phone: "Phone Number",
    address: "Delivery Address",
    notes: "Order Notes",
    placeOrder: "Place Order",
    orderSuccess: "Order Placed Successfully!",
    orderSuccessDesc: "We will contact you shortly to confirm delivery.",
    
    // Admin
    adminDashboard: "Admin Dashboard",
    revenue: "Revenue",
    totalOrders: "Total Orders",
    totalPlants: "Total Plants",
    lowStock: "Low Stock Alerts",
    inventory: "Inventory",
    manageOrders: "Manage Orders",
    managePlants: "Manage Plants",
    reports: "Reports & Analytics",
    status: "Status",
    date: "Date",
    actions: "Actions",
    addPlant: "Add New Plant",
    editPlant: "Edit Plant",
    addCategory: "Add Category",
  },
  ar: {
    // Navigation
    home: "الرئيسية",
    plants: "النباتات",
    categories: "الفئات",
    about: "من نحن",
    contact: "اتصل بنا",
    dashboard: "لوحة التحكم",
    myOrders: "طلباتي",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    register: "حساب جديد",
    
    // Actions
    search: "بحث...",
    addToCart: "أضف للسلة",
    orderNow: "اطلب الآن",
    checkout: "إتمام الطلب",
    viewDetails: "عرض التفاصيل",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    
    // Plant Info
    price: "السعر",
    height: "الطول",
    category: "الفئة",
    stock: "المخزون",
    inStock: "متوفر",
    outOfStock: "نفذت الكمية",
    description: "الوصف",
    
    // Home Page
    heroTitle: "اجلب الطبيعة إلى مساحتك",
    heroSubtitle: "اكتشف مجموعتنا المتميزة من النباتات الداخلية والخارجية، تمت رعايتها بعناية لتغيير بيئتك.",
    shopNow: "تسوق الآن",
    featuredPlants: "نباتات مميزة",
    newArrivals: "وصل حديثاً",
    
    // Cart & Order
    cart: "سلة التسوق",
    emptyCart: "سلة التسوق فارغة",
    total: "الإجمالي",
    subtotal: "المجموع الفرعي",
    customerInfo: "معلومات العميل",
    fullName: "الاسم الكامل",
    phone: "رقم الهاتف",
    address: "عنوان التوصيل",
    notes: "ملاحظات الطلب",
    placeOrder: "إرسال الطلب",
    orderSuccess: "تم إرسال الطلب بنجاح!",
    orderSuccessDesc: "سنتواصل معك قريباً لتأكيد التوصيل.",
    
    // Admin
    adminDashboard: "لوحة تحكم الإدارة",
    revenue: "الإيرادات",
    totalOrders: "إجمالي الطلبات",
    totalPlants: "إجمالي النباتات",
    lowStock: "تنبيهات انخفاض المخزون",
    inventory: "المخزون",
    manageOrders: "إدارة الطلبات",
    managePlants: "إدارة النباتات",
    reports: "التقارير والتحليلات",
    status: "الحالة",
    date: "التاريخ",
    actions: "إجراءات",
    addPlant: "إضافة نبتة جديدة",
    editPlant: "تعديل نبتة",
    addCategory: "إضافة فئة",
  }
};

export const useI18n = create<I18nStore>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => {
        set({ lang });
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      },
      t: (key) => translations[get().lang][key] || key,
    }),
    {
      name: 'nursery-i18n',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = state.lang;
        }
      },
    }
  )
);
