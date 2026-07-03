window.global = window;
window.process = window.process || {};
window.process.env = window.process.env || { NODE_ENV: "production" };
window.process.type = window.process.type || "renderer";
window.process.platform = window.process.platform || "linux";
