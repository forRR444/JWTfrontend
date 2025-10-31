/**
 * 総カロリー表示コンポーネント
 * 選択された期間の総カロリーを青いボックスで表示
 */
import React from "react";

interface TotalCaloriesProps {
  totalCalories: number;
  rangeLabel: string;
}

/**
 * 総カロリーと対象期間を表示
 * カロリーが0の場合は何も表示しない
 */
export const TotalCalories: React.FC<TotalCaloriesProps> = ({ totalCalories, rangeLabel }) => {
  if (totalCalories === 0) return null;

  return (
    <div
      style={{
        backgroundColor: "#f0f8ff",
        border: "2px solid #4a90e2",
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        textAlign: "center",
      }}
    >
      <h3 style={{ margin: "0 0 8px 0", color: "#2c5aa0" }}>
        総カロリー: {totalCalories} kcal
      </h3>
      <p style={{ margin: 0, fontSize: "0.9em", color: "#666" }}>
        {rangeLabel} の合計
      </p>
    </div>
  );
};
