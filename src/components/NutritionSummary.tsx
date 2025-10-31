/**
 * 栄養素サマリーコンポーネント
 * 日次の栄養素合計と目標との差分、達成率をグラフで表示
 */
import React from "react";
import type { User } from "../types";
import type { Meal } from "../api";
import styles from "../styles/meals.module.css";

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
    <div className={styles.nutritionCard}>
      <div className={styles.nutritionHeader}>
        <h3 className={styles.nutritionTitle}>本日の栄養素</h3>
        <button onClick={onOpenGoalModal} className={styles.nutritionButton}>
          {hasGoals ? "目標を編集" : "目標を設定"}
        </button>
      </div>

      {hasGoals ? (
        <div className={styles.nutritionList}>
          {user.target_calories && (
            <NutritionItem
              label="カロリー"
              current={totals.calories}
              target={user.target_calories}
              unit="kcal"
              color="#ff6b6b"
            />
          )}

          {user.target_protein && (
            <NutritionItem
              label="たんぱく質"
              current={totals.protein}
              target={user.target_protein}
              unit="g"
              color="#4dabf7"
            />
          )}

          {user.target_fat && (
            <NutritionItem
              label="脂質"
              current={totals.fat}
              target={user.target_fat}
              unit="g"
              color="#ffd43b"
            />
          )}

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
        <div className={styles.nutritionEmpty}>
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
    <div className={styles.nutritionItem}>
      <div className={styles.nutritionItemHeader}>
        <span className={styles.nutritionLabel}>{label}</span>
        <span className={styles.nutritionValues}>
          {safeCurrent.toFixed(1)} / {safeTarget} {unit}
          <span
            className={`${styles.nutritionDiff} ${
              isOver ? styles.nutritionDiffOver : styles.nutritionDiffUnder
            }`}
          >
            ({isOver ? "+" : ""}
            {diff.toFixed(1)} {unit})
          </span>
        </span>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          }}
        />
        <span
          className={`${styles.progressText} ${
            percentage > 50 ? styles.progressTextDark : styles.progressTextLight
          }`}
        >
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
