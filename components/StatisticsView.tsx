"use client";

import { useTreeStatistics } from "@/app/service/family-tree/tree";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { getQueryErrorMessage } from "@/lib/query-error";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

interface StatisticsViewProps {
  treeId: string;
}

export function StatisticsView({ treeId }: StatisticsViewProps) {
  const t = useTranslations("statistics");
  const tCommon = useTranslations("common");
  const { data, isLoading, error, refetch } = useTreeStatistics(treeId);

  const genderChartConfig: ChartConfig = {
    male: { label: t("male"), color: "var(--chart-1)" },
    female: { label: t("female"), color: "var(--chart-2)" },
    unknown: { label: t("unknown"), color: "var(--chart-3)" },
  };

  const photoChartConfig: ChartConfig = {
    withPhotos: { label: t("withPhotos"), color: "var(--chart-1)" },
    withoutPhotos: { label: t("withoutPhotos"), color: "var(--chart-2)" },
  };

  const livingChartConfig: ChartConfig = {
    living: { label: t("living"), color: "var(--chart-1)" },
    deceased: { label: t("deceased"), color: "var(--chart-2)" },
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-2 text-zinc-500">{t("loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-destructive">
          {getQueryErrorMessage(error)}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-zinc-500">{t("noData")}</p>
      </div>
    );
  }

  const genderData = [
    { name: "male", value: data.genderRatio.male, fill: "var(--color-male)" },
    { name: "female", value: data.genderRatio.female, fill: "var(--color-female)" },
    { name: "unknown", value: data.genderRatio.unknown, fill: "var(--color-unknown)" },
  ].filter((d) => d.value > 0);

  const photoData = [
    { name: "withPhotos", value: data.photoCoverage.withPhotos, fill: "var(--color-withPhotos)" },
    { name: "withoutPhotos", value: data.photoCoverage.withoutPhotos, fill: "var(--color-withoutPhotos)" },
  ].filter((d) => d.value > 0);

  const livingData = [
    { name: "living", value: data.livingVsDeceased.living, fill: "var(--color-living)" },
    { name: "deceased", value: data.livingVsDeceased.deceased, fill: "var(--color-deceased)" },
  ].filter((d) => d.value > 0);

  const generationsData = data.generations.map((g) => ({
    name: t("generationLabel", { n: g.generation }),
    count: g.count,
    fullName: `generation_${g.generation}`,
  }));

  const decadesData = data.birthDecades.map((d) => ({
    name: d.decade,
    count: d.count,
    fullName: d.decade,
  }));

  const siblingsLabels: Record<number, string> = {
    0: t("noSiblings"),
    1: t("siblingsCount", { n: 1 }),
    2: t("siblingsCount", { n: 2 }),
    3: t("siblingsCount", { n: "3+" }),
  };
  const siblingsData = data.siblingsDistribution.map((s) => ({
    name: siblingsLabels[s.count] ?? String(s.count),
    count: s.numberOfPeople,
    fullName: `siblings_${s.count}`,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("familyMembersCount", {
            count: data.totalNodes.toLocaleString(),
          })}
        </h1>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("totalMembers")}</CardDescription>
            <CardTitle className="text-3xl">{data.totalNodes}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("avgChildrenPerPerson")}</CardDescription>
            <CardTitle className="text-3xl">
              {data.avgChildrenPerPerson.toFixed(1)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("maxChildren")}</CardDescription>
            <CardTitle className="text-3xl">{data.maxChildren}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("rootCount")}</CardDescription>
            <CardTitle className="text-3xl">{data.rootCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("treeDepth")}</CardDescription>
            <CardTitle className="text-3xl">{data.treeDepth}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("genderRatio")}</CardTitle>
            <CardDescription>
              {data.genderRatio.male} {t("male")}, {data.genderRatio.female}{" "}
              {t("female")}, {data.genderRatio.unknown} {t("unknown")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {genderData.length > 0 ? (
              <ChartContainer config={genderChartConfig} className="min-h-[200px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => value?.toLocaleString()}
                      />
                    }
                  />
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    label={({ name, value }) => {
                      const cfg = genderChartConfig[name as keyof typeof genderChartConfig];
                      return `${cfg?.label ?? name}: ${value}`;
                    }}
                  >
                    {genderData.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="py-8 text-center text-zinc-500">{t("noData")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("photoCoverage")}</CardTitle>
            <CardDescription>
              {data.photoCoverage.withPhotos} {t("withPhotos")},{" "}
              {data.photoCoverage.withoutPhotos} {t("withoutPhotos")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {photoData.length > 0 ? (
              <ChartContainer config={photoChartConfig} className="min-h-[200px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => value?.toLocaleString()}
                      />
                    }
                  />
                  <Pie
                    data={photoData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    label={({ name, value }) => {
                      const cfg = photoChartConfig[name as keyof typeof photoChartConfig];
                      return `${cfg?.label ?? name}: ${value}`;
                    }}
                  >
                    {photoData.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="py-8 text-center text-zinc-500">{t("noData")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("livingVsDeceased")}</CardTitle>
            <CardDescription>
              {data.livingVsDeceased.living} {t("living")},{" "}
              {data.livingVsDeceased.deceased} {t("deceased")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {livingData.length > 0 ? (
              <ChartContainer config={livingChartConfig} className="min-h-[200px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => value?.toLocaleString()}
                      />
                    }
                  />
                  <Pie
                    data={livingData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    label={({ name, value }) => {
                      const cfg = livingChartConfig[name as keyof typeof livingChartConfig];
                      return `${cfg?.label ?? name}: ${value}`;
                    }}
                  >
                    {livingData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="py-8 text-center text-zinc-500">{t("noData")}</p>
            )}
          </CardContent>
        </Card>

        {generationsData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("generations")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={Object.fromEntries(
                  generationsData.map((g, i) => [
                    g.fullName,
                    {
                      label: g.name,
                      color: `hsl(var(--chart-${(i % 5) + 1}))`,
                    },
                  ])
                )}
                className="min-h-[200px] w-full"
              >
                <BarChart data={generationsData} margin={{ left: 12, right: 12 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => value?.toLocaleString()}
                      />
                    }
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {decadesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("birthDecades")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={Object.fromEntries(
                  decadesData.map((d, i) => [
                    d.fullName,
                    {
                      label: d.name,
                      color: `hsl(var(--chart-${(i % 5) + 1}))`,
                    },
                  ])
                )}
                className="min-h-[200px] w-full"
              >
                <BarChart data={decadesData} margin={{ left: 12, right: 12 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => value?.toLocaleString()}
                      />
                    }
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("siblingsDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            {siblingsData.some((s) => s.count > 0) ? (
              <ChartContainer
                config={Object.fromEntries(
                  siblingsData.map((s, i) => [
                    `siblings_${data.siblingsDistribution[i]?.count ?? i}`,
                    {
                      label: s.name,
                      color: `hsl(var(--chart-${(i % 5) + 1}))`,
                    },
                  ])
                )}
                className="min-h-[200px] w-full"
              >
                <BarChart data={siblingsData} margin={{ left: 12, right: 12 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => value?.toLocaleString()}
                      />
                    }
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="py-8 text-center text-zinc-500">{t("noData")}</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="my-8" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("missingGender")}</CardTitle>
            <CardDescription>
              {t("familyMembersCount", {
                count: data.missingGenderCount.toLocaleString(),
              })}{" "}
              {t("unknown")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.missingGenderCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("missingParents")}</CardTitle>
            <CardDescription>
              {t("familyMembersCount", {
                count: data.missingParentsCount.toLocaleString(),
              })}{" "}
              (roots)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.missingParentsCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
