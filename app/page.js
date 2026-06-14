export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <p className="label-mono mb-3">Vector Mode Legal</p>
      <h1 className="font-serif text-5xl mb-4">Intake Portal</h1>
      <p className="text-gray-400 mb-10">
        Qualified leads. Booked consultations. Signed clients. Every inquiry scored by the
        LQS engine the moment it arrives.
      </p>
      <div className="space-y-3">
        <a href="/f/demo" className="block rounded-lg border border-panel2 bg-panel p-4 hover:border-gold/50">
          <span className="text-gold font-semibold">→ Demo intake form</span>
          <p className="text-sm text-gray-500">Submit a test inquiry and watch it get scored.</p>
        </a>
        <a href="/login" className="block rounded-lg border border-panel2 bg-panel p-4 hover:border-gold/50">
          <span className="text-gold font-semibold">→ Client Login</span>
          <p className="text-sm text-gray-500">
            The attorney dashboard: leads ranked by LQS. Demo: demo@vectormodelegal.com / demo1234
          </p>
        </a>
      </div>
    </main>
  );
}
