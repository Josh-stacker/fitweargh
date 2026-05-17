import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
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

interface FirestoreProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  images?: string[];
  sizes: string[];
  colors: string[];
  category: string;
  stock: number;
}

// Fallback used when no Firestore product exists for the given ID
const FALLBACK: FirestoreProduct = {
  id: "1",
  name: "Women's Sports Wear",
  price: 120,
  description:
    "Premium quality sportswear designed for maximum comfort and performance. Made from breathable, moisture-wicking fabric that keeps you cool during intense workouts.",
  imageUrl: product1,
  images: [product1, heroBg, heroBg2, product1],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: ["#000000", "#FFFFFF", "#ef4444", "#00864A", "#533113"],
  category: "Women's",
  stock: 10,
};

const SIZE_CHART = [
  { size: "XS", chest: "30–32", waist: "24–26", hips: "34–36" },
  { size: "S",  chest: "32–34", waist: "26–28", hips: "36–38" },
  { size: "M",  chest: "34–36", waist: "28–30", hips: "38–40" },
  { size: "L",  chest: "36–38", waist: "30–32", hips: "40–42" },
  { size: "XL", chest: "38–40", waist: "32–34", hips: "42–44" },
  { size: "XXL",chest: "40–42", waist: "34–36", hips: "44–46" },
];

function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<FirestoreProduct | null>(null);
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
        if (!id || !isNaN(Number(id))) {
          // Numeric ID = fallback demo product
          setProduct(FALLBACK);
        } else {
          const snap = await getDoc(doc(db, "products", id));
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() } as FirestoreProduct;
            // Build images array: primary imageUrl + any additional images
            if (!data.images || data.images.length === 0) {
              data.images = [data.imageUrl];
            }
            setProduct(data);
          } else {
            setProduct(FALLBACK);
          }
        }
      } catch {
        setProduct(FALLBACK);
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

  const handleAddToCart = () => {
    if (p.sizes?.length > 0 && !selectedSize) {
      setToastMsg("Please select a size");
      setToast(true);
      return;
    }
    addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl,
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
        <div className="flex items-center gap-2 raleway-light text-sm text-[#533113]/60">
          <Link to="/new-arrivals" className="flex items-center gap-1 hover:text-[#533113] transition-colors">
            <ArrowLeftIcon size={14} />
            New Arrivals
          </Link>
          <span>/</span>
          <span className="text-[#533113] truncate max-w-[200px]">{p.name}</span>
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
                    <img src={img} alt={`view ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: product info */}
          <div className="w-full md:w-[55%] px-4 md:pl-16 md:pr-10 py-6 md:py-10 flex flex-col gap-5 md:gap-6">

            {/* Category tag */}
            <span className="raleway-light text-xs text-[#533113]/60 uppercase tracking-widest self-start border border-[#DEDEDE] px-3 py-1">
              {p.category}
            </span>

            {/* Name */}
            <h1 className="raleway-light text-3xl md:text-4xl lg:text-5xl text-[#533113] leading-tight">
              {p.name}
            </h1>

            {/* Price + stock */}
            <div className="flex items-center justify-between">
              <p className="raleway-bold text-xl md:text-2xl text-[#533113]">
                gh₵ {p.price.toFixed(2)}
              </p>
              <span className={`raleway-light text-xs px-3 py-1 ${inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {inStock ? `In stock (${p.stock})` : "Out of stock"}
              </span>
            </div>

            {/* Size selection */}
            {p.sizes?.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="raleway-bold text-xs uppercase tracking-widest text-[#533113]">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`border px-4 py-2 raleway-light text-sm transition-all duration-150 ${
                        selectedSize === s
                          ? "bg-[#533113] text-white border-[#533113]"
                          : "text-[#533113] border-[#533113] hover:bg-[#533113]/10"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selection */}
            {p.colors?.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="raleway-bold text-xs uppercase tracking-widest text-[#533113]">
                  Select Color
                </p>
                <div className="flex gap-3 flex-wrap">
                  {p.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-9 h-9 rounded-full transition-all duration-150 ${
                        selectedColor === c
                          ? "ring-2 ring-[#533113] ring-offset-2 scale-110"
                          : "border border-[#DEDEDE] hover:scale-110"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <p className="raleway-bold text-xs uppercase tracking-widest text-[#533113]">Qty</p>
              <div className="flex items-stretch border border-[#533113]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-[#533113] hover:bg-[#533113]/10 transition-colors"
                >
                  <MinusIcon size={16} />
                </button>
                <span className="raleway-bold text-sm w-10 flex items-center justify-center text-[#533113] border-l border-r border-[#533113]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-[#533113] hover:bg-[#533113]/10 transition-colors"
                >
                  <PlusIcon size={16} />
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
                <span className="raleway-bold text-sm uppercase tracking-widest text-[#533113]">
                  Description
                </span>
                {descOpen ? <CaretUpIcon size={18} color="#533113" /> : <CaretDownIcon size={18} color="#533113" />}
              </button>
              <hr className="border-[#DEDEDE]" />
              {descOpen && (
                <p className="raleway-light text-base text-[#533113]/80 leading-relaxed pt-4 pb-2">
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
                <span className="raleway-bold text-sm uppercase tracking-widest text-[#533113]">
                  Size Chart
                </span>
                {chartOpen ? <CaretUpIcon size={18} color="#533113" /> : <CaretDownIcon size={18} color="#533113" />}
              </button>
              <hr className="border-[#DEDEDE]" />
              {chartOpen && (
                <div className="overflow-x-auto pt-4 pb-2">
                  <table className="w-full text-sm raleway-light text-[#533113]">
                    <thead>
                      <tr className="border-b border-[#DEDEDE]">
                        {["Size", "Chest (in)", "Waist (in)", "Hips (in)"].map((h) => (
                          <th key={h} className="raleway-bold text-left pb-2 pr-4 text-[#533113]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_CHART.map((row) => (
                        <tr key={row.size} className="border-b border-[#DEDEDE]/40">
                          <td className="py-2 pr-4">{row.size}</td>
                          <td className="py-2 pr-4">{row.chest}</td>
                          <td className="py-2 pr-4">{row.waist}</td>
                          <td className="py-2">{row.hips}</td>
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

      <Footer />

      {toast && (
        <Toast message={toastMsg} onDone={() => setToast(false)} />
      )}
    </div>
  );
}

export default ProductPage;
