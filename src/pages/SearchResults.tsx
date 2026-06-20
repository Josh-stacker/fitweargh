import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  category: string;
  categories?: string[];
  imageUrl?: string;
  colors?: string[];
}

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [input, setInput] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    setInput(query);
    if (!query.trim()) {
      setProducts([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    supabase
      .from("products")
      .select("id, name, price, discount_price, category, categories, image_url, colors")
      .ilike("name", `%${query.trim()}%`)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setProducts(
            data.map((row) => ({
              id: row.id,
              name: row.name,
              price: Number(row.price ?? 0),
              discountPrice: row.discount_price == null ? null : Number(row.discount_price),
              category: row.category ?? "",
              categories: row.categories ?? [],
              imageUrl: row.image_url ?? "",
              colors: row.colors ?? [],
            }))
          );
        }
        setLoading(false);
      });
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setSearchParams({ q: input.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF6]">
      <Navbar />

      <div className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mt-10 mb-16">
        {/* Search bar */}
        <form onSubmit={handleSubmit} className="flex items-stretch gap-0 max-w-2xl mx-auto mb-10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search for products…"
            className="input-base flex-1"
            autoFocus
          />
          <button
            type="submit"
            className="bg-[#533113] text-white px-5 flex items-center justify-center hover:bg-[#3d2409] transition-colors shrink-0"
            aria-label="Search"
          >
            <MagnifyingGlassIcon size={20} weight="bold" />
          </button>
        </form>

        {/* Results heading */}
        {query.trim() && !loading && (
          <p className="raleway-regular text-base text-[#533113]/60 mb-6">
            {products.length > 0
              ? `${products.length} result${products.length !== 1 ? "s" : ""} for "${query}"`
              : null}
          </p>
        )}

        {/* States */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#F5EDE0] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && searched && products.length === 0 && (
          <div className="text-center py-24">
            <MagnifyingGlassIcon size={40} className="text-[#533113]/20 mx-auto mb-4" />
            <p className="raleway-bold text-lg text-[#533113]">No results for "{query}"</p>
            <p className="raleway-regular text-base text-[#533113]/50 mt-2">
              Try a different keyword or browse our categories.
            </p>
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-24">
            <MagnifyingGlassIcon size={40} className="text-[#533113]/20 mx-auto mb-4" />
            <p className="raleway-regular text-lg text-[#533113]/50">Enter a keyword to search.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.imageUrl}
                name={product.name}
                price={product.price}
                discountPrice={product.discountPrice}
                colors={product.colors}
                category={product.category}
                categories={product.categories}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default SearchResults;
