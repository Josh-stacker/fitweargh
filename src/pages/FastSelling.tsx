import { useEffect, useState } from "react";
import { ArrowLineUpRightIcon, FunnelIcon, XIcon } from "@phosphor-icons/react";
import { fetchProducts, hasCategory } from "../lib/products";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Button from "../components/ui/Button";
import HeroSlider from "../components/HeroSlider";
import ProductPagination from "../components/ProductPagination";
import product1 from "../assets/prod-1.webp";
import { supabase } from "../supabase";

const SORT_OPTIONS = ["Newest First", "Price: Low to High", "Price: High to Low", "Best Selling"];
const COLORS = ["#000000", "#FFFFFF", "#ef4444", "#00864A", "#808000", "#4B5320", "#533113", "#3b82f6", "#f97316", "#FFA500", "#ec4899", "#1e3a5f", "#6b7280", "#eab308", "#D4A017", "#800080", "#E3BC9A", "#FF69B4", "#4A0E4E", "#a9edff", "#FFF099", "#C8A2C8", "#98FF98", "#800020", "#F4C2C2", "#7BA0B4", "#CC5500"];
const MOBILE_PAGE_SIZE = 10;

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  category: string;
  categories?: string[];
  imageUrl?: string;
  colors?: string[];
}

const FALLBACK: Product[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: "Fast Selling Activewear",
  price: 100 + i * 10,
  category: "Fast Selling",
  imageUrl: product1,
}));

function FastSellingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState("Newest First");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(500);
  const [maxAvailablePrice, setMaxAvailablePrice] = useState(500);
  const [pageEnabled, setPageEnabled] = useState(true);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileVisible, setMobileVisible] = useState(MOBILE_PAGE_SIZE);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [settingsResult, all] = await Promise.all([
          supabase.from("site_settings").select("value").eq("key", "homepage").maybeSingle(),
          fetchProducts(),
        ]);
        const settings = settingsResult.data?.value as { fastSellingEnabled?: boolean } | null;
        setPageEnabled(settings?.fastSellingEnabled ?? true);
        const fastSelling = all.filter((p) => hasCategory(p, "Fast Selling"));
        const resolvedProducts = fastSelling.length > 0 ? fastSelling : FALLBACK;
        const highestPrice = Math.max(500, ...resolvedProducts.map((p) => Number(p.price) || 0));
        setMaxAvailablePrice(highestPrice);
        setPriceMax(highestPrice);
        setProducts(resolvedProducts);
      } catch (err) {
        console.error("[FastSelling] Product load error:", err);
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

  useEffect(() => {
    setCurrentPage(1);
    setMobileVisible(MOBILE_PAGE_SIZE);
  }, [activeSort, priceMin, priceMax, selectedColors]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const pageStartIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = sorted.slice(pageStartIndex, pageStartIndex + pageSize);
  const mobileProducts = sorted.slice(0, mobileVisible);
  const showingStart = sorted.length === 0 ? 0 : pageStartIndex + 1;
  const showingEnd = Math.min(pageStartIndex + paginatedProducts.length, sorted.length);

  const toggleColor = (c: string) =>
    setSelectedColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="min-h-screen bg-[#FFFBF6]">
      <Navbar />
      {!pageEnabled ? (
        <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-20 text-center">
          <p className="raleway-regular text-lg text-[#533113]/60">Fast Selling is currently unavailable.</p>
        </main>
      ) : (
      <>
      <HeroSlider page="Fast Selling" />

      <div className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mt-8">
        <div className="flex md:hidden items-center gap-3 pb-4 border-b border-[#DEDEDE]">
          <select
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
            className="raleway-regular text-base border border-[#DEDEDE] text-[#533113] bg-white px-3 py-2.5 outline-none cursor-pointer flex-1 focus:border-[#533113]"
          >
            {SORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className="flex items-center gap-2 bg-[#533113] text-white px-4 py-2.5 raleway-regular text-base shrink-0"
          >
            {filterPanelOpen ? <XIcon size={16} /> : <FunnelIcon size={16} />}
            Filters
          </button>
        </div>

        <div className="hidden md:flex justify-between items-center border-b border-[#DEDEDE] pb-4">
          <p className="raleway-regular text-base text-[#533113]/70">{sorted.length} items</p>
          <div className="flex items-center gap-3">
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value)}
              className="raleway-regular text-base border border-[#533113] text-[#533113] bg-white px-3 py-2 outline-none cursor-pointer focus:border-[#533113]"
            >
              {SORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <button
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className="flex items-center gap-2 bg-[#533113] text-white px-4 py-2 raleway-regular text-base hover:bg-[#3d2409] transition-colors"
            >
              {filterPanelOpen ? <XIcon size={16} /> : <FunnelIcon size={16} />}
              {filterPanelOpen ? "Close" : "Filters"}
            </button>
          </div>
        </div>

        {filterPanelOpen && (
          <div className="border border-[#DEDEDE] bg-white p-5 md:p-6 mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
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

            <div className="flex flex-col gap-4 sm:col-span-2 md:col-span-1">
              <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Price Range</p>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="raleway-regular text-sm text-[#533113]/60">Min</span>
                  <span className="raleway-bold text-xs text-[#533113]">gh₵ {priceMin}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxAvailablePrice}
                  step={10}
                  value={priceMin}
                  onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax - 10))}
                  className="w-full accent-[#533113] cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="raleway-regular text-sm text-[#533113]/60">Max</span>
                  <span className="raleway-bold text-xs text-[#533113]">gh₵ {priceMax}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxAvailablePrice}
                  step={10}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin + 10))}
                  className="w-full accent-[#533113] cursor-pointer"
                />
              </div>
              <p className="raleway-regular text-sm text-[#533113]/70">gh₵ {priceMin} — gh₵ {priceMax}</p>
              <Button text="Apply" width="w-full" icon={<ArrowLineUpRightIcon size={14} />} />
            </div>
          </div>
        )}
      </div>

      <main className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mt-8 mb-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#F5EDE0] animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="raleway-regular text-lg text-[#533113]/50">No products match your filters.</p>
          </div>
        ) : (
          <>
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.imageUrl}
                name={product.name}
                price={product.price}
                discountPrice={product.discountPrice}
                colors={product.colors}
                category={product.category}
                categories={product.categories}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 md:hidden gap-4">
            {mobileProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.imageUrl}
                name={product.name}
                price={product.price}
                discountPrice={product.discountPrice}
                colors={product.colors}
                category={product.category}
                categories={product.categories}
              />
            ))}
          </div>
          </>
        )}

        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sorted.length}
          showingStart={showingStart}
          showingEnd={showingEnd}
          onPageChange={setCurrentPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setCurrentPage(1);
          }}
        />

        <div className="flex md:hidden justify-center mt-12">
          {mobileVisible < sorted.length && (
            <Button
              text="Load More"
              width="w-48 md:w-56"
              icon={<ArrowLineUpRightIcon size={20} />}
              onClick={() => setMobileVisible((count) => count + MOBILE_PAGE_SIZE)}
            />
          )}
        </div>
      </main>
      </>
      )}

      <Footer />
    </div>
  );
}

export default FastSellingPage;
