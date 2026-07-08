use arboard::Clipboard;
use base64::{engine::general_purpose, Engine as _};
use image::{DynamicImage, ImageFormat, RgbaImage};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::hash::{DefaultHasher, Hash, Hasher};
use std::io::Cursor;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const MIN_LINUX_WINDOW_OPACITY: f64 = 0.25;
const CLIPBOARD_POLL_INTERVAL_MS: u64 = 250;

static LISTEN_CLIPBOARD: AtomicBool = AtomicBool::new(true);

fn legacy_config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let home = app.path().home_dir().map_err(|e| e.to_string())?;
    Ok(home.join("copytranslator").join("copytranslator.json"))
}

fn migrate_legacy_config(app: &tauri::AppHandle, config_path: &PathBuf) -> Result<(), String> {
    if config_path.exists() {
        return Ok(());
    }

    let old_path = legacy_config_path(app)?;
    if old_path.exists() {
        std::fs::copy(old_path, config_path).map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn get_config_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let base_dir = app
        .path()
        .config_dir()
        .map_err(|e| e.to_string())?
        .join("copytranslator");
    std::fs::create_dir_all(&base_dir).map_err(|e| e.to_string())?;
    let config_path = base_dir.join("copytranslator.json");
    migrate_legacy_config(app, &config_path)?;
    Ok(config_path)
}

#[tauri::command]
fn read_config(app: tauri::AppHandle) -> Result<String, String> {
    let path = get_config_path(&app)?;
    if path.exists() {
        std::fs::read_to_string(path).map_err(|e| e.to_string())
    } else {
        Ok("{}".to_string())
    }
}

#[tauri::command]
fn write_config(app: tauri::AppHandle, content: String) -> Result<(), String> {
    let path = get_config_path(&app)?;
    std::fs::write(path, content).map_err(|e| e.to_string())
}

fn open_system_path(path: PathBuf) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        let path_arg = path.to_string_lossy().to_string();
        std::process::Command::new("cmd")
            .args(["/C", "start", "", path_arg.as_str()])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn open_config_file(app: tauri::AppHandle) -> Result<(), String> {
    let path = get_config_path(&app)?;
    if !path.exists() {
        std::fs::write(&path, "{}").map_err(|e| e.to_string())?;
    }
    open_system_path(path)
}

#[tauri::command]
fn open_config_folder(app: tauri::AppHandle) -> Result<(), String> {
    let path = get_config_path(&app)?;
    let folder = path
        .parent()
        .ok_or_else(|| "config folder not found".to_string())?
        .to_path_buf();
    open_system_path(folder)
}

#[tauri::command]
fn set_listen_clipboard(listen: bool) {
    // The clipboard monitor runs on a background thread. Release/acquire keeps
    // the user's latest listen state visible across that thread boundary.
    LISTEN_CLIPBOARD.store(listen, Ordering::Release);
}

#[tauri::command]
fn set_window_opacity(window: tauri::Window, opacity: f64) -> Result<(), String> {
    let opacity = if opacity.is_finite() { opacity } else { 1.0 };
    let opacity = opacity.clamp(MIN_LINUX_WINDOW_OPACITY, 1.0);

    #[cfg(target_os = "linux")]
    {
        use gtk::prelude::WidgetExt;

        let gtk_window = window.gtk_window().map_err(|e| e.to_string())?;
        gtk_window.set_opacity(opacity);
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = window;
        let _ = opacity;
    }

    Ok(())
}

#[tauri::command]
fn set_window_always_on_top(window: tauri::Window, stay_top: bool) -> Result<(), String> {
    let tauri_result = window.set_always_on_top(stay_top);

    #[cfg(target_os = "linux")]
    {
        use gtk::prelude::GtkWindowExt;

        if let Ok(gtk_window) = window.gtk_window() {
            gtk_window.set_keep_above(stay_top);
        }

        apply_kde_keep_above_fallback(stay_top);

        if tauri_result.is_err() {
            return Ok(());
        }
    }

    tauri_result.map_err(|e| e.to_string())
}

#[cfg(target_os = "linux")]
fn apply_kde_keep_above_fallback(stay_top: bool) {
    let desktop = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default();
    if !desktop.to_ascii_lowercase().contains("kde") {
        return;
    }

    let pid = std::process::id();
    let script = format!(
        r#"
const targetPid = {pid};
const stayTop = {stay_top};

function allWindows() {{
  if (typeof workspace.windowList === "function") {{
    return workspace.windowList();
  }}
  if (typeof workspace.clientList === "function") {{
    return workspace.clientList();
  }}
  return [];
}}

for (const window of allWindows()) {{
  const caption = String(window.caption || "");
  const resourceClass = String(window.resourceClass || "").toLowerCase();
  const resourceName = String(window.resourceName || "").toLowerCase();
  if (
    window.pid === targetPid ||
    caption.indexOf("CopyTranslator") !== -1 ||
    resourceClass.indexOf("copytranslator") !== -1 ||
    resourceName.indexOf("copytranslator") !== -1
  ) {{
    window.keepAbove = stayTop;
  }}
}}
"#,
        pid = pid,
        stay_top = if stay_top { "true" } else { "false" }
    );

    let script_path = std::env::temp_dir().join(format!("copytranslator-keep-above-{}.js", pid));
    if std::fs::write(&script_path, script).is_err() {
        return;
    }

    for program in ["qdbus6", "qdbus"] {
        let Ok(output) = std::process::Command::new(program)
            .arg("org.kde.KWin")
            .arg("/Scripting")
            .arg("org.kde.kwin.Scripting.loadScript")
            .arg(&script_path)
            .output()
        else {
            continue;
        };
        if !output.status.success() {
            continue;
        }
        let script_id = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if script_id.is_empty() {
            continue;
        }
        let candidate_paths = [
            format!("/Scripting/Script{}", script_id),
            format!("/{}", script_id),
        ];
        for script_object in candidate_paths {
            let _ = std::process::Command::new(program)
                .arg("org.kde.KWin")
                .arg(script_object)
                .arg("org.kde.kwin.Script.run")
                .output();
        }
        break;
    }

    let _ = std::fs::remove_file(script_path);
}

#[derive(Deserialize)]
struct ShortcutRegistration {
    id: String,
    accelerator: String,
}

#[derive(Serialize)]
struct ShortcutRegistrationResult {
    id: String,
    accelerator: String,
    ok: bool,
    error: Option<String>,
}

#[derive(Clone, Serialize)]
struct ShortcutTrigger {
    id: String,
    accelerator: String,
}

#[tauri::command]
fn configure_global_shortcuts(
    app: tauri::AppHandle,
    shortcuts: Vec<ShortcutRegistration>,
) -> Result<Vec<ShortcutRegistrationResult>, String> {
    let manager = app.global_shortcut();
    manager.unregister_all().map_err(|e| e.to_string())?;

    let mut results = Vec::with_capacity(shortcuts.len());
    for shortcut in shortcuts {
        let id = shortcut.id.trim().to_string();
        let accelerator = shortcut.accelerator.trim().to_string();
        if id.is_empty() || accelerator.is_empty() {
            continue;
        }

        let event_payload = ShortcutTrigger {
            id: id.clone(),
            accelerator: accelerator.clone(),
        };
        let register_result = manager.on_shortcut(accelerator.as_str(), move |app, _, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app.emit("global-shortcut", event_payload.clone());
            }
        });

        match register_result {
            Ok(()) => results.push(ShortcutRegistrationResult {
                id,
                accelerator,
                ok: true,
                error: None,
            }),
            Err(err) => results.push(ShortcutRegistrationResult {
                id,
                accelerator,
                ok: false,
                error: Some(err.to_string()),
            }),
        }
    }

    Ok(results)
}

