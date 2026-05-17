import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import PageHero from "./PageHero";
import herobg from "../assets/hero-bg2.webp";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  bgImageUrl: string;
  image1Url: string;
  image2Url: string;
  bgPosition: string;
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
          const settingsSnap = await getDoc(doc(db, "siteSettings", "homepage"));
          if (settingsSnap.exists()) {
            const d = settingsSnap.data();
            setHeroMode(d.heroMode ?? "slider");
            setStillImageUrl(d.heroStillImageUrl ?? "");
          }
        }

        const slidesSnap = await getDocs(
          query(
            collection(db, "heroSlides"),
            where("active", "==", true),
            where("page", "==", page),
            orderBy("order", "asc")
          )
        );
        const data = slidesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Slide));
        setSlides(data);
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

  const s = slides[current];

  return (
    <div className="relative">
      <PageHero
        bgImage={s.bgImageUrl || herobg}
        bgPosition={s.bgPosition || "50% 40%"}
        title={s.title || undefined}
        subtitle={s.subtitle || undefined}
        badge={s.badge || undefined}
        ctaText={s.ctaText || "Shop Now"}
        image1={s.image1Url || undefined}
        image2={s.image2Url || undefined}
      />

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
