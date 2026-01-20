import studyflowLogo from "@/assets/studyflow-logo.png";
import { cn } from "@/lib/utils";

interface StudyFlowLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const StudyFlowLogo = ({ size = "md", className }: StudyFlowLogoProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10"
  };

  return (
    <img
      src={studyflowLogo}
      alt="StudyFlow"
      className={cn(sizeClasses[size], "object-contain", className)}
    />
  );
};
