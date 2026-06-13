import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { fetchProducts, hasCategory } from "../lib/products";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeroSlider from "../components/HeroSlider";
import {
  ArrowLineUpRightIcon,
  StarIcon,
  FireIcon,
  SquaresFourIcon,
  TShirtIcon,
  CrownIcon,
  HandbagIcon,
  TagIcon,
} from "@phosphor-icons/react";
import ProductCard from "../components/ProductCard";
import FastSelling from "../components/FastSelling";
import ShopByCategory from "../components/ShopByCategory";
import Accesories from "../components/Accesories";
import Footer from "../components/Footer";
import SalePopup from "../components/SalePopup";
import product1 from "../assets/prod-1.webp";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "New Arrivals": StarIcon,
  "Fast Selling": FireIcon,
  "Shop By Category": SquaresFourIcon,
  "Clothing": TShirtIcon,
  "Body Shapers": CrownIcon,
  "Accessories": HandbagIcon,
  "Sales": TagIcon,
};

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  discountPrice?: number | null;
  colors?: string[];
  category: string;
  categories?: string[];
  createdAt: unknown;
}

interface HomepageSections {
  newArrivals: string[];
  fastSelling: string[];
  shopByCategory: string[];
  accessories: string[];
  mobileTabs?: string[];
}

const MAX_PER_SECTION = 6;

const STATIC_PRODUCTS: Product[] = [1, 2, 3, 4, 5, 6].map((i) => ({
  id: `static-${i}`,
  name: "Women's Sports Wear",
  imageUrl: product1,
  price: 120,
  discountPrice: null,
  colors: [],
  category: "New Arrivals",
  createdAt: null,
}));

