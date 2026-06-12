import Link from "next/link";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export function LegalPage({
  eyebrow,
  title,
  introduction,
  sections,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  sections: LegalSection[];
}) {
  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-[#11110f] px-6 pb-28 pt-12 text-[#f4f1e8] sm:px-10 sm:pt-20"
      id="main-content"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-60 h-[560px] w-[560px] rounded-full bg-[#c87867]/8 blur-[120px]"
      />
      <article className="relative mx-auto max-w-[720px]">
        <Link
          className="inline-flex items-center gap-2 rounded-md font-mono text-[9px] font-semibold uppercase tracking-[0.19em] text-[#c87867] transition hover:text-[#e39a88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c87867]"
          href="/"
        >
          <span aria-hidden="true">&larr;</span>
          Toronto STR Explorer / {eyebrow}
        </Link>

        <h1 className="mt-8 max-w-[620px] text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-[#f4f1e8] text-balance sm:text-7xl">
          {title}
        </h1>
        <p className="mt-6 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#777368]">
          Last updated June 11, 2026
        </p>

        <p className="mt-10 max-w-[620px] text-base leading-8 text-[#aaa69a] text-pretty sm:mt-14">
          {introduction}
        </p>

        <div className="my-12 h-px bg-white/8 sm:my-16" />

        <div className="space-y-12 sm:space-y-16">
          {sections.map((section, index) => (
            <section
              className="grid gap-3 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-5"
              key={section.title}
            >
              <p className="pt-1 font-mono text-[9px] font-semibold tracking-[0.2em] text-[#c87867]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.035em] text-[#e9e5da] sm:text-2xl">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-[#9b978b] text-pretty">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
