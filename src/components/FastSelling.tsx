import { useRef } from "react";
import DirectionButton from "./ui/DirectionButton";
import ProductCard from "./ProductCard";
import product1 from "../assets/prod-1.webp";

function FastSelling() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -400, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: "smooth" });
    }
  };

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
          <style>{`
            section::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="min-w-[calc(50%-0.5rem)] md:min-w-[calc(50%-0.25rem)] lg:min-w-[calc(33.333%-0.333rem)] snap-start"
            >
              <ProductCard
                image={product1}
                name="Women’s Sports Wear"
                price="gh₵ 120.00"
              />
            </div>
          ))}
        </section>
      </main>
    </section>
  );
}

export default FastSelling;
