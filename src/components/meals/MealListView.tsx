/**
 * 食事リスト表示コンポーネント
 * ビューモード（日/週/月）に応じて異なる形式で食事を表示
 */
import React from "react";
import type { Meal } from "../../api";
import { MEAL_TYPE_LABELS, MEAL_TYPES_ORDER } from "../../constants/mealTypes";
import type { ViewMode } from "../../utils/dateUtils";

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
          <section
            key={type}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h3 style={{ margin: 0 }}>{MEAL_TYPE_LABELS[type] || type}</h3>
              {subtotalCalories > 0 && (
                <span
                  style={{
                    backgroundColor: "#ffe4b5",
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: "0.9em",
                    fontWeight: "bold",
                    color: "#d97706",
                  }}
                >
                  小計: {subtotalCalories} kcal
                </span>
              )}
            </div>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                display: "grid",
                gap: 8,
              }}
            >
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
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        maxHeight: "600px",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        {viewMode === "week" ? "週間" : "月間"}食事リスト
      </h3>
      {allMealsInRange.length > 0 ? (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "grid",
            gap: 8,
          }}
        >
          {allMealsInRange.map((m) => (
            <MealItem key={m.id} meal={m} onDelete={onDelete} showDate={true} />
          ))}
        </ul>
      ) : (
        <p style={{ color: "#999" }}>この期間の記録はありません</p>
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
    <li
      style={{
        border: "1px solid #eee",
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: showDate ? "flex-start" : "center",
        }}
      >
        <div style={{ flex: 1 }}>
          {showDate && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <strong style={{ fontSize: "0.9em", color: "#666" }}>
                {meal.eaten_on}
              </strong>
              <span
                style={{
                  backgroundColor: "#e3f2fd",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: "0.75em",
                  color: "#2c5aa0",
                }}
              >
                {MEAL_TYPE_LABELS[meal.meal_type] || meal.meal_type}
              </span>
            </div>
          )}
          <div style={{ marginTop: showDate ? 4 : 0 }}>
            <strong>{meal.content}</strong>
          </div>
          <small>
            kcal: {meal.calories ?? "-"} / g: {meal.grams ?? "-"}
          </small>
          {meal.tags && meal.tags.length > 0 && (
            <div style={{ fontSize: showDate ? "0.85em" : "1em" }}>
              タグ: {meal.tags.join(", ")}
            </div>
          )}
          {!showDate && (
            <small>記録日時: {new Date(meal.created_at).toLocaleString()}</small>
          )}
        </div>
        <button onClick={() => onDelete(meal.id)} style={{ marginLeft: 8 }}>
          削除
        </button>
      </div>
    </li>
  );
};
