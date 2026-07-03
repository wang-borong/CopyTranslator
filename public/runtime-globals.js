(() => {
  const userAgent = (window.navigator && window.navigator.userAgent
    ? window.navigator.userAgent
    : ""
  ).toLowerCase();
  const platform = userAgent.includes("win")
    ? "win32"
    : userAgent.includes("mac")
      ? "darwin"
      : "linux";

  window.global = window;
  window.process = window.process || {};
  window.process.env = window.process.env || { NODE_ENV: "production" };
  window.process.platform = window.process.platform || platform;
})();
