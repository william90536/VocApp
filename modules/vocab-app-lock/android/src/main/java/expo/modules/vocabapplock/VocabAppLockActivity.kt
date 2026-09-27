package expo.modules.vocabapplock

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

class VocabAppLockActivity : Activity() {
  companion object {
    const val EXTRA_PACKAGE = "protected_package"
  }

  private lateinit var answerInput: EditText
  private lateinit var feedback: TextView

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)

    val prefs = getSharedPreferences(VocabAppLockModule.PREFS, Context.MODE_PRIVATE)
    val prompt = prefs.getString(VocabAppLockModule.KEY_PROMPT, "") ?: ""
    val answer = prefs.getString(VocabAppLockModule.KEY_ANSWER, "") ?: ""
    val page = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(dp(25), dp(30), dp(25), dp(30))
      setBackgroundColor(Color.rgb(244, 246, 250))
    }

    page.addView(TextView(this).apply {
      text = "先答一題，再繼續"
      textSize = 25f
      setTextColor(Color.rgb(23, 34, 59))
      typeface = Typeface.DEFAULT_BOLD
      gravity = Gravity.CENTER
    }, matchWidth())

    page.addView(TextView(this).apply {
      text = "拼出這個中文意思的英文單字，即可暫時解鎖。"
      textSize = 15f
      setTextColor(Color.rgb(101, 113, 138))
      gravity = Gravity.CENTER
      setPadding(0, dp(9), 0, dp(23))
    }, matchWidth())

    page.addView(TextView(this).apply {
      text = prompt
      textSize = 27f
      setTextColor(Color.rgb(23, 34, 59))
      typeface = Typeface.DEFAULT_BOLD
      gravity = Gravity.CENTER
      setPadding(dp(18), dp(28), dp(18), dp(28))
      background = rounded(Color.WHITE, Color.rgb(225, 230, 239))
    }, matchWidth())

    answerInput = EditText(this).apply {
      hint = "輸入英文單字"
      textSize = 18f
      isSingleLine = true
      inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
      imeOptions = EditorInfo.IME_ACTION_DONE
      setPadding(dp(16), 0, dp(16), 0)
      setTextColor(Color.rgb(23, 34, 59))
      background = rounded(Color.WHITE, Color.rgb(225, 230, 239))
    }
    page.addView(answerInput, LinearLayout.LayoutParams(-1, dp(56)).apply { topMargin = dp(16) })

    feedback = TextView(this).apply {
      textSize = 14f
      gravity = Gravity.CENTER
      setTextColor(Color.rgb(101, 113, 138))
      setPadding(0, dp(10), 0, dp(10))
    }
    page.addView(feedback, matchWidth())

    page.addView(Button(this).apply {
      text = "確認答案"
      textSize = 16f
      setTextColor(Color.WHITE)
      isAllCaps = false
      background = rounded(Color.rgb(64, 86, 232), Color.rgb(64, 86, 232))
      setOnClickListener { submitAnswer(answer, prefs) }
    }, LinearLayout.LayoutParams(-1, dp(54)))

    answerInput.setOnEditorActionListener { _, actionId, _ ->
      if (actionId == EditorInfo.IME_ACTION_DONE) {
        submitAnswer(answer, prefs)
        true
      } else false
    }

    val scroll = ScrollView(this).apply { addView(page) }
    setContentView(scroll)

  }

  @Deprecated("Deprecated in Android")
  override fun onBackPressed() {
    feedback.text = "請先答對單字，再返回使用這個 App。"
    feedback.setTextColor(Color.rgb(184, 62, 80))
  }

  private fun submitAnswer(answer: String, prefs: android.content.SharedPreferences) {
    if (answerInput.text.toString().trim().equals(answer.trim(), ignoreCase = true)) {
      val minutes = prefs.getInt(VocabAppLockModule.KEY_COOLDOWN_MINUTES, 15).coerceIn(1, 120)
      prefs.edit().putLong(VocabAppLockModule.KEY_COOLDOWN_UNTIL, System.currentTimeMillis() + minutes * 60_000L).apply()
      finish()
    } else {
      feedback.text = "答案不太一樣，再試一次。"
      feedback.setTextColor(Color.rgb(184, 62, 80))
      answerInput.selectAll()
    }
  }

  private fun rounded(fill: Int, stroke: Int) = GradientDrawable().apply {
    setColor(fill)
    cornerRadius = dp(13).toFloat()
    setStroke(dp(1), stroke)
  }

  private fun matchWidth() = LinearLayout.LayoutParams(-1, LinearLayout.LayoutParams.WRAP_CONTENT)
  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
