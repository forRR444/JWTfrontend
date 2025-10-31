/**
 * 食事入力フォームコンポーネント
 * 食事の種類、内容、カロリー、グラム数、タグを入力
 */
import React, { useState } from "react";
import type { Meal } from "../../api";
import type { Food } from "../../types";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "../../constants/mealTypes";
import { FoodSearch } from "./FoodSearch";
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
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
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
      setTags("");
      setError(null);
    } catch (e: any) {
      setError(e?.message || "作成に失敗しました");
    }
  };

  return (
    <div className={styles.formCard}>
      <h3 className={styles.formTitle}>食事を追加</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <p className={styles.error}>{error}</p>}

        {/* 重要度: 高 - 種類と内容 */}
        <div className={`${styles.formRow} ${styles.formRowHalf}`}>
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
        </div>

        <FoodSearch onSelect={handleFoodSelect} />

        <div className={styles.formGroup}>
          <label htmlFor="content" className={`${styles.label} ${styles.labelRequired}`}>
            食事内容
          </label>
          <input
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="例：鮭おにぎり、味噌汁"
            required
            className={styles.input}
          />
        </div>

        {/* 重要度: 中 - カロリーとグラム数 */}
        <div className={`${styles.formRow} ${styles.formRow2Col}`}>
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
        </div>

        {/* 重要度: 低 - 詳細な栄養素（小サイズ） */}
        <div className={`${styles.formRow} ${styles.formRow3Col}`}>
          <div className={styles.formGroup}>
            <label htmlFor="protein" className={styles.label}>タンパク質 (g)</label>
            <input
              id="protein"
              type="number"
              inputMode="numeric"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className={`${styles.input} ${styles.inputSmall}`}
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
              className={`${styles.input} ${styles.inputSmall}`}
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
              className={`${styles.input} ${styles.inputSmall}`}
            />
          </div>
        </div>

        {/* 重要度: 低 - タグ */}
        <div className={styles.formGroup}>
          <label htmlFor="tags" className={styles.label}>タグ（カンマ区切り）</label>
          <input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="和食, 低脂質"
            className={`${styles.input} ${styles.inputSmall}`}
          />
          <span className={styles.hint}>例: 和食, 低脂質, 外食</span>
        </div>

        <button type="submit" className={styles.submitButton}>追加</button>
      </form>
    </div>
  );
};
