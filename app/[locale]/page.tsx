import { redirect } from "@/i18n/navigation";

// export default function Home() {
//   const t = useTranslations("home");

//   return (
//     <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
//       <main className="flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16 sm:px-16 sm:py-24 sm:items-start">
//         <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
//           <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
//             {t("title")}
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             {t("subtitle")}
//           </p>
//         </div>
//       </main>
//     </div>
//   );
// }

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/trees", locale });
}