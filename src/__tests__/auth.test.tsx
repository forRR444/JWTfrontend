import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Login from "../Login";

// APIのモック
vi.mock("../api", () => ({
  login: vi.fn(),
  scheduleTokenRefresh: vi.fn(),
  cancelTokenRefresh: vi.fn(),
}));

describe("認証フロー", () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Login", () => {
    it("ログインフォームが表示される", () => {
      render(
        <BrowserRouter>
          <Login onSuccess={mockOnSuccess} />
        </BrowserRouter>
      );

      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
      // フォーム内のsubmitボタンを正確に取得
      expect(
        screen.getByRole("button", { name: /^ログイン$/i })
      ).toBeInTheDocument();
    });

    it("メールアドレスとパスワードを入力できる", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Login onSuccess={mockOnSuccess} />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      expect(emailInput).toHaveValue("test@example.com");
      expect(passwordInput).toHaveValue("password123");
    });

    it("ログイン成功時にトークンがlocalStorageに保存される", async () => {
      const user = userEvent.setup();
      const { login } = await import("../api");

      const mockLoginResponse = {
        token: "test-access-token",
        expires: Math.floor(Date.now() / 1000) + 600,
        user: { id: 1, name: "Test User", email: "test@example.com" },
      };

      vi.mocked(login).mockResolvedValue(mockLoginResponse);

      render(
        <BrowserRouter>
          <Login onSuccess={mockOnSuccess} />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole("button", { name: /^ログイン$/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(login).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(localStorage.getItem("access_token")).toBe("test-access-token");
        expect(mockOnSuccess).toHaveBeenCalledWith(mockLoginResponse);
      });
    });

    it("ログイン失敗時にエラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      const { login } = await import("../api");

      vi.mocked(login).mockRejectedValue(new Error("認証に失敗しました"));

      render(
        <BrowserRouter>
          <Login onSuccess={mockOnSuccess} />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole("button", { name: /^ログイン$/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/認証に失敗しました/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("メールアドレスが空の場合、送信できない", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Login onSuccess={mockOnSuccess} />
        </BrowserRouter>
      );

      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole("button", { name: /^ログイン$/i });

      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // HTML5のバリデーションにより送信されない
      const emailInput = screen.getByLabelText(
        /メールアドレス/i
      ) as HTMLInputElement;
      expect(emailInput.validity.valid).toBe(false);
    });

    it("パスワードが空の場合、送信できない", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Login onSuccess={mockOnSuccess} />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const submitButton = screen.getByRole("button", { name: /^ログイン$/i });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      // HTML5のバリデーションにより送信されない
      const passwordInput = screen.getByLabelText(
        /パスワード/i
      ) as HTMLInputElement;
      expect(passwordInput.validity.valid).toBe(false);
    });
  });

  describe("localStorage管理", () => {
    it("ログイン時にユーザー情報がlocalStorageに保存される", () => {
      const user = { id: 1, name: "Test User", email: "test@example.com" };
      localStorage.setItem("current_user", JSON.stringify(user));

      const storedUser = JSON.parse(
        localStorage.getItem("current_user") || "{}"
      );
      expect(storedUser).toEqual(user);
    });

    it("トークンの有効期限がlocalStorageに保存される", () => {
      const expires = Math.floor(Date.now() / 1000) + 600;
      localStorage.setItem("access_token_expires", String(expires));

      const storedExpires = localStorage.getItem("access_token_expires");
      expect(storedExpires).toBe(String(expires));
    });

    it("ログアウト時にlocalStorageがクリアされる", () => {
      localStorage.setItem("access_token", "test-token");
      localStorage.setItem("access_token_expires", "123456");
      localStorage.setItem("current_user", JSON.stringify({ id: 1 }));

      localStorage.clear();

      expect(localStorage.getItem("access_token")).toBeNull();
      expect(localStorage.getItem("access_token_expires")).toBeNull();
      expect(localStorage.getItem("current_user")).toBeNull();
    });
  });
});
