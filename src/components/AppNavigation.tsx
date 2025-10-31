/**
 * アプリナビゲーション
 * マイページと食事管理ページ間のナビゲーション
 */
import React from "react";
import { Link } from "react-router-dom";
import styles from "../styles/app.module.css";

interface AppNavigationProps {
  currentPage: "me" | "dashboard";
}

export const AppNavigation: React.FC<AppNavigationProps> = ({ currentPage }) => {
  return (
    <nav className={styles.nav}>
      <Link
        to="/me"
        className={`${styles.navLink} ${
          currentPage === "me" ? styles.navLinkActive : ""
        }`}
      >
        マイページ
      </Link>
      <Link
        to="/dashboard"
        className={`${styles.navLink} ${
          currentPage === "dashboard" ? styles.navLinkActive : ""
        }`}
      >
        食事管理
      </Link>
    </nav>
  );
};
