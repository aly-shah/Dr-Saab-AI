import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://drsaab.ai"),
  title: "Dr Saab AI — Your diabetes coach on WhatsApp",
  description:
    "Dr Saab AI is a friendly, doctor-informed diabetes prevention and management coach that lives inside WhatsApp. Log readings, snap your meals, and bring your blood sugar into a healthy range — one message at a time.",
  keywords: [
    "diabetes",
    "blood sugar",
    "WhatsApp health coach",
    "diabetes prevention",
    "AI health assistant",
    "HbA1c",
  ],
  openGraph: {
    title: "Dr Saab AI — Your diabetes coach on WhatsApp",
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
    <html lang="en" className={bricolage.variable}>
      <body>{children}</body>
    </html>
  );
}
