package expo.modules.vocabapplock

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView

class VocabAppLockActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val prefs = getSharedPreferences(VocabAppLockModule.PREFS, Context.MODE_PRIVATE)
    val prompt = prefs.getString(VocabAppLockModule.KEY_PROMPT, "") ?: ""
    val answer = prefs.getString(VocabAppLockModule.KEY_ANSWER, "") ?: ""
    val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setPadding(36, 36, 36, 36); setBackgroundColor(Color.rgb(246, 247, 251)) }
    val title = TextView(this).apply { text = "先完成一題單字"; textSize = 25f; setTextColor(Color.rgb(31,41,67)); gravity = Gravity.CENTER; setTypeface(typeface, 1) }
    val subtitle = TextView(this).apply { text = "答對後即可繼續使用此 App"; textSize = 15f; setTextColor(Color.rgb(102,114,143)); gravity = Gravity.CENTER; setPadding(0,12,0,28) }
    val question = TextView(this).apply { text = prompt; textSize = 28f; setTextColor(Color.rgb(31,41,67)); gravity = Gravity.CENTER; setPadding(20,40,20,40); background = rounded(Color.WHITE, Color.rgb(223,227,238)) }
    val input = EditText(this).apply { hint = "輸入英文單字"; textSize = 18f; setSingleLine(); setPadding(20,0,20,0); background = rounded(Color.WHITE, Color.rgb(223,227,238)) }
    val feedback = TextView(this).apply { textSize = 14f; gravity = Gravity.CENTER; setPadding(0,12,0,12) }
    val submit = Button(this).apply { text = "解除鎖定"; setTextColor(Color.WHITE); setBackgroundColor(Color.rgb(66,85,255)) }
    submit.setOnClickListener { if (input.text.toString().trim().equals(answer.trim(), true)) { prefs.edit().putLong(VocabAppLockModule.KEY_COOLDOWN_UNTIL, System.currentTimeMillis() + prefs.getInt(VocabAppLockModule.KEY_COOLDOWN_MINUTES,15) * 60_000L).apply(); finish() } else { feedback.text = "還差一點，再試一次。"; feedback.setTextColor(Color.rgb(190,55,75)) } }
    root.addView(title); root.addView(subtitle); root.addView(question, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)); root.addView(input, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 56).apply { topMargin = 20 }); root.addView(feedback); root.addView(submit, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 56)); setContentView(root)
  }
  private fun rounded(fill: Int, stroke: Int) = GradientDrawable().apply { setColor(fill); cornerRadius = 12f; setStroke(2, stroke) }
}
