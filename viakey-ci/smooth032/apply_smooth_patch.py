from pathlib import Path

ROOT = Path("/tmp/viakey-build")
JAVA = ROOT / "app/src/main/java/com/mova/viakey"

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"Patch failed [{label}]")
    return text.replace(old, new, 1)

# Version / clean side-by-side package.
p = ROOT / "app/build.gradle.kts"
s = p.read_text()
s = s.replace('versionCode = 11', 'versionCode = 12')
s = s.replace('versionName = "0.3.1"', 'versionName = "0.3.2"')
s = s.replace('applicationIdSuffix = ".agent031"', 'applicationIdSuffix = ".smooth032"')
s = s.replace('versionNameSuffix = "-agent"', 'versionNameSuffix = "-smooth"')
s = s.replace('ViaKey AI Agent 0.3.1', 'ViaKey AI Smooth 0.3.2')
p.write_text(s)

# Typing Agent: do not run a second correction pass on every key.
p = JAVA / "TypingAgent.kt"
s = p.read_text()
old = '''    fun suggestions(
        context: Context,
        prefix: String,
        previous: String,
        tag: String,
        limit: Int = 8
    ): List<String> {
        val base = SuggestionEngine.suggest(context, prefix, previous, tag, limit + 4)
        if (prefix.isBlank()) return base.take(limit)

        val decision = decideCorrection(context, prefix, previous, tag)
        val out = ArrayList<String>(limit + 2)
        if (decision.shouldApply && !decision.correction.isNullOrBlank()) out += decision.correction
        out += base
        if (!decision.shouldApply) out += prefix
        return out.distinctBy(::normalize).take(limit)
    }
'''
new = '''    fun suggestions(
        context: Context,
        prefix: String,
        previous: String,
        tag: String,
        limit: Int = 8
    ): List<String> {
        // Live typing must never perform a second full correction pass.
        // SmartCore already ranks typo-aware candidates. The expensive
        // confidence decision is reserved for word commit (space).
        val base = SuggestionEngine.suggest(context, prefix, previous, tag, limit + 2)
        if (prefix.isBlank()) return base.take(limit)
        if (looksProtected(prefix)) {
            return (listOf(prefix) + base).distinctBy(::normalize).take(limit)
        }
        return base.distinctBy(::normalize).take(limit)
    }
'''
s = must_replace(s, old, new, "typing-agent-live-pass")
p.write_text(s)

# SmartCore: cache SharedPreferences counters and trim live candidate work.
p = JAVA / "SuggestionEngine.kt"
s = p.read_text()
if 'private val counterCache' not in s:
    s = s.replace(
        '    private val cache = HashMap<String, LanguageData>()',
        '    private val cache = HashMap<String, LanguageData>()\n    private val counterCache = HashMap<String, Map<String, Int>>()'
    )
