/**
 * アプリ紹介セクション
 * ログイン画面と新規登録画面で共通使用
 */
import React from "react";
import styles from "../styles/auth.module.css";

export const AppIntroSection: React.FC = () => {
  return (
    <div className={styles.introSection}>
      <h2 className={styles.introTitle}>私の経験から生まれたアプリ</h2>
      <p className={styles.introText}>
        減量・食事制限をしていた時、食事の記録をつけるのが本当に大変でした。
        食材を1つ1つ検索して、カロリーや栄養素を調べる作業が面倒で、
        「もっと簡単にできないか？」と毎日感じていました。
      </p>
      <p className={styles.introText}>
        そこで、
        <strong>
          食材名を入力するだけで簡単にカロリーや栄養素がわかるアプリ
        </strong>
        を開発しました。
        実際に自分が欲しかった機能を詰め込んだ、実用性重視のツールです。
      </p>
      <p className={styles.introText}>
        <strong>主な機能：</strong>
      </p>
      <ul className={styles.featureList}>
        <li>食材名検索で即座に栄養素を表示</li>
        <li>カロリー・タンパク質・脂質・炭水化物を自動計算</li>
        <li>日別・週別・月別で栄養バランスを可視化</li>
      </ul>
    </div>
  );
};
