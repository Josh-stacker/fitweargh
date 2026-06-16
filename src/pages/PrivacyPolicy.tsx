import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ArrowLeftIcon } from "@phosphor-icons/react";

function PrivacyPolicy() {
  const sections = [
    {
      id: "who-we-are",
      title: "1. Who We Are",
      content: (
        <>
          <p>The data controller for this website is:</p>
          <p className="mt-4">
            FitwearGH<br />
            Ghana<br />
            Email: fitweargh@gmail.com
          </p>
        </>
      ),
    },
    {
      id: "data-we-collect",
      title: "2. Personal Data We Collect",
      content: (
        <>
          <p>We collect personal data that is necessary to run an ecommerce store, process orders, provide customer service, and meet legal obligations.</p>
          <p className="mt-4">We may collect:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Account data:</strong> name, email address, password authentication details, account ID, and login records.</li>
            <li><strong>Checkout and order data:</strong> name, phone number, email address, delivery address, city, delivery area, order notes, items ordered, product size, color, quantity, order value, delivery fee, order status, and payment status.</li>
            <li><strong>Payment data:</strong> payment reference, payment provider, payment status, transaction metadata, and fraud-prevention information. We do not intentionally store full card numbers on our website.</li>
            <li><strong>Customer support data:</strong> messages, complaints, return or exchange requests, delivery questions, and related communications.</li>
            <li><strong>Marketing data:</strong> newsletter or promotional preferences, consent records, and interactions with promotions, where enabled.</li>
            <li><strong>Technical data:</strong> IP address, browser type, device information, pages visited, timestamps, session data, cookies, and similar analytics or security logs.</li>
          </ul>
          <p className="mt-4">We do not intentionally collect special category data, such as health information, political opinions, religious beliefs, biometric data, or similar sensitive information.</p>
        </>
      ),
    },
    {
      id: "how-we-collect",
      title: "3. How We Collect Personal Data",
      content: (
        <>
          <p>We collect personal data directly from you when you:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Create an account or sign in.</li>
            <li>Add items to cart and place an order.</li>
            <li>Select a delivery area.</li>
            <li>Complete payment through Paystack.</li>
            <li>Contact us by email, phone, form, or social media.</li>
            <li>Subscribe to marketing, promotions, or sales notifications.</li>
            <li>Browse the website, where cookies or similar technologies are used.</li>
          </ul>
        </>
      ),
    },
    {
      id: "why-we-use",
      title: "4. Why We Use Personal Data",
      content: (
        <ul className="list-disc pl-6 space-y-1">
          <li>To create and manage customer accounts.</li>
          <li>To process carts, checkout, orders, payments, delivery, returns, exchanges, and cancellations.</li>
          <li>To verify payment and prevent fraud.</li>
          <li>To send order confirmations, shipping updates, cancellation notices, and customer service messages.</li>
          <li>To respond to enquiries, complaints, and support requests.</li>
          <li>To maintain website security and prevent abuse.</li>
          <li>To send marketing communications, where you have opted in.</li>
          <li>To comply with legal obligations.</li>
        </ul>
      ),
    },
    {
      id: "legal-bases",
      title: "5. Legal Bases for Processing",
      content: (
        <p>We process personal data in line with the principles of the Ghana Data Protection Act, 2012 (Act 843) and, where applicable, the GDPR. We rely on contract performance, legal obligations, legitimate interests, and consent as legal bases for processing.</p>
      ),
    },
    {
      id: "cookies",
      title: "6. Cookies and Similar Technologies",
      content: (
        <>
          <p>Our website may use cookies, local storage, session storage, and similar technologies to keep you signed in, save cart preferences, support checkout, improve performance, and protect the website from abuse.</p>
          <p className="mt-4">You can control cookies through your browser settings. Blocking some cookies may affect login, cart, checkout, or payment functionality.</p>
        </>
      ),
    },
    {
      id: "sharing",
      title: "7. Who We Share Personal Data With",
      content: (
        <>
          <p>We share personal data only where necessary. This may include:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Payment processors, including Paystack.</li>
            <li>Supabase for authentication, database, and backend services.</li>
            <li>Email and notification providers.</li>
            <li>Delivery partners and fulfilment staff.</li>
            <li>Professional advisers and legal authorities where required.</li>
          </ul>
          <p className="mt-4 font-semibold">We do not sell personal data.</p>
        </>
      ),
    },
    {
      id: "data-retention",
      title: "8. How Long We Keep Personal Data",
      content: (
        <p>We keep personal data only for as long as reasonably necessary. Account data is kept while the account is active, order records for the period required for tax and legal purposes, and marketing preferences until you unsubscribe.</p>
      ),
    },
    {
      id: "security",
      title: "9. Security",
      content: (
        <p>We use reasonable technical and organisational measures to protect personal data. However, no website or online transmission is completely secure. Customers should keep account passwords confidential.</p>
      ),
    },
    {
      id: "your-rights",
      title: "10. Your Rights",
      content: (
        <>
          <p>Subject to applicable law, you may have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Request access to your personal data.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of data where legally permitted.</li>
            <li>Object to processing, including direct marketing.</li>
            <li>Withdraw consent where processing is based on consent.</li>
            <li>Lodge a complaint with the Data Protection Commission of Ghana.</li>
          </ul>
        </>
      ),
    },
    {
      id: "contact",
      title: "11. Contact and Complaints",
      content: (
        <p>
          For privacy questions or data subject requests, contact us at:<br />
          Email: fitweargh@gmail.com<br />
          You may also contact the Data Protection Commission of Ghana if you are not satisfied with our response.
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
          Privacy Policy
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
              <div className="prose prose-sm max-w-none text-[#533113] raleway-regular space-y-6">
                <p className="text-base leading-relaxed">
                  This Privacy Policy explains how FitwearGH ("we", "us", or "our") collects, uses, stores, shares, and protects personal data when customers use our ecommerce website, create an account, place an order, make a payment, contact us, or interact with our marketing and customer support.
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

export default PrivacyPolicy;
