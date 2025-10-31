/**
 * 食品検索コンポーネント
 * 文部科学省の食品成分表から食品を検索し、栄養素情報を取得
 */
import React, { useState } from "react";
import { searchFoods } from "../../api";
import type { Food } from "../../types";

interface FoodSearchProps {
  onSelect: (food: Food) => void;
}

export const FoodSearch: React.FC<FoodSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchFoods(query.trim());
      setResults(response.foods);
    } catch (e: any) {
      setError(e?.message || "検索に失敗しました");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div style={{ marginBottom: 16, border: "1px solid #ddd", padding: 12, borderRadius: 4 }}>
      <div style={{ marginBottom: 8 }}>
        <strong>食品成分表から検索</strong>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例：鶏肉、ご飯、卵"
          style={{ flex: 1 }}
        />
        <button type="button" onClick={handleSearch} disabled={loading}>
          {loading ? "検索中..." : "検索"}
        </button>
      </div>

      {error && <p style={{ color: "crimson", margin: "8px 0" }}>{error}</p>}

      {results.length > 0 && (
        <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #eee", borderRadius: 4 }}>
          {results.map((food) => (
            <div
              key={food.id}
              onClick={() => onSelect(food)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                backgroundColor: "#fff",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f0f0f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
              }}
            >
              <div style={{ fontWeight: "bold" }}>{food.name}</div>
              <div style={{ fontSize: "0.9em", color: "#666" }}>
                100gあたり: {food.calories ? `${food.calories}kcal` : "-"} /
                P:{food.protein ? `${food.protein}g` : "-"} /
                F:{food.fat ? `${food.fat}g` : "-"} /
                C:{food.carbohydrate ? `${food.carbohydrate}g` : "-"}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query.trim() && (
        <p style={{ color: "#666", margin: "8px 0", fontSize: "0.9em" }}>
          検索結果がありません
        </p>
      )}
    </div>
  );
};
