package expo.modules.vocabapplock

import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VocabAppLockModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VocabAppLock")

    Function("setConfig") { config: Map<String, Any?> ->
      val context = appContext.reactContext ?: return@Function null
      val packages = (config["packageNames"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
      val cooldown = (config["cooldownMinutes"] as? Number)?.toInt() ?: 15
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        .putStringSet(KEY_PACKAGES, packages.toSet())
        .putInt(KEY_COOLDOWN_MINUTES, cooldown.coerceIn(1, 120))
        .putString(KEY_PROMPT, config["prompt"] as? String ?: "")
        .putString(KEY_ANSWER, config["answer"] as? String ?: "")
        .apply()
    }

    Function("getStatus") {
      val context = appContext.reactContext ?: return@Function mapOf("serviceEnabled" to false, "cooldownUntil" to 0)
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      mapOf("serviceEnabled" to VocabAppLockAccessibilityService.isEnabled(context), "cooldownUntil" to prefs.getLong(KEY_COOLDOWN_UNTIL, 0))
    }

    Function("openAccessibilitySettings") {
      val context = appContext.reactContext ?: return@Function null
      context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      true
    }
  }

  companion object {
    const val PREFS = "vocab_app_lock"
    const val KEY_PACKAGES = "packages"
    const val KEY_COOLDOWN_MINUTES = "cooldown_minutes"
    const val KEY_COOLDOWN_UNTIL = "cooldown_until"
    const val KEY_PROMPT = "prompt"
    const val KEY_ANSWER = "answer"
  }
}
