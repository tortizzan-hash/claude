import './globals.css';

export const metadata = {
  title: 'Vector Mode Legal — Intake Portal',
  description: 'Qualified leads. Booked consultations. Signed clients.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
