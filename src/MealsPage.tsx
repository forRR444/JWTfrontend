import React, { useEffect, useState } from "react";
import { createMeal, deleteMeal, listMeals, type Meal } from "./api";

const MEAL_TYPES: Meal["meal_type"][] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "other",
];

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [content, setContent] = useState(""); // 必須
  const [mealType, setMealType] = useState<Meal["meal_type"]>("other");
  const [calories, setCalories] = useState<string>(""); // 任意
  const [grams, setGrams] = useState<string>(""); // 任意
  const [tags, setTags] = useState<string>(""); // カンマ区切り

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await listMeals();
      setMeals(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("食事内容は必須です");
      return;
    }
    try {
      const meal = await createMeal({
        content: content.trim(),
        meal_type: mealType,
        calories: calories ? Number(calories) : undefined,
        grams: grams ? Number(grams) : undefined,
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setMeals([meal, ...meals]);
      // reset
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

  const onDelete = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    try {
      await deleteMeal(id);
      setMeals(meals.filter((m) => m.id !== id));
    } catch (e: any) {
      alert(e?.message || "削除に失敗しました");
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: 16 }}>
      <h2>食事管理（最小構成）</h2>

      <form
        onSubmit={onSubmit}
        style={{ marginBottom: 24, display: "grid", gap: 8 }}
      >
        <label>
          種類
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value as any)}
          >
            {MEAL_TYPES.map((mt) => (
              <option key={mt} value={mt}>
                {mt}
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

      {loading ? (
        <p>読み込み中...</p>
      ) : error ? (
        <p style={{ color: "crimson" }}>{error}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
          {meals.map((m) => (
            <li
              key={m.id}
              style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong>{m.meal_type}</strong>
                <button onClick={() => onDelete(m.id)}>削除</button>
              </div>
              <div>{m.content}</div>
              <small>
                kcal: {m.calories ?? "-"} / g: {m.grams ?? "-"}
              </small>
              {m.tags.length > 0 && <div>タグ: {m.tags.join(", ")}</div>}
              <small>記録日時: {new Date(m.created_at).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
