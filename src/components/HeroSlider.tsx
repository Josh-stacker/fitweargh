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

interface HomepageHeroSettings {
  heroMode?: "slider" | "still";
  heroSliderInterval?: number;
  heroStillImageUrl?: string;
}

function HeroSlider({ page = "Homepage" }: Props) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [heroMode, setHeroMode] = useState<"slider" | "still">("slider");
  const [heroSliderInterval, setHeroSliderInterval] = useState(5);
  const [stillImageUrl, setStillImageUrl] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        console.info("[HeroSlider] Loading", { page });
        // For the homepage, fetch the heroMode setting
        if (page === "Homepage") {
          const { data, error } = await supabase.from("site_settings").select("value").eq("key", "homepage").maybeSingle();
          if (error) console.error("[HeroSlider] Homepage settings error:", error);
          if (data && data.value) {
            const d = data.value as HomepageHeroSettings;
            setHeroMode(d.heroMode ?? "slider");
            setHeroSliderInterval(d.heroSliderInterval ?? 5);
            setStillImageUrl(d.heroStillImageUrl ?? "");
            console.info("[HeroSlider] Homepage settings loaded", {
              heroMode: d.heroMode ?? "slider",
              heroSliderInterval: d.heroSliderInterval ?? 5,
              hasStillImage: Boolean(d.heroStillImageUrl),
            });
          }
        }

        const { data: slidesData, error: slidesError } = await supabase
          .from("hero_slides")
          .select("*")
          .eq("active", true)
          .eq("page", page)
          .order("display_order", { ascending: true });

        if (slidesError) {
          console.error("[HeroSlider] Slides load error:", { page, error: slidesError });
        }
        if (slidesData) setSlides(slidesData as Slide[]);
        console.info("[HeroSlider] Slides loaded", {
          page,
          count: slidesData?.length ?? 0,
          slideIds: slidesData?.map((s) => s.id) ?? [],
        });
      } catch (err) {
        console.error("[HeroSlider] Load error:", { page, error: err });
        // Firestore composite index may not exist yet — fall through to fallback
      } finally {
        setReady(true);
      }
    };
    load();
  }, [page]);

  // Auto-advance every interval when multiple slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const ms = heroSliderInterval * 1000;
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), ms);
    return () => clearInterval(t);
  }, [slides.length, heroSliderInterval]);

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
    <div className="relative w-full h-[60vh] md:h-[80.75vh] min-[1441px]:h-[71.25vh] overflow-hidden bg-[#1a0d06]">
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
