import localFont from "next/font/local";

export const aeonik = localFont({
  src: [
    {
      path: "../assets/fonts/aeonik-pro-trial/aeonikprotrial-bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-aeonik",
  display: "swap",
});

export const dmSans = localFont({
  src: [
    {
      path: "../assets/fonts/DM_Sans/static/DMSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/DM_Sans/static/DMSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});