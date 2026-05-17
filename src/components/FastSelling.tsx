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
}

function FastSelling({ products }: FastSellingProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -400, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 400, behavior: "smooth" });

  return (
    <section className="bg-[#FDF1E1] flex flex-col md:flex-row justify-between items-start md:items-end py-6 md:py-0">
      <div className="flex flex-col p-6 lg:p-10 w-full md:w-[30%]">
        <h2 className="text-4xl lg:text-6xl raleway-black text-[#875A33]">
          FAST <br className="hidden md:block" />
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
          className="flex gap-4 md:gap-2 lg:gap-2 px-4 md:px-0 md:ml-6 overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`section::-webkit-scrollbar { display: none; }`}</style>
          {products.map((p) => (
            <div
              key={p.id}
              className="min-w-[calc(50%-0.5rem)] md:min-w-[calc(50%-0.25rem)] lg:min-w-[calc(33.333%-0.333rem)] snap-start"
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
      </main>
    </section>
  );
}

export default FastSelling;
