"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  ArrowRight,
  BookOpen,
  Check,
  Link as LinkIcon,
  ChevronUp,
} from "lucide-react";
import { getBlogPostBySlug, getRelatedPosts } from "@/lib/blog";

export default function BlogPostDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const post = getBlogPostBySlug(slug);
  const related = getRelatedPosts(slug, 3);

  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(pct);
      setShowTop(scrollTop > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url,
        });
        return;
      } catch {
        // User cancelled share — fallback to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!post) {
    return (
      <main className="min-h-screen bg-gray-50/50 py-24">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Maqola topilmadi
          </h1>
          <p className="text-gray-500 mb-6">
            Bunday maqola mavjud emas yoki olib tashlangan.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-green-700 font-semibold hover:text-green-800"
          >
            <ArrowLeft size={16} />
            Blogga qaytish
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/40 pb-20">
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600 z-50 transition-[width]"
        style={{ width: `${progress}%` }}
      />

      {/* Hero */}
      <section className="relative bg-white border-b border-gray-100 overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 w-96 h-96 bg-green-100/50 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-10">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-700 transition-colors mb-6 bg-gray-50 hover:bg-green-50 px-3.5 py-2 rounded-xl"
          >
            <ArrowLeft size={16} />
            Orqaga
          </button>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-5">
            <span className="bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
              {post.category}
            </span>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-green-500" />
              {post.date}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-green-500" />
              {post.readTime} o&apos;qish
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-[1.15] mb-6 tracking-tight">
            {post.title}
          </h1>

          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl">
            {post.excerpt}
          </p>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
                {post.author.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {post.author}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {post.authorRole}
                </p>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-green-700 bg-gray-50 hover:bg-green-50 rounded-xl transition-all"
              aria-label="Ulashish"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-green-600" />
                  <span className="text-green-700">Nusxalandi</span>
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  <span className="hidden sm:inline">Ulashish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Hero Image + Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4">
        <div className="relative rounded-3xl overflow-hidden shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-64 sm:h-96 object-cover"
          />
        </div>

        <article className="mt-10 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 lg:p-12">
          <p className="text-lg sm:text-xl text-gray-700 font-medium leading-relaxed border-l-4 border-green-500 pl-5 italic">
            {post.content.lead}
          </p>

          <div className="mt-8 space-y-8">
            {post.content.sections.map((section, idx) => (
              <section key={idx}>
                {section.heading && (
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-green-500 rounded-full" />
                    {section.heading}
                  </h2>
                )}

                {section.paragraphs?.map((p, i) => (
                  <p
                    key={i}
                    className="text-gray-700 leading-relaxed text-[15px] sm:text-base mb-4 last:mb-0"
                  >
                    {p}
                  </p>
                ))}

                {section.list && (
                  <ul className="space-y-2.5 mt-3">
                    {section.list.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-gray-700 text-[15px] sm:text-base leading-relaxed"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center mt-0.5">
                          <Check size={12} strokeWidth={3} />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.quote && (
                  <blockquote className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 p-5 sm:p-6 rounded-r-2xl">
                    <p className="text-green-900 font-medium italic leading-relaxed">
                      &ldquo;{section.quote.text}&rdquo;
                    </p>
                    {section.quote.author && (
                      <footer className="mt-3 text-sm text-green-700 font-semibold">
                        — {section.quote.author}
                      </footer>
                    )}
                  </blockquote>
                )}
              </section>
            ))}
          </div>

          {/* Share bottom */}
          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Maqola foydali bo&apos;ldimi? Do&apos;stlaringiz bilan ulashing!
            </p>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Nusxalandi
                </>
              ) : (
                <>
                  <LinkIcon size={16} />
                  Havolani nusxalash
                </>
              )}
            </button>
          </div>
        </article>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-14">
          <div className="flex items-baseline justify-between mb-5">
            <h3 className="text-xl font-bold text-gray-900">
              Shu mavzudagi maqolalar
            </h3>
            <Link
              href="/blog"
              className="text-sm font-semibold text-green-700 hover:text-green-800 inline-flex items-center gap-1"
            >
              Barchasi
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className="h-36 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <span className="inline-block bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2">
                    {p.category}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
                    {p.title}
                  </h4>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {p.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center justify-center transition-all"
          aria-label="Tepaga"
        >
          <ChevronUp size={20} />
        </button>
      )}
    </main>
  );
}
