import { useEffect, useMemo, useState } from "react";
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

const TAB_TEXT: Record<string, { heading: string; copy?: string }> = {
  "New Arrivals": { heading: "NEW ARRIVALS", copy: "PREMIUM LOUNGE / GYM WEAR, AND ACCESORIES" },
  "Fast Selling": { heading: "FAST SELLING", copy: "" },
  "Shop By Category": { heading: "SHOP BY CATEGORY", copy: "ALL CATEGORIES SUITABLE FOR YOU" },
  "Accessories": { heading: "ACCESSORIES", copy: "STYLE WITH ACCESSORIES" },
};

const SECTION_LINKS: Record<string, string> = {
  "New Arrivals": "/new-arrivals",
  "Fast Selling": "/new-arrivals",
  "Shop By Category": "/clothing",
  "Clothing": "/clothing",
  "Body Shapers": "/body-shapers",
  "Accessories": "/accessories",
  "Sales": "/sales",
};

const SHOP_CATEGORY_CARDS = [
  { name: "Clothing", href: "/clothing" },
  { name: "Body Shapers", href: "/body-shapers" },
  { name: "Accessories", href: "/accessories" },
  { name: "Sales", href: "/sales" },
];

const HOMEPAGE_TAB_CATEGORIES = [
  "New Arrivals",
  "Fast Selling",
  "Clothing",
  "Body Shapers",
  "Accessories",
  "Sales",
];

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

interface CategoryCardSettings {
  [categoryName: string]: {
    imageUrl?: string;
    imagePath?: string;
  };
}

const MAX_PER_SECTION = 8;

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

function limitProducts(products: Product[]): Product[] {
  return products.slice(0, MAX_PER_SECTION);
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
  const [categoryCardSettings, setCategoryCardSettings] = useState<CategoryCardSettings>({});

  useEffect(() => {
    const load = async () => {
      try {
        console.info("[Homepage] Loading homepage settings and products");
        const [settingsResult, products] = await Promise.all([
          supabase
            .from("site_settings")
            .select("value")
            .eq("key", "homepage")
            .maybeSingle(),
          fetchProducts(),
        ]);

        console.info("[Homepage] Products loaded", {
          total: products.length,
          newArrivals: products.filter((p) => hasCategory(p, "New Arrivals")).length,
          accessories: products.filter((p) => hasCategory(p, "Accessories")).length,
        });
        setAllProducts(products);

        if (settingsResult.error) {
          console.error("[Homepage] Settings load error:", settingsResult.error);
        }

        if (settingsResult.data) {
          const d = settingsResult.data.value as {
            sections?: Partial<HomepageSections>;
            mobileTabs?: string[];
            categoryCards?: CategoryCardSettings;
          };
          console.info("[Homepage] Settings loaded", {
            pinnedSections: d.sections,
            mobileTabs: d.mobileTabs ?? [],
          });
          setSections({
            newArrivals: d.sections?.newArrivals ?? [],
            fastSelling: d.sections?.fastSelling ?? [],
            shopByCategory: d.sections?.shopByCategory ?? [],
            accessories: d.sections?.accessories ?? [],
          });
          setMobileTabs((d.mobileTabs ?? []).filter((tab) => HOMEPAGE_TAB_CATEGORIES.includes(tab)));
          setCategoryCardSettings(d.categoryCards ?? {});
        }
      } catch (err) {
        console.error("[Homepage] Load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const taggedNewArrivals = useMemo(
    () => allProducts.filter((p) => hasCategory(p, "New Arrivals")),
    [allProducts],
  );
  const newArrivalsProducts = useMemo(
    () => limitProducts(
      sections.newArrivals.length > 0
        ? resolvePinned(sections.newArrivals, allProducts)
        : taggedNewArrivals.length > 0
          ? taggedNewArrivals
          : allProducts
    ),
    [allProducts, sections.newArrivals, taggedNewArrivals],
  );

  const hasProducts = allProducts.length > 0;

  const fallbackNewArrivals = !hasProducts
    ? STATIC_PRODUCTS
    : newArrivalsProducts;

  const fastSellingProducts = useMemo(
    () => limitProducts(
      sections.fastSelling.length > 0
        ? resolvePinned(sections.fastSelling, allProducts)
        : STATIC_PRODUCTS
    ),
    [allProducts, sections.fastSelling],
  );

  const shopByCategoryCards = useMemo(
    () => SHOP_CATEGORY_CARDS.map((category) => {
      const savedImage = categoryCardSettings[category.name]?.imageUrl;
      const imageProduct = allProducts.find((p) => hasCategory(p, category.name));
      return {
        ...category,
        imageUrl: savedImage || imageProduct?.imageUrl || product1,
      };
    }),
    [allProducts, categoryCardSettings],
  );

  const taggedAccessories = useMemo(
    () => allProducts.filter((p) => hasCategory(p, "Accessories")),
    [allProducts],
  );
  const accessoriesProducts = useMemo(
    () => limitProducts(
      sections.accessories.length > 0
        ? resolvePinned(sections.accessories, allProducts)
        : taggedAccessories.length > 0
          ? taggedAccessories
          : STATIC_PRODUCTS
    ),
    [allProducts, sections.accessories, taggedAccessories],
  );

  useEffect(() => {
    if (loading) return;
    console.info("[Homepage] Resolved section products", {
      newArrivals: {
        pinnedIds: sections.newArrivals,
        taggedCount: taggedNewArrivals.length,
        renderedCount: fallbackNewArrivals.length,
        renderedIds: fallbackNewArrivals.map((p) => p.id),
      },
      fastSelling: {
        pinnedIds: sections.fastSelling,
        renderedCount: fastSellingProducts.length,
        renderedIds: fastSellingProducts.map((p) => p.id),
      },
      shopByCategory: {
        renderedCount: shopByCategoryCards.length,
        renderedNames: shopByCategoryCards.map((card) => card.name),
      },
      accessories: {
        pinnedIds: sections.accessories,
        taggedCount: taggedAccessories.length,
        renderedCount: accessoriesProducts.length,
        renderedIds: accessoriesProducts.map((p) => p.id),
      },
    });
  }, [
    loading,
    sections,
    taggedNewArrivals,
    taggedAccessories,
    fallbackNewArrivals,
    fastSellingProducts,
    shopByCategoryCards,
    accessoriesProducts,
  ]);

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
      {activeTab !== null && (() => {
        const filtered = allProducts.filter((p) => hasCategory(p, activeTab!));
        return (
          <section className="md:hidden max-w-[1440px] mx-auto px-4 mt-5 mb-10">
            <div className="flex flex-col gap-1 w-full mb-4">
              <h3 className="text-2xl font-bold raleway-bold uppercase">
                {TAB_TEXT[activeTab!]?.heading || activeTab}
              </h3>
              {TAB_TEXT[activeTab!]?.copy && (
                <p className="text-base raleway-regular w-full text-[#533113]">
                  {TAB_TEXT[activeTab!]?.copy}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {filtered.slice(0, MAX_PER_SECTION).map((p) => (
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
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Link
                to={SECTION_LINKS[activeTab!] ?? `/${activeTab!.toLowerCase().replace(/\s+/g, '-')}`}
                className="w-full flex justify-center py-3 px-3 border border-[#533113] text-[#533113] raleway-bold text-sm uppercase tracking-widest text-center hover:bg-[#533113] hover:text-white transition-colors"
              >
                View All {activeTab}
              </Link>
            </div>
          </section>
        );
      })()}

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
            className={`max-w-[1440px] 2xl:max-w-[1620px] md:mx-auto px-4 md:px-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-4 md:gap-6 mb-4 ${activeTab !== null ? "hidden md:grid" : ""}`}
          >
            {fallbackNewArrivals.slice(0, MAX_PER_SECTION).map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                image={p.imageUrl}
                name={p.name}
                price={p.discountPrice ?? p.price}
                colors={p.colors}
              />
            ))}
          </section>
          <div className={`max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-4 md:gap-6 ${activeTab !== null ? "hidden md:grid" : ""}`}>
            <Link
              to="/new-arrivals"
              className="w-full flex items-center justify-center gap-2 border border-[#533113] text-[#533113] py-3 px-3 raleway-bold text-sm uppercase tracking-widest text-center hover:bg-[#533113] hover:text-white transition-colors"
            >
              <span>View All New Arrivals</span>
              <ArrowLineUpRightIcon size={22} />
            </Link>
          </div>

          {fastSellingProducts.length > 0 && (
            <section
              className={`max-w-[1440px] 2xl:max-w-[1620px] mx-auto md:px-10 my-20 ${activeTab !== null ? "hidden md:block" : ""}`}
            >
              <FastSelling
                products={fastSellingProducts}
                mobileLimit={8}
                viewAllHref="/new-arrivals"
                viewAllLabel="View All Fast Selling"
              />
            </section>
          )}

          {shopByCategoryCards.length > 0 && (
            <section
              className={`max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 my-20 ${activeTab !== null ? "hidden md:block" : ""}`}
            >
              <ShopByCategory
                categories={shopByCategoryCards}
                viewAllHref="/clothing"
                viewAllLabel="View All Categories"
              />
            </section>
          )}

          {accessoriesProducts.length > 0 && (
            <section
              className={`max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 my-20 ${activeTab !== null ? "hidden md:block" : ""}`}
            >
              <Accesories
                products={accessoriesProducts}
                mobileLimit={8}
                viewAllHref="/accessories"
                viewAllLabel="View All Accessories"
              />
            </section>
          )}
        </>
      )}

      <Footer />
    </div>
  );
}

export default Homepage;
