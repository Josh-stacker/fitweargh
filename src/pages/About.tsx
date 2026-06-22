import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function About() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl md:text-4xl font-bold raleway-bold mb-6 text-[#1a1a1a]">About Fitwear GH</h1>

        <div className="space-y-6 text-base raleway-regular text-[#333] leading-relaxed">
          <p>
            Fitwear GH has been Ghana's go-to destination for women's sportswear since <strong>2019</strong>. For over
            half a decade we have curated premium women's sports brands — from high-performance activewear to
            comfortable everyday fits — all in one place.
          </p>

          <p>
            Our customers love us for our quality products, honest sizing, and the care we put into every order.
            We're proud of the strong ratings and loyal community we have built over the years.
          </p>

          <p>
            Founded by <strong>Esmonde Lisa Annette Kaiser</strong>, Fitwear GH was born from a passion for fitness
            and the belief that every woman deserves stylish, high-quality sportswear that performs as hard as she does.
          </p>
        </div>

        <div className="mt-10 border-t border-[#e5e5e5] pt-8">
          <h2 className="text-xl font-semibold raleway-bold mb-4 text-[#1a1a1a]">Get in Touch</h2>
          <ul className="space-y-3 text-base raleway-regular text-[#333]">
            <li>
              <span className="font-medium">Phone:</span>{" "}
              <a href="tel:0559506998" className="underline hover:text-[#e63946]">
                0559506998
              </a>
            </li>
            <li>
              <span className="font-medium">Instagram:</span>{" "}
              <a
                href="https://www.instagram.com/fitwearghana"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#e63946]"
              >
                @fitwearghana
              </a>
            </li>
            <li>
              <span className="font-medium">Facebook:</span>{" "}
              <a
                href="https://www.facebook.com/share/1Dj77MGvkx/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#e63946]"
              >
                Fitwear GH on Facebook
              </a>
            </li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default About;
