import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = "https://skillfeed-xi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Skillfeed — a feed ranked to your skills",
  description:
    "Pull today's tech writing, score it against your skills with Jev, and read what matters first.",
  applicationName: "Skillfeed",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Skillfeed — a feed ranked to your skills",
    description:
      "HN, Dev.to, Hashnode, Lobsters — ranked to your skills with typesafe-ai/jev.",
    url: siteUrl,
    siteName: "Skillfeed",
    images: [
      {
        url: "/og.png",
        width: 1024,
        height: 1024,
        alt: "Skillfeed — ranked tech reading",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Skillfeed — a feed ranked to your skills",
    description:
      "A tech reading feed ranked to your skills — powered by Jev.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
