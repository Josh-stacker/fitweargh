import Navbar from "../components/Navbar";
import HeroSlider from "../components/HeroSlider";
import Button from "../components/ui/Button";
import { ArrowLineUpRightIcon } from "@phosphor-icons/react";
import ProductCard from "../components/ProductCard";
import product1 from "../assets/prod-1.webp";
import FastSelling from "../components/FastSelling";
import ShopByCategory from "../components/ShopByCategory";
import Accesories from "../components/Accesories";
import Footer from "../components/Footer";

function Homepage() {
  return (
    <div className="">
      <Navbar />

      <HeroSlider />

      <main className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mt-10">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 md:py-10 py-4">
          <div className="flex flex-col gap-2 w-full md:w-[70%] lg:w-full">
            <h3 className="text-2xl font-bold raleway-bold">NEW ARRIVALS</h3>
            <p className="text-sm raleway-light w-full md:w-[80%] lg:w-[60%]">
              THE LATEST SPORTS, WOMEN'S AND MANY MORE ACCESORIES
            </p>
          </div>
          <Button
            text="Shop Now"
            width="w-full md:w-64 lg:w-[20%]"
            icon={<ArrowLineUpRightIcon size={24} />}
          ></Button>
        </section>
      </main>

      <section className="max-w-[1440px] 2xl:max-w-[1620px] md:mx-auto px-4 md:px-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-4 md:gap-6 mb-10">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className={`${item === 3 ? "hidden md:block" : ""} ${
              item === 4 ? "hidden lg:block" : ""
            } ${item === 5 ? "hidden 2xl:block" : ""} ${
              item === 6 ? "hidden min-[1920px]:block" : ""
            }`}
          >
            <ProductCard
              image={product1}
              name="Women’s Sports Wear"
              price="gh₵ 120.00"
            />
          </div>
        ))}
      </section>

      <section className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 my-20">
        <FastSelling />
      </section>

      <section className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 my-20">
        <ShopByCategory />
      </section>

      <section className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 my-20">
        <Accesories />
      </section>

      <Footer />
    </div>
  );
}

export default Homepage;
