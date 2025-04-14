// Removed default Metadata import and font imports
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry"; // Import ThemeRegistry

// Removed default metadata export

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Removed default font classNames */}
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
