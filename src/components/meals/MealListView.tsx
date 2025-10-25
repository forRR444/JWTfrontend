/**
 * 食事リスト表示コンポーネント
 * ビューモード（日/週/月）に応じて異なる形式で食事を表示
 */
import React, { useState, useRef, useEffect } from "react";
import type { Meal } from "../../api";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPES_ORDER,
  MEAL_TYPES,
} from "../../constants/mealTypes";
import type { ViewMode } from "../../utils/dateUtils";
import styles from "../../styles/meals.module.css";

// タグごとの色定義
const TAG_COLORS: Record<string, string> = {
  外食: "#ef4444",
  自炊: "#22c55e",
  和食: "#f59e0b",
  洋食: "#3b82f6",
  中華: "#dc2626",
  韓国料理: "#ec4899",
  イタリアン: "#10b981",
};

const DEFAULT_TAG_COLOR = "#6b7280";

const AVAILABLE_TAGS = [
  "外食",
  "自炊",
  "和食",
  "洋食",
  "中華",
  "韓国料理",
  "イタリアン",
];

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
  onUpdate: (id: number, data: Partial<Meal>) => Promise<void>;
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
  onUpdate,
}) => {
  if (!groups) {
    return <p>データがありません</p>;
  }

  if (viewMode === "day") {
    return <DayView groups={groups} onDelete={onDelete} onUpdate={onUpdate} />;
  }

  return (
    <WeekMonthView
      viewMode={viewMode}
      allMealsInRange={allMealsInRange}
      onDelete={onDelete}
      onUpdate={onUpdate}
    />
  );
};

/**
 * 日ビュー: 食事タイプ別にグループ表示
 * 朝食/昼食/夕食/間食/その他に分けて表示し、各タイプの小計カロリーを表示
 */
const DayView: React.FC<{
  groups: MealListViewProps["groups"];
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, data: Partial<Meal>) => Promise<void>;
}> = ({ groups, onDelete, onUpdate }) => {
  if (!groups) return null;

  // 各食事タイプの小計カロリーを計算
  const calculateSubtotal = (meals: Meal[]) => {
    return meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  };

  return (
    <>
      {MEAL_TYPES_ORDER.map((type) => {
        const items = groups[type] || [];
        if (items.length === 0) return null;

        const subtotalCalories = calculateSubtotal(items);

        return (
          <section key={type} className={styles.mealSection}>
            <div className={styles.mealSectionHeader}>
              <h3 className={styles.mealSectionTitle}>
                {MEAL_TYPE_LABELS[type] || type}
              </h3>
              {subtotalCalories > 0 && (
                <span className={styles.mealSubtotal}>
                  小計: {subtotalCalories} kcal
                </span>
              )}
            </div>

            <ul className={styles.mealList}>
              {items.map((meal) => (
                <MealItem
                  key={meal.id}
                  meal={meal}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  showDate={false}
                />
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
  onUpdate: (id: number, data: Partial<Meal>) => Promise<void>;
}> = ({ viewMode, allMealsInRange, onDelete, onUpdate }) => {
  const title = viewMode === "week" ? "週間食事リスト" : "月間食事リスト";
  const hasNoMeals = allMealsInRange.length === 0;

  return (
    <div className={styles.weekMonthContainer}>
      <h3 className={styles.weekMonthTitle}>{title}</h3>
      {hasNoMeals ? (
        <p className={styles.emptyMessage}>この期間の記録はありません</p>
      ) : (
        <ul className={styles.mealList}>
          {allMealsInRange.map((meal) => (
            <MealItem
              key={meal.id}
              meal={meal}
              onDelete={onDelete}
              onUpdate={onUpdate}
              showDate={true}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * タグの色を取得するヘルパー関数
 */
const getTagColor = (tag: string): string => {
  return TAG_COLORS[tag] || DEFAULT_TAG_COLOR;
};

/**
 * 栄養素の値をフォーマット（小数点1桁）
 */
const formatNutrient = (value: number | null | undefined): string => {
  return value ? Number(value).toFixed(1) : "-";
};

/**
 * 個別の食事アイテム表示
 * showDate=trueの場合は日付と食事タイプバッジを表示（週/月ビュー用）
 * showDate=falseの場合は記録日時を表示（日ビュー用）
 */
const MealItem: React.FC<{
  meal: Meal;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, data: Partial<Meal>) => Promise<void>;
  showDate: boolean;
}> = ({ meal, onDelete, onUpdate, showDate }) => {
  const [isEditing, setIsEditing] = useState(false);

  // 栄養素が入力されているかチェック
  const hasNutritionInfo = meal.protein || meal.fat || meal.carbohydrate;
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
          <div className={styles.mealItemName}>{meal.content}</div>
          <div className={styles.mealItemCalories}>
            {meal.calories ?? "-"} kcal
          </div>
          <div className={styles.mealItemDetails}>
            <div>グラム数: {meal.grams ?? "-"} g</div>
            {hasNutritionInfo && (
              <div className={styles.mealItemNutrition}>
                P: {formatNutrient(meal.protein)}g / F:{" "}
                {formatNutrient(meal.fat)}g / C:{" "}
                {formatNutrient(meal.carbohydrate)}g
              </div>
            )}
          </div>
          {meal.tags && meal.tags.length > 0 && (
            <div className={styles.mealItemTags}>
              {meal.tags.map((tag) => (
                <span
                  key={tag}
                  className={styles.mealTagChip}
                  style={{ backgroundColor: getTagColor(tag) }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {!showDate && (
            <div className={styles.mealItemTimestamp}>
              記録日時: {new Date(meal.created_at).toLocaleString()}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setIsEditing(true)}
            className={styles.mealDeleteButton}
          >
            編集
          </button>
          <button
            onClick={() => onDelete(meal.id)}
            className={styles.mealDeleteButton}
          >
            削除
          </button>
        </div>
      </div>
      {isEditing && (
        <EditMealModal
          meal={meal}
          onClose={() => setIsEditing(false)}
          onUpdate={onUpdate}
        />
      )}
    </li>
  );
};

/**
 * 数値をフォーム用の文字列に変換するヘルパー関数
 */
const toFormString = (value: number | null | undefined): string => {
  return value !== null && value !== undefined ? String(value) : "";
};

/**
 * 食事編集モーダル
 */
const EditMealModal: React.FC<{
  meal: Meal;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<Meal>) => Promise<void>;
}> = ({ meal, onClose, onUpdate }) => {
  // フォーム入力状態
  const [content, setContent] = useState(meal.content);
  const [mealType, setMealType] = useState(meal.meal_type);
  const [calories, setCalories] = useState(toFormString(meal.calories));
  const [grams, setGrams] = useState(toFormString(meal.grams));
  const [protein, setProtein] = useState(toFormString(meal.protein));
  const [fat, setFat] = useState(toFormString(meal.fat));
  const [carbohydrate, setCarbohydrate] = useState(
    toFormString(meal.carbohydrate)
  );
  const [tags, setTags] = useState<string[]>(meal.tags || []);

  // UI状態
  const [showTagSelector, setShowTagSelector] = useState(false);
  const tagSelectorRef = useRef<HTMLDivElement>(null);

  // モーダル表示時に背景のスクロールを防ぐ
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // タグセレクターの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagSelectorRef.current &&
        !tagSelectorRef.current.contains(event.target as Node)
      ) {
        setShowTagSelector(false);
      }
    };

    if (showTagSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTagSelector]);

  // タグの選択・解除を切り替え
  const handleTagToggle = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: Partial<Meal> = {
      content,
      meal_type: mealType,
      calories: calories ? Number(calories) : undefined,
      grams: grams ? Number(grams) : undefined,
      protein: protein ? Number(protein) : undefined,
      fat: fat ? Number(fat) : undefined,
      carbohydrate: carbohydrate ? Number(carbohydrate) : undefined,
      tags,
    };

    await onUpdate(meal.id, updatedData);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>食事を編集</h3>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>食事内容</label>
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>食事のタイミング</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as Meal["meal_type"])}
              className={styles.modalInput}
            >
              {MEAL_TYPES.map((mt) => (
                <option key={mt} value={mt}>
                  {MEAL_TYPE_LABELS[mt]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>カロリー (kcal)</label>
            <input
              type="number"
              step="0.1"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>グラム数 (g)</label>
            <input
              type="number"
              step="0.1"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>タンパク質 (g)</label>
            <input
              type="number"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>脂質 (g)</label>
            <input
              type="number"
              step="0.1"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>炭水化物 (g)</label>
            <input
              type="number"
              step="0.1"
              value={carbohydrate}
              onChange={(e) => setCarbohydrate(e.target.value)}
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>タグ</label>
            <div className={styles.tagSelector} ref={tagSelectorRef}>
              <button
                type="button"
                onClick={() => setShowTagSelector(!showTagSelector)}
                className={styles.tagSelectorButton}
              >
                {tags.length > 0 ? `選択中: ${tags.join(", ")}` : "タグを選択"}
              </button>
              {showTagSelector && (
                <div className={styles.tagDropdown}>
                  {AVAILABLE_TAGS.map((tag) => (
                    <label key={tag} className={styles.tagCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={tags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        className={styles.tagCheckbox}
                      />
                      <span className={styles.tagCheckboxText}>{tag}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalButtonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={styles.modalButtonCancel}
            >
              キャンセル
            </button>
            <button type="submit" className={styles.modalButtonSubmit}>
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
