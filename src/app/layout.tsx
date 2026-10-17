import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
const editorial = Fraunces({ subsets: ["latin"], variable: "--font-editorial", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
export const metadata: Metadata = { title: "Herald — Your daily paper", description: "A daily paper shaped by your interests, with important stories beyond them." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={editorial.variable + " " + body.variable}><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>; }

