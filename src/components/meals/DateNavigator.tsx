/**
 * 日付ナビゲーションコンポーネント
 * 日付選択、前後への移動、今日へのジャンプ機能を提供
 */
import React from "react";
import type { ViewMode } from "../../utils/dateUtils";

interface DateNavigatorProps {
  selectedDate: string;
  viewMode: ViewMode;
  viewRangeLabel: string;
  isShowingToday: boolean;
  onDateChange: (date: string) => void;
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
}

/**
 * 日付入力フィールド、前/次ボタン、今日ボタン、表示範囲ラベルを提供
 * ビューモードに応じて前/次の移動単位が変化（日/週/月）
 * 今日を表示中の場合、今日ボタンは青色で無効化される
 */
export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  viewMode,
  viewRangeLabel,
  isShowingToday,
  onDateChange,
  onPrevious,
  onToday,
  onNext,
}) => {
  const getNavigationTitle = (direction: "prev" | "next") => {
    const directionLabel = direction === "prev" ? "前の" : "次の";
    if (viewMode === "day") return `${directionLabel}日`;
    if (viewMode === "week") return `${directionLabel}週`;
    return `${directionLabel}月`;
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
      />
      <div style={{ display: "flex", gap: 4 }}>
        <button
          onClick={onPrevious}
          title={getNavigationTitle("prev")}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: "1em",
          }}
        >
          ←
        </button>
        <button
          onClick={onToday}
          disabled={isShowingToday}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: isShowingToday ? "2px solid #4a90e2" : "1px solid #ccc",
            backgroundColor: isShowingToday ? "#e3f2fd" : "white",
            color: isShowingToday ? "#2c5aa0" : "#333",
            cursor: isShowingToday ? "default" : "pointer",
            fontWeight: isShowingToday ? "bold" : "500",
            opacity: isShowingToday ? 0.7 : 1,
          }}
        >
          今日
        </button>
        <button
          onClick={onNext}
          title={getNavigationTitle("next")}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: "1em",
          }}
        >
          →
        </button>
      </div>
      <span style={{ fontSize: "0.9em", color: "#666" }}>
        表示範囲: {viewRangeLabel}
      </span>
    </div>
  );
};
