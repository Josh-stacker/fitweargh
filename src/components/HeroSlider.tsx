import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
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
}

function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    getDocs(
      query(
        collection(db, "heroSlides"),
        where("active", "==", true),
        orderBy("order", "asc")
      )
    ).then((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Slide));
      setSlides(data);
    }).catch(() => {
      // Firestore may need an index; fall through to static fallback
    });
  }, []);

  // Auto-advance every 5 s when multiple slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  // Fallback to static hero when no slides configured
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

      {/* Slide dots — only if multiple slides */}
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
