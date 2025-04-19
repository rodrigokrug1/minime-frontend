import { useState, useRef, useEffect } from "react";
import React from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const recaptchaRef = useRef(null);
  const recaptchaClientIdRef = useRef(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [placeholderText, setPlaceholderText] = useState("Cole sua URL aqui... ✂️");

  useEffect(() => {
    let intervalId = null;

    const renderRecaptcha = () => {
      if (
        window.grecaptcha &&
        typeof window.grecaptcha.render === "function" &&
        recaptchaRef.current &&
        recaptchaClientIdRef.current === null
      ) {
        const clientId = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: "{sitekey}", // TODO: replace sitekey on build
          size: "invisible",
        });
        recaptchaClientIdRef.current = clientId;
        setRecaptchaReady(true); // ✅ AQUI
      }
    };

    if (!window.grecaptcha) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      intervalId = setInterval(renderRecaptcha, 300);

      return () => {
        document.body.removeChild(script);
        clearInterval(intervalId);
        recaptchaClientIdRef.current = null;
      };
    } else {
      renderRecaptcha();
    }
  }, []);

  useEffect(() => {
    const suggestions = [
      "https://meusite.com/promocao",
      "https://youtube.com/video-superlegal",
      "https://minhaempresa.com.br/landingpage",
      "https://meublog.com/post-incrivel",
      "https://linkgigante.com.br/um-texto-imenso-aqui",
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % suggestions.length;
      setPlaceholderText(suggestions[index]);
    }, 4000); // troca a cada 4s

    return () => clearInterval(interval);
  }, []);


  const onRecaptchaSuccess = async (token, urlToSend) => {
    if (!token) {
      setError("Erro: Token do reCAPTCHA inválido.");
      setLoading(false);
      return;
    }

    try {
      await submitUrlWithToken(token, urlToSend);
    } catch (err) {
      console.error("Erro ao enviar token:", err);
      setError("Erro inesperado ao verificar reCAPTCHA.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShortUrl("");
    setCopied(false);

    if (!isValidUrl(url)) {
      setError("URL inválida.");
      setLoading(false);
      return;
    }

    if (window.grecaptcha && recaptchaClientIdRef.current !== null) {
      try {
        // Armazena a URL atual em uma variável para uso posterior
        const currentUrl = url;

        // Executa o reCAPTCHA e salva a URL atual em uma variável ref temporária
        window.grecaptcha.execute(recaptchaClientIdRef.current).then((token) => {
          onRecaptchaSuccess(token, currentUrl);
        });
      } catch (err) {
        console.error("Erro ao executar reCAPTCHA:", err);
        setError("Erro ao executar reCAPTCHA.");
        setLoading(false);
      }
    } else {
      setError("Erro ao carregar o reCAPTCHA.");
      setLoading(false);
    }
  };

  const submitUrlWithToken = async (token, urlToSend) => {
    try {
      const response = await fetch("https://api.minime.cloud/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: urlToSend }),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar a URL");
      }

      const data = await response.json();
      setShortUrl(data.shortUrl);
    } catch (err) {
      setError("Ocorreu um erro. Verifique a URL e tente novamente.");
      console.error("Erro no envio da URL:", err);
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`https://link.${shortUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      {/* Cabeçalho */}
      <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
          MiniMe
        </a>
        <button
          onClick={toggleDarkMode}
          className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
        >
          {darkMode ? "☀️ Claro" : "🌙 Escuro"}
        </button>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
          <img src="img/logo.png" alt="MiniMe Logo" className="h-[150px] mx-auto block" />
          <h1 className="text-3xl font-bold text-center text-white dark:text-gray-100">
            encurte sua URL com MiniMe
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="url"
                placeholder={placeholderText}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 pr-24 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-2">
                {url ? (
                  <button
                    type="button"
                    onClick={() => setUrl("")}
                    className="px-3 py-1 rounded-lg text-sm text-white bg-red-500 hover:bg-red-600 transition"
                  >
                    Limpar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const text = await navigator.clipboard.readText();
                      setUrl(text);
                    }}
                    className="px-3 py-1 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 transition"
                  >
                    Colar
                  </button>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-3 rounded-xl transition ${loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                } text-white flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Encurtando...
                </>
              ) : (
                "Encurtar"
              )}
            </button>
          </form>
          {shortUrl && (
            <div className="mt-4 text-center space-y-2">
              <p className="text-green-500">URL encurtada com sucesso!</p>
              <a
                href={`https://link.${shortUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline break-words"
              >
                https://link.{shortUrl}
              </a>
              <div className="flex items-center justify-center flex-col gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  aria-label="Copiar URL encurtada"
                >
                  📋 Copiar
                </button>
                {copied && (
                  <span className="text-green-500 text-sm animate-pulse">Copiado!</span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-center text-red-500">{error}</div>
          )}
        </div>
      </main>

      {/* Invisible reCAPTCHA */}
      <div ref={recaptchaRef} />

      {/* Rodapé */}
      <footer className="bg-white dark:bg-gray-800 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} MiniMe.cloud – Encurtador de URLs. Todos os direitos reservados.
      </footer>
    </div>
  );
}
