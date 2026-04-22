"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  BookOpen,
  Tag,
} from "lucide-react";
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/lib/blog";

export default function BlogPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState<(typeof BLOG_CATEGORIES)[number]>("Barchasi");

  const featured = useMemo(() => BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BLOG_POSTS.filter((p) => {
      if (category !== "Barchasi" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const others = filtered.filter((p) => p.id !== featured.id);
  const showFeatured =
    category === "Barchasi" && !query.trim() && filtered.some((p) => p.id === featured.id);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-gray-50/50 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-green-200/30 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-20 pb-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Sparkles size={14} />
              Nuvita blog
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Salomatlik haqida{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                foydali maqolalar
              </span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Sog&apos;lom hayot tarzi, to&apos;g&apos;ri ovqatlanish, sport va
              organizm uchun kerakli vitaminlar haqida mutaxassislardan
              ma&apos;lumotlar.
            </p>

            {/* Search */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Maqolalardan qidiring..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none text-sm text-gray-800 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {BLOG_CATEGORIES.map((cat) => {
            const active = cat === category;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-green-600 text-white shadow-md shadow-green-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-700"
                }`}
              >
                {cat === "Barchasi" ? (
                  <BookOpen size={14} />
                ) : (
                  <Tag size={14} />
                )}
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      {showFeatured && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <Link
            href={`/blog/${featured.slug}`}
            className="group block bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative h-64 lg:h-auto overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.imageUrl}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                  <Sparkles size={12} />
                  Tanlangan
                </div>
              </div>
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                <span className="inline-flex w-fit items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {featured.category}
                </span>
                <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight group-hover:text-green-700 transition-colors">
                  {featured.title}
                </h2>
                <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-3">
                  {featured.excerpt}
                </p>
                <div className="mt-5 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-green-500" />
                    {featured.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-green-500" />
                    {featured.readTime}
                  </span>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-green-700 font-semibold text-sm group-hover:gap-3 transition-all">
                  Maqolani o&apos;qish
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Grid — faqat filtered/search/kategoriya bo'lganda ko'rinadi */}
      {!showFeatured && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">Hech narsa topilmadi</p>
              <p className="text-sm text-gray-400 mt-1">
                Boshqa kalit so&apos;z yoki kategoriya tanlang
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">{category}</h3>
                <span className="text-sm text-gray-500 tabular-nums">
                  {filtered.length} ta maqola
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filtered.map((post) => (
                  <article
                    key={post.id}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="relative h-48 overflow-hidden block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/95 backdrop-blur-sm text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                          {post.category}
                        </span>
                      </div>
                    </Link>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-green-500" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-green-500" />
                          {post.readTime}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>

                      <p className="mt-2 text-sm text-gray-600 line-clamp-2 flex-1">
                        {post.excerpt}
                      </p>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                            {post.author.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-gray-700 truncate">
                            {post.author}
                          </span>
                        </div>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="flex items-center gap-1 text-green-700 text-xs font-semibold hover:gap-2 transition-all shrink-0"
                        >
                          O&apos;qish
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
