import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Harvest Nation - Official Agency Hub',
  description: 'Powerful Community & Professional Learning Hub',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning={true}>
      <body className="bg-gray-50 text-gray-800 font-sans min-h-screen flex flex-col justify-between">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <footer className="bg-[#083344] text-white py-4 text-center text-xs">
          <p className="font-bold text-[#A8C338]">HARVEST NATION</p>
          <p className="text-gray-400 mt-1">© 2026 Harvest Agency. All Rights Reserved.</p>
        </footer>
      </body>
    </html>
  );
}