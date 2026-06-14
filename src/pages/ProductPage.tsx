import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProduct as fetchProductById } from "../lib/products.ts";
import { BUILT_IN_SIZE_CHARTS, mergeBuiltInSizeCharts, resolveSizeChart, type SizeChart } from "../lib/sizeCharts";
import { supabase } from "../supabase";
import ProductCard from "../components/ProductCard";

// Color name → hex for swatches (matches admin COLORS list)
const COLOR_HEX: Record<string, string> = {
  Black: "#000000",
  White: "#FFFFFF",
  Red: "#ef4444",
  Green: "#00864A",
  "Olive Green": "#808000",
  "Army Green": "#4B5320",
  Brown: "#533113",
  Blue: "#3b82f6",
  Orange: "#f97316",
  "Pure Orange": "#FFA500",
  Pink: "#ec4899",
  Navy: "#1e3a5f",
  Grey: "#6b7280",
  Yellow: "#eab308",
  "Curry Yellow": "#D4A017",
  Purple: "#800080",
  Nude: "#E3BC9A",
  "Hot Pink": "#FF69B4",
  "Dark Purple": "#4A0E4E",
  "Sea Blue": "#a9edff",
  "Butter Yellow": "#FFF099",
  Lilac: "#C8A2C8",
  "Mint Green": "#98FF98",
  Burgundy: "#800020",
  "Baby Pink": "#F4C2C2",
  "Pigeon Blue": "#7BA0B4",
  "Burnt Orange": "#CC5500",
};

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/ui/Button";
import { Toast } from "../components/ui/Toast";
import { useCart } from "../context/CartContext";
import {
  ArrowLineUpRightIcon,
  CaretDownIcon,
  CaretUpIcon,
  MinusIcon,
  PlusIcon,
  ArrowLeftIcon,
  ImageIcon,
} from "@phosphor-icons/react";
import product1 from "../assets/prod-1.webp";
import heroBg from "../assets/hero-bg.webp";
import heroBg2 from "../assets/hero-bg2.webp";

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  description: string;
  imageUrl: string;
  images?: string[];
  displayImageIndex?: number;
  colorImageMap?: Record<string, number | number[]>;
  sizes: string[];
  colors: string[];
  colorSizeStock?: Record<string, number>;
  category: string;
  categories?: string[];
  subcategories?: string[];
  sizeChartId?: string | null;
  stock: number;
  onSale?: boolean;
}

interface RelatedProductRow {
  id: string;
  name: string;
  price: number | string;
  discount_price: number | string | null;
  image_url: string | null;
  images: string[] | null;
  display_image_index: number | null;
  color_image_map: Record<string, number | number[]> | null;
  colors: string[] | null;
  category: string | null;
  stock: number | null;
}

// Fallback shown when no product is found for the given ID
const FALLBACK: Product = {
  id: "1",
  name: "Women's Sports Wear",
  price: 120,
  description:
    "Premium quality sportswear designed for maximum comfort and performance. Made from breathable, moisture-wicking fabric that keeps you cool during intense workouts.",
  imageUrl: product1,
  images: [product1, heroBg, heroBg2, product1],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: ["Black", "White", "Red", "Green", "Brown"],
  category: "Women's",
  stock: 10,
};

