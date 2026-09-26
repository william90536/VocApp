package expo.modules.vocabapplock

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

class VocabAppLockAccessibilityService : AccessibilityService() {
  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val packageName = event.packageName?.toString() ?: return
    if (packageName == applicationContext.packageName) return
    val prefs = getSharedPreferences(VocabAppLockModule.PREFS, Context.MODE_PRIVATE)
    val protected = prefs.getStringSet(VocabAppLockModule.KEY_PACKAGES, emptySet()) ?: emptySet()
    if (!protected.contains(packageName) || System.currentTimeMillis() < prefs.getLong(VocabAppLockModule.KEY_COOLDOWN_UNTIL, 0)) return
    val prompt = prefs.getString(VocabAppLockModule.KEY_PROMPT, "") ?: ""
    val answer = prefs.getString(VocabAppLockModule.KEY_ANSWER, "") ?: ""
    if (prompt.isBlank() || answer.isBlank()) return
    startActivity(Intent(this, VocabAppLockActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      putExtra(VocabAppLockActivity.EXTRA_PACKAGE, packageName)
    })
  }

  override fun onInterrupt() = Unit

  companion object {
    fun isEnabled(context: Context): Boolean {
      val expected = ComponentName(context, VocabAppLockAccessibilityService::class.java).flattenToString()
      val enabled = android.provider.Settings.Secure.getString(context.contentResolver, android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: ""
      return enabled.split(':').any { it.equals(expected, ignoreCase = true) }
    }
  }
}
