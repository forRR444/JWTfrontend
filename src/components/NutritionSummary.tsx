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

/**
 * 食事リストから栄養素の合計を計算
 */
const calculateNutritionTotals = (meals: Meal[]): NutritionTotals => {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (Number(meal.calories) || 0),
      protein: acc.protein + (Number(meal.protein) || 0),
      fat: acc.fat + (Number(meal.fat) || 0),
      carbohydrate: acc.carbohydrate + (Number(meal.carbohydrate) || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbohydrate: 0 }
  );
};

/**
 * ユーザーが目標値を設定しているかチェック
 */
const hasNutritionGoals = (user: User): boolean => {
  return !!(
    user.target_calories ||
    user.target_protein ||
    user.target_fat ||
    user.target_carbohydrate
  );
};

export const NutritionSummary: React.FC<NutritionSummaryProps> = ({
  meals,
  user,
  onOpenGoalModal,
}) => {
  const totals = calculateNutritionTotals(meals);
  const hasGoals = hasNutritionGoals(user);

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
              color="#4a90e2"
            />
          )}

          {user.target_protein && (
            <NutritionItem
              label="たんぱく質"
              current={totals.protein}
              target={user.target_protein}
              unit="g"
              color="#5fa3ef"
            />
          )}

          {user.target_fat && (
            <NutritionItem
              label="脂質"
              current={totals.fat}
              target={user.target_fat}
              unit="g"
              color="#74b6f9"
            />
          )}

          {user.target_carbohydrate && (
            <NutritionItem
              label="炭水化物"
              current={totals.carbohydrate}
              target={user.target_carbohydrate}
              unit="g"
              color="#89c9ff"
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

/**
 * 個別の栄養素アイテム表示
 * 現在値、目標値、達成率を表示
 */
const NutritionItem: React.FC<NutritionItemProps> = ({
  label,
  current,
  target,
  unit,
  color,
}) => {
  // 安全な数値変換（ゼロ除算を避ける）
  const safeTarget = Number(target) || 1;
  const safeCurrent = Number(current) || 0;

  // 達成率と差分を計算
  const percentage = (safeCurrent / safeTarget) * 100;
  const diff = safeCurrent - safeTarget;
  const isOver = diff > 0;

  // プログレスバーの幅（最大100%）
  const progressWidth = Math.min(percentage, 100);

  // テキスト色の切り替え（背景色に応じて）
  const textColorClass = percentage > 50 ? styles.progressTextDark : styles.progressTextLight;

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
            width: `${progressWidth}%`,
            backgroundColor: color,
          }}
        />
        <span className={`${styles.progressText} ${textColorClass}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