function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>(BUILT_IN_SIZE_CHARTS);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [descOpen, setDescOpen] = useState(true);
  const [chartOpen, setChartOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setPrimaryIdx(0);
      setSelectedSize("");
      setSelectedColor("");
      setQuantity(1);
      try {
        const chartResult = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "size_charts")
          .maybeSingle();
        const savedCharts = chartResult.data?.value as { charts?: SizeChart[] } | null;
        setSizeCharts(mergeBuiltInSizeCharts(savedCharts?.charts));

        if (!id || !isNaN(Number(id))) {
          setProduct(FALLBACK);
          setRelated([]);
        } else {
          const product = await fetchProductById(id);
          if (product) {
            const data = product as Product;
            // New schema: images[] = all slots. Legacy: images = slots[1..], prepend imageUrl.
            if (!data.images || data.images.length === 0) {
              data.images = [data.imageUrl];
            } else if (data.displayImageIndex == null) {
              data.images = [data.imageUrl, ...data.images];
            }
            setProduct(data);
            setPrimaryIdx(data.displayImageIndex ?? 0);

            // Fetch related: query Supabase directly by category, exclude current product
            const cats = data.categories?.length
              ? data.categories
              : data.category
                ? [data.category]
                : [];
            if (cats.length > 0) {
              let { data: relatedData } = await supabase
                .from("products")
                .select(
                  "id,name,price,discount_price,image_url,images,display_image_index,color_image_map,colors,category,categories,stock",
                )
                .neq("id", id)
                .overlaps("categories", cats)
                .limit(4);

              // Fallback: overlap didn't match, try plain category string
              if (!relatedData || relatedData.length === 0) {
                const fb = await supabase
                  .from("products")
                  .select(
                    "id,name,price,discount_price,image_url,images,display_image_index,color_image_map,colors,category,categories,stock",
                  )
                  .neq("id", id)
                  .eq("category", cats[0])
                  .limit(4);
                relatedData = fb.data;
              }

              const toRelated = (r: RelatedProductRow): Product => ({
                id: r.id,
                name: r.name,
                price: Number(r.price),
                discountPrice: r.discount_price == null ? null : Number(r.discount_price),
                imageUrl: r.image_url ?? "",
                images: r.images ?? [],
                displayImageIndex: r.display_image_index ?? 0,
                colorImageMap: r.color_image_map ?? {},
                colors: r.colors ?? [],
                category: r.category ?? "",
                sizes: [],
                stock: r.stock ?? 0,
                description: "",
                colorSizeStock: {},
              });
              setRelated((relatedData ?? []).map(toRelated));
            } else {
              setRelated([]);
            }
          } else {
            setProduct(FALLBACK);
            setRelated([]);
          }
        }
      } catch {
        setProduct(FALLBACK);
        setRelated([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF6]">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const p = product ?? FALLBACK;
  const images = p.images && p.images.length > 0 ? p.images : [p.imageUrl];
  const inStock = p.stock > 0;
  const activeSizeChart = resolveSizeChart({
    charts: sizeCharts,
    productChartId: p.sizeChartId,
    categories: p.categories?.length ? p.categories : p.category ? [p.category] : [],
    subcategories: p.subcategories ?? [],
  });

  const displayPrice = p.discountPrice ?? p.price;
  const selectedImage = images[primaryIdx] ?? p.imageUrl;

  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
    const imageValue = p.colorImageMap?.[colorName];
    const imageIdx = Array.isArray(imageValue) ? imageValue[0] : imageValue;
    if (typeof imageIdx === "number" && images[imageIdx]) {
      setPrimaryIdx(imageIdx);
    }
  };

  const handleAddToCart = () => {
    if (p.sizes?.length > 0 && !selectedSize) {
      setToastMsg("Please select a size");
      setToast(true);
      return;
    }
    addItem({
      id: p.id,
      name: p.name,
      price: displayPrice,
      imageUrl: selectedImage,
      size: selectedSize,
      color: selectedColor || (p.colors?.[0] ?? ""),
      quantity,
    });
    setToastMsg(`${p.name} added to cart`);
    setToast(true);
  };

  return (
    <div className="min-h-screen bg-[#FFFBF6]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3 md:py-4">
        <div className="flex items-center gap-2 raleway-regular text-base text-[#533113]/60">
          <Link
            to="/new-arrivals"
            className="flex items-center gap-1 hover:text-[#533113] transition-colors"
          >
            <ArrowLeftIcon size={14} />
            New Arrivals
          </Link>
          <span>/</span>
          <span className="text-[#533113] truncate max-w-[200px]">
            {p.name}
          </span>
        </div>
      </div>

      <main className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto">
        <div className="flex flex-col md:flex-row">
          {/* Left: image gallery */}
          <div className="w-full md:w-[45%] md:sticky md:top-0 md:self-start">
            <div className="w-full bg-[#F5EDE0] overflow-hidden aspect-[3/4]">
              {images[primaryIdx] ? (
                <img
                  src={images[primaryIdx]}
                  alt={p.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={64} className="text-[#533113]/20" />
                </div>
              )}
            </div>

            {/* Thumbnails — only show if multiple images */}
            {images.length > 1 && (
              <div className="flex gap-3 px-4 md:px-6 py-4 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setPrimaryIdx(i)}
                    className={`shrink-0 w-[20vw] h-[20vw] md:w-20 md:h-20 overflow-hidden border-2 transition-all duration-200 ${
                      primaryIdx === i
                        ? "border-[#533113]"
                        : "border-[#DEDEDE] opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`view ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: product info */}
          <div className="w-full md:w-[55%] px-4 md:pl-16 md:pr-10 py-6 md:py-10 flex flex-col gap-5 md:gap-6">
            {/* Category tag */}
            <span className="raleway-regular text-sm text-[#533113]/60 uppercase tracking-widest self-start border border-[#DEDEDE] px-3 py-1">
              {p.category}
            </span>

            {/* Name */}
            <h1 className="raleway-regular text-4xl md:text-5xl lg:text-6xl text-[#533113] leading-tight">
              {p.name}
            </h1>

            {/* Price + stock */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <p className="raleway-bold text-2xl md:text-3xl text-[#533113]">
                  gh₵ {displayPrice.toFixed(2)}
                </p>
                {p.discountPrice != null && (
                  <p className="raleway-regular text-lg text-[#533113]/40 line-through">
                    gh₵ {p.price.toFixed(2)}
                  </p>
                )}
              </div>
              <span
                className={`raleway-regular text-base px-3 py-1 shrink-0 ${inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            {/* Size selection */}
            {p.sizes?.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="raleway-bold text-sm uppercase tracking-widest text-[#533113]">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.sizes.map((s) => {
                    const chart = activeSizeChart.rows.find((r) => r.size === s);
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`flex flex-col items-center border px-4 py-2 raleway-bold text-sm transition-all duration-150 ${
                          selectedSize === s
                            ? "bg-[#533113] text-white border-[#533113]"
                            : "text-[#533113] border-[#533113] hover:bg-[#533113]/10"
                        }`}
                      >
                        <span className="text-base">{s}</span>
                        {chart && (
                          <span
                            className={`raleway-regular text-xs leading-tight mt-0.5 ${selectedSize === s ? "text-white/70" : "text-[#533113]/50"}`}
                          >
                            {chart.value}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color selection */}
            {p.colors?.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="raleway-bold text-sm uppercase tracking-widest text-[#533113]">
                  Select Color
                  {selectedColor && (
                    <span className="ml-2 raleway-regular normal-case tracking-normal text-[#533113]/60">
                      — {selectedColor}
                    </span>
                  )}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {p.colors.map((colorName) => {
                    const hex = COLOR_HEX[colorName] ?? colorName;
                    return (
                      <button
                        key={colorName}
                        onClick={() => handleColorSelect(colorName)}
                        className={`flex items-center gap-2 px-4 py-2.5 border raleway-regular text-lg transition-all duration-150 ${
                          selectedColor === colorName
                            ? "bg-[#533113] text-white border-[#533113]"
                            : "text-[#533113] border-[#533113] hover:bg-[#533113]/10"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        {colorName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <p className="raleway-bold text-sm uppercase tracking-widest text-[#533113]">
                Qty
              </p>
              <div className="flex items-stretch border border-[#533113]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2.5 text-[#533113] hover:bg-[#533113]/10 transition-colors"
                >
                  <MinusIcon size={18} />
                </button>
                <span className="raleway-bold text-base w-12 flex items-center justify-center text-[#533113] border-l border-r border-[#533113]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2.5 text-[#533113] hover:bg-[#533113]/10 transition-colors"
                >
                  <PlusIcon size={18} />
                </button>
              </div>
            </div>

            <hr className="border-[#DEDEDE]" />

            {/* Description accordion */}
            <div className="flex flex-col">
              <button
                onClick={() => setDescOpen(!descOpen)}
                className="flex justify-between items-center py-3"
              >
                <span className="raleway-bold text-base uppercase tracking-widest text-[#533113]">
                  Description
                </span>
                {descOpen ? (
                  <CaretUpIcon size={18} color="#533113" />
                ) : (
                  <CaretDownIcon size={18} color="#533113" />
                )}
              </button>
              <hr className="border-[#DEDEDE]" />
              {descOpen && (
                <p className="raleway-regular text-xl text-[#533113]/80 leading-relaxed pt-4 pb-2">
                  {p.description || "No description available."}
                </p>
              )}
            </div>

            {/* Size chart accordion */}
            <div className="flex flex-col">
              <button
                onClick={() => setChartOpen(!chartOpen)}
                className="flex justify-between items-center py-3"
              >
                <span className="raleway-bold text-base uppercase tracking-widest text-[#533113]">
                  Size Guide
                </span>
                {chartOpen ? (
                  <CaretUpIcon size={18} color="#533113" />
                ) : (
                  <CaretDownIcon size={18} color="#533113" />
                )}
              </button>
              <hr className="border-[#DEDEDE]" />
              {chartOpen && (
                <div className="overflow-x-auto pt-4 pb-2">
                  <table className="w-full text-lg raleway-regular text-[#533113]">
                    <thead>
                      <tr className="border-b border-[#DEDEDE]">
                        <th className="raleway-bold text-left pb-2 pr-8 text-[#533113]">
                          Size
                        </th>
                        <th className="raleway-bold text-left pb-2 pr-8 text-[#533113]">
                          {activeSizeChart.labelHeading ?? "Label"}
                        </th>
                        <th className="raleway-bold text-left pb-2 text-[#533113]">
                          {activeSizeChart.valueHeading ?? "Guide"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSizeChart.rows.map((row) => (
                        <tr
                          key={row.size}
                          className="border-b border-[#DEDEDE]/40"
                        >
                          <td className="py-2 pr-8 raleway-bold">{row.size}</td>
                          <td className="py-2 pr-8">{row.label}</td>
                          <td className="py-2">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add to cart */}
            <div className="pt-2 pb-8">
              <Button
                text={inStock ? "Add to Cart" : "Out of Stock"}
                width="w-full"
                icon={<ArrowLineUpRightIcon size={24} />}
                onClick={inStock ? handleAddToCart : undefined}
                className="!py-3.5 !px-6"
                textSize="text-base"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Related products */}
      {related.length > 0 && (
        <section className="border-t border-[#DEDEDE] bg-[#FFFBF6]">
          <div className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 py-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="raleway-regular text-xs text-[#533113]/50 uppercase tracking-[0.3em] mb-1">
                  More Like This
                </p>
                <h2 className="raleway-bold text-2xl text-[#533113]">
                  You May Also Like
                </h2>
              </div>
              <Link
                to="/new-arrivals"
                className="hidden sm:flex items-center gap-1.5 raleway-bold text-sm text-[#533113] uppercase tracking-widest border-b border-[#533113] pb-0.5 hover:opacity-70 transition-opacity"
              >
                View All <ArrowLineUpRightIcon size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((rp) => (
                <ProductCard
                  key={rp.id}
                  id={rp.id}
                  image={rp.imageUrl}
                  name={rp.name}
                  price={rp.price}
                  discountPrice={rp.discountPrice}
                  colors={rp.colors}
                />
              ))}
            </div>
            <Link
              to="/new-arrivals"
              className="sm:hidden mt-6 flex items-center justify-center gap-2 raleway-bold text-sm text-[#533113] uppercase tracking-widest border border-[#533113] py-3"
            >
              View All <ArrowLineUpRightIcon size={14} />
            </Link>
          </div>
        </section>
      )}

      <Footer />

      {toast && <Toast message={toastMsg} onDone={() => setToast(false)} />}
    </div>
  );
}

export default ProductPage;
