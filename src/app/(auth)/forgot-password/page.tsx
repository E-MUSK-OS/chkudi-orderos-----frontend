import LeftPanel from "@/components/Auth/LeftPanel";
import ForgotPasswordPage from "@/components/Auth/ForgotPasswordPage";

export default function Page() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden bg-[#F3F1EC] p-3 sm:p-6 md:p-8 lg:p-10 dark:bg-[#080B11]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] sm:h-[480px] lg:h-[560px] w-[320px] sm:w-[600px] lg:w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C89B3C]/[0.05] blur-[100px] sm:blur-[130px] dark:bg-[#F5C451]/[0.03]" />

      <div className="relative w-full max-w-7xl rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#C89B3C]/25 via-black/5 to-[#2D6A8C]/15 p-[1px] shadow-[0_24px_70px_-16px_rgba(10,14,26,0.25)] dark:from-[#F5C451]/20 dark:via-white/5 dark:to-[#F5C451]/10">
        <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl sm:rounded-3xl bg-white min-h-auto lg:h-[720px] xl:h-[760px] items-stretch dark:bg-[#0F1626]">
          <div className="hidden lg:block lg:w-[45%] h-full shrink-0">
            <LeftPanel />
          </div>

          <div className="w-full lg:w-[55%] flex-1 flex flex-col justify-center">
            <ForgotPasswordPage />
          </div>
        </div>
      </div>
    </section>
  );
}