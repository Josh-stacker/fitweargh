import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeroSlider from "../components/HeroSlider";
import { ArrowLineUpRightIcon } from "@phosphor-icons/react";
import ProductCard from "../components/ProductCard";
import FastSelling from "../components/FastSelling";
import ShopByCategory from "../components/ShopByCategory";
import Accesories from "../components/Accesories";
import Footer from "../components/Footer";
import SalePopup from "../components/SalePopup";
import product1 from "../assets/prod-1.webp";

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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsSnap, productsSnap] = await Promise.all([
          getDoc(doc(db, "siteSettings", "homepage")),
          getDocs(query(collection(db, "products"), orderBy("createdAt", "desc"))),
        ]);

        const products = productsSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Product)
        );
        setAllProducts(products);

        if (settingsSnap.exists()) {
          const d = settingsSnap.data();
          setSections({
            newArrivals: d.sections?.newArrivals ?? [],
            fastSelling: d.sections?.fastSelling ?? [],
            shopByCategory: d.sections?.shopByCategory ?? [],
            accessories: d.sections?.accessories ?? [],
          });
        }
      } catch (err) {
        console.error("Homepage load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasCategory = (p: Product, cat: string) =>
    p.categories?.includes(cat) ?? p.category === cat;

  // Resolve each section: pinned IDs → products, or fall back to auto-latest
  const newArrivalsProducts =
    sections.newArrivals.length > 0
      ? resolvePinned(sections.newArrivals, allProducts)
      : allProducts.filter((p) => hasCategory(p, "New Arrivals")).slice(0, MAX_PER_SECTION);

  const hasProducts = allProducts.length > 0;

  const fallbackNewArrivals = !hasProducts ? STATIC_PRODUCTS : newArrivalsProducts;

  const fastSellingProducts = sections.fastSelling.length > 0
    ? resolvePinned(sections.fastSelling, allProducts)
    : STATIC_PRODUCTS;

  const shopByCategoryProducts = sections.shopByCategory.length > 0
    ? resolvePinned(sections.shopByCategory, allProducts)
    : STATIC_PRODUCTS;

  const accessoriesProducts = sections.accessories.length > 0
    ? resolvePinned(sections.accessories, allProducts)
    : allProducts.filter((p) => hasCategory(p, "Accessories")).slice(0, MAX_PER_SECTION).length > 0
      ? allProducts.filter((p) => hasCategory(p, "Accessories")).slice(0, MAX_PER_SECTION)
      : STATIC_PRODUCTS;

  return (
    <div>
      <SalePopup />
      <Navbar />

      <HeroSlider page="Homepage" />

      <main className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mt-10">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 md:py-10 py-4">
          <div className="flex flex-col gap-2 w-full md:w-[70%] lg:w-full">
            <h3 className="text-2xl font-bold raleway-bold">NEW ARRIVALS</h3>
            <p className="text-base raleway-regular w-full md:w-[80%] lg:w-[60%]">
              THE LATEST SPORTS, WOMEN'S AND MANY MORE ACCESORIES
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
          <section className="max-w-[1440px] 2xl:max-w-[1620px] md:mx-auto px-4 md:px-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-4 md:gap-6 mb-10">
            {fallbackNewArrivals.map((p, item) => (
              <div
                key={p.id}
                className={`${item === 2 ? "hidden md:block" : ""} ${
                  item === 3 ? "hidden lg:block" : ""
                } ${item === 4 ? "hidden 2xl:block" : ""} ${
                  item === 5 ? "hidden min-[1920px]:block" : ""
                }`}
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
            <section className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 my-20">
              <FastSelling products={fastSellingProducts} />
            </section>
          )}

          {shopByCategoryProducts.length > 0 && (
            <section className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 my-20">
              <ShopByCategory products={shopByCategoryProducts} />
            </section>
          )}

          {accessoriesProducts.length > 0 && (
            <section className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 my-20">
              <Accesories products={accessoriesProducts} />
            </section>
          )}
        </>
      )}

      <Footer />
    </div>
  );
}

export default Homepage;
