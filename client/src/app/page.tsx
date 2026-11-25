'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HomePage() {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-2xl bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">EngageLoop</h1>
        <p className="text-gray-600 mb-8">
          Kenyan Biometric Voter Verification System &mdash; secure face and
          fingerprint identity verification for registered voters.
        </p>
        <div className="space-y-4">
          <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            Login
          </Link>
          <Link href="/register" className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition">
            Register as Voter
          </Link>
        </div>
      </div>
    </div>
  );
}
