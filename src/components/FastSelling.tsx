import { useRef } from "react";
import DirectionButton from "./ui/DirectionButton";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  discountPrice?: number | null;
  colors?: string[];
}

interface FastSellingProps {
  products: Product[];
  mobileLimit?: number;
}

function FastSelling({ products, mobileLimit = 4 }: FastSellingProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -400, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 400, behavior: "smooth" });

  return (
    <section className="bg-[#FDF1E1]">
      {/* Mobile: 2-column grid */}
      <div className="md:hidden px-4 py-6">
        <h2 className="text-3xl raleway-black text-[#875A33] mb-5">FAST SELLING</h2>
        <div className="grid grid-cols-2 gap-3">
          {products.slice(0, mobileLimit).map((p) => (
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
      </div>

      {/* Desktop: side label + horizontal scroll */}
      <div className="hidden md:flex flex-row justify-between items-start md:items-end">
        <div className="flex flex-col p-6 lg:p-10 w-[30%]">
          <h2 className="text-4xl lg:text-6xl raleway-black text-[#875A33]">
            FAST <br />
            SELLING
          </h2>
          <div className="flex justify-start md:justify-between gap-6 mt-4">
            <DirectionButton direction="left" onClick={scrollLeft} />
            <DirectionButton direction="right" onClick={scrollRight} />
          </div>
        </div>
        <main className="w-full overflow-hidden">
          <section
            ref={scrollRef}
            className="flex gap-2 md:ml-6 overflow-x-auto snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`section::-webkit-scrollbar { display: none; }`}</style>
            {products.map((p) => (
              <div
                key={p.id}
                className="flex-1 min-w-[calc(25%-0.375rem)] snap-start"
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
            {products.length < 4 &&
              Array.from({ length: 4 - products.length }).map((_, i) => (
                <div key={`placeholder-${i}`} className="flex-1 min-w-[calc(25%-0.375rem)]" />
              ))}
          </section>
        </main>
      </div>
    </section>
  );
}

export default FastSelling;
