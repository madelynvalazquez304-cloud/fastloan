import { z } from 'zod';

export const crbFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, { message: "Full name must be at least 3 characters" })
    .max(100, { message: "Full name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Full name can only contain letters, spaces, hyphens, and apostrophes" }),
  
  idNumber: z
    .string()
    .trim()
    .length(8, { message: "ID number must be exactly 8 digits" })
    .regex(/^\d{8}$/, { message: "ID number must contain only digits" }),
  
  phoneNumber: z
    .string()
    .trim()
    .regex(/^0[71]\d{8}$/, { message: "Phone number must start with 07 or 01 and be 10 digits" }),
  // Optional field for the loan flow
  loanAmount: z.number().optional(),
});

export type CRBFormData = z.infer<typeof crbFormSchema>;

export const formatPhoneForMpesa = (phone: string): string => {
  // Convert 07XXXXXXXX or 01XXXXXXXX to 2547XXXXXXXX or 2541XXXXXXXX
  if (phone.startsWith('0')) {
    return '254' + phone.slice(1);
  }
  return phone;
};
