/**
 * 栄養目標設定モーダルコンポーネント
 * - ユーザーの1日あたりの目標カロリー・三大栄養素を入力・更新する
 * - モーダル表示中は既存の目標値をフォームに反映
 * - API経由で更新処理を行い、完了後に親コンポーネントへ反映
 */
import React, { useState, useEffect } from "react";
import type { User } from "../types";
import { updateNutritionGoals, type NutritionGoals } from "../api";
import styles from "../styles/meals.module.css";

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
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e && typeof e.message === "string"
          ? e.message
          : "更新に失敗しました";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>栄養目標を設定</h2>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalFormGroup}>
            <label htmlFor="calories" className={styles.modalLabel}>
              目標カロリー (kcal)
            </label>
            <input
              id="calories"
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="例: 2000"
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalFormGroup}>
            <label htmlFor="protein" className={styles.modalLabel}>
              目標たんぱく質 (g)
            </label>
            <input
              id="protein"
              type="number"
              inputMode="numeric"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="例: 60"
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalFormGroup}>
            <label htmlFor="fat" className={styles.modalLabel}>
              目標脂質 (g)
            </label>
            <input
              id="fat"
              type="number"
              inputMode="numeric"
              step="0.1"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="例: 50"
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalFormGroup}>
            <label htmlFor="carbohydrate" className={styles.modalLabel}>
              目標炭水化物 (g)
            </label>
            <input
              id="carbohydrate"
              type="number"
              inputMode="numeric"
              step="0.1"
              value={carbohydrate}
              onChange={(e) => setCarbohydrate(e.target.value)}
              placeholder="例: 250"
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalButtonGroup}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={styles.modalButtonCancel}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.modalButtonSubmit}
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>

        <div className={styles.modalHints}>
          <p className={styles.modalHint}>目標値は1日あたりの推奨摂取量です</p>
          <p className={styles.modalHint}>空欄にすると目標は未設定になります</p>
        </div>
      </div>
    </div>
  );
};
