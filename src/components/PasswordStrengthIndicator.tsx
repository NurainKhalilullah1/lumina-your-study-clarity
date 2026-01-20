import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const criteria = useMemo(() => ({
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);

  const score = useMemo(() => {
    return Object.values(criteria).filter(Boolean).length;
  }, [criteria]);

  const strength = useMemo(() => {
    if (score <= 1) return { label: "Weak", color: "bg-destructive", textColor: "text-destructive" };
    if (score === 2) return { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-500" };
    if (score <= 4) return { label: "Good", color: "bg-green-500", textColor: "text-green-500" };
    return { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500" };
  }, [score]);

  const criteriaList = [
    { key: "minLength", label: "At least 6 characters", met: criteria.minLength },
    { key: "hasUppercase", label: "Uppercase letter", met: criteria.hasUppercase },
    { key: "hasLowercase", label: "Lowercase letter", met: criteria.hasLowercase },
    { key: "hasNumber", label: "Number", met: criteria.hasNumber },
    { key: "hasSpecial", label: "Special character", met: criteria.hasSpecial },
  ];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div
              key={segment}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                segment <= score ? strength.color : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-2 gap-1.5">
        {criteriaList.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              item.met ? "text-green-500" : "text-muted-foreground"
            }`}
          >
            {item.met ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PasswordStrengthIndicator;
