import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { groupMenuItems } from "@/lib/menu";
import { SacForm } from "@/components/store/SacForm";
import { FormattedText } from "@/components/store/FormattedText";
import { BackButton } from "@/components/store/BackButton";

export default async function ContentPage({ params }: { params: { slug: string } }) {
  const [page, footerMenu] = await Promise.all([
    prisma.page.findUnique({ where: { slug: params.slug } }),
    prisma.menu.findUnique({
      where: { location: "footer" },
      include: { items: { orderBy: { order: "asc" } } },
    }),
  ]);

  if (!page) notFound();

  const groups = groupMenuItems(footerMenu?.items || []);
  const currentUrl = `/paginas/${params.slug}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <BackButton />

      {groups.length > 0 && (
        <details className="mb-8 rounded-xl border border-gray-200 overflow-hidden">
          <summary className="cursor-pointer bg-cat-black text-white font-bold px-4 py-3 text-sm select-none">
            Menu institucional
          </summary>
          <div className="p-4 space-y-4 bg-white">
            {groups.map((group, gi) => (
              <div key={gi}>
                {group.header && (
                  <p className="font-bold text-cat-black text-sm mb-1.5">{group.header.label}</p>
                )}
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.url}
                        className={
                          item.url === currentUrl
                            ? "text-sm font-bold text-cat-black underline decoration-cat-yellow decoration-2"
                            : "text-sm text-gray-600 hover:text-cat-black transition-colors"
                        }
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}

      <h1 className="text-2xl font-black uppercase mb-4" style={{ color: "#FFCD11" }}>
        {page.title}
      </h1>
      <FormattedText
        text={page.content || "Conteúdo em breve."}
        className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed"
      />

      {page.slug === "fale-conosco" && <SacForm />}
    </div>
  );
}
