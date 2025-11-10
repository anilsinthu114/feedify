import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/lib/ThemeContext";
import { UserProvider } from "@/lib/UserContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ThemeProvider>
        <Navbar />
        <Toaster position="top-right" />
        <Component {...pageProps} />
      </ThemeProvider>
    </UserProvider>
  );
}