s = s.replace('.take(1200).forEach { e ->', '.take(650).forEach { e ->')
s = s.replace('val scored = correctionPool(d, clean).asSequence().take(1800)', 'val scored = correctionPool(d, clean).asSequence().take(900)')
s = s.replace('.take(120)\n            .forEach { e ->', '.take(80)\n            .forEach { e ->')
old = '''    private fun loadCounter(context: Context, key: String): Map<String, Int> {
        val raw=context.getSharedPreferences(LEARNING_FILE,Context.MODE_PRIVATE).getString(key,"").orEmpty()
        if(raw.isBlank()) return emptyMap()
        val out=LinkedHashMap<String,Int>()
        raw.lineSequence().forEach { line ->
            val tab=line.lastIndexOf('\t'); if(tab<=0) return@forEach
            val token=line.substring(0,tab); val count=line.substring(tab+1).toIntOrNull() ?: return@forEach
            if(token.isNotBlank()) out[token]=count
        }
        return out
    }

    private fun saveCounter(context: Context,key:String,map:Map<String,Int>) {
        val raw=map.entries.joinToString("\n") { "${it.key}\t${it.value}" }
        context.getSharedPreferences(LEARNING_FILE,Context.MODE_PRIVATE).edit().putString(key,raw).apply()
    }
'''
new = '''    private fun loadCounter(context: Context, key: String): Map<String, Int> = synchronized(counterCache) {
        counterCache[key] ?: run {
            val raw=context.getSharedPreferences(LEARNING_FILE,Context.MODE_PRIVATE).getString(key,"").orEmpty()
            val parsed = if(raw.isBlank()) emptyMap() else LinkedHashMap<String,Int>().also { out ->
                raw.lineSequence().forEach { line ->
                    val tab=line.lastIndexOf('\t'); if(tab<=0) return@forEach
                    val token=line.substring(0,tab); val count=line.substring(tab+1).toIntOrNull() ?: return@forEach
                    if(token.isNotBlank()) out[token]=count
                }
            }
            parsed.also { counterCache[key]=it }
        }
    }

    private fun saveCounter(context: Context,key:String,map:Map<String,Int>) {
        val snapshot=LinkedHashMap(map)
        synchronized(counterCache){ counterCache[key]=snapshot }
        val raw=snapshot.entries.joinToString("\n") { "${it.key}\t${it.value}" }
        context.getSharedPreferences(LEARNING_FILE,Context.MODE_PRIVATE).edit().putString(key,raw).apply()
    }
'''
s = must_replace(s, old, new, "counter-cache")
s = s.replace(
    'context.getSharedPreferences(LEARNING_FILE, Context.MODE_PRIVATE).edit().clear().apply()',
    'context.getSharedPreferences(LEARNING_FILE, Context.MODE_PRIVATE).edit().clear().apply()\n        synchronized(counterCache){ counterCache.clear() }'
)
p.write_text(s)

# Main screen/settings naming.
for name in ("MainActivity.kt","SettingsActivity.kt"):
    p = JAVA / name
    s = p.read_text().replace("0.3.1", "0.3.2")
    p.write_text(s)

# Service: live suggestion work moves off the IME/main thread.
p = JAVA / "ViaKeyService.kt"
s = p.read_text()
if 'java.util.concurrent.LinkedBlockingDeque' not in s:
    s = s.replace(
        'import kotlin.math.roundToInt',
        'import kotlin.math.roundToInt\nimport java.util.concurrent.LinkedBlockingDeque\nimport java.util.concurrent.ThreadPoolExecutor\nimport java.util.concurrent.TimeUnit'
    )

old_fields = '''    private var previewRunnable: Runnable? = null
    private var suggestionRunnable: Runnable? = null
    private var lastNavigationInsetBottom = 0
'''
new_fields = '''    private var previewRunnable: Runnable? = null
    private var suggestionRunnable: Runnable? = null
    private val suggestionExecutor = ThreadPoolExecutor(
        1, 1, 0L, TimeUnit.MILLISECONDS, LinkedBlockingDeque<Runnable>()
    )
    @Volatile private var suggestionCacheKey = ""
    @Volatile private var suggestionCacheWords: List<String> = emptyList()
    @Volatile private var suggestionPendingKey = ""
    private var suggestionGeneration = 0L
    private var keyPreviewView: TextView? = null
    private var lastNavigationInsetBottom = 0
'''
s = must_replace(s, old_fields, new_fields, "service-fields")

s = s.replace(
    '        keyPreviewPopup?.dismiss()\n        translator.close()',
    '        keyPreviewPopup?.dismiss()\n        suggestionExecutor.shutdownNow()\n        translator.close()'
)

old_words = '''        var words=when{
            manualSuggestions.isNotEmpty()->manualSuggestions
            prefix.isNotEmpty()&&Prefs.suggestions(this)->if(Prefs.typingAgent(this)) TypingAgent.suggestions(this,prefix,previousForPrefix,lang,8) else SuggestionEngine.suggest(this,prefix,previousForPrefix,lang,8)
            Prefs.nextWord(this)&&Prefs.suggestions(this)->if(Prefs.typingAgent(this)) TypingAgent.nextWords(this,lastWord(before),lang) else SuggestionEngine.nextWords(this,lastWord(before),lang)
            else->emptyList()
        }
'''
new_words = '''        var words=when{
            manualSuggestions.isNotEmpty()->manualSuggestions
            prefix.isNotEmpty()&&Prefs.suggestions(this)->liveSuggestions(prefix,previousForPrefix,lang,false)
            Prefs.nextWord(this)&&Prefs.suggestions(this)->liveSuggestions("",lastWord(before),lang,true)
            else->emptyList()
        }
'''
s = must_replace(s, old_words, new_words, "async-words")

