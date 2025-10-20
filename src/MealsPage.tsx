import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createMeal,
  deleteMeal,
  listMeals,
  refreshToken,
  type Meal,
} from "./api";
import { getMealSummaryByDate, getCalendarMonth, type MealGroups } from "./api";
import { clearAuth } from "./auth";

const MEAL_TYPES: Meal["meal_type"][] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "other",
];

export default function MealsPage() {
  const navigate = useNavigate();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [content, setContent] = useState(""); // 必須
  const [mealType, setMealType] = useState<Meal["meal_type"]>("other");
  const [calories, setCalories] = useState<string>(""); // 任意
  const [grams, setGrams] = useState<string>(""); // 任意
  const [tags, setTags] = useState<string>(""); // カンマ区切り
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  });
  const [groups, setGroups] = useState<MealGroups["groups"] | null>(null);
  const [monthStat, setMonthStat] = useState<Record<
    string,
    { total: number }
  > | null>(null);

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

  // 初期表示：当日のサマリ
  useEffect(() => {
    (async () => {
      try {
        const res = await getMealSummaryByDate(selectedDate);
        setGroups(res.groups);
        // ついでに月統計（バッジ表示などに使える）
        const month = selectedDate.slice(0, 7);
        const cal = await getCalendarMonth(month);
        const compact = Object.fromEntries(
          Object.entries(cal.days).map(([d, v]) => [d, { total: v.total }])
        );
        setMonthStat(compact);
      } catch (e) {
        console.error(e);
        setGroups(null);
      }
    })();
  }, []); // 初回のみ

  // 「表示」ボタン
  const handleShowByDate = async () => {
    setLoading(true);
    try {
      const res = await getMealSummaryByDate(selectedDate);
      setGroups(res.groups);
      const month = selectedDate.slice(0, 7);
      const cal = await getCalendarMonth(month);
      const compact = Object.fromEntries(
        Object.entries(cal.days).map(([d, v]) => [d, { total: v.total }])
      );
      setMonthStat(compact);
      setError("");
    } catch (e: any) {
      setError(e?.message || "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

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
        eaten_on: selectedDate,
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

  // === 追加: ログアウト ===
  const handleLogoutClick = () => {
    clearAuth(); // localStorage をクリア
    window.dispatchEvent(new Event("unauthorized")); // グローバル通知（AuthBridge等）
    navigate("/login", { replace: true });
  };

  // === 追加: トークン更新 ===
  const handleRefreshToken = async () => {
    try {
      const r = await refreshToken();
      localStorage.setItem("access_token", r.token);
      localStorage.setItem("access_token_expires", String(r.expires ?? ""));
      localStorage.setItem("current_user", JSON.stringify(r.user ?? null));
      window.dispatchEvent(new Event("authorized")); // 認可状態の更新通知
      alert("アクセストークンを更新しました");
    } catch (e: any) {
      alert(e?.message || "更新に失敗。再ログインしてください");
    }
  };

  const MEAL_TYPES_ORDER = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "other",
  ] as const;

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, flex: 1 }}>食事管理</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleRefreshToken}>トークン更新</button>
          <button onClick={handleLogoutClick}>ログアウト</button>
        </div>
      </div>

      {/* date selector + show button */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button onClick={handleShowByDate}>表示</button>
      </div>

      {/* mini calendar (day buttons with counts) */}
      {monthStat && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 16,
          }}
        >
          {Object.entries(monthStat).map(([d, v]) => (
            <button
              key={d}
              onClick={() => {
                setSelectedDate(d);
                handleShowByDate();
              }}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid #ddd",
              }}
              title={`${d} の記録 ${v.total} 件`}
            >
              {d.slice(-2)}日 {v.total > 0 ? `(${v.total})` : ""}
            </button>
          ))}
        </div>
      )}

      {/* form */}
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

      {/* groups rendering from /meals/summary */}
      {loading ? (
        <p>読み込み中...</p>
      ) : error ? (
        <p style={{ color: "crimson" }}>{error}</p>
      ) : groups ? (
        <>
          {MEAL_TYPES_ORDER.map((type) => {
            const items = groups[type] || [];
            if (items.length === 0) return null;

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
                <h3 style={{ marginTop: 0, textTransform: "capitalize" }}>
                  {type}
                </h3>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  {items.map((m) => (
                    <li
                      key={m.id}
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
                          alignItems: "center",
                        }}
                      >
                        <strong>{m.content}</strong>
                        <button onClick={() => onDelete(m.id)}>削除</button>
                      </div>
                      <small>
                        kcal: {m.calories ?? "-"} / g: {m.grams ?? "-"}
                      </small>
                      {m.tags && m.tags.length > 0 && (
                        <div>タグ: {m.tags.join(", ")}</div>
                      )}
                      <small>
                        食べた日: {m.eaten_on} / 記録日時:{" "}
                        {new Date(m.created_at).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      ) : (
        <p>データがありません</p>
      )}
    </div>
  );
  // ここでコンポーネント関数の波括弧を閉じる
}
