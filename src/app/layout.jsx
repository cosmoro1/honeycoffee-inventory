import "./globals.css";

export const metadata = {
  title: "BREW",
  description: "BREW coffee shop customer and monitoring dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
