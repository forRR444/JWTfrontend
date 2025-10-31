/**
 * ビュー切替コンポーネント
 * 日/週/月の表示モードを切り替えるボタン群を提供
 */
import React from "react";
import type { ViewMode } from "../../utils/dateUtils";

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

/**
 * 日/週/月の3つのビューモードを切り替えるボタン
 * 選択中のモードは青色で強調表示される
 */
export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  const buttonStyle = (isActive: boolean) => ({
    padding: "8px 16px",
    borderRadius: 6,
    border: isActive ? "2px solid #4a90e2" : "1px solid #ddd",
    backgroundColor: isActive ? "#e3f2fd" : "white",
    fontWeight: isActive ? "bold" : "normal",
    cursor: "pointer",
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
        borderBottom: "2px solid #ddd",
        paddingBottom: 8,
      }}
    >
      <button onClick={() => onViewModeChange("day")} style={buttonStyle(viewMode === "day")}>
        日
      </button>
      <button onClick={() => onViewModeChange("week")} style={buttonStyle(viewMode === "week")}>
        週
      </button>
      <button onClick={() => onViewModeChange("month")} style={buttonStyle(viewMode === "month")}>
        月
      </button>
    </div>
  );
};
