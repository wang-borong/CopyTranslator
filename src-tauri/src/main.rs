// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "linux")]
fn prefer_x11_backend_for_window_management() {
    if std::env::var_os("GDK_BACKEND").is_some() {
        return;
    }
    if std::env::var_os("COPYTRANSLATOR_NATIVE_WAYLAND").is_some() {
        return;
    }
    if std::env::var("XDG_SESSION_TYPE").as_deref() != Ok("wayland") {
        return;
    }
    if std::env::var_os("DISPLAY").is_none() {
        return;
    }

    // Native Wayland does not expose a compositor-independent keep-above
    // protocol. Prefer XWayland when available so stay-on-top remains useful.
    std::env::set_var("GDK_BACKEND", "x11,wayland");
}

fn main() {
    #[cfg(target_os = "linux")]
    prefer_x11_backend_for_window_management();

    app_lib::run();
}
