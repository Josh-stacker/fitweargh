import { Link } from "react-router-dom";
import Button from "./ui/Button";
import { ArrowLineUpRightIcon } from "@phosphor-icons/react";
import CatCards from "./CatCards";

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  colors?: string[];
}

interface ShopByCategoryProps {
  products: Product[];
}

function ShopByCategory({ products }: ShopByCategoryProps) {
  return (
    <main>
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 md:py-10 py-4">
        <div className="flex flex-col gap-2 w-full md:w-[70%] lg:w-full">
          <h3 className="text-2xl font-bold raleway-bold">SHOP BY CATEGORY</h3>
          <p className="text-sm raleway-light w-full md:w-[80%] lg:w-[60%]">
            ALL CATEGORIES SUITABLE FOR YOU
          </p>
        </div>
        <Link to="/clothing">
          <Button
            text="Shop Now"
            width="w-full md:w-64 lg:w-[20%]"
            icon={<ArrowLineUpRightIcon size={24} />}
          />
        </Link>
      </section>
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-4 md:gap-6 lg:gap-12">
        {products.map((p, item) => (
          <div
            key={p.id}
            className={`${item === 2 ? "hidden md:block" : ""} ${
              item === 3 ? "hidden lg:block" : ""
            } ${item === 4 ? "hidden 2xl:block" : ""} ${
              item === 5 ? "hidden min-[1920px]:block" : ""
            }`}
          >
            <CatCards
              image={p.imageUrl}
              name={p.name}
              colors={p.colors}
              id={p.id}
            />
          </div>
        ))}
      </section>
    </main>
  );
}

export default ShopByCategory;
