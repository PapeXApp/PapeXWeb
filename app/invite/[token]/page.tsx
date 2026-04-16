import type { Metadata } from "next";
import Link from "next/link";

const APP_STORE_URL = "https://apps.apple.com/us/app/papex/id6754945242";

export const metadata: Metadata = {
  title: "Get PapeX on the App Store",
  description: "Open this invite in the PapeX iOS app.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function InviteFallbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const hasToken = Boolean(token);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">
          PapeX Invite
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Open in the PapeX app
        </h1>
        <p className="mt-4 text-slate-600">
          {hasToken
            ? "If PapeX is installed, this invite should open in-app. If not, install it from the App Store."
            : "Install PapeX from the App Store to continue."}
        </p>

        <div className="mt-8">
          <Link
            href={APP_STORE_URL}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-base font-medium text-white transition hover:bg-slate-700"
          >
            Get PapeX on the App Store
          </Link>
        </div>
      </div>
    </main>
  );
}
