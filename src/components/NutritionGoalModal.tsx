/**
 * 栄養目標設定モーダル
 * ユーザーの目標カロリーと3大栄養素を設定
 */
import React, { useState, useEffect } from "react";
import type { User } from "../types";
import { updateNutritionGoals, type NutritionGoals } from "../api";

interface NutritionGoalModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

export const NutritionGoalModal: React.FC<NutritionGoalModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbohydrate, setCarbohydrate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // モーダルが開かれたときにユーザーの現在の目標値をセット
  useEffect(() => {
    if (isOpen) {
      setCalories(user.target_calories?.toString() || "");
      setProtein(user.target_protein?.toString() || "");
      setFat(user.target_fat?.toString() || "");
      setCarbohydrate(user.target_carbohydrate?.toString() || "");
      setError(null);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const goals: NutritionGoals = {
      target_calories: calories ? Number(calories) : undefined,
      target_protein: protein ? Number(protein) : undefined,
      target_fat: fat ? Number(fat) : undefined,
      target_carbohydrate: carbohydrate ? Number(carbohydrate) : undefined,
    };

    try {
      const updatedUser = await updateNutritionGoals(goals);
      onUpdate(updatedUser);
      onClose();
    } catch (e: any) {
      setError(e?.message || "更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 8,
          maxWidth: 500,
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>栄養目標を設定</h2>

        {error && <p style={{ color: "crimson", margin: "8px 0" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label>
            目標カロリー (kcal)
            <input
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="例: 2000"
              style={{ width: "100%", padding: 8, fontSize: 16 }}
            />
          </label>

          <label>
            目標たんぱく質 (g)
            <input
              type="number"
              inputMode="numeric"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="例: 60"
              style={{ width: "100%", padding: 8, fontSize: 16 }}
            />
          </label>

          <label>
            目標脂質 (g)
            <input
              type="number"
              inputMode="numeric"
              step="0.1"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="例: 50"
              style={{ width: "100%", padding: 8, fontSize: 16 }}
            />
          </label>

          <label>
            目標炭水化物 (g)
            <input
              type="number"
              inputMode="numeric"
              step="0.1"
              value={carbohydrate}
              onChange={(e) => setCarbohydrate(e.target.value)}
              placeholder="例: 250"
              style={{ width: "100%", padding: 8, fontSize: 16 }}
            />
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: 12,
                fontSize: 16,
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: 12,
                fontSize: 16,
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 16, fontSize: 14, color: "#666" }}>
          <p style={{ margin: "4px 0" }}>
            💡 目標値は1日あたりの推奨摂取量です
          </p>
          <p style={{ margin: "4px 0" }}>
            💡 空欄にすると目標は未設定になります
          </p>
        </div>
      </div>
    </div>
  );
};
