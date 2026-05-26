import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Button from "../components/ui/Button";
import PageHero from "../components/PageHero";
import { ArrowLineUpRightIcon, FunnelIcon, XIcon } from "@phosphor-icons/react";
import product1 from "../assets/prod-1.webp";
import heroBg from "../assets/hero-bg.webp";

const SORT_OPTIONS = ["Newest First", "Price: Low to High", "Price: High to Low", "Best Selling"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = ["#000000", "#FFFFFF", "#ef4444", "#00864A", "#533113", "#3b82f6"];

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  category: string;
  imageUrl?: string;
  colors?: string[];
}

const FALLBACK: Product[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: "Sale Item",
  price: 200 - i * 5,
  discountPrice: 120 - i * 3,
  category: i % 2 === 0 ? "Women's" : "Men's",
  imageUrl: product1,
}));

function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState("Newest First");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(500);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "products"), orderBy("createdAt", "desc"))
        );
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        const onSale = all.filter(
          (p) => p.discountPrice != null && p.discountPrice < p.price
        );
        setProducts(onSale.length > 0 ? onSale : FALLBACK);
      } catch {
        setProducts(FALLBACK);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const display = loading ? FALLBACK : products;

  const filtered = display.filter((p) => {
    const effectivePrice = p.discountPrice ?? p.price;
    return effectivePrice >= priceMin && effectivePrice <= priceMax;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ap = a.discountPrice ?? a.price;
    const bp = b.discountPrice ?? b.price;
    if (activeSort === "Price: Low to High") return ap - bp;
    if (activeSort === "Price: High to Low") return bp - ap;
    return 0;
  });

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const toggleColor = (c: string) =>
    setSelectedColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="min-h-screen bg-[#FFFBF6]">
      <Navbar />

      <PageHero
        bgImage={heroBg}
        bgPosition="50% 40%"
        title={"SALES &\nOFFERS"}
        subtitle="Limited-time deals on your favourite pieces — shop before they're gone."
        badge="FitwearGH Sale"
        ctaText="Shop the Sale"
      />

      <div className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mt-8">

        {/* Mobile: sort + filter */}
        <div className="flex md:hidden items-center gap-3 pb-4 border-b border-[#DEDEDE]">
          <select
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
            className="raleway-light text-sm border border-[#DEDEDE] text-[#533113] bg-white px-3 py-2.5 outline-none cursor-pointer flex-1 focus:border-[#533113]"
          >
            {SORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className="flex items-center gap-2 bg-[#533113] text-white px-4 py-2.5 raleway-light text-sm shrink-0"
          >
            {filterPanelOpen ? <XIcon size={16} /> : <FunnelIcon size={16} />}
            Filters
          </button>
        </div>

        {/* Desktop: sort + filter */}
        <div className="hidden md:flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-[#DEDEDE] pb-4">
            <p className="raleway-light text-sm text-[#533113]/70">{sorted.length} items on sale</p>
            <div className="flex items-center gap-3">
              <select
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value)}
                className="raleway-light text-sm border border-[#533113] text-[#533113] bg-white px-3 py-2 outline-none cursor-pointer focus:border-[#533113]"
              >
                {SORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <button
                onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                className="flex items-center gap-2 bg-[#533113] text-white px-4 py-2 raleway-light text-sm hover:bg-[#3d2409] transition-colors"
              >
                {filterPanelOpen ? <XIcon size={16} /> : <FunnelIcon size={16} />}
                {filterPanelOpen ? "Close" : "Filters"}
              </button>
            </div>
          </div>
        </div>

        {/* Filter panel */}
        {filterPanelOpen && (
          <div className="border border-[#DEDEDE] bg-white p-5 md:p-6 mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {/* Size */}
            <div className="flex flex-col gap-3">
              <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Size</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={`border px-3 py-1.5 raleway-light text-xs transition-all ${
                      selectedSizes.includes(s)
                        ? "bg-[#533113] text-white border-[#533113]"
                        : "text-[#533113] border-[#533113] hover:bg-[#533113]/10"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-3">
              <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Color</p>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-all ${
                      selectedColors.includes(c)
                        ? "ring-2 ring-[#533113] ring-offset-2 scale-110"
                        : "border border-[#DEDEDE] hover:scale-110"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="flex flex-col gap-4">
              <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Price Range</p>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="raleway-light text-xs text-[#533113]/60">Min</span>
                  <span className="raleway-bold text-xs text-[#533113]">gh₵ {priceMin}</span>
                </div>
                <input
                  type="range" min={0} max={500} step={10} value={priceMin}
                  onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax - 10))}
                  className="w-full accent-[#533113] cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="raleway-light text-xs text-[#533113]/60">Max</span>
                  <span className="raleway-bold text-xs text-[#533113]">gh₵ {priceMax}</span>
                </div>
                <input
                  type="range" min={0} max={500} step={10} value={priceMax}
                  onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin + 10))}
                  className="w-full accent-[#533113] cursor-pointer"
                />
              </div>
              <p className="raleway-light text-xs text-[#533113]/70">gh₵ {priceMin} — gh₵ {priceMax}</p>
              <Button text="Apply" width="w-full" icon={<ArrowLineUpRightIcon size={14} />} />
            </div>
          </div>
        )}
      </div>

      {/* Product grid */}
      <main className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mt-8 mb-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#F5EDE0] animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="raleway-light text-base text-[#533113]/50">No sale items right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {sorted.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.imageUrl}
                name={product.name}
                price={product.price}
                discountPrice={product.discountPrice}
                colors={product.colors}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-12">
          <Button text="Load More" width="w-48 md:w-56" icon={<ArrowLineUpRightIcon size={20} />} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Sales;
