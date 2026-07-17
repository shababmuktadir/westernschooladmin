import * as z from "zod";

const capitalizeWords = (str) => {
  if (!str) return str;
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const studentSchema = z.object({
  // Required Fields
  fullName: z.string().min(2, "Full name is required").transform(capitalizeWords),
  studentId: z.string().min(1, "Student ID is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  class: z.string().min(1, "Class is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  
  // Optional Fields
  photoURL: z.string().optional(),
  birthCertificateNumber: z.string().optional().or(z.literal("")),
  fatherName: z.string().optional().or(z.literal("")).transform(capitalizeWords),
  fatherNID: z.string().optional().or(z.literal("")),
  motherName: z.string().optional().or(z.literal("")).transform(capitalizeWords),
  motherNID: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  section: z.string().optional().or(z.literal("")).transform((val) => val.toUpperCase()),
  bloodGroup: z.string().optional().or(z.literal("")),
  guardianName: z.string().optional().or(z.literal("")).transform(capitalizeWords),
  address: z.string().optional().or(z.literal("")).transform(capitalizeWords),
});