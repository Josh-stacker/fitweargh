import herobg from "../assets/hero-bg2.webp";

function HeroSlider() {
  return (
    <section
      className="w-full h-[60vh] min-[1441px]:h-[30vh]"
      style={{
        backgroundImage: `url(${herobg})`,
        backgroundSize: "cover",
        backgroundPosition: "50% 40%",
      }}
    ></section>
  );
}

export default HeroSlider;
