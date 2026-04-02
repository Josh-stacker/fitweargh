import { Link } from "react-router-dom";

function Footer() {
  return (
    <section className="bg-[#FDF1E1] flex flex-col-reverse md:flex-row justify-between items-center py-6 md:py-0 md:h-20 px-4 md:px-10 gap-4 md:gap-0">
      <p className="text-sm raleway-light text-center md:text-left">Copyright © 2026 Fitweargh</p>
      <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-8">
        <Link to="#" className="text-sm raleway-light underline">
          Contact Us
        </Link>
        <Link to="#" className="text-sm raleway-light underline">
          Privacy Policy
        </Link>
        <Link to="#" className="text-sm raleway-light underline">
          Terms of Service
        </Link>
      </div>
    </section>
  );
}

export default Footer;
