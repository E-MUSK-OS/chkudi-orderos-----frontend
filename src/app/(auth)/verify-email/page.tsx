import LeftPanel from "@/components/Auth/LeftPanel";
import VerifyEmailForm from "@/components/Auth/VerifyEmailForm";
import { Suspense } from "react";

export default function VerifyEmailPage() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#F3F1EC] p-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C89B3C]/[0.05] blur-[130px]" />

      <div className="relative w-full max-w-7xl bg-gradient-to-br from-[#C89B3C]/25 via-black/5 to-[#2D6A8C]/15 p-[1px] shadow-[0_40px_100px_-24px_rgba(10,14,26,0.28)]">
        <div className="flex overflow-hidden bg-white p-2 h-200 items-center">
          <div className="max-w-[45%] lg:flex-1 h-full">
            <LeftPanel />
          </div>

          <div className="w-full max-w-[55%] flex-1 h-full">
            <Suspense fallback={null}>
              <VerifyEmailForm />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
