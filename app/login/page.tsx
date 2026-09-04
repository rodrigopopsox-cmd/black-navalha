"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="login-page">
      <div className="login-decoration" />

      <div className="login-box">

        <div className="brand">
          BLACK <span>NAVALHA</span>
        </div>

        <p className="area">ÁREA RESTRITA</p>

        <h1>Painel da barbearia</h1>

        <p className="subtitle">
          Entre com sua conta para acessar a agenda e administrar
          a Black Navalha.
        </p>

        <form onSubmit={handleLogin}>

          <label htmlFor="email">E-mail</label>

          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <label htmlFor="password">Senha</label>

          <input
            id="password"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "ENTRANDO..." : "ENTRAR NO PAINEL"}
          </button>

        </form>

        <div className="back">
          <a href="/">← Voltar para Black Navalha</a>
        </div>

      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: #070707;
          color: #f7f4ee;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          position: relative;
          overflow: hidden;
          font-family: Arial, sans-serif;
        }

        .login-decoration {
          width: 500px;
          height: 500px;
          position: absolute;
          border-radius: 50%;
          background: #c8954b;
          filter: blur(180px);
          opacity: 0.08;
          top: -230px;
          right: -120px;
        }

        .login-box {
          width: 100%;
          max-width: 460px;
          position: relative;
          z-index: 2;
        }

        .brand {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 4px;
          margin-bottom: 50px;
        }

        .brand span {
          color: #d29d4f;
        }

        .area {
          color: #d29d4f;
          letter-spacing: 4px;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 15px;
        }

        h1 {
          font-size: clamp(36px, 5vw, 52px);
          line-height: 1;
          margin: 0 0 16px;
          letter-spacing: -2px;
        }

        .subtitle {
          color: #888;
          font-size: 14px;
          line-height: 1.7;
          margin-bottom: 35px;
          max-width: 400px;
        }

        form {
          display: flex;
          flex-direction: column;
        }

        label {
          color: #ccc;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 9px;
        }

        input {
          width: 100%;
          background: #101010;
          border: 1px solid #252525;
          color: white;
          padding: 16px;
          outline: none;
          border-radius: 5px;
          margin-bottom: 22px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        input:focus {
          border-color: #d29d4f;
        }

        button {
          border: 0;
          border-radius: 5px;
          background: #d29d4f;
          color: #080808;
          min-height: 52px;
          font-size: 12px;
          letter-spacing: 1px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s;
        }

        button:hover {
          background: #e4b66e;
        }

        button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .error {
          background: rgba(180, 40, 40, 0.1);
          border: 1px solid #702929;
          color: #ff8d8d;
          padding: 13px;
          margin-bottom: 20px;
          border-radius: 5px;
          font-size: 13px;
        }

        .back {
          text-align: center;
          margin-top: 30px;
        }

        .back a {
          color: #777;
          text-decoration: none;
          font-size: 12px;
        }

        .back a:hover {
          color: #d29d4f;
        }
      `}</style>
    </main>
  );
}