'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HomePage() {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-2xl bg-white p-8 rounded-xl shadow-lg text-center border-4 border-black">
        <div className="h-2 w-full bg-gradient-to-r from-black via-red-600 to-green-700 rounded mb-6"></div>
        <h1 className="text-4xl font-bold mb-4 text-black">IEBC</h1>
        <p className="text-gray-700 mb-8 text-lg">
          Kenya's Biometric Voter Verification System &mdash; secure face and
          fingerprint identity verification for registered voters.
        </p>
        <div className="space-y-4">
          <Link href="/login" className="px-8 py-4 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-900 transition w-full block">
            Login
          </Link>
          <Link href="/register" className="px-8 py-4 border-2 border-black text-black rounded-lg font-semibold text-lg hover:bg-gray-100 transition w-full block">
            Register as Voter
          </Link>
        </div>
        <div className="mt-8 h-2 w-full bg-gradient-to-r from-black via-red-600 to-green-700 rounded"></div>
      </div>
    </div>
  );
}