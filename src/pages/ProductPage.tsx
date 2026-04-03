import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/ui/Button";
import {
  ArrowLineUpRightIcon,
  CaretDownIcon,
  CaretUpIcon,
  MinusIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import product1 from "../assets/prod-1.webp";
import heroBg from "../assets/hero-bg.webp";
import heroBg2 from "../assets/hero-bg2.webp";

// ── Mock product data ──────────────────────────────────────
const PRODUCT = {
  id: 1,
  name: "Women's Sports Wear",
  price: 120,
  description:
    "Premium quality sportswear designed for maximum comfort and performance. Made from breathable, moisture-wicking fabric that keeps you cool during intense workouts. Perfect for gym sessions, yoga, running, and everyday active wear.",
  images: [product1, heroBg, heroBg2, product1],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: ["#000000", "#FFFFFF", "#ef4444", "#00864A", "#533113"],
  sizeChart: [
    { size: "XS", chest: "30–32", waist: "24–26", hips: "34–36" },
    { size: "S", chest: "32–34", waist: "26–28", hips: "36–38" },
    { size: "M", chest: "34–36", waist: "28–30", hips: "38–40" },
    { size: "L", chest: "36–38", waist: "30–32", hips: "40–42" },
    { size: "XL", chest: "38–40", waist: "32–34", hips: "42–44" },
    { size: "XXL", chest: "40–42", waist: "34–36", hips: "44–46" },
  ],
};

function ProductPage() {
  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [descOpen, setDescOpen] = useState(true);
  const [chartOpen, setChartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFBF6]">
      <Navbar />

      <main className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto">
        <div className="flex flex-col md:flex-row">

          {/* ── LEFT: Image gallery ────────────────────────── */}
          <div className="w-full md:w-[55%] md:sticky md:top-0 md:self-start">
            {/* Primary image */}
            <div className="w-full bg-[#F5EDE0] flex items-center justify-center" style={{ minHeight: "80vw", maxHeight: "92vw" }}>
              <img
                src={PRODUCT.images[primaryIdx]}
                alt={PRODUCT.name}
                className="w-full h-full object-contain transition-opacity duration-300"
                style={{ maxHeight: "92vw" }}
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 px-4 md:px-6 py-4 overflow-x-auto">
              {PRODUCT.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setPrimaryIdx(i)}
                  className={`shrink-0 w-[22vw] h-[22vw] md:w-24 md:h-24 overflow-hidden border-2 transition-all duration-200 ${
                    primaryIdx === i
                      ? "border-[#533113]"
                      : "border-[#DEDEDE] opacity-70 hover:opacity-100"
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
          </div>

          {/* ── RIGHT: Product info ────────────────────────── */}
          <div className="w-full md:w-[45%] px-4 md:px-10 py-4 md:py-10 flex flex-col gap-6 md:overflow-y-auto">

            {/* Size selection */}
            <div className="flex flex-col gap-3">
              <p className="raleway-bold text-xs uppercase tracking-widest text-[#533113]">
                Select Size
              </p>
              <div className="flex flex-wrap gap-2">
                {PRODUCT.sizes.map((s) => (
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

            {/* Product name */}
            <h1 className="raleway-light text-3xl md:text-4xl lg:text-5xl text-[#1a0d06] leading-tight">
              {PRODUCT.name}
            </h1>

            {/* Price + Quantity on same row */}
            <div className="flex justify-between items-center">
              <p className="raleway-bold text-xl md:text-2xl text-[#533113]">
                gh₵ {PRODUCT.price}.00
              </p>

              {/* Quantity changer */}
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

            {/* Color selection */}
            <div className="flex flex-col gap-3">
              <p className="raleway-bold text-xs uppercase tracking-widest text-[#533113]">
                Select Color
              </p>
              <div className="flex gap-3">
                {PRODUCT.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full transition-all duration-150 ${
                      selectedColor === c
                        ? "ring-2 ring-[#533113] ring-offset-2 scale-110"
                        : "border border-[#DEDEDE] hover:scale-110"
                    }`}
                  />
                ))}
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
                {descOpen ? (
                  <CaretUpIcon size={18} color="#533113" />
                ) : (
                  <CaretDownIcon size={18} color="#533113" />
                )}
              </button>
              <hr className="border-[#DEDEDE]" />
              {descOpen && (
                <p className="raleway-light text-sm text-[#533113]/80 leading-relaxed pt-4 pb-2">
                  {PRODUCT.description}
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
                {chartOpen ? (
                  <CaretUpIcon size={18} color="#533113" />
                ) : (
                  <CaretDownIcon size={18} color="#533113" />
                )}
              </button>
              <hr className="border-[#DEDEDE]" />
              {chartOpen && (
                <div className="overflow-x-auto pt-4 pb-2">
                  <table className="w-full text-sm raleway-light text-[#533113]">
                    <thead>
                      <tr className="border-b border-[#DEDEDE]">
                        <th className="raleway-bold text-left pb-2 pr-4">Size</th>
                        <th className="raleway-bold text-left pb-2 pr-4">Chest (in)</th>
                        <th className="raleway-bold text-left pb-2 pr-4">Waist (in)</th>
                        <th className="raleway-bold text-left pb-2">Hips (in)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRODUCT.sizeChart.map((row) => (
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
                text="Add to Cart"
                width="w-full"
                icon={<ArrowLineUpRightIcon size={20} />}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ProductPage;
