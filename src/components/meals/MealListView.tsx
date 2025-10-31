/**
 * 食事リスト表示コンポーネント
 * ビューモード（日/週/月）に応じて異なる形式で食事を表示
 */
import React from "react";
import type { Meal } from "../../api";
import { MEAL_TYPE_LABELS, MEAL_TYPES_ORDER } from "../../constants/mealTypes";
import type { ViewMode } from "../../utils/dateUtils";
import styles from "../../styles/meals.module.css";

interface MealListViewProps {
  viewMode: ViewMode;
  groups: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
    snack: Meal[];
    other: Meal[];
  } | null;
  allMealsInRange: Meal[];
  onDelete: (id: number) => Promise<void>;
}

/**
 * ビューモードに応じて表示形式を切り替える
 * - 日ビュー: 食事タイプ別にグループ表示、小計カロリー表示
 * - 週/月ビュー: 日付順のリスト表示、スクロール可能
 */
export const MealListView: React.FC<MealListViewProps> = ({
  viewMode,
  groups,
  allMealsInRange,
  onDelete,
}) => {
  if (!groups) {
    return <p>データがありません</p>;
  }

  if (viewMode === "day") {
    return <DayView groups={groups} onDelete={onDelete} />;
  }

  return <WeekMonthView viewMode={viewMode} allMealsInRange={allMealsInRange} onDelete={onDelete} />;
};

/**
 * 日ビュー: 食事タイプ別にグループ表示
 * 朝食/昼食/夕食/間食/その他に分けて表示し、各タイプの小計カロリーを表示
 */
const DayView: React.FC<{
  groups: MealListViewProps["groups"];
  onDelete: (id: number) => Promise<void>;
}> = ({ groups, onDelete }) => {
  if (!groups) return null;

  return (
    <>
      {MEAL_TYPES_ORDER.map((type) => {
        const items = groups[type] || [];
        if (items.length === 0) return null;

        const subtotalCalories = items.reduce((sum, m) => sum + (m.calories || 0), 0);

        return (
          <section key={type} className={styles.mealSection}>
            <div className={styles.mealSectionHeader}>
              <h3 className={styles.mealSectionTitle}>{MEAL_TYPE_LABELS[type] || type}</h3>
              {subtotalCalories > 0 && (
                <span className={styles.mealSubtotal}>
                  小計: {subtotalCalories} kcal
                </span>
              )}
            </div>

            <ul className={styles.mealList}>
              {items.map((m) => (
                <MealItem key={m.id} meal={m} onDelete={onDelete} showDate={false} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
};

/**
 * 週・月ビュー: 日付順のリスト表示
 * 期間内の全食事を日付順に並べて表示。スクロール可能で最大高600px
 */
const WeekMonthView: React.FC<{
  viewMode: ViewMode;
  allMealsInRange: Meal[];
  onDelete: (id: number) => Promise<void>;
}> = ({ viewMode, allMealsInRange, onDelete }) => {
  return (
    <div className={styles.weekMonthContainer}>
      <h3 className={styles.weekMonthTitle}>
        {viewMode === "week" ? "週間" : "月間"}食事リスト
      </h3>
      {allMealsInRange.length > 0 ? (
        <ul className={styles.mealList}>
          {allMealsInRange.map((m) => (
            <MealItem key={m.id} meal={m} onDelete={onDelete} showDate={true} />
          ))}
        </ul>
      ) : (
        <p className={styles.emptyMessage}>この期間の記録はありません</p>
      )}
    </div>
  );
};

/**
 * 個別の食事アイテム表示
 * showDate=trueの場合は日付と食事タイプバッジを表示（週/月ビュー用）
 * showDate=falseの場合は記録日時を表示（日ビュー用）
 */
const MealItem: React.FC<{
  meal: Meal;
  onDelete: (id: number) => Promise<void>;
  showDate: boolean;
}> = ({ meal, onDelete, showDate }) => {
  return (
    <li className={styles.mealItem}>
      <div className={styles.mealItemContent}>
        <div className={styles.mealItemInfo}>
          {showDate && (
            <div className={styles.mealItemDate}>
              <strong className={styles.mealItemDateText}>
                {meal.eaten_on}
              </strong>
              <span className={styles.mealItemTypeBadge}>
                {MEAL_TYPE_LABELS[meal.meal_type] || meal.meal_type}
              </span>
            </div>
          )}
          <div className={styles.mealItemName}>
            {meal.content}
          </div>
          <div className={styles.mealItemDetails}>
            <div>
              カロリー: {meal.calories ?? "-"} kcal / 重量: {meal.grams ?? "-"} g
            </div>
            {(meal.protein || meal.fat || meal.carbohydrate) && (
              <div className={styles.mealItemNutrition}>
                P: {meal.protein ? Number(meal.protein).toFixed(1) : "-"}g / F: {meal.fat ? Number(meal.fat).toFixed(1) : "-"}g / C: {meal.carbohydrate ? Number(meal.carbohydrate).toFixed(1) : "-"}g
              </div>
            )}
          </div>
          {meal.tags && meal.tags.length > 0 && (
            <div className={styles.mealItemTags}>
              タグ: {meal.tags.join(", ")}
            </div>
          )}
          {!showDate && (
            <div className={styles.mealItemTimestamp}>
              記録日時: {new Date(meal.created_at).toLocaleString()}
            </div>
          )}
        </div>
        <button onClick={() => onDelete(meal.id)} className={styles.mealDeleteButton}>
          削除
        </button>
      </div>
    </li>
  );
};
