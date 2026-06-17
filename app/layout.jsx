import { Montserrat, Manrope } from "next/font/google";
import "./globals.css";

// Headings: Montserrat (SemiBold) · Body: Manrope (Regular)
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://drsaab.ai"),
  title: "DrSaab — Your diabetes coach on WhatsApp",
  description:
    "DrSaab is a friendly, doctor-informed diabetes prevention and management coach that lives inside WhatsApp. Log readings, snap your meals, and bring your blood sugar into a healthy range — one message at a time.",
  keywords: [
    "diabetes",
    "blood sugar",
    "WhatsApp health coach",
    "diabetes prevention",
    "AI health assistant",
    "HbA1c",
  ],
  openGraph: {
    title: "DrSaab — Your diabetes coach on WhatsApp",
    description:
      "Manage and prevent diabetes, one WhatsApp message at a time. No app to download.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#0891B2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
