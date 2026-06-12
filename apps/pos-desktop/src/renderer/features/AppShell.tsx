import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Salad,
  Search,
  Settings as SettingsIcon,
  ShoppingCart,
  Tag,
  User,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ActivationState,
  GlobalSearchResult,
  PosOrder,
  PosSettings,
  SystemStatus,
} from "@restrozapp/shared";
import { OrdersView } from "../components/OrdersView";
import { SystemView } from "../components/SystemView";
type ReceiptType = "kot" | "token" | "bill";
import restrozappMark from "../assets/restrozapp-mark.png";

const DashboardPage = lazy(() => import("./DashboardPage"));
const InventoryPage = lazy(() => import("./InventoryPage"));
const GroceryPage = lazy(() => import("./GroceryPage"));
const KitchensPage = lazy(() => import("./KitchensPage"));
const OrdersPage = lazy(() => import("./OrdersPage"));
const PosPage = lazy(() => import("./PosPage"));
const ReportsPage = lazy(() => import("./ReportsPage"));
const CustomersPage = lazy(() => import("./CustomersPage"));
const SettingsPage = lazy(() => import("./SettingsPage"));

type View =
  | "dashboard"
  | "pos"
  | "inventory"
  | "grocery"
  | "kitchens"
  | "orders"
  | "reports"
  | "customers"
  | "settings";

type NavSection = {
  label: string;
  items: Array<{
    id: View;
    label: string;
    icon: LucideIcon;
  }>;
};

