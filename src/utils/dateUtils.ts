export type ViewMode = "day" | "week" | "month";

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 */
export const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * 今日の日付を YYYY-MM-DD 形式で取得
 */
export const getTodayString = (): string => {
  return formatDate(new Date());
};

/**
 * 週の開始日（月曜）と終了日（日曜）を計算
 */
export const getWeekRange = (dateStr: string): { from: string; to: string } => {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0=日, 1=月, ..., 6=土
  const diff = day === 0 ? -6 : 1 - day; // 月曜を週の始まりとする

  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { from: formatDate(monday), to: formatDate(sunday) };
};

/**
 * 月の開始日と終了日を計算
 */
export const getMonthRange = (dateStr: string): { from: string; to: string } => {
  const [year, month] = dateStr.split("-");
  const firstDay = `${year}-${month}-01`;
  const lastDay = new Date(parseInt(year), parseInt(month), 0);
  const lastDayStr = `${year}-${month}-${String(lastDay.getDate()).padStart(2, "0")}`;
  return { from: firstDay, to: lastDayStr };
};

/**
 * ビューモードと日付から表示範囲のラベルを取得
 */
export const getViewRangeLabel = (viewMode: ViewMode, selectedDate: string): string => {
  if (viewMode === "day") {
    return selectedDate;
  } else if (viewMode === "week") {
    const range = getWeekRange(selectedDate);
    return `${range.from} 〜 ${range.to}`;
  } else if (viewMode === "month") {
    const [year, month] = selectedDate.split("-");
    return `${year}年${parseInt(month)}月`;
  }
  return "";
};

/**
 * 現在のビューが「今日」を含むかどうかを判定
 */
export const isShowingToday = (viewMode: ViewMode, selectedDate: string): boolean => {
  const today = getTodayString();
  if (viewMode === "day") {
    return selectedDate === today;
  } else if (viewMode === "week") {
    const range = getWeekRange(today);
    const selectedRange = getWeekRange(selectedDate);
    return range.from === selectedRange.from && range.to === selectedRange.to;
  } else if (viewMode === "month") {
    const todayMonth = today.slice(0, 7);
    const selectedMonth = selectedDate.slice(0, 7);
    return todayMonth === selectedMonth;
  }
  return false;
};

/**
 * 前の期間の日付を計算
 */
export const getPreviousDate = (viewMode: ViewMode, dateStr: string): string => {
  const date = new Date(dateStr);
  if (viewMode === "day") {
    date.setDate(date.getDate() - 1);
  } else if (viewMode === "week") {
    date.setDate(date.getDate() - 7);
  } else if (viewMode === "month") {
    date.setMonth(date.getMonth() - 1);
  }
  return formatDate(date);
};

/**
 * 次の期間の日付を計算
 */
export const getNextDate = (viewMode: ViewMode, dateStr: string): string => {
  const date = new Date(dateStr);
  if (viewMode === "day") {
    date.setDate(date.getDate() + 1);
  } else if (viewMode === "week") {
    date.setDate(date.getDate() + 7);
  } else if (viewMode === "month") {
    date.setMonth(date.getMonth() + 1);
  }
  return formatDate(date);
};
