import { Shield, Lock, CheckCircle, Award } from "lucide-react";

export const TrustBadges = () => {
  const badges = [
    { icon: Shield, label: "CBK Licensed" },
    { icon: Lock, label: "Secure & Encrypted" },
    { icon: CheckCircle, label: "Instant Results" },
    { icon: Award, label: "Trusted Service" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 py-6">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm rounded-full border border-border/50 text-sm animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <badge.icon className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">{badge.label}</span>
        </div>
      ))}
    </div>
  );
};
