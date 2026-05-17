import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Pros Home — Tech help that actually makes sense",
  description:
    "AI-powered home tech support for homeowners, DIY enthusiasts, and anyone who just wants their TV to work. Available 24/7 in plain English.",
  openGraph: {
    title: "Tech Pros Home",
    description: "Tech help that actually makes sense — for real people.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