# Faster key visual feedback: no per-key release animation queue.
old_press = '''    private fun press(v:View,on:Boolean){v.animate().cancel();if(on){v.translationY=dp(2f).toFloat();v.scaleX=.97f;v.scaleY=.97f;v.alpha=.88f}else v.animate().translationY(0f).scaleX(1f).scaleY(1f).alpha(1f).setDuration(28).start()}
'''
new_press = '''    private fun press(v:View,on:Boolean){
        v.animate().cancel()
        if(on){
            v.translationY=dp(1.5f).toFloat();v.scaleX=.985f;v.scaleY=.985f;v.alpha=.92f
        }else{
            v.translationY=0f;v.scaleX=1f;v.scaleY=1f;v.alpha=1f
        }
    }
'''
s = must_replace(s, old_press, new_press, "press-fast")

# Reuse key-preview view/popup instead of allocating one every letter.
start = s.index('    private fun showKeyPreview(anchor:View,label:String){')
end = s.index('    private fun hideKeyPreview(){', start)
hide_end = s.index('    private fun feedback()', end)
new_preview = '''    private fun showKeyPreview(anchor:View,label:String){
        if(!Prefs.keyPreview(this)||isPrivateField()||label.isBlank()) return
        val p=ThemeUtil.palette(this)
        val bubble=(keyPreviewView ?: TextView(this).also { keyPreviewView=it }).apply{
            text=label
            textSize=30f*Prefs.fontScale(this@ViaKeyService)
            gravity=Gravity.CENTER
            setTextColor(p.text)
            background=rounded(p.key,14f)
            elevation=dp(8f).toFloat()
        }
        val w=dp(56f); val h=dp(64f)
        val popup=(keyPreviewPopup ?: PopupWindow(bubble,w,h,false).also{
            it.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            it.isClippingEnabled=false
            it.elevation=dp(10f).toFloat()
            keyPreviewPopup=it
        })
        if(popup.isShowing) popup.dismiss()
        popup.width=w; popup.height=h
        popup.showAsDropDown(anchor,(anchor.width-w)/2,-anchor.height-h-dp(4f))
    }

    private fun hideKeyPreview(){
        if(keyPreviewPopup?.isShowing==true) keyPreviewPopup?.dismiss()
    }

    private fun liveSuggestions(prefix:String,previous:String,lang:String,nextWord:Boolean):List<String>{
        val agent=Prefs.typingAgent(this)
        val key="$lang|$prefix|$previous|$nextWord|$agent|${Prefs.aiEnabled(this)}"
        if(key==suggestionCacheKey) return suggestionCacheWords
        if(key!=suggestionPendingKey){
            suggestionPendingKey=key
            val generation=++suggestionGeneration
            suggestionExecutor.queue.clear()
            suggestionExecutor.execute{
                val result=try{
                    if(nextWord){
                        if(agent) TypingAgent.nextWords(this,previous,lang,8) else SuggestionEngine.nextWords(this,previous,lang)
                    }else{
                        if(agent) TypingAgent.suggestions(this,prefix,previous,lang,8) else SuggestionEngine.suggest(this,prefix,previous,lang,8)
                    }
                }catch(_:Throwable){ emptyList() }
                handler.post{
                    if(generation==suggestionGeneration){
                        suggestionCacheKey=key
                        suggestionCacheWords=result
                        suggestionPendingKey=""
                        if(::root.isInitialized) updateSuggestions()
                    }
                }
            }
        }
        return emptyList()
    }

'''
s = s[:start] + new_preview + s[hide_end:]

# Suggestion debounce can be shorter now because work is background.
s = s.replace(
    'private fun scheduleSuggestionUpdate(delay:Long=72L)',
    'private fun scheduleSuggestionUpdate(delay:Long=34L)'
)
s = s.replace('scheduleSuggestionUpdate(72L);scheduleTranslationPreview()', 'scheduleSuggestionUpdate(34L);scheduleTranslationPreview()')

p.write_text(s)

print("ViaKey 0.3.2 Smooth patch applied.")
