import type { Metadata } from "next";
import FaqPageClient from "@/components/faq-page-client";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Nasym-Ur-Rahmah Institute",
  description: "Answers to frequently asked questions about Nasym-Ur-Rahmah Institute, courses, registration, and recordings.",
};

export default function Page() { return <FaqPageClient />; }
