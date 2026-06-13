import { Link } from "react-router-dom";
import Button from "./ui/Button";
import { ArrowLineUpRightIcon } from "@phosphor-icons/react";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  discountPrice?: number | null;
  colors?: string[];
}

interface AccesoriesProps {
  products: Product[];
  mobileLimit?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
}

function Accesories({
  products,
  mobileLimit = 8,
  viewAllHref = "/accessories",
  viewAllLabel = "View All Accessories",
}: AccesoriesProps) {
  const visibleProducts = products.slice(0, mobileLimit);

  return (
    <main>
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 md:py-10 py-4">
        <div className="flex flex-col gap-2 w-full md:w-[70%] lg:w-full">
          <h3 className="text-2xl font-bold raleway-bold">ACCESORIES</h3>
          <p className="text-base raleway-regular w-full md:w-[80%] lg:w-[60%]">
            TO COMPLEMENT ALL YOUR CLOTHING AND SPORTS WEAR
          </p>
        </div>
        <Link to={viewAllHref} className="w-full md:w-auto shrink-0">
          <Button
            text="Shop Now"
            width="w-full md:w-64"
            icon={<ArrowLineUpRightIcon size={24} />}
          />
        </Link>
      </section>
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-4 md:gap-6">
        {visibleProducts.map((p) => (
          <div key={p.id}>
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
      <div className="mt-5 w-full">
        <Link
          to={viewAllHref}
          className="w-full flex justify-center py-3 border border-[#533113] text-[#533113] raleway-bold text-sm uppercase tracking-widest hover:bg-[#533113] hover:text-white transition-colors"
        >
          {viewAllLabel}
        </Link>
      </div>
    </main>
  );
}

export default Accesories;
