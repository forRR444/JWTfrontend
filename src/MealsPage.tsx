import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createMeal,
  deleteMeal,
  refreshToken,
  type Meal,
} from "./api";
import { getMealSummaryByDate, getMealSummaryByRange, type MealGroups } from "./api";
import { clearAuth } from "./auth";

const MEAL_TYPES: Meal["meal_type"][] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "other",
];

const MEAL_TYPE_LABELS: Record<Meal["meal_type"], string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
  other: "その他",
};

type ViewMode = "day" | "week" | "month";

export default function MealsPage() {
  const navigate = useNavigate();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // view mode
  const [viewMode, setViewMode] = useState<ViewMode>("day");

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
  const [allMealsInRange, setAllMealsInRange] = useState<Meal[]>([]); // 週・月ビュー用

  // 週の開始日（月曜）と終了日（日曜）を計算
  const getWeekRange = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0=日, 1=月, ..., 6=土
    const diff = day === 0 ? -6 : 1 - day; // 月曜を週の始まりとする

    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };

    return { from: format(monday), to: format(sunday) };
  };

  // 月の開始日と終了日を計算
  const getMonthRange = (dateStr: string) => {
    const [year, month] = dateStr.split("-");
    const firstDay = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    const lastDayStr = `${year}-${month}-${String(lastDay.getDate()).padStart(2, "0")}`;
    return { from: firstDay, to: lastDayStr };
  };

  // ビューモードに応じたデータ取得
  const loadDataForView = async (mode: ViewMode, dateStr: string) => {
    setLoading(true);
    try {
      if (mode === "day") {
        const res = await getMealSummaryByDate(dateStr);
        setGroups(res.groups);
        setAllMealsInRange([]);
      } else if (mode === "week") {
        const range = getWeekRange(dateStr);
        const res = await getMealSummaryByRange(range.from, range.to);
        setGroups(res.groups);
        // 週ビュー用に全食事を日付順でリスト化
        const allMeals = Object.values(res.groups).flat();
        allMeals.sort((a, b) => {
          const dateA = a.eaten_on || "";
          const dateB = b.eaten_on || "";
          return dateA.localeCompare(dateB);
        });
        setAllMealsInRange(allMeals);
      } else if (mode === "month") {
        const range = getMonthRange(dateStr);
        const res = await getMealSummaryByRange(range.from, range.to);
        setGroups(res.groups);
        // 月ビュー用に全食事を日付順でリスト化
        const allMeals = Object.values(res.groups).flat();
        allMeals.sort((a, b) => {
          const dateA = a.eaten_on || "";
          const dateB = b.eaten_on || "";
          return dateA.localeCompare(dateB);
        });
        setAllMealsInRange(allMeals);
      }
      setError("");
    } catch (e: any) {
      setError(e?.message || "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 初期表示
  useEffect(() => {
    loadDataForView(viewMode, selectedDate);
  }, []);

  // ビューモードまたは日付が変更されたら再読み込み
  useEffect(() => {
    loadDataForView(viewMode, selectedDate);
  }, [viewMode, selectedDate]);

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
      // 追加後、現在のビューを再取得
      await loadDataForView(viewMode, selectedDate);
    } catch (e: any) {
      setError(e?.message || "作成に失敗しました");
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    try {
      await deleteMeal(id);
      setMeals(meals.filter((m) => m.id !== id));
      // 削除後、現在のビューを再取得
      await loadDataForView(viewMode, selectedDate);
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

  const getViewRangeLabel = () => {
    if (viewMode === "day") {
      return selectedDate;
    } else if (viewMode === "week") {
      const range = getWeekRange(selectedDate);
      return `${range.from} 〜 ${range.to}`;
    } else if (viewMode === "month") {
      const [year, month] = selectedDate.split("-");
      return `${year}年${parseInt(month)}月`;
    }
    return "";
  };

  const getTodayString = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  };

  const goToToday = () => {
    setSelectedDate(getTodayString());
  };

  const isShowingToday = () => {
    const today = getTodayString();
    if (viewMode === "day") {
      // 日ビュー: 今日を選択しているか
      return selectedDate === today;
    } else if (viewMode === "week") {
      // 週ビュー: 今日を含む週を表示しているか
      const range = getWeekRange(today);
      const selectedRange = getWeekRange(selectedDate);
      return range.from === selectedRange.from && range.to === selectedRange.to;
    } else if (viewMode === "month") {
      // 月ビュー: 今日を含む月を表示しているか
      const todayMonth = today.slice(0, 7); // YYYY-MM
      const selectedMonth = selectedDate.slice(0, 7);
      return todayMonth === selectedMonth;
    }
    return false;
  };

  const goToPrevious = () => {
    const date = new Date(selectedDate);
    if (viewMode === "day") {
      // 1日前
      date.setDate(date.getDate() - 1);
    } else if (viewMode === "week") {
      // 1週間前
      date.setDate(date.getDate() - 7);
    } else if (viewMode === "month") {
      // 1ヶ月前
      date.setMonth(date.getMonth() - 1);
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const goToNext = () => {
    const date = new Date(selectedDate);
    if (viewMode === "day") {
      // 1日後
      date.setDate(date.getDate() + 1);
    } else if (viewMode === "week") {
      // 1週間後
      date.setDate(date.getDate() + 7);
    } else if (viewMode === "month") {
      // 1ヶ月後
      date.setMonth(date.getMonth() + 1);
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);
  };

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, flex: 1 }}>食事管理</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleRefreshToken}>トークン更新</button>
          <button onClick={handleLogoutClick}>ログアウト</button>
        </div>
      </div>

      {/* ビュー切替ボタン */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          borderBottom: "2px solid #ddd",
          paddingBottom: 8,
        }}
      >
        <button
          onClick={() => setViewMode("day")}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: viewMode === "day" ? "2px solid #4a90e2" : "1px solid #ddd",
            backgroundColor: viewMode === "day" ? "#e3f2fd" : "white",
            fontWeight: viewMode === "day" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          日
        </button>
        <button
          onClick={() => setViewMode("week")}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: viewMode === "week" ? "2px solid #4a90e2" : "1px solid #ddd",
            backgroundColor: viewMode === "week" ? "#e3f2fd" : "white",
            fontWeight: viewMode === "week" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          週
        </button>
        <button
          onClick={() => setViewMode("month")}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: viewMode === "month" ? "2px solid #4a90e2" : "1px solid #ddd",
            backgroundColor: viewMode === "month" ? "#e3f2fd" : "white",
            fontWeight: viewMode === "month" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          月
        </button>
      </div>

      {/* 日付選択と表示範囲 */}
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
          onChange={(e) => {
            setSelectedDate(e.target.value);
          }}
        />
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={goToPrevious}
            title={viewMode === "day" ? "前の日" : viewMode === "week" ? "前の週" : "前の月"}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              backgroundColor: "white",
              cursor: "pointer",
              fontSize: "1em",
            }}
          >
            ←
          </button>
          <button
            onClick={goToToday}
            disabled={isShowingToday()}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: isShowingToday() ? "2px solid #4a90e2" : "1px solid #ccc",
              backgroundColor: isShowingToday() ? "#e3f2fd" : "white",
              color: isShowingToday() ? "#2c5aa0" : "#333",
              cursor: isShowingToday() ? "default" : "pointer",
              fontWeight: isShowingToday() ? "bold" : "500",
              opacity: isShowingToday() ? 0.7 : 1,
            }}
          >
            今日
          </button>
          <button
            onClick={goToNext}
            title={viewMode === "day" ? "次の日" : viewMode === "week" ? "次の週" : "次の月"}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              backgroundColor: "white",
              cursor: "pointer",
              fontSize: "1em",
            }}
          >
            →
          </button>
        </div>
        <span style={{ fontSize: "0.9em", color: "#666" }}>
          表示範囲: {getViewRangeLabel()}
        </span>
      </div>

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

      {/* データ表示エリア */}
      {loading ? (
        <p>読み込み中...</p>
      ) : error ? (
        <p style={{ color: "crimson" }}>{error}</p>
      ) : groups ? (
        <>
          {/* 総カロリー計算 */}
          {(() => {
            const allMeals = MEAL_TYPES_ORDER.flatMap(
              (type) => groups[type] || []
            );
            const totalCalories = allMeals.reduce(
              (sum, m) => sum + (m.calories || 0),
              0
            );

            const rangeLabel = viewMode === "day"
              ? selectedDate
              : getViewRangeLabel();

            return totalCalories > 0 ? (
              <div
                style={{
                  backgroundColor: "#f0f8ff",
                  border: "2px solid #4a90e2",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", color: "#2c5aa0" }}>
                  総カロリー: {totalCalories} kcal
                </h3>
                <p style={{ margin: 0, fontSize: "0.9em", color: "#666" }}>
                  {rangeLabel} の合計
                </p>
              </div>
            ) : null;
          })()}

          {viewMode === "day" ? (
            // 日ビュー: 食事タイプ別にグループ表示
            <>
              {MEAL_TYPES_ORDER.map((type) => {
                const items = groups[type] || [];
                if (items.length === 0) return null;

                const subtotalCalories = items.reduce(
                  (sum, m) => sum + (m.calories || 0),
                  0
                );

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
                      <h3 style={{ margin: 0 }}>
                        {MEAL_TYPE_LABELS[type] || type}
                      </h3>
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
                            記録日時: {new Date(m.created_at).toLocaleString()}
                          </small>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </>
          ) : (
            // 週・月ビュー: 日付順のリスト表示
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
                  {allMealsInRange.map((m) => {
                    return (
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
                            alignItems: "flex-start",
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <strong style={{ fontSize: "0.9em", color: "#666" }}>
                                {m.eaten_on}
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
                                {MEAL_TYPE_LABELS[m.meal_type] || m.meal_type}
                              </span>
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <strong>{m.content}</strong>
                            </div>
                            <small>
                              kcal: {m.calories ?? "-"} / g: {m.grams ?? "-"}
                            </small>
                            {m.tags && m.tags.length > 0 && (
                              <div style={{ fontSize: "0.85em" }}>
                                タグ: {m.tags.join(", ")}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => onDelete(m.id)}
                            style={{ marginLeft: 8 }}
                          >
                            削除
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ color: "#999" }}>この期間の記録はありません</p>
              )}
            </div>
          )}
        </>
      ) : (
        <p>データがありません</p>
      )}
    </div>
  );
}
