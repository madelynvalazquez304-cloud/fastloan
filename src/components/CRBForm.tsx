import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crbFormSchema, type CRBFormData } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, CreditCard, Phone, ArrowRight, Loader2 } from "lucide-react";

interface CRBFormProps {
  onSubmit: (data: CRBFormData) => void;
  isLoading?: boolean;
}

export const CRBForm = ({ onSubmit, isLoading }: CRBFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CRBFormData>({
    resolver: zodResolver(crbFormSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-foreground font-medium flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Full Name
        </Label>
        <Input
          id="fullName"
          placeholder="Enter your full name as per ID"
          {...register("fullName")}
          className="h-12 text-base border-2 focus:border-primary transition-colors"
          disabled={isLoading}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive animate-fade-in">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="idNumber" className="text-foreground font-medium flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          National ID Number
        </Label>
        <Input
          id="idNumber"
          placeholder="Enter 8-digit ID number"
          maxLength={8}
          {...register("idNumber")}
          className="h-12 text-base border-2 focus:border-primary transition-colors font-mono tracking-wider"
          disabled={isLoading}
        />
        {errors.idNumber && (
          <p className="text-sm text-destructive animate-fade-in">{errors.idNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber" className="text-foreground font-medium flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          M-Pesa Phone Number
        </Label>
        <Input
          id="phoneNumber"
          placeholder="07XXXXXXXX or 01XXXXXXXX"
          maxLength={10}
          {...register("phoneNumber")}
          className="h-12 text-base border-2 focus:border-primary transition-colors font-mono tracking-wider"
          disabled={isLoading}
        />
        {errors.phoneNumber && (
          <p className="text-sm text-destructive animate-fade-in">{errors.phoneNumber.message}</p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-lg font-semibold gradient-primary shadow-primary hover:opacity-90 transition-all duration-300 group"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Next: Loan Options
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Next you will choose the loan amount to apply for.
      </p>
    </form>
  );
};
