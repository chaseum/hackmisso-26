import { NeuralSecHeader } from "@/components/neuralsec-header";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#010409] text-slate-300 relative flex flex-col">
      <NeuralSecHeader activeItem="dashboard" />
      <div className="mx-auto max-w-7xl w-full px-8 py-10 space-y-6">
        <div className="h-28 animate-pulse rounded-[2rem] border border-white/5 bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-80 animate-pulse rounded-[2.5rem] border border-white/5 bg-white/5" />
              <div className="h-80 animate-pulse rounded-[2.5rem] border border-white/5 bg-white/5" />
            </div>
            <div className="h-[32rem] animate-pulse rounded-[2.5rem] border border-white/5 bg-white/5" />
          </div>
          <div className="h-[44rem] animate-pulse rounded-[2.5rem] border border-white/5 bg-white/5" />
        </div>
      </div>
    </div>
  );
}
