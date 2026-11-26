// Recibe la respuesta de Google (en el fragmento #, que nunca llega a ningún servidor) y se la pasa a la Memphis que abrió esta ventana.
(function () {
  const p = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, "", location.pathname);
  const msg = { memphisOAuth: true, token: p.get("access_token") || "", exp: +p.get("expires_in") || 0, state: p.get("state") || "", error: p.get("error") || "" };
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(msg, location.origin);
    document.getElementById("m").textContent = msg.error ? "Google respondió: " + msg.error : "Listo. Puedes cerrar esta ventana.";
    setTimeout(() => window.close(), 400);
  } else document.getElementById("m").textContent = "Vuelve a Memphis e inténtalo desde allí.";
})();