#[derive(Serialize, Deserialize)]
struct ProxyRequest {
    url: String,
    method: String,
    headers: HashMap<String, String>,
    body: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct ProxyResponse {
    status: u16,
    body: String,
    final_url: String,
}

#[derive(Deserialize)]
struct BaiduOcrConfig {
    app_id: String,
    api_key: String,
    secret_key: String,
}

#[derive(Deserialize)]
struct BaiduTokenResponse {
    access_token: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

#[derive(Deserialize)]
struct BaiduOcrWord {
    words: String,
}

#[derive(Deserialize)]
struct BaiduOcrResponse {
    words_result: Option<Vec<BaiduOcrWord>>,
    error_code: Option<u64>,
    error_msg: Option<String>,
}

#[tauri::command]
async fn fetch_http_proxy(req: ProxyRequest) -> Result<ProxyResponse, String> {
    validate_http_url(&req.url)?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let method = req.method.to_uppercase();
    let mut builder = match method.as_str() {
        "HEAD" => client.head(&req.url),
        "POST" => client.post(&req.url),
        "PUT" => client.put(&req.url),
        "DELETE" => client.delete(&req.url),
        _ => client.get(&req.url),
    };

    for (k, v) in req.headers {
        builder = builder.header(k, v);
    }

    if let Some(body_str) = req.body {
        builder = builder.body(body_str);
    }

    let res = builder.send().await.map_err(|e| e.to_string())?;
    let status = res.status().as_u16();
    let final_url = res.url().to_string();
    let body = if method == "HEAD" {
        String::new()
    } else {
        res.text().await.map_err(|e| e.to_string())?
    };

    Ok(ProxyResponse {
        status,
        body,
        final_url,
    })
}

fn validate_http_url(raw_url: &str) -> Result<&str, String> {
    let url = raw_url.trim();
    if url.is_empty() || url != raw_url {
        return Err("invalid URL".to_string());
    }

    let lower_url = url.to_ascii_lowercase();
    if !lower_url.starts_with("http://") && !lower_url.starts_with("https://") {
        return Err("only http and https URLs are allowed".to_string());
    }

    if url.chars().any(|ch| ch.is_control() || ch.is_whitespace()) {
        return Err("URL contains unsupported characters".to_string());
    }

    Ok(url)
}

fn strip_data_url_prefix(image: &str) -> &str {
    match image.split_once(',') {
        Some((_, data)) => data,
        None => image,
    }
}

async fn get_baidu_access_token(
    client: &reqwest::Client,
    config: &BaiduOcrConfig,
) -> Result<String, String> {
    let response = client
        .post("https://aip.baidubce.com/oauth/2.0/token")
        .form(&[
            ("grant_type", "client_credentials"),
            ("client_id", config.api_key.as_str()),
            ("client_secret", config.secret_key.as_str()),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = response.status();
    let token_response = response
        .json::<BaiduTokenResponse>()
        .await
        .map_err(|e| e.to_string())?;

    if let Some(token) = token_response.access_token {
        return Ok(token);
    }

    let message = token_response
        .error_description
        .or(token_response.error)
        .unwrap_or_else(|| format!("HTTP {}", status));
    Err(format!("failed to get Baidu OCR token: {}", message))
}

#[tauri::command]
async fn baidu_ocr(
    image: String,
    config: BaiduOcrConfig,
    language_type: String,
) -> Result<String, String> {
    if config.app_id.trim().is_empty()
        || config.api_key.trim().is_empty()
        || config.secret_key.trim().is_empty()
    {
        return Err("Baidu OCR config is incomplete".to_string());
    }

    let client = reqwest::Client::new();
    let token = get_baidu_access_token(&client, &config).await?;
    let image_base64 = strip_data_url_prefix(&image);
    let url = format!(
        "https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token={}",
        token
    );

    let response = client
        .post(url)
        .form(&[
            ("image", image_base64),
            ("language_type", language_type.as_str()),
            ("detect_language", "true"),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = response.status();
    let ocr_response = response
        .json::<BaiduOcrResponse>()
        .await
        .map_err(|e| e.to_string())?;

    if let Some(words) = ocr_response.words_result {
        let text = words
            .into_iter()
            .map(|item| item.words)
            .collect::<Vec<_>>()
            .join("\n");
        return Ok(text);
    }

    let message = ocr_response
        .error_msg
        .unwrap_or_else(|| format!("HTTP {}", status));
    Err(format!(
        "Baidu OCR failed{}: {}",
        ocr_response
            .error_code
            .map(|code| format!(" ({})", code))
            .unwrap_or_default(),
        message
    ))
}

#[tauri::command]
fn simulate_copy() -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdotool")
            .args(&["key", "ctrl+c"])
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("osascript")
            .args(&[
                "-e",
                "tell application \"System Events\" to keystroke \"c\" using {command down}",
            ])
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("powershell")
            .args(&["-Command", "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^c')"])
            .output()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn simulate_paste() -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdotool")
            .args(&["key", "ctrl+v"])
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("osascript")
            .args(&[
                "-e",
                "tell application \"System Events\" to keystroke \"v\" using {command down}",
            ])
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("powershell")
            .args(&["-Command", "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"])
            .output()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn open_url(raw_url: String) -> Result<(), String> {
    let url = validate_http_url(&raw_url)?;

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("rundll32")
            .args(["url.dll,FileProtocolHandler", url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn image_data_to_png_data_url(image: arboard::ImageData<'_>) -> Result<String, String> {
    let width = image.width as u32;
    let height = image.height as u32;
    let rgba = RgbaImage::from_raw(width, height, image.bytes.into_owned())
        .ok_or_else(|| "invalid clipboard image buffer".to_string())?;
    let mut png = Cursor::new(Vec::new());
    DynamicImage::ImageRgba8(rgba)
        .write_to(&mut png, ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    let encoded = general_purpose::STANDARD.encode(png.into_inner());
    Ok(format!("data:image/png;base64,{}", encoded))
}

fn hash_clipboard_image(image: &arboard::ImageData<'_>) -> u64 {
    let mut hasher = DefaultHasher::new();
    image.width.hash(&mut hasher);
    image.height.hash(&mut hasher);
    image.bytes.hash(&mut hasher);
    hasher.finish()
}

#[tauri::command]
fn read_clipboard_image() -> Result<Option<String>, String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    match clipboard.get_image() {
        Ok(image) => image_data_to_png_data_url(image).map(Some),
        Err(_) => Ok(None),
    }
}

#[tauri::command]
fn read_clipboard_text() -> Result<Option<String>, String> {
    Ok(read_clipboard_text_inner())
}

fn read_clipboard_text_inner() -> Option<String> {
    if let Ok(mut clipboard) = Clipboard::new() {
        match clipboard.get_text() {
            Ok(text) if !text.is_empty() => return Some(text),
            Ok(_) | Err(_) => {}
        }
    }

    read_clipboard_text_fallback()
}

#[cfg(target_os = "linux")]
fn read_clipboard_text_fallback() -> Option<String> {
    for (program, args) in [
        ("wl-paste", vec!["--no-newline"]),
        ("xclip", vec!["-selection", "clipboard", "-o"]),
        ("xsel", vec!["--clipboard", "--output"]),
        (
            "qdbus6",
            vec![
                "org.kde.klipper",
                "/klipper",
                "org.kde.klipper.klipper.getClipboardContents",
            ],
        ),
        (
            "qdbus",
            vec![
                "org.kde.klipper",
                "/klipper",
                "org.kde.klipper.klipper.getClipboardContents",
            ],
        ),
    ] {
        if let Some(text) = command_text_output(program, &args) {
            return Some(text);
        }
    }

    None
}

#[cfg(target_os = "macos")]
fn read_clipboard_text_fallback() -> Option<String> {
    command_text_output("pbpaste", &[])
}

#[cfg(target_os = "windows")]
fn read_clipboard_text_fallback() -> Option<String> {
    command_text_output(
        "powershell",
        &["-NoProfile", "-Command", "Get-Clipboard -Raw"],
    )
}

#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
fn read_clipboard_text_fallback() -> Option<String> {
    None
}

fn command_text_output(program: &str, args: &[&str]) -> Option<String> {
    let output = std::process::Command::new(program)
        .args(args)
        .output()
        .ok()?;
    if !output.status.success() || output.stdout.is_empty() {
        return None;
    }
    let text = String::from_utf8(output.stdout).ok()?;
    let text = text.trim_end_matches(['\r', '\n']).to_string();
    if text.is_empty() {
        None
    } else {
        Some(text)
    }
}

fn command_output(program: &str, args: &[&str]) -> Result<Option<String>, String> {
    let output = match std::process::Command::new(program).args(args).output() {
        Ok(output) => output,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };

    if !output.status.success() {
        return Ok(None);
    }

    let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if name.is_empty() {
        Ok(None)
    } else {
        Ok(Some(name))
    }
}

#[tauri::command]
fn get_active_window_name() -> Result<Option<String>, String> {
    #[cfg(target_os = "linux")]
    {
        return command_output("xdotool", &["getwindowfocus", "getwindowname"]);
    }

    #[cfg(target_os = "macos")]
    {
        return command_output(
            "osascript",
            &[
                "-e",
                "tell application \"System Events\" to get name of first application process whose frontmost is true",
            ],
        );
    }

    #[cfg(target_os = "windows")]
    {
        return command_output(
            "powershell",
            &[
                "-NoProfile",
                "-Command",
                "$sig='[DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\"user32.dll\")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);'; Add-Type -MemberDefinition $sig -Name Win32Window -Namespace Native; $b=New-Object System.Text.StringBuilder 512; [void][Native.Win32Window]::GetWindowText([Native.Win32Window]::GetForegroundWindow(), $b, $b.Capacity); $b.ToString()",
            ],
        );
    }

    #[allow(unreachable_code)]
    Ok(None)
}

fn start_clipboard_monitor(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let mut last_text = String::new();
        let mut last_image_hash = 0;

        loop {
            std::thread::sleep(Duration::from_millis(CLIPBOARD_POLL_INTERVAL_MS));

            if !LISTEN_CLIPBOARD.load(Ordering::Acquire) {
                continue;
            }

            if let Some(text) = read_clipboard_text_inner() {
                if text != last_text {
                    last_text = text.clone();
                    let _ = app_handle.emit("clipboard-changed", text);
                }
            } else {
                last_text.clear();
            }

            if let Ok(mut clipboard) = Clipboard::new() {
                if let Ok(image) = clipboard.get_image() {
                    let image_hash = hash_clipboard_image(&image);
                    if image_hash != last_image_hash {
                        last_image_hash = image_hash;
                        if let Ok(data_url) = image_data_to_png_data_url(image) {
                            let _ = app_handle.emit("clipboard-image-changed", data_url);
                        }
                    }
                }
            }
        }
    });
}

fn apply_main_window_icon(app: &tauri::App) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    let Some(icon) = app.default_window_icon().cloned() else {
        return;
    };

    if let Err(error) = window.set_icon(icon) {
        eprintln!("Failed to set main window icon: {}", error);
    }

    #[cfg(target_os = "linux")]
    {
        use gtk::prelude::GtkWindowExt;

        if let Ok(gtk_window) = window.gtk_window() {
            gtk_window.set_icon_name(Some("copytranslator"));
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_handle = app.handle().clone();
            start_clipboard_monitor(app_handle);
            apply_main_window_icon(app);

            // Tray setup
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_listen_clipboard,
            set_window_opacity,
            set_window_always_on_top,
            configure_global_shortcuts,
            fetch_http_proxy,
            simulate_copy,
            simulate_paste,
            read_config,
            write_config,
            open_config_file,
            open_config_folder,
            open_url,
            read_clipboard_text,
            read_clipboard_image,
            baidu_ocr,
            get_active_window_name
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
