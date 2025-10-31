/**
 * ヘッダーアクションボタン
 * トークン更新とログアウトボタンを表示
 */
import React from "react";
import styles from "../styles/app.module.css";

interface HeaderActionsProps {
  onRefreshToken: () => void;
  onLogout: () => void;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
  onRefreshToken,
  onLogout,
}) => {
  return (
    <>
      <button
        onClick={onRefreshToken}
        className={`${styles.buttonSecondary} ${styles.buttonSmall}`}
      >
        トークン更新
      </button>
      <button
        onClick={onLogout}
        className={`${styles.buttonSecondary} ${styles.buttonSmall}`}
      >
        ログアウト
      </button>
    </>
  );
};
