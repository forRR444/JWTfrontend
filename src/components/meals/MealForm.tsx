/**
 * 食事入力フォームコンポーネント
 * 食事の種類、内容、カロリー、グラム数、タグを入力
 */
import React, { useState } from "react";
import type { Meal } from "../../api";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "../../constants/mealTypes";

interface MealFormProps {
  selectedDate: string;
  onSubmit: (mealData: {
    content: string;
    meal_type: Meal["meal_type"];
    calories?: number;
    grams?: number;
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
  const [grams, setGrams] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      setGrams("");
      setTags("");
      setError(null);
    } catch (e: any) {
      setError(e?.message || "作成に失敗しました");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: "grid", gap: 8 }}>
      {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}

      <label>
        種類
        <select value={mealType} onChange={(e) => setMealType(e.target.value as any)}>
          {MEAL_TYPES.map((mt) => (
            <option key={mt} value={mt}>
              {MEAL_TYPE_LABELS[mt]}
            </option>
          ))}
        </select>
      </label>

      <label>
        食事内容（必須）
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="例：鮭おにぎり、味噌汁"
          required
        />
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <label style={{ flex: 1 }}>
          カロリー(kcal)
          <input
            type="number"
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </label>
        <label style={{ flex: 1 }}>
          グラム数(g)
          <input
            type="number"
            inputMode="numeric"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
        </label>
      </div>

      <label>
        タグ（カンマ区切り）
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="和食, 低脂質"
        />
      </label>

      <button type="submit">追加</button>
    </form>
  );
};
