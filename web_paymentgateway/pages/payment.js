import { useRouter } from "next/router";

export default function Payment() {
  const router = useRouter();
  const { status, cid } = router.query;

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Payment Result</h1>
      <p>Status: <b>{status || "-"}</b></p>
      <p>Checkout ID: <b>{cid || "-"}</b></p>
      <p className="mt-4 text-sm opacity-70">
        Jika status kamu sudah PAID, webhook akan mengubah status checkout menjadi LUNAS otomatis.
      </p>
    </main>
  );
}
