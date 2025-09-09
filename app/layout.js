import './globals.css';

export const metadata = {
  title: "Football Social Automator",
  description: "A tool to generate social media posts for your club.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
