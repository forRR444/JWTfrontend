/**
 * 栄養素サマリーコンポーネント
 * 日次の栄養素合計と目標との差分、達成率をグラフで表示
 */
import React from "react";
import type { User } from "../types";
import type { Meal } from "../api";

interface NutritionSummaryProps {
  meals: Meal[];
  user: User;
  onOpenGoalModal: () => void;
}

interface NutritionTotals {
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
}

export const NutritionSummary: React.FC<NutritionSummaryProps> = ({
  meals,
  user,
  onOpenGoalModal,
}) => {
  // 栄養素の合計を計算
  const totals: NutritionTotals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (Number(meal.calories) || 0),
      protein: acc.protein + (Number(meal.protein) || 0),
      fat: acc.fat + (Number(meal.fat) || 0),
      carbohydrate: acc.carbohydrate + (Number(meal.carbohydrate) || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbohydrate: 0 }
  );

  const hasGoals =
    user.target_calories ||
    user.target_protein ||
    user.target_fat ||
    user.target_carbohydrate;

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0 }}>本日の栄養素</h3>
        <button
          onClick={onOpenGoalModal}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {hasGoals ? "目標を編集" : "目標を設定"}
        </button>
      </div>

      {hasGoals ? (
        <div style={{ display: "grid", gap: 16 }}>
          {/* カロリー */}
          {user.target_calories && (
            <NutritionItem
              label="カロリー"
              current={totals.calories}
              target={user.target_calories}
              unit="kcal"
              color="#ff6b6b"
            />
          )}

          {/* たんぱく質 */}
          {user.target_protein && (
            <NutritionItem
              label="たんぱく質"
              current={totals.protein}
              target={user.target_protein}
              unit="g"
              color="#4dabf7"
            />
          )}

          {/* 脂質 */}
          {user.target_fat && (
            <NutritionItem
              label="脂質"
              current={totals.fat}
              target={user.target_fat}
              unit="g"
              color="#ffd43b"
            />
          )}

          {/* 炭水化物 */}
          {user.target_carbohydrate && (
            <NutritionItem
              label="炭水化物"
              current={totals.carbohydrate}
              target={user.target_carbohydrate}
              unit="g"
              color="#74c0fc"
            />
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#666" }}>
          <p>目標を設定すると、達成状況を確認できます</p>
        </div>
      )}
    </div>
  );
};

interface NutritionItemProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

const NutritionItem: React.FC<NutritionItemProps> = ({
  label,
  current,
  target,
  unit,
  color,
}) => {
  const safeTarget = Number(target) || 1;
  const safeCurrent = Number(current) || 0;
  const percentage = (safeCurrent / safeTarget) * 100;
  const diff = safeCurrent - safeTarget;
  const isOver = diff > 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span style={{ fontWeight: "bold" }}>{label}</span>
        <span>
          {safeCurrent.toFixed(1)} / {safeTarget} {unit}
          <span
            style={{
              marginLeft: 8,
              color: isOver ? "#dc3545" : "#28a745",
              fontSize: 14,
            }}
          >
            ({isOver ? "+" : ""}
            {diff.toFixed(1)} {unit})
          </span>
        </span>
      </div>

      {/* プログレスバー */}
      <div
        style={{
          width: "100%",
          height: 24,
          backgroundColor: "#e9ecef",
          borderRadius: 12,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${Math.min(percentage, 100)}%`,
            height: "100%",
            backgroundColor: color,
            transition: "width 0.3s ease",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 12,
            fontWeight: "bold",
            color: percentage > 50 ? "white" : "#333",
          }}
        >
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
