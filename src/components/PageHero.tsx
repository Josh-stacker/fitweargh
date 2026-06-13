import Button from "./ui/Button";
import { ArrowLineUpRightIcon } from "@phosphor-icons/react";

interface PageHeroProps {
  bgImage: string;
  bgPosition?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  ctaText?: string;
  image1?: string;
  image2?: string;
}

function PageHero({
  bgImage,
  bgPosition = "50% 40%",
  title,
  subtitle,
  badge,
  ctaText = "Shop Now",
  image1,
  image2,
}: PageHeroProps) {
  const hasContent = !!title;

  return (
    <section
      className="relative w-full h-[75vh] md:h-[80vh] min-[1441px]:h-[70vh] overflow-hidden bg-[#1a0d06]"
    >
      {/* Background */}
      <div
        className={`absolute inset-0 ${hasContent ? "opacity-50" : "opacity-100"}`}
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: bgPosition,
        }}
      />

      {/* Overlay content — only rendered when title is provided */}
      {hasContent && (
        <div className="relative z-10 h-full max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left — text */}
          <div className="flex flex-col gap-4 md:gap-6 text-white pt-10 md:pt-0 md:w-1/2">
            {badge && (
              <span className="raleway-regular text-sm tracking-[0.3em] uppercase opacity-70">
                {badge}
              </span>
            )}
            <h1 className="raleway-black text-4xl md:text-5xl lg:text-6xl leading-tight whitespace-pre-line">
              {title}
            </h1>
            {subtitle && (
              <p className="raleway-regular text-base md:text-lg opacity-80 max-w-sm">
                {subtitle}
              </p>
            )}
            <div className="mt-2">
              <Button
                text={ctaText}
                width="w-48 md:w-56"
                icon={<ArrowLineUpRightIcon size={20} />}
              />
            </div>
          </div>

          {/* Right — two portrait images */}
          {image1 && image2 && (
            <div className="hidden md:flex items-end gap-4 md:w-[45%] lg:w-[40%] h-full pt-8">
              <div className="w-1/2 h-[80%] rounded-t-full overflow-hidden shadow-2xl self-end">
                <img
                  src={image1}
                  alt="hero featured 1"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="w-1/2 h-[65%] rounded-t-full overflow-hidden shadow-2xl self-end">
                <img
                  src={image2}
                  alt="hero featured 2"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          )}
        </div>
      )}


    </section>
  );
}

export default PageHero;
