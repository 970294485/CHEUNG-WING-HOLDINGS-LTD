/** 列表／表格用：繁中區域格式，固定含年份 yyyy/mm/dd。 */
export function formatZhDateWithYear(d: Date): string {
  return d.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
