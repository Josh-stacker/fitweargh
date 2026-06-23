import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const FAQS = [
  {
    question: "How do I place an order?",
    answer:
      "Browse our collections, select your size and color, then click 'Add to Cart'. When ready, go to your cart and follow the checkout steps to complete your purchase.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept mobile money (MTN, Vodafone, AirtelTigo), bank transfers, and card payments through our secure payment gateway.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Standard delivery within Accra takes 1–3 business days. Orders outside Accra typically arrive within 3–7 business days depending on your location.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes. Once your order ships, you will receive an email with tracking information. You can also check your order status in your account dashboard.",
  },
  {
    question: "What sizes do you carry?",
    answer:
      "We carry sizes XS through 3XL across most of our collections. Size guides are available on each product page to help you find the perfect fit.",
  },
  {
    question: "Can I exchange an item?",
    answer:
      "Yes, exchanges are accepted within 7 days of delivery provided the item is unworn, unwashed, and in original packaging with tags intact. Contact us to initiate an exchange.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "Refunds are issued exclusively as store credit. We do not process cash refunds or reverse electronic transactions. Store credit is added to your account within 3–5 business days after we receive and inspect the returned item, and never expires.",
  },
  {
    question: "How do I return an item?",
    answer:
      "Contact our support team within 7 days of receiving your order. We will provide return instructions. Items must be in original, unused condition with all tags attached.",
  },
  {
    question: "Do you ship outside Ghana?",
    answer:
      "Currently we only ship within Ghana. International shipping is something we are working towards — follow our socials for updates.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "You can reach us through the Contact Us page, via WhatsApp, or by email. Our team is available Monday to Saturday, 9am–6pm.",
  },
];

function FAQItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#533113]/20">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-5 text-left gap-4"
        aria-expanded={open}
      >
        <span className="raleway-bold text-sm md:text-base uppercase tracking-wide text-[#533113]">
          {question}
        </span>
        <CaretDownIcon
          size={18}
          weight="bold"
          className={`flex-shrink-0 text-[#533113] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="raleway-regular text-sm md:text-base text-[#533113]/80 pb-5 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}

function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="flex-1 max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 py-12 md:py-16 w-full">
        <div className="flex flex-col gap-2 mb-10">
          <h1 className="text-3xl md:text-4xl raleway-bold uppercase text-[#533113]">
            Frequently Asked Questions
          </h1>
          <p className="raleway-regular text-base text-[#533113]/70">
            Everything you need to know about shopping with Fitweargh.
          </p>
        </div>
        <div className="max-w-3xl">
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default FAQPage;
