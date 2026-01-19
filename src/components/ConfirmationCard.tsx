import { type CRBFormData } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Phone, ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface ConfirmationCardProps {
  data: CRBFormData;
  onBack: () => void;
  onConfirmPayment: () => void;
  paymentStatus: 'idle' | 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'insufficient';
  isLoading?: boolean;
}

const statusConfig = {
  idle: {
    icon: null,
    title: "Confirm Your Details",
    description: "Review your information and proceed to pay the processing fee (KES 99)",
    color: "text-foreground",
  },
  pending: {
    icon: <Clock className="w-8 h-8 text-warning animate-pulse" />,
    title: "STK Push Sent",
    description: "Check your phone and enter your M-Pesa PIN to complete payment",
    color: "text-warning",
  },
  processing: {
    icon: <Loader2 className="w-8 h-8 text-primary animate-spin" />,
    title: "Processing Payment",
    description: "Please wait while we confirm your payment...",
    color: "text-primary",
  },
  success: {
    icon: <CheckCircle2 className="w-8 h-8 text-success" />,
    title: "Payment Successful!",
    description: "Your application has been initiated. Results will be sent to your phone.",
    color: "text-success",
  },
  failed: {
    icon: <XCircle className="w-8 h-8 text-destructive" />,
    title: "Payment Failed",
    description: "The transaction could not be completed. Please try again.",
    color: "text-destructive",
  },
  cancelled: {
    icon: <AlertCircle className="w-8 h-8 text-muted-foreground" />,
    title: "Payment Cancelled",
    description: "You cancelled the M-Pesa transaction. Try again when ready.",
    color: "text-muted-foreground",
  },
  insufficient: {
    icon: <AlertCircle className="w-8 h-8 text-warning" />,
    title: "Insufficient Balance",
    description: "Your M-Pesa balance is too low. Please top up and try again.",
    color: "text-warning",
  },
};

export const ConfirmationCard = ({
  data,
  onBack,
  onConfirmPayment,
  paymentStatus,
  isLoading,
}: ConfirmationCardProps) => {
  const status = statusConfig[paymentStatus];
  const canRetry = ['idle', 'failed', 'cancelled', 'insufficient'].includes(paymentStatus);
  const showBackButton = paymentStatus !== 'pending' && paymentStatus !== 'processing';

  const isWaiting = paymentStatus === 'pending' || paymentStatus === 'processing';

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="text-center space-y-3">
        {isWaiting ? (
          <div className="flex flex-col items-center gap-4 animate-scale-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        ) : status.icon ? (
          <div className="flex justify-center animate-scale-in">
            {status.icon}
          </div>
        ) : null}
        <h2 className={`text-xl font-semibold ${status.color}`}>{status.title}</h2>
        <p className="text-muted-foreground text-sm">{status.description}</p>
        {isWaiting && (
          <p className="text-xs text-muted-foreground animate-pulse">
            Do not close this page...
          </p>
        )}
      </div>

      {/* Details Card */}
      <div className="bg-muted/50 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Full Name</p>
            <p className="font-medium text-foreground">{data.fullName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ID Number</p>
            <p className="font-medium font-mono tracking-wider text-foreground">{data.idNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">M-Pesa Number</p>
            <p className="font-medium font-mono tracking-wider text-foreground">{data.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Loan & Payment Summary */}
      <div className="bg-secondary/20 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Selected Loan</span>
          <span className="text-foreground font-semibold">KES {data.loanAmount ? data.loanAmount.toLocaleString() : '—'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Verification</span>
          <span className="text-foreground font-semibold">Identity & loan verification</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-muted-foreground font-medium">Processing fee</span>
          <span className="text-2xl font-bold text-foreground">KES 99</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {canRetry && (
          <Button
            onClick={onConfirmPayment}
            size="lg"
            className="w-full h-14 text-lg font-semibold gradient-primary shadow-primary hover:opacity-90 transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending STK Push...
              </>
            ) : paymentStatus === 'idle' ? (
              "Pay Processing Fee (KES 99) via M-Pesa"
            ) : (
              "Try Again"
            )}
          </Button>
        )}

        {paymentStatus === 'success' && (
          <Button
            onClick={onBack}
            size="lg"
            className="w-full h-14 text-lg font-semibold gradient-primary shadow-primary"
          >
            Start Another Application
          </Button>
        )}

        {showBackButton && paymentStatus !== 'success' && (
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
            className="w-full h-12 group"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Edit Details
          </Button>
        )}
      </div>
    </div>
  );
};
