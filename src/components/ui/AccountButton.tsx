import { UserIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

function AccountButton() {
  return (
    <Link to="/account" className="flex items-center gap-2">
      <p className="raleway-regular text-base">Account</p>
      <UserIcon size={24} />
    </Link>
  );
}

export default AccountButton;