/* ── Grouped navigation matching the Figma design ── */
const navSections: NavSection[] = [
  {
    label: "MENU",
    items: [
      { id: "dashboard" as const, label: "Overview", icon: LayoutDashboard },
      { id: "orders" as const, label: "Orders", icon: ClipboardList },
      { id: "pos" as const, label: "POS", icon: CreditCard },
      { id: "reports" as const, label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "INVENTORY",
    items: [
      { id: "inventory" as const, label: "Products", icon: Package },
      { id: "grocery" as const, label: "Categories", icon: Salad },
      { id: "kitchens" as const, label: "Kitchens", icon: ChefHat },
    ],
  },
  {
    label: "OTHERS",
    items: [
      { id: "settings" as const, label: "Settings", icon: SettingsIcon },
      { id: "customers" as const, label: "Customers", icon: Users },
    ],
  },
];

/* flat list for the MigrationPlaceholder fallback */
const allNavItems = navSections.flatMap((s) => s.items);

function MigrationPlaceholder({ view }: { view: View }) {
  const item = allNavItems.find((entry) => entry.id === view);
  const Icon = item?.icon || Package;

  return (
    <section className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Icon size={28} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{item?.label}</h2>
        <p className="mt-2 text-slate-500">
          This section is being prepared. Check back shortly.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────── Shell ───────────────────── */

export function AppShell({ state }: { state: ActivationState }) {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const preload = () => void import("./PosPage");
    const idle = window.requestIdleCallback?.(preload, { timeout: 1_500 });
    if (idle === undefined) {
      const timer = window.setTimeout(preload, 500);
      return () => window.clearTimeout(timer);
    }
    return () => window.cancelIdleCallback?.(idle);
  }, []);
  const [showNotifications, setShowNotifications] = useState(false);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [notice, setNotice] = useState("");
  const [dataVersion, setDataVersion] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchScope, setSearchScope] = useState("All");
  const [settings, setSettings] = useState<PosSettings | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.restrozapp.system.status().then(setSystem);
  }, []);

  useEffect(() => {
    const refresh = () => {
      void window.restrozapp.pos.getSettings().then((result) => {
        if (result.ok) setSettings(result.data);
      });
    };
    refresh();
    return window.restrozapp.pos.onSettingsChanged(refresh);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(() => {
      void window.restrozapp.pos.globalSearch(query).then((result) => {
        setSearchResults(result.ok ? result.data.results : []);
        setSearching(false);
      });
    }, 90);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const visibleSearchResults = useMemo(() => {
    const entityByScope: Record<string, GlobalSearchResult["entity"] | undefined> = {
      Products: "product",
      Orders: "order",
      Customers: "customer",
      Vendors: "vendor",
    };
    const entity = entityByScope[searchScope];
    return entity ? searchResults.filter((result) => result.entity === entity) : searchResults;
  }, [searchResults, searchScope]);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  /* Ctrl+K / Cmd+K to open search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchRef.current?.focus(), 80);
      }
      if (e.key === "Escape") setShowSearch(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  async function print(order: PosOrder, type: ReceiptType) {
    const result = await window.restrozapp.print.enqueue({
      orderId: order.id,
      receiptType: type,
    });
    setNotice(result.ok ? `${type.toUpperCase()} sent to the default printer.` : result.error);
  }

  function changed() {
    setDataVersion((version) => version + 1);
  }

  function openView(view: View) {
    setActiveView(view);
    setIsSidebarOpen(false);
  }

  function openSearchResult(result: GlobalSearchResult) {
    const destination: Record<GlobalSearchResult["entity"], View> = {
      product: "inventory",
      order: "orders",
      customer: "customers",
      vendor: "grocery",
      grocery: "grocery",
      setting: "settings",
    };
    openView(destination[result.entity]);
    setShowSearch(false);
    setSearchQuery("");
  }

  const restaurantName =
    settings?.restaurantName || state.restaurant?.restaurantName || "RestroZapp POS";
  const restaurantLogo = settings?.restaurantLogo || state.restaurant?.logoUrl || "";

  function renderView() {
    if (activeView === "dashboard") return <DashboardPage />;
    if (activeView === "pos") return <PosPage />;
    if (activeView === "inventory") return <InventoryPage />;
    if (activeView === "grocery") return <GroceryPage />;
    if (activeView === "kitchens") {
      return <KitchensPage onOpenInventory={() => openView("inventory")} />;
    }
    if (activeView === "orders") return <OrdersPage />;
    if (activeView === "reports") return <ReportsPage />;
    if (activeView === "customers") return <CustomersPage />;
    if (activeView === "settings") return <SettingsPage />;
    return <MigrationPlaceholder view={activeView} />;
  }

  const sidebarW = isCollapsed ? "w-[84px]" : "w-72";
  const mainML = isCollapsed ? "lg:ml-[84px]" : "lg:ml-72";

  return (
    <div className="restrozapp-shell flex h-screen bg-[#0d0d16] overflow-hidden text-slate-900">
      {/* ── Mobile hamburger ── */}
      <motion.button
        type="button"
        onClick={() => setIsSidebarOpen((open) => !open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#1a1a2e] text-white rounded-xl shadow-xl border border-slate-800/20"
        aria-label="Toggle menu"
        whileTap={{ scale: 0.95 }}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </motion.button>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ════════════════ SIDEBAR ════════════════ */}
      <aside
        className={`fixed top-0 left-0 h-full ${sidebarW} bg-[#0d0d16] text-white z-40 border-r border-[#181827]/80 transition-all duration-300 overflow-y-auto overflow-x-hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="relative flex items-center gap-3 px-4 py-5 border-b border-[#181827]">
          <img
            src={restrozappMark}
            alt="RestroZapp"
            className="flex-shrink-0 h-11 w-11 rounded-lg object-contain"
          />
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="min-w-0"
            >
              <h1 className="text-xl font-extrabold text-white leading-tight tracking-wide">
                RestroZapp
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-400">
                Restaurant POS
              </p>
            </motion.div>
          )}
          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed((c) => !c)}
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-[#181827] hover:bg-[#222235] text-slate-400 hover:text-white transition-colors ${
              isCollapsed ? "mx-auto" : "ml-auto"
            }`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={14}
              className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed ? (
          <button
            type="button"
            onClick={() => {
              setShowSearch(true);
              setTimeout(() => searchRef.current?.focus(), 80);
            }}
            className="mx-4 mt-4 mb-2 flex items-center gap-3 w-[calc(100%-32px)] px-3 py-2 bg-[#181824] hover:bg-[#20202e] rounded-xl text-xs text-slate-400 transition-colors border border-[#1f1f2e]"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Search</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#0d0d16] border border-[#1f1f2e] rounded text-[9px] text-slate-500 font-mono">
              ⌘K
            </kbd>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowSearch(true);
              setTimeout(() => searchRef.current?.focus(), 80);
            }}
            className="mx-auto mt-4 mb-2 flex items-center justify-center w-8 h-8 bg-[#181824] hover:bg-[#20202e] rounded-xl text-slate-400 transition-colors border border-[#1f1f2e]"
            aria-label="Search"
          >
            <Search size={16} />
          </button>
        )}

        {/* Navigation Sections */}
        <nav className="px-3 mt-2 pb-44" aria-label="Main navigation">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!isCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase">
                  {section.label}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map(({ id, label, icon: Icon }) => {
                  const active = activeView === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => openView(id)}
                        className={`group w-full flex items-center ${
                          isCollapsed ? "justify-center px-0" : "px-4"
                        } gap-3 py-2.5 rounded-xl transition-all text-[13px] font-medium relative ${
                          active
                            ? "bg-[#1c1c28] text-white font-semibold"
                            : "text-slate-400 hover:bg-[#151522] hover:text-white"
                        }`}
                        title={isCollapsed ? label : undefined}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange-500 rounded-r-full" />
                        )}
                        <Icon size={18} className={active ? "text-orange-500" : "text-slate-400 group-hover:text-white transition-colors"} strokeWidth={active ? 2.5 : 2} />
                        {!isCollapsed && <span>{label}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#181827] bg-[#0d0d16]">
          {/* Feedback & Help */}
          {!isCollapsed && (
            <div className="px-3 py-2 space-y-0.5">
              <button
                type="button"
                onClick={() => window.open("https://restrozapp.vercel.app/feedback", "_blank", "noopener,noreferrer")}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-[#151522] hover:text-white transition-colors"
              >
                <MessageSquare size={16} />
                <span>Feedback</span>
              </button>
              <button
                type="button"
                onClick={() => window.open("https://restrozapp.vercel.app/help", "_blank", "noopener,noreferrer")}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-[#151522] hover:text-white transition-colors"
              >
                <HelpCircle size={16} />
                <span>Help & Center</span>
              </button>
            </div>
          )}

          {/* Store profile */}
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center px-2" : "px-4"
            } py-3.5 gap-3`}
          >
            {restaurantLogo ? (
              <img
                src={restaurantLogo}
                alt=""
                className="h-9 w-9 flex-shrink-0 rounded-lg bg-white object-contain"
              />
            ) : (
              <div className="flex-shrink-0 w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md">
                {restaurantName.slice(0, 2).toUpperCase()}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  Store
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {restaurantName}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    system?.online ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
              </div>
            )}
          </div>
          {!isCollapsed && (
            <a
              href="https://restrozapp.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="block pb-3 text-center text-[10px] font-medium text-slate-500 hover:text-orange-400"
            >
              Powered by RestroZapp
            </a>
          )}
        </div>
      </aside>

      {/* ════════════════ MAIN CONTENT ════════════════ */}
      <div
        className={`flex-1 min-w-0 flex flex-col ${mainML} transition-all duration-300 h-screen p-3 lg:p-4`}
      >
        <div className="flex-1 flex flex-col bg-[#f5f6fa] rounded-[24px] overflow-hidden border border-slate-200/50 shadow-xl">
          {/* ── Top Header Bar ── */}
          <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 h-[56px] flex items-center justify-between border-b border-slate-100">
            {/* Store Name / Brand */}
            <div className="flex items-center gap-3">
              {restaurantLogo ? (
                <img src={restaurantLogo} alt="" className="h-9 w-9 rounded-lg object-contain" />
              ) : (
                <img src={restrozappMark} alt="" className="h-9 w-9 rounded-lg object-contain" />
              )}
              <div>
                <span className="block text-sm font-extrabold text-slate-900 leading-tight font-display">
                  {restaurantName}
                </span>
                <span className="block text-[10px] text-[#FF6B2B] font-bold tracking-wider uppercase font-display">
                  Active Store
                </span>
              </div>
            </div>

            {/* Search Trigger in Header */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <button
                type="button"
                onClick={() => {
                  setShowSearch(true);
                  setTimeout(() => searchRef.current?.focus(), 80);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 hover:border-slate-200 focus:border-[#FF6B2B] focus:ring-1 focus:ring-[#FF6B2B] rounded-xl text-xs text-slate-400 transition-all font-medium text-left group"
              >
                <Search size={14} className="text-slate-400 group-hover:text-slate-500 transition-colors" />
                <span className="flex-1">Search products, orders, customers...</span>
                <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200/60 rounded text-[9px] text-slate-500 font-mono">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* Online indicator */}
              <span
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                  system?.online
                    ? "bg-emerald-50/60 text-emerald-700 border-emerald-100"
                    : "bg-amber-50/60 text-amber-700 border-amber-100"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${system?.online ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
                {system?.online ? "Online" : "Offline"}
              </span>

              {/* Notification bell */}
              <button
                type="button"
                onClick={() => setShowNotifications((o) => !o)}
                className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 hover:border-slate-200 text-slate-500 transition-all shadow-sm group focus:outline-none focus:border-[#FF6B2B] focus:ring-1 focus:ring-[#FF6B2B]"
              >
                <Bell size={15} className="group-hover:animate-bounce" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 border border-white rounded-full" />
              </button>

              {/* Profile */}
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={() => setShowProfileMenu((open) => !open)}
                  className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-slate-200/60 hover:border-slate-350 rounded-xl transition-all shadow-sm"
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
                    <User size={14} className="text-white" />
                  </span>
                  <span className="hidden md:block text-left">
                    <span className="block text-xs font-bold text-[#111827] leading-tight">
                      Admin User
                    </span>
                    <span className="block text-[10px] text-[#6b7280] font-semibold">
                      Store Manager
                    </span>
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-slate-400 transition-transform duration-300 ${
                      showProfileMenu ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <button
                        type="button"
                        aria-label="Close profile menu"
                        className="fixed inset-0 z-30"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-40"
                      >
                        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-slate-200">
                          <p className="font-bold text-xs text-[#111827]">Admin User</p>
                          <p className="text-[10px] text-[#6b7280] mt-0.5">
                            {state.restaurant?.restaurantCode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            openView("settings");
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-left text-slate-700 text-xs font-medium"
                        >
                          <SettingsIcon size={16} />
                          <span>System Settings</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowProfileMenu(false)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-left text-red-600 text-xs font-medium"
                        >
                          <LogOut size={16} />
                          <span>Close Menu</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>


          {/* ── Page content ── */}
          <main className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="max-w-[1440px] mx-auto">
              <Suspense
                fallback={
                  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8 animate-pulse">
                    <div className="w-full max-w-2xl space-y-5">
                      <div className="flex justify-between items-center">
                        <div className="h-9 w-48 bg-slate-200/80 rounded-xl"></div>
                        <div className="h-9 w-32 bg-slate-200/80 rounded-xl"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="h-28 bg-slate-200/60 rounded-2xl"></div>
                        <div className="h-28 bg-slate-200/60 rounded-2xl"></div>
                        <div className="h-28 bg-slate-200/60 rounded-2xl"></div>
                        <div className="h-28 bg-slate-200/60 rounded-2xl"></div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        <div className="lg:col-span-3 h-72 bg-slate-200/60 rounded-2xl"></div>
                        <div className="lg:col-span-2 h-72 bg-slate-200/60 rounded-2xl"></div>
                      </div>
                    </div>
                  </div>
                }
              >
                {renderView()}
              </Suspense>
            </div>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {showSearch && (
          <>
            <motion.button
              type="button"
              aria-label="Close search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.96 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[90%] max-w-xl bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.08)] z-50 overflow-hidden border border-slate-100"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
                <Search size={20} className="text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search products, orders, customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm text-[#111827] placeholder:text-slate-400 outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex gap-1 px-5 py-3 border-b border-slate-100">
                {["All", "Products", "Orders", "Customers", "Vendors"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSearchScope(tab)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                      searchScope === tab
                        ? "bg-orange-50 text-orange-700"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                  >
                    {tab === "All" && <LayoutDashboard size={13} />}
                    {tab === "Products" && <Package size={13} />}
                    {tab === "Orders" && <ClipboardList size={13} />}
                    {tab === "Customers" && <Users size={13} />}
                    {tab}
                  </button>
                ))}
              </div>
              <div className="max-h-[420px] overflow-y-auto p-2">
                {searching ? (
                  <p className="px-4 py-10 text-center text-sm font-medium text-slate-500">
                    Searching...
                  </p>
                ) : visibleSearchResults.length ? (
                  visibleSearchResults.map((result) => (
                    <button
                      key={`${result.entity}:${result.id}`}
                      type="button"
                      onClick={() => openSearchResult(result)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-orange-50"
                    >
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                        {result.entity === "product" && <Package size={17} />}
                        {result.entity === "order" && <ClipboardList size={17} />}
                        {result.entity === "customer" && <Users size={17} />}
                        {result.entity === "vendor" && <Tag size={17} />}
                        {result.entity === "grocery" && <ShoppingCart size={17} />}
                        {result.entity === "setting" && <SettingsIcon size={17} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {result.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {result.subtitle}
                        </span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {result.entity}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-10 text-center">
                    <Search size={40} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-sm font-semibold text-[#111827]">
                      {searchQuery.trim().length >= 2 ? "No results found" : "Start typing to search"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Search accepts partial words and common spelling mistakes.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Notification panel ── */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <button
              type="button"
              aria-label="Close notifications"
              className="fixed inset-0 z-30"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              className="fixed top-16 right-6 w-96 max-h-[70vh] bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.08)] border border-slate-100 z-40 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#111827]">Notifications</h3>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <SettingsIcon size={18} />
                </button>
              </div>
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                No new notifications
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast notice ── */}
      {notice && (
        <button
          type="button"
          className="fixed right-6 bottom-6 z-50 px-4 py-3 rounded-xl bg-[#1a1a2e] text-white shadow-xl"
          onClick={() => setNotice("")}
        >
          {notice}
        </button>
      )}

    </div>
  );
}
