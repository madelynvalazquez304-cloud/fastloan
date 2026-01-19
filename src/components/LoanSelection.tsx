import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface LoanSelectionProps {
  defaultAmount?: number;
  onNext: (payload: { loanAmount: number }) => void;
  onBack: () => void;
}

export const LoanSelection = ({ defaultAmount = 10000, onNext, onBack }: LoanSelectionProps) => {
  // Allow the user to pick between KES 5,000 and KES 10,000
  const [loanAmount, setLoanAmount] = useState(defaultAmount);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext({ loanAmount });
      }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Choose Loan Amount</h2>
        <p className="text-sm text-muted-foreground mt-1">Select how much you want between KES 5,000 and KES 10,000</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Loan amount: <span className="font-bold text-foreground">KES {loanAmount.toLocaleString()}</span></Label>
        <input
          type="range"
          min={5000}
          max={10000}
          step={500}
          value={loanAmount}
          onChange={(e) => setLoanAmount(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>KES 5,000</span>
          <span>KES 10,000</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button type="submit" className="flex-1 h-12 gradient-primary">
          Continue to Confirmation
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        We will verify your details. A processing fee (KES 99) applies.
      </p>
    </form>
  );
};
