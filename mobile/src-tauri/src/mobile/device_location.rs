//! Deteksi lokasi palsu (aplikasi Fake GPS) untuk laporan driver, PRD §6.2.
//!
//! Modul ini SENGAJA berada di luar daftar salin `sync-rust-modules.ts`:
//! command-nya hanya ada di biner Mobile (aturan 27, awalan `mobile_`).
//!
//! WebView tidak bisa membedakan lokasi palsu dari yang asli, tetapi Android
//! menandai setiap `Location` dari penyedia uji (`setTestProviderLocation`,
//! dipakai aplikasi pemalsu GPS): `Location.isMock()` di Android 12+, dan
//! `isFromMockProvider()` di bawahnya. Fix yang baru saja dipakai WebView
//! dibaca ulang lewat `LocationManager.getLastKnownLocation` untuk penyedia
//! `gps`, `network`, dan `fused`. Hasilnya hanya tanda tinjau, tidak pernah
//! menolak laporan: GPS di gudang sering meleset dan tanda ini bisa keliru.
//!
//! JNI dijalankan di thread WebView lewat `jni_handle().exec` milik Tauri,
//! jadi tidak ada Kotlin (folder `gen/` di-gitignore) dan tidak ada akses
//! `Context` di luar yang sudah disediakan Tauri.

use serde_json::{json, Value};
use tauri::State;

use super::commands::require_permission;
use super::config::MobileState;
use super::models::CommandError;

/// Fix yang lebih tua dari ini tidak mewakili laporan yang sedang dibuat.
/// Dipanggil tepat setelah WebView mendapat koordinat, jadi umurnya detik.
pub const MAKS_UMUR_FIX_NS: i64 = 120_000_000_000;

/// Vonis dari fix yang terbaca: `(umur_ns, palsu)` per penyedia.
/// `None` = tidak ada fix baru yang bisa diperiksa (tidak diperiksa).
pub fn vonis_lokasi_palsu(fix: &[(i64, bool)], maks_umur_ns: i64) -> Option<bool> {
    let baru: Vec<bool> = fix
        .iter()
        .filter(|(umur, _)| (0..=maks_umur_ns).contains(umur))
        .map(|(_, palsu)| *palsu)
        .collect();
    if baru.is_empty() {
        None
    } else {
        Some(baru.contains(&true))
    }
}

#[cfg(target_os = "android")]
fn baca_fix(
    env: &mut jni::JNIEnv<'_>,
    activity: &jni::objects::JObject<'_>,
) -> jni::errors::Result<Vec<(i64, bool)>> {
    let sdk = env
        .get_static_field("android/os/Build$VERSION", "SDK_INT", "I")?
        .i()?;
    let nama_layanan = env.new_string("location")?;
    let manager = env
        .call_method(
            activity,
            "getSystemService",
            "(Ljava/lang/String;)Ljava/lang/Object;",
            &[(&nama_layanan).into()],
        )?
        .l()?;
    if manager.is_null() {
        return Ok(Vec::new());
    }
    let sekarang = env
        .call_static_method("android/os/SystemClock", "elapsedRealtimeNanos", "()J", &[])?
        .j()?;
    let mut hasil = Vec::new();
    for penyedia in ["gps", "network", "fused"] {
        let nama = env.new_string(penyedia)?;
        // Penyedia yang tidak ada (fused di bawah Android 12) atau izin lokasi
        // yang dicabut melempar exception: lewati penyedia itu saja.
        let lokasi = match env.call_method(
            &manager,
            "getLastKnownLocation",
            "(Ljava/lang/String;)Landroid/location/Location;",
            &[(&nama).into()],
        ) {
            Ok(nilai) => nilai.l()?,
            Err(_) => {
                env.exception_clear()?;
                continue;
            }
        };
        if lokasi.is_null() {
            continue;
        }
        // Jam monotonik sejak boot: tidak ikut berubah bila jam HP diubah.
        let waktu = env
            .call_method(&lokasi, "getElapsedRealtimeNanos", "()J", &[])?
            .j()?;
        let metode = if sdk >= 31 { "isMock" } else { "isFromMockProvider" };
        let palsu = env.call_method(&lokasi, metode, "()Z", &[])?.z()?;
        hasil.push((sekarang - waktu, palsu));
    }
    Ok(hasil)
}

#[cfg(target_os = "android")]
async fn periksa_android(app: &tauri::AppHandle) -> Option<bool> {
    use std::sync::mpsc;
    use std::time::Duration;
    use tauri::Manager;

    let jendela = app.webview_windows().into_values().next()?;
    let (kirim, terima) = mpsc::channel::<Option<Vec<(i64, bool)>>>();
    jendela
        .with_webview(move |webview| {
            webview.jni_handle().exec(move |env, activity, _webview| {
                let fix = match baca_fix(env, activity) {
                    Ok(fix) => Some(fix),
                    Err(_) => {
                        let _ = env.exception_clear();
                        None
                    }
                };
                let _ = kirim.send(fix);
            });
        })
        .ok()?;
    let fix = tauri::async_runtime::spawn_blocking(move || {
        terima.recv_timeout(Duration::from_secs(3)).ok().flatten()
    })
    .await
    .ok()??;
    vonis_lokasi_palsu(&fix, MAKS_UMUR_FIX_NS)
}

/// `{ diperiksa, palsu }`. `diperiksa: false` = tidak ada fix baru yang bisa
/// dibaca (atau bukan Android); laporan tetap dikirim tanpa vonis.
#[tauri::command]
pub async fn mobile_location_is_mock(
    app: tauri::AppHandle,
    state: State<'_, MobileState>,
) -> Result<Value, CommandError> {
    require_permission(&state, "trip.report")?;
    #[cfg(target_os = "android")]
    let vonis = periksa_android(&app).await;
    #[cfg(not(target_os = "android"))]
    let vonis: Option<bool> = {
        let _ = &app;
        None
    };
    Ok(json!({ "diperiksa": vonis.is_some(), "palsu": vonis == Some(true) }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn vonis_dari_fix_yang_baru_saja() {
        let detik = 1_000_000_000;
        assert_eq!(vonis_lokasi_palsu(&[], MAKS_UMUR_FIX_NS), None);
        assert_eq!(vonis_lokasi_palsu(&[(5 * detik, false)], MAKS_UMUR_FIX_NS), Some(false));
        // Satu penyedia palsu sudah cukup (Fake GPS biasanya memalsukan gps saja).
        assert_eq!(
            vonis_lokasi_palsu(&[(5 * detik, false), (3 * detik, true)], MAKS_UMUR_FIX_NS),
            Some(true)
        );
        // Fix lama atau umur negatif (jam tidak masuk akal) tidak dinilai.
        assert_eq!(vonis_lokasi_palsu(&[(600 * detik, true)], MAKS_UMUR_FIX_NS), None);
        assert_eq!(vonis_lokasi_palsu(&[(-detik, true)], MAKS_UMUR_FIX_NS), None);
    }
}
