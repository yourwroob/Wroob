import { Link } from "react-router-dom";

interface ProfileLinkProps {
  userId: string;
  type: "student" | "employer";
  children: React.ReactNode;
  className?: string;
}

const ProfileLink = ({ userId, type, children, className = "" }: ProfileLinkProps) => {
  const path = type === "student" ? `/student/${userId}` : `/employer/${userId}`;

  return (
    <Link
      to={path}
      className={`hover:underline hover:text-primary transition-colors cursor-pointer ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
};

export default ProfileLink;