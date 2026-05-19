"use client";

import Link from "next/link";
import { Bell, Command, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrewLogo } from "@/components/brand/BrewLogo";
import { CategoryTabs } from "@/components/customer/CategoryTabs";
import { CustomerOrderPreview } from "@/components/customer/CustomerOrderPreview";
import { CustomerSearchBar } from "@/components/customer/CustomerSearchBar";
import { FeaturedPanel } from "@/components/customer/FeaturedPanel";
import { ProductCard } from "@/components/customer/ProductCard";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function generatePickupNumber() {
  const sequence = String(Math.floor(1000 + Math.random() * 9000));
  return `BREW-${sequence}`;
}

export default function CustomerLandingPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery]           = useState("");
  const [cartItems, setCartItems]               = useState([]);
  const [orderMessage, setOrderMessage]         = useState("");
  const [pickupNumber, setPickupNumber]         = useState("Pending");
  const [products, setProducts]                 = useState([]);
  const [categories, setCategories]             = useState(["All"]);
  const [loading, setLoading]                   = useState(true);

  useEffect(() => {
    setPickupNumber(generatePickupNumber());
  }, []);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setProducts(data);
        const unique = ["All", ...new Set(data.map((p) => p.category))];
        setCategories(unique);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch   = !query || `${product.name} ${product.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, products]);

  function handleAdd(product) {
    setOrderMessage("");
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentItems, { ...product, quantity: 1 }];
    });
  }

  function handleIncrease(productId) {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function handleDecrease(productId) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function handleRemove(productId) {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== productId));
  }

  async function handleCheckout() {
    if (!cartItems.length) {
      setOrderMessage("Choose an item to start your picks.");
      return;
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      const price = typeof item.price === "string"
        ? parseFloat(item.price.replace(/[^0-9.]/g, ""))
        : Number(item.price);
      return sum + price * item.quantity;
    }, 0);

    try {
      await fetch("/api/customer-orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pickupNumber, items: cartItems, totalAmount }),
      });
    } catch (err) {
      console.error("Checkout save failed:", err);
    }

    setOrderMessage(`Pickup number ${pickupNumber} is ready. Please proceed to the counter.`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ed] px-3 py-5 text-[#082d1d] transition-colors dark:bg-[#050b08] dark:text-white sm:px-6 lg:px-8">
      <div className="absolute left-[-12rem] top-[-10rem] h-96 w-96 rounded-full bg-[#d9eee2]/80 blur-3xl dark:bg-emerald-700/20" />
      <div className="absolute right-[-8rem] top-24 h-80 w-80 rounded-full bg-[#f7cfbc]/70 blur-3xl dark:bg-amber-700/10" />
      <div className="absolute bottom-[-14rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-white/90 blur-3xl dark:bg-emerald-950/20" />

      <div className="relative mx-auto max-w-7xl rounded-[2rem] border border-white/70 bg-white/45 p-4 shadow-[0_24px_70px_rgba(28,40,32,0.13)] backdrop-blur-2xl dark:border-emerald-300/10 dark:bg-[#0a1510]/95 dark:shadow-[0_24px_70px_rgba(0,0,0,0.55)] sm:p-5 lg:p-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <BrewLogo />

          <div className="flex flex-1 flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-center">
            <CustomerSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b5b38] shadow-sm dark:bg-[#13241b] dark:text-white sm:block">
              Today&apos;s Picks
            </div>
            <ThemeToggle />
            <button
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0b5b38] shadow-sm dark:bg-[#13241b] dark:text-white"
              aria-label="Notifications"
            >
              <Bell size={18} aria-hidden="true" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#ff5b55] ring-2 ring-white" />
            </button>
            <Link
              href="/login"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-black text-[#0b5b38] shadow-sm ring-1 ring-white/80 transition hover:bg-[#0b5b38] hover:text-white dark:bg-[#13241b] dark:text-white dark:ring-emerald-300/10 dark:hover:bg-emerald-400 dark:hover:text-emerald-950"
              aria-label="Open account page"
            >
              C
            </Link>
          </div>
        </header>

        <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <FeaturedPanel
                title="Coffee"
                subtitle="Freshly brewed favorites"
                status="Available"
                tone="green"
                image="/images/menu/hot-coffee.jpg"
              />
              <FeaturedPanel
                title="Tea"
                subtitle="Calm blends and herbal cups"
                status="Available"
                tone="coral"
                image="/images/menu/tea.jpg"
              />
              <FeaturedPanel
                title="Snack"
                subtitle="Pastries and light bites"
                status="Need to re-stock"
                tone="gold"
                image="/images/menu/pastry.jpg"
              />
            </div>

            <div className="rounded-[1.5rem] border border-white/70 bg-white/65 p-3 shadow-sm backdrop-blur-xl dark:border-emerald-300/10 dark:bg-[#102018]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-[#0b5b38] dark:text-emerald-300">
                    <Sparkles size={16} aria-hidden="true" />
                    BREW Menu
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#082d1d] dark:text-white sm:text-3xl">
                    Choose your coffee shop favorites
                  </h1>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[#0b5b38]/15 bg-white/70 px-3 py-2 text-sm font-semibold text-[#0b5b38] dark:border-emerald-300/10 dark:bg-[#172b20] dark:text-white">
                  <Command size={15} aria-hidden="true" />
                  Browse only
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <CategoryTabs
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelect={setSelectedCategory}
                />
                <div className="text-sm font-semibold text-[#5e6d61] dark:text-emerald-100">
                  {loading ? "Loading…" : `${filteredProducts.length} items shown`}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-sm font-semibold text-[#5e6d61] dark:text-emerald-100/60">
                Loading menu…
              </div>
            ) : (
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={handleAdd} />
                ))}
              </section>
            )}
          </div>

          <CustomerOrderPreview
            pickupNumber={pickupNumber}
            items={cartItems}
            fallbackProducts={products.slice(0, 3)}
            message={orderMessage}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            onRemove={handleRemove}
            onCheckout={handleCheckout}
          />
        </section>
      </div>
    </main>
  );
}
