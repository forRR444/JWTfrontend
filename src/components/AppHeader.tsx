/**
 * アプリ共通ヘッダー
 * ログイン前後で同じデザインを使用
 */
import React from "react";
import styles from "../styles/app.module.css";

interface AppHeaderProps {
  // ログイン後の場合、右側にアクションボタンを表示
  actions?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ actions }) => {
  return (
    <header className={styles.header}>
      <h1 className={styles.headerTitle}>MealTracking</h1>
      {actions && <div className={styles.headerActions}>{actions}</div>}
    </header>
  );
};
