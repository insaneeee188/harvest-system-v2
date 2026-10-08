import './globals.css';
import Navbar from '../components/Navbar';
import PwaRegister from '../components/PwaRegister';

export const metadata = {
  title: 'Harvest Agency - Official Agency Hub',
  description: 'Powerful Community & Professional Learning Hub',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Harvest LMS',
  },
};

export const viewport = {
  themeColor: '#083344',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning={true}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo-192.png" />
      </head>
      <body className="bg-gray-50 text-gray-800 font-sans min-h-screen flex flex-col justify-between">
        <PwaRegister />
        <Navbar />
        <main className="flex-grow">{children}</main>
        <footer className="bg-[#083344] text-white py-4 text-center text-xs">
          <p className="font-bold text-[#A8C338]">HARVEST AGENCY</p>
          <p className="text-gray-400 mt-1">© 2026 Harvest Agency. All Rights Reserved.</p>
        </footer>
      </body>
    </html>
  );
}