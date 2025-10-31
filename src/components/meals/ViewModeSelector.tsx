/**
 * ビュー切替コンポーネント
 * 日/週/月の表示モードを切り替えるボタン群を提供
 */
import React from "react";
import type { ViewMode } from "../../utils/dateUtils";
import styles from "../../styles/meals.module.css";

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
  return (
    <div className={styles.viewModeSelector}>
      <button
        onClick={() => onViewModeChange("day")}
        className={`${styles.viewModeButton} ${
          viewMode === "day" ? styles.viewModeButtonActive : ""
        }`}
      >
        日
      </button>
      <button
        onClick={() => onViewModeChange("week")}
        className={`${styles.viewModeButton} ${
          viewMode === "week" ? styles.viewModeButtonActive : ""
        }`}
      >
        週
      </button>
      <button
        onClick={() => onViewModeChange("month")}
        className={`${styles.viewModeButton} ${
          viewMode === "month" ? styles.viewModeButtonActive : ""
        }`}
      >
        月
      </button>
    </div>
  );
};
