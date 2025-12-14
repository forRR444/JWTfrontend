/**
 * 食事入力フォームコンポーネント
 * 食事の種類、内容、カロリー、グラム数、タグを入力
 */
import React, { useState, useRef, useEffect } from "react";
import type { Meal } from "../../api";
import type { Food } from "../../types";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "../../constants/mealTypes";
import { searchFoods } from "../../api";
import styles from "../../styles/meals.module.css";

// 利用可能なタグの定数
const AVAILABLE_TAGS = ["外食", "自炊", "和食", "洋食", "中華", "韓国料理", "イタリアン"];
const DEFAULT_GRAMS_FOR_SEARCH = "100";

// 倍数オプション
const MULTIPLIER_OPTIONS = [0.5, 1, 2, 3] as const;

interface MealFormProps {
  selectedDate: string;
  onSubmit: (mealData: {
    content: string;
    meal_type: Meal["meal_type"];
    calories?: number;
    grams?: number;
    protein?: number;
    fat?: number;
    carbohydrate?: number;
    tags: string[];
    eaten_on: string;
  }) => Promise<void>;
}

/**
 * 食事を追加するためのフォーム
 * 必須項目は食事内容のみ。他はオプション
 * 送信成功後、フォームは自動的にリセットされる
 */
export const MealForm: React.FC<MealFormProps> = ({ selectedDate, onSubmit }) => {
  // フォーム入力状態
  const [content, setContent] = useState("");
  const [mealType, setMealType] = useState<Meal["meal_type"]>("other");
  const [calories, setCalories] = useState("");
  const [grams, setGrams] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbohydrate, setCarbohydrate] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // 基準値（検索結果から選択した時の100gあたりの値）
  const [baseValues, setBaseValues] = useState<{
    grams: string;
    calories: string;
    protein: string;
    fat: string;
    carbohydrate: string;
  } | null>(null);

  // 現在選択中の倍数
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(1);
  const [customMultiplier, setCustomMultiplier] = useState<string>("");

  // UI状態
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const tagSelectorRef = useRef<HTMLDivElement>(null);

  // タグセレクターの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagSelectorRef.current && !tagSelectorRef.current.contains(event.target as Node)) {
        setShowTagSelector(false);
      }
    };

    if (showTagSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagSelector]);

  // タグの選択・解除を切り替え
  const handleTagToggle = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 食品検索を実行
  const handleSearch = async () => {
    if (!content.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await searchFoods(content.trim());
      setSearchResults(response.foods);
      setHasSearched(true);
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e && typeof e.message === "string"
          ? e.message
          : "検索に失敗しました";
      setError(message);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setSearching(false);
    }
  };

  // 検索結果から食品を選択してフォームに反映
  const handleFoodSelect = (food: Food) => {
    setContent(food.name);
    setGrams(DEFAULT_GRAMS_FOR_SEARCH);

    // 栄養情報を文字列に変換してセット
    const caloriesStr = food.calories ? String(food.calories) : "";
    const proteinStr = food.protein ? String(food.protein) : "";
    const fatStr = food.fat ? String(food.fat) : "";
    const carbohydrateStr = food.carbohydrate ? String(food.carbohydrate) : "";

    setCalories(caloriesStr);
    setProtein(proteinStr);
    setFat(fatStr);
    setCarbohydrate(carbohydrateStr);

    // 基準値を保存（倍数計算用）
    setBaseValues({
      grams: DEFAULT_GRAMS_FOR_SEARCH,
      calories: caloriesStr,
      protein: proteinStr,
      fat: fatStr,
      carbohydrate: carbohydrateStr,
    });

    // 倍数をリセット
    setSelectedMultiplier(1);
    setCustomMultiplier("");

    // 検索状態をクリア
    setSearchResults([]);
    setHasSearched(false);
    setShowDetails(true); // 検索結果から選んだ場合は詳細を自動表示
  };

  // Enterキーで検索を実行
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // 食事内容の入力をクリア
  const handleClearContent = () => {
    setContent("");
    setSearchResults([]);
    setHasSearched(false);
  };

  // 倍数を適用（基準値に対して適用）
  const applyMultiplier = (multiplier: number) => {
    if (!baseValues) return;

    const multiplyValue = (value: string) => {
      if (!value) return "";
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      return String(Math.round(num * multiplier * 10) / 10);
    };

    setGrams(multiplyValue(baseValues.grams));
    setCalories(multiplyValue(baseValues.calories));
    setProtein(multiplyValue(baseValues.protein));
    setFat(multiplyValue(baseValues.fat));
    setCarbohydrate(multiplyValue(baseValues.carbohydrate));
    setSelectedMultiplier(multiplier);
    setCustomMultiplier("");
  };

  // カスタム倍数を適用
  const applyCustomMultiplier = () => {
    const multiplier = parseFloat(customMultiplier);
    if (!isNaN(multiplier) && multiplier > 0) {
      applyMultiplier(multiplier);
    }
  };

  // フォームをリセット
  const resetForm = () => {
    setContent("");
    setMealType("other");
    setCalories("");
    setGrams("");
    setProtein("");
    setFat("");
    setCarbohydrate("");
    setTags([]);
    setError(null);
    setSearchResults([]);
    setHasSearched(false);
    setShowDetails(false);
    setBaseValues(null);
    setSelectedMultiplier(1);
    setCustomMultiplier("");
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("食事内容は必須です");
      return;
    }

    try {
      await onSubmit({
        content: content.trim(),
        meal_type: mealType,
        calories: calories ? Number(calories) : undefined,
        grams: grams ? Number(grams) : undefined,
        protein: protein ? Number(protein) : undefined,
        fat: fat ? Number(fat) : undefined,
        carbohydrate: carbohydrate ? Number(carbohydrate) : undefined,
        tags: tags,
        eaten_on: selectedDate,
      });

      resetForm();
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e && typeof e.message === "string"
          ? e.message
          : "作成に失敗しました";
      setError(message);
    }
  };

  return (
    <div className={styles.formCard}>
      <h3 className={styles.formTitle}>食事を追加</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <p className={styles.error}>{error}</p>}

        {/* 食事内容 */}
        <div className={styles.formGroup}>
          <label htmlFor="content" className={`${styles.label} ${styles.labelRequired}`}>
            食事内容
          </label>
          <div className={styles.inputWithButtons}>
            <input
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例：鮭おにぎり、味噌汁"
              required
              className={styles.inputFlex}
            />
            {content && (
              <button
                type="button"
                onClick={handleClearContent}
                className={styles.clearButton}
                aria-label="入力をクリア"
              >
                ×
              </button>
            )}
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !content.trim()}
              className={styles.searchButton}
            >
              {searching ? "検索中..." : "検索"}
            </button>
            <button type="submit" className={styles.addButton}>
              追加
            </button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className={styles.searchResults}>
            {searchResults.map((food) => (
              <div
                key={food.id}
                onClick={() => handleFoodSelect(food)}
                className={styles.searchResultItem}
              >
                <div className={styles.searchResultName}>{food.name}</div>
                <div className={styles.searchResultInfo}>
                  100gあたり: {food.calories ? `${food.calories}kcal` : "-"} /
                  P:{food.protein ? `${food.protein}g` : "-"} /
                  F:{food.fat ? `${food.fat}g` : "-"} /
                  C:{food.carbohydrate ? `${food.carbohydrate}g` : "-"}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasSearched && searchResults.length === 0 && (
          <div className={styles.searchResults}>
            <p className={styles.error}>該当する食品が見つかりませんでした。</p>
          </div>
        )}

        {/* 食事のタイミング、カロリー、タグ */}
        <div className={`${styles.formRow} ${styles.formRow3Col}`}>
          <div className={styles.formGroup}>
            <label htmlFor="mealType" className={styles.label}>食事のタイミング</label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value as Meal["meal_type"])}
              className={styles.select}
            >
              {MEAL_TYPES.map((mt) => (
                <option key={mt} value={mt}>
                  {MEAL_TYPE_LABELS[mt]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="calories" className={styles.label}>カロリー (kcal)</label>
            <input
              id="calories"
              type="number"
              inputMode="numeric"
              step="0.1"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className={styles.input}
              placeholder="200"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>タグ</label>
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
        </div>

        {/* 詳細入力ボタン */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className={styles.toggleDetailsButton}
        >
          {showDetails ? "詳細を閉じる" : "詳細を入力"}
        </button>

        {/* オプション項目（詳細） */}
        {showDetails && (
          <>
            {/* 倍数調整ボタン */}
            <div className={styles.multiplierSection}>
              <span className={styles.multiplierLabel}>倍数調整:</span>
              <div className={styles.multiplierButtons}>
                {MULTIPLIER_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => applyMultiplier(m)}
                    className={`${styles.multiplierButton} ${selectedMultiplier === m && !customMultiplier ? styles.multiplierButtonActive : ""}`}
                    disabled={!baseValues}
                  >
                    ×{m}
                  </button>
                ))}
                <div className={styles.customMultiplierWrapper}>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0.1"
                    value={customMultiplier}
                    onChange={(e) => setCustomMultiplier(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCustomMultiplier();
                      }
                    }}
                    placeholder="×"
                    className={`${styles.customMultiplierInput} ${customMultiplier && selectedMultiplier === parseFloat(customMultiplier) ? styles.customMultiplierInputActive : ""}`}
                    disabled={!baseValues}
                  />
                  <button
                    type="button"
                    onClick={applyCustomMultiplier}
                    className={styles.customMultiplierApply}
                    disabled={!baseValues || !customMultiplier}
                  >
                    適用
                  </button>
                </div>
              </div>
            </div>

            <div className={`${styles.formRow} ${styles.formRow4Col}`}>
              <div className={styles.formGroup}>
                <label htmlFor="grams" className={styles.label}>グラム数 (g)</label>
              <input
                id="grams"
                type="number"
                inputMode="numeric"
                step="0.1"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                placeholder="100"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="protein" className={styles.label}>タンパク質 (g)</label>
              <input
                id="protein"
                type="number"
                inputMode="numeric"
                step="0.1"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="fat" className={styles.label}>脂質 (g)</label>
              <input
                id="fat"
                type="number"
                inputMode="numeric"
                step="0.1"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="carbohydrate" className={styles.label}>炭水化物 (g)</label>
              <input
                id="carbohydrate"
                type="number"
                inputMode="numeric"
                step="0.1"
                value={carbohydrate}
                onChange={(e) => setCarbohydrate(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>
          </>
        )}
      </form>
    </div>
  );
};
