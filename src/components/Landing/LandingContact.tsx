"use client";

import React, { useState } from "react";
import { Mail, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LandingContact() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@chakudee.com";

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const response = await fetch(`${baseUrl}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          message: contactForm.message.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to deliver inquiry email.");
      }

      toast.success(data?.message || "Your inquiry has been sent successfully!");
      setContactForm({
        name: "",
        email: "",
        message: "",
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to send inquiry. Please check your network and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="scroll-mt-24 py-12 sm:py-20 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-white/40 dark:bg-[#0A0E1A]/40 transition-colors">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 px-2">
          <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[2px] text-[#B88728] dark:text-[#E8C170]">
            Get In Touch
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-2 text-slate-900 dark:text-white leading-tight">
            Connect With Our Team
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
            Have questions about marketplace onboarding, custom integrations, or platform setup? Send us a direct message below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* Contact Details Cards (All 3 identical in height) */}
          <div className="flex flex-col gap-3.5 h-full">
            {/* Card 1: Email */}
            <div className="flex-1 min-h-[105px] sm:min-h-[112px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#FFF9EC] dark:bg-[#E8C170]/10 border border-[#C89B3C]/30 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#B88728] dark:text-[#E8C170]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Email Us</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Direct inquiries & support</p>
                </div>
              </div>
              <a
                href={`mailto:${contactEmail}`}
                className="block text-xs sm:text-sm font-bold text-[#B88728] dark:text-[#E8C170] hover:underline break-all truncate pt-2"
              >
                {contactEmail}
              </a>
            </div>

            {/* Card 2: Headquarters */}
            <div className="flex-1 min-h-[105px] sm:min-h-[112px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Headquarters</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Chakudee Fashion Pvt Ltd</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium truncate pt-2">
                Surat, Gujarat, India (395002)
              </p>
            </div>

            {/* Card 3: Operating Hours */}
            <div className="flex-1 min-h-[105px] sm:min-h-[112px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Operating Hours</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Monday – Saturday</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium truncate pt-2">
                9:30 AM – 7:00 PM IST • 24/7 Monitoring
              </p>
            </div>
          </div>

          {/* Interactive Contact Form (Matched in height with left cards) */}
          <div className="lg:col-span-2 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">Send Us an Inquiry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Fill in your details below and an email will be dispatched directly to our operations team.
              </p>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#080B11] px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E8C170] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="john@brand.com"
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#080B11] px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E8C170] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us about your order volume and what you're looking to automate..."
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#080B11] px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E8C170] transition-colors leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-slate-400 break-all">
                    Recipient: <strong className="text-slate-600 dark:text-slate-300">{contactEmail}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#E8C170] hover:bg-[#d8b05c] active:bg-[#c9a14d] disabled:opacity-50 text-[#080B11] px-8 py-3 text-xs sm:text-sm font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
