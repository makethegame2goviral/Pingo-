(() => {
  const SUPABASE_URL = "https://puddgzxqekteblmlpiqv.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_PVR0CA2g2AXgzoUDnAE_pg_GkWb5LRb";
  const AUTH_URL = `${SUPABASE_URL}/functions/v1/pingo-auth`;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const form = document.querySelector("#authForm");
  const usernameInput = document.querySelector("#username");
  const passwordInput = document.querySelector("#password");
  const message = document.querySelector("#message");
  const submitButton = document.querySelector("#submitButton");
  const loginTab = document.querySelector("#loginTab");
  const registerTab = document.querySelector("#registerTab");
  const authCard = document.querySelector("#authCard");
  const welcomeCard = document.querySelector("#welcomeCard");
  const welcomeName = document.querySelector("#welcomeName");
  const logoutButton = document.querySelector("#logoutButton");
  let mode = "login";

  function setMode(next) {
    mode = next;
    loginTab.classList.toggle("active", mode === "login");
    registerTab.classList.toggle("active", mode === "register");
    submitButton.innerHTML = mode === "login" ? 'Anmelden <span>→</span>' : 'Konto erstellen <span>→</span>';
    passwordInput.autocomplete = mode === "login" ? "current-password" : "new-password";
    passwordInput.placeholder = mode === "login" ? "Dein Passwort" : "Mindestens 8 Zeichen";
    message.textContent = "";
  }

  function showWelcome(name) {
    authCard.classList.add("hidden");
    welcomeCard.classList.remove("hidden");
    welcomeName.textContent = name;
  }

  loginTab.addEventListener("click", () => setMode("login"));
  registerTab.addEventListener("click", () => setMode("register"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = mode === "login" ? "Anmeldung läuft …" : "Konto wird erstellt …";

    try {
      const response = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ action: mode, username: usernameInput.value.trim(), password: passwordInput.value })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Anmeldung fehlgeschlagen.");
      const { error } = await supabase.auth.setSession(result.session);
      if (error) throw error;
      showWelcome(result.user.username);
      passwordInput.value = "";
    } catch (error) {
      message.textContent = error.message || "Verbindung fehlgeschlagen. Bitte erneut versuchen.";
    } finally {
      submitButton.disabled = false;
      setMode(mode);
    }
  });

  logoutButton.addEventListener("click", async () => {
    await supabase.auth.signOut();
    welcomeCard.classList.add("hidden");
    authCard.classList.remove("hidden");
    setMode("login");
  });

  supabase.auth.getSession().then(({ data }) => {
    if (data.session) {
      const name = data.session.user.user_metadata?.username || "PINGO";
      showWelcome(name);
    }
  });
})();