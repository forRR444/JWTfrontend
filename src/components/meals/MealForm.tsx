/**
 * 食事入力フォームコンポーネント
 * 食事の種類、内容、カロリー、グラム数、タグを入力
 */
import React, { useState } from "react";
import type { Meal } from "../../api";
import type { Food } from "../../types";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "../../constants/mealTypes";
import { searchFoods } from "../../api";
import styles from "../../styles/meals.module.css";

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
  const [content, setContent] = useState("");
  const [mealType, setMealType] = useState<Meal["meal_type"]>("other");
  const [calories, setCalories] = useState("");
  const [grams, setGrams] = useState("100");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbohydrate, setCarbohydrate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);

  const availableTags = ["外食", "自炊", "和食", "洋食", "中華", "韓国料理", "イタリアン"];

  const handleTagToggle = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSearch = async () => {
    if (!content.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await searchFoods(content.trim());
      setSearchResults(response.foods);
    } catch (e: any) {
      setError(e?.message || "検索に失敗しました");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleFoodSelect = (food: Food) => {
    // 選択した食品の情報をフォームに反映（100gあたり）
    setContent(food.name);
    setGrams("100");
    if (food.calories) {
      setCalories(String(food.calories));
    }
    if (food.protein) {
      setProtein(String(food.protein));
    }
    if (food.fat) {
      setFat(String(food.fat));
    }
    if (food.carbohydrate) {
      setCarbohydrate(String(food.carbohydrate));
    }
    setSearchResults([]);
    setShowDetails(true); // 検索結果から選んだ場合は詳細を自動表示
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

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

      // リセット
      setContent("");
      setMealType("other");
      setCalories("");
      setGrams("100");
      setProtein("");
      setFat("");
      setCarbohydrate("");
      setTags([]);
      setError(null);
      setSearchResults([]);
      setShowDetails(false);
    } catch (e: any) {
      setError(e?.message || "作成に失敗しました");
    }
  };

  return (
    <div className={styles.formCard}>
      <h3 className={styles.formTitle}>食事を追加</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <p className={styles.error}>{error}</p>}

        {/* 重要度: 高 - 種類、カロリー、タグ */}
        <div className={`${styles.formRow} ${styles.formRow3Col}`}>
          <div className={styles.formGroup}>
            <label htmlFor="mealType" className={styles.label}>種類</label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value as any)}
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
            <div className={styles.tagSelector}>
              <button
                type="button"
                onClick={() => setShowTagSelector(!showTagSelector)}
                className={styles.tagSelectorButton}
              >
                {tags.length > 0 ? `選択中: ${tags.join(", ")}` : "タグを選択"}
              </button>
              {showTagSelector && (
                <div className={styles.tagDropdown}>
                  {availableTags.map((tag) => (
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
        )}
      </form>
    </div>
  );
};