function resolvePinned(ids: string[], allProducts: Product[]): Product[] {
  const map = new Map(allProducts.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter(Boolean) as Product[];
}

function Homepage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<HomepageSections>({
    newArrivals: [],
    fastSelling: [],
    shopByCategory: [],
    accessories: [],
    mobileTabs: [],
  });
  const [loading, setLoading] = useState(true);
  const [mobileTabs, setMobileTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsResult, products] = await Promise.all([
          supabase
            .from("site_settings")
            .select("value")
            .eq("key", "homepage")
            .maybeSingle(),
          fetchProducts(),
        ]);

        setAllProducts(products);

        if (settingsResult.data) {
          const d = settingsResult.data.value as {
            sections?: Partial<HomepageSections>;
            mobileTabs?: string[];
          };
          setSections({
            newArrivals: d.sections?.newArrivals ?? [],
            fastSelling: d.sections?.fastSelling ?? [],
            shopByCategory: d.sections?.shopByCategory ?? [],
            accessories: d.sections?.accessories ?? [],
          });
          setMobileTabs(d.mobileTabs ?? []);
        }
      } catch (err) {
        console.error("Homepage load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const newArrivalsProducts =
    sections.newArrivals.length > 0
      ? resolvePinned(sections.newArrivals, allProducts)
      : allProducts
          .filter((p) => hasCategory(p, "New Arrivals"))
          .slice(0, MAX_PER_SECTION);

  const hasProducts = allProducts.length > 0;

  const fallbackNewArrivals = !hasProducts
    ? STATIC_PRODUCTS
    : newArrivalsProducts;

  const fastSellingProducts =
    sections.fastSelling.length > 0
      ? resolvePinned(sections.fastSelling, allProducts)
      : STATIC_PRODUCTS;

  const shopByCategoryProducts =
    sections.shopByCategory.length > 0
      ? resolvePinned(sections.shopByCategory, allProducts)
      : STATIC_PRODUCTS;

  const accessoriesProducts =
    sections.accessories.length > 0
      ? resolvePinned(sections.accessories, allProducts)
      : allProducts
            .filter((p) => hasCategory(p, "Accessories"))
            .slice(0, MAX_PER_SECTION).length > 0
        ? allProducts
            .filter((p) => hasCategory(p, "Accessories"))
            .slice(0, MAX_PER_SECTION)
        : STATIC_PRODUCTS;

  return (
    <div>
      <SalePopup />
      <Navbar />

      <HeroSlider page="Homepage" />

      {/* Dynamic Mobile Category Toggle Buttons */}
      {mobileTabs.length > 0 && mobileTabs.length <= 2 && (
        <div className="md:hidden flex px-4 mt-6 gap-3 max-w-[1440px] mx-auto">
          {mobileTabs.map(tab => {
            const Icon = CATEGORY_ICONS[tab] || StarIcon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(activeTab === tab ? null : tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-[#533113] raleway-bold text-sm uppercase transition-colors ${
                  activeTab === tab ? "bg-[#533113] text-white" : "bg-transparent text-[#533113]"
                }`}
              >
                <Icon size={16} weight={activeTab === tab ? "fill" : "regular"} />
                {tab}
              </button>
            );
          })}
        </div>
      )}

      {mobileTabs.length > 2 && (
        <div className="md:hidden flex px-4 mt-6 gap-3 max-w-[1440px] mx-auto overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2">
          {mobileTabs.map(tab => {
            const Icon = CATEGORY_ICONS[tab] || StarIcon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(activeTab === tab ? null : tab)}
                className={`w-[85px] h-[85px] flex-shrink-0 flex flex-col items-center justify-center gap-1.5 p-1 border border-[#533113] uppercase transition-colors snap-center ${
                  activeTab === tab ? "bg-[#533113] text-white" : "bg-transparent text-[#533113]"
                }`}
              >
                <Icon size={24} weight={activeTab === tab ? "fill" : "regular"} />
                <span className="raleway-bold text-[10px] leading-tight text-center px-1 break-words">{tab}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic Mobile Category Content */}
      {activeTab !== null && (
        <section className="md:hidden max-w-[1440px] mx-auto px-4 mt-8 mb-10">
          <div className="flex flex-col gap-2 w-full mb-6">
            <h2 className="text-[32px] text-[#533113] raleway-black uppercase leading-[1.1]">
              {activeTab} <br /> that define you
            </h2>
            <p className="raleway-regular text-sm text-[#533113] w-full max-w-[90%]">
              Discover pieces that redefine bold and confidence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {allProducts
              .filter((p) => hasCategory(p, activeTab))
              .slice(0, 6)
              .map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  image={p.imageUrl}
                  name={p.name}
                  price={p.discountPrice ?? p.price}
                  colors={p.colors}
                />
              ))}
          </div>
          <div className="mt-8">
            <Link
              to={`/${activeTab.toLowerCase().replace(/\s+/g, '-')}`}
              className="w-full flex justify-center py-3 border border-[#533113] text-[#533113] raleway-bold text-sm uppercase tracking-widest hover:bg-[#533113] hover:text-white transition-colors"
            >
              View All {activeTab}
            </Link>
          </div>
        </section>
      )}

      <main
        className={`max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mt-10 ${activeTab !== null ? "hidden md:block" : ""}`}
      >
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 md:py-10 py-4">
          <div className="flex flex-col gap-2 w-full md:w-[70%] lg:w-full">
            <h3 className="text-2xl font-bold raleway-bold">NEW ARRIVALS</h3>
            <p className="text-base raleway-regular w-full md:w-[80%] lg:w-[60%]">
              PREMIUM LOUNGE / GYM WEAR, AND ACCESORIES
            </p>
          </div>
          <Link
            to="/new-arrivals"
            className="bg-[#533113] text-white py-2 px-4 flex justify-between items-center w-full md:w-64 lg:w-48"
          >
            <span className="raleway-regular text-base">Shop Now</span>
            <ArrowLineUpRightIcon size={24} />
          </Link>
        </section>
      </main>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* New Arrivals grid */}
          <section
            className={`max-w-[1440px] 2xl:max-w-[1620px] md:mx-auto px-4 md:px-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-4 md:gap-6 mb-10 ${activeTab !== null ? "hidden md:grid" : ""}`}
          >
            {fallbackNewArrivals.map((p, item) => (
              <div
                key={p.id}
                className={`
                  ${item === 2 ? "block" : ""}
                  ${item === 3 ? "block md:hidden lg:block" : ""}
                  ${item === 4 ? "hidden 2xl:block" : ""}
                  ${item === 5 ? "hidden min-[1920px]:block" : ""}
                `}
              >
                <ProductCard
                  id={p.id}
                  image={p.imageUrl}
                  name={p.name}
                  price={p.discountPrice ?? p.price}
                  colors={p.colors}
                />
              </div>
            ))}
          </section>

          {fastSellingProducts.length > 0 && (
            <section
              className={`max-w-[1440px] 2xl:max-w-[1620px] mx-auto md:px-10 my-20 ${activeTab !== null ? "hidden md:block" : ""}`}
            >
              <FastSelling
                products={fastSellingProducts}
                mobileLimit={4}
              />
            </section>
          )}

          {shopByCategoryProducts.length > 0 && (
            <section
              className={`max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 my-20 ${activeTab !== null ? "hidden md:block" : ""}`}
            >
              <ShopByCategory
                products={shopByCategoryProducts}
                mobileLimit={2}
              />
            </section>
          )}

          {accessoriesProducts.length > 0 && (
            <section
              className={`max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 my-20 ${activeTab !== null ? "hidden md:block" : ""}`}
            >
              <Accesories products={accessoriesProducts} mobileLimit={4} />
            </section>
          )}
        </>
      )}

      <Footer />
    </div>
  );
}

export default Homepage;
