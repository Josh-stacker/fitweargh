import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ArrowLeftIcon } from "@phosphor-icons/react";

function TermsAndConditions() {
  const sections = [
    {
      id: "about",
      title: "1. About FitwearGH",
      content: (
        <p>
          FitwearGH sells fitness wear, activewear, clothing, body shapers, accessories, sale items, fast-selling items, and related products online.<br /><br />
          FitwearGH<br />
          Ghana<br />
          Email: fitweargh1@gmail.com
        </p>
      ),
    },
    {
      id: "eligibility",
      title: "2. Eligibility",
      content: (
        <p>You may use the website only if you can lawfully enter into a binding contract or you have permission from a parent, guardian, or authorised representative. You must provide accurate, current, and complete information when creating an account or placing an order.</p>
      ),
    },
    {
      id: "accounts",
      title: "3. Customer Accounts",
      content: (
        <p>Customers may create an account to manage orders and checkout faster. You are responsible for keeping your account login details confidential. You must notify us immediately if you suspect unauthorised access to your account.</p>
      ),
    },
    {
      id: "products",
      title: "4. Products and Product Information",
      content: (
        <>
          <p>We try to display product information accurately. However:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Product colors may appear differently depending on device screens.</li>
            <li>Product images are for reference and may not show every variation.</li>
            <li>Size availability and stock may change.</li>
            <li>If a product is listed with an incorrect price, we may cancel the affected order and refund any amount paid.</li>
          </ul>
        </>
      ),
    },
    {
      id: "pricing",
      title: "5. Prices and Currency",
      content: (
        <p>Prices are displayed in Ghana cedis (GH₵). Prices may change without notice. The price charged for an order is the price shown at checkout when the order is submitted. Delivery fees are calculated based on the delivery area selected at checkout.</p>
      ),
    },
    {
      id: "orders",
      title: "6. Orders",
      content: (
        <>
          <p>An order is placed when you submit checkout details and initiate payment. We may send an order confirmation email after payment is verified.</p>
          <p className="mt-4">We reserve the right to accept, reject, cancel, or limit any order for reasons including payment failure, product unavailability, incorrect information, or suspected fraud.</p>
        </>
      ),
    },
    {
      id: "payments",
      title: "7. Payments",
      content: (
        <p>Payments are processed through Paystack or another payment provider. By making payment, you agree to comply with the relevant payment provider's terms. We do not intentionally store full payment card details on our website.</p>
      ),
    },
    {
      id: "delivery",
      title: "8. Delivery",
      content: (
        <p>Delivery is available only to areas shown as enabled at checkout. You are responsible for providing accurate delivery information. Delivery timelines are estimates only and delays may occur due to circumstances outside our control.</p>
      ),
    },
    {
      id: "returns",
      title: "9. Returns, Exchanges, and Refunds",
      content: (
        <>
          <p>Return or exchange requests must be made within 7 days after delivery. Items must be unused, unworn, unwashed, undamaged, and returned with original tags and packaging.</p>
          <p className="mt-4">For hygiene reasons, body shapers and intimate wear may be non-returnable unless faulty. Sale items may be final sale unless faulty. Refunds are issued after returned items are inspected and approved.</p>
        </>
      ),
    },
    {
      id: "conduct",
      title: "10. Customer Conduct",
      content: (
        <>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Use the website for unlawful, fraudulent, or harmful purposes.</li>
            <li>Provide false or misleading information.</li>
            <li>Interfere with website security or payment processing.</li>
            <li>Copy or exploit website content except as permitted by law.</li>
            <li>Harass or impersonate any person.</li>
          </ul>
        </>
      ),
    },
    {
      id: "intellectual-property",
      title: "11. Intellectual Property",
      content: (
        <p>The website, logo, product photography, text, graphics, and other content are owned by or licensed to FitwearGH. You may use the website for personal shopping purposes only.</p>
      ),
    },
    {
      id: "privacy",
      title: "12. Privacy and Data Protection",
      content: (
        <p>
          Our <Link to="/privacy-policy" className="underline hover:text-[#533113]">Privacy Policy</Link> explains how we collect, use, share, protect, and retain personal data. By using the website, you acknowledge that personal data will be processed as described in the Privacy Policy.
        </p>
      ),
    },
    {
      id: "limitation",
      title: "13. Limitation of Liability",
      content: (
        <p>To the fullest extent permitted by law, FitwearGH will not be liable for indirect, incidental, or consequential losses. Our total liability for a claim relating to an order will not exceed the amount paid for the affected product.</p>
      ),
    },
    {
      id: "changes",
      title: "14. Changes to These Terms",
      content: (
        <p>We may update these Terms from time to time. The updated Terms will be posted on the website with a new "Last updated" date. Continued use of the website after changes means you accept the updated Terms.</p>
      ),
    },
    {
      id: "governing-law",
      title: "15. Governing Law",
      content: (
        <p>These Terms are governed by the laws of the Republic of Ghana. If a dispute cannot be resolved informally, it may be submitted to the courts of Ghana.</p>
      ),
    },
    {
      id: "contact",
      title: "16. Contact",
      content: (
        <p>
          For questions about these Terms, orders, delivery, returns, or complaints, contact:<br /><br />
          FitwearGH<br />
          Email: fitweargh1@gmail.com
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF6]">
      <Navbar />

      <div className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mt-8 mb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#533113] raleway-regular text-sm mb-8 hover:underline"
        >
          <ArrowLeftIcon size={16} />
          Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl raleway-bold text-[#533113] mb-2">
          Terms and Conditions
        </h1>
        <p className="text-sm text-[#533113]/60 raleway-regular mb-12">
          Last updated: June 16, 2026
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar nav */}
          <nav className="lg:col-span-1 order-2 lg:order-1">
            <div className="lg:sticky lg:top-8 flex flex-col gap-2">
              <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest mb-2">
                Sections
              </p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-sm raleway-regular text-[#533113]/70 hover:text-[#533113] hover:underline transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white border border-[#DEDEDE] p-6 md:p-10">
              <div className="text-[#533113] raleway-regular space-y-6">
                <p className="text-base leading-relaxed">
                  These Terms and Conditions ("Terms") govern access to and use of the FitwearGH ecommerce website. By using the website or placing an order, you agree to these Terms. If you do not agree, do not use the website.
                </p>
                {sections.map((s) => (
                  <section key={s.id} id={s.id}>
                    <h2 className="text-xl raleway-bold text-[#533113] mb-3">
                      {s.title}
                    </h2>
                    <div className="text-sm leading-relaxed text-[#533113]/80 space-y-2">
                      {s.content}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default TermsAndConditions;
