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
    <main className="min-h-dvh bg-[#090909] px-6 pb-28 pt-16 text-[#f1f1f2] sm:px-10 sm:pt-24">
      <article className="mx-auto max-w-[680px]">
        <Link
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#77777d] transition hover:text-[#d4d4d6]"
          href="/"
        >
          Toronto STR Explorer · {eyebrow}
        </Link>

        <h1 className="mt-6 text-4xl font-medium tracking-[-0.04em] text-white sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#66666c]">
          Last updated June 11, 2026
        </p>

        <p className="mt-10 max-w-[620px] text-sm leading-7 text-[#a9a9ad] sm:mt-12">
          {introduction}
        </p>

        <div className="my-12 h-px bg-[#242426] sm:my-16" />

        <div className="space-y-12 sm:space-y-16">
          {sections.map((section, index) => (
            <section key={section.title}>
              <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#77777d]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-xl font-medium tracking-[-0.02em] text-[#f1f1f2] sm:text-2xl">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[#96969c]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
