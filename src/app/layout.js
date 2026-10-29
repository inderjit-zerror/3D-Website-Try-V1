import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata = {
  title: "Model S Plaid — Beyond Ludicrous",
  description:
    "An interactive WebGL story of the Model S Plaid: sculpted by the wind, powered by three motors, and configured by you. Concept experience.",
};

export const viewport = {
  themeColor: "#efeeeb",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="day"
      // font variables live on <html> so :root tokens (and the WebGL backdrop) can resolve them
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased" cz-shortcut-listen="true">
        {children}
      </body>
    </html>
  );
}
