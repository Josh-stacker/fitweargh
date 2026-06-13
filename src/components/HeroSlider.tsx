import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import PageHero from "./PageHero";
import herobg from "../assets/hero-bg2.webp";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  cta_text: string;
  bg_image_url: string;
  image1_url: string;
  image2_url: string;
  bg_position: string;
  page: string;
}

interface Props {
  page?: string; // "Homepage" | "New Arrivals" | etc. — defaults to "Homepage"
}

function HeroSlider({ page = "Homepage" }: Props) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [heroMode, setHeroMode] = useState<"slider" | "still">("slider");
  const [stillImageUrl, setStillImageUrl] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // For the homepage, fetch the heroMode setting
        if (page === "Homepage") {
          const { data } = await supabase.from("site_settings").select("value").eq("key", "homepage").maybeSingle();
          if (data && data.value) {
            const d = data.value as any;
            setHeroMode(d.heroMode ?? "slider");
            setStillImageUrl(d.heroStillImageUrl ?? "");
          }
        }

        const { data: slidesData } = await supabase
          .from("hero_slides")
          .select("*")
          .eq("active", true)
          .eq("page", page)
          .order("display_order", { ascending: true });
          
        if (slidesData) setSlides(slidesData as Slide[]);
      } catch {
        // Firestore composite index may not exist yet — fall through to fallback
      } finally {
        setReady(true);
      }
    };
    load();
  }, [page]);

  // Auto-advance every 5s when multiple slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!ready) return null;

  // Homepage still-image mode
  if (page === "Homepage" && heroMode === "still") {
    return <PageHero bgImage={stillImageUrl || herobg} bgPosition="50% 40%" />;
  }

  // No slides — show static fallback
  if (slides.length === 0) {
    return <PageHero bgImage={herobg} bgPosition="50% 40%" />;
  }

  return (
    <div className="relative w-full h-[85vh] md:h-[85vh] min-[1441px]:h-[80vh] overflow-hidden bg-[#1a0d06]">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          <PageHero
            bgImage={s.bg_image_url || herobg}
            bgPosition={s.bg_position || "50% 40%"}
            title={s.title || undefined}
            subtitle={s.subtitle || undefined}
            badge={s.badge || undefined}
            ctaText={s.cta_text || "Shop Now"}
            image1={s.image1_url || undefined}
            image2={s.image2_url || undefined}
          />
        </div>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? "bg-white scale-125" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HeroSlider;
