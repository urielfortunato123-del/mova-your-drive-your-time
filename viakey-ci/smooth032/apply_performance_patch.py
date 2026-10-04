from pathlib import Path

ROOT = Path("/tmp/viakey-build")
JAVA = ROOT / "app/src/main/java/com/mova/viakey"

def replace_once(path: Path, old: str, new: str, label: str):
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"Patch failed [{label}] in {path}: pattern not found")
    path.write_text(text.replace(old, new, 1))

# --- SuggestionEngine: cache learned data + avoid expensive first-use stalls ---
p = JAVA / "SuggestionEngine.kt"
s = p.read_text()
if "private val counterCache" not in s:
    s = s.replace(
        '    private val cache = HashMap<String, LanguageData>()\n',
        '    private val cache = HashMap<String, LanguageData>()\n    private val counterCache = HashMap<String, Map<String, Int>>()\n'
    )
if "fun prewarm(context: Context" not in s:
    s = s.replace(
        '    private fun completions(d: LanguageData, clean: String): List<Entry> = when {',
        '    fun prewarm(context: Context, tag: String) { data(context, tag) }\n\n'
        '    fun isLoaded(tag: String): Boolean = synchronized(cache) { cache.containsKey(tag) }\n\n'
        '    private fun completions(d: LanguageData, clean: String): List<Entry> = when {'
    )
s = s.replace(
    'val scored = correctionPool(d, clean).asSequence().take(1800)',
    'val scored = correctionPool(d, clean).asSequence().take(560)'
)
s = s.replace(
'''    fun clearLearned(context: Context) {
        context.getSharedPreferences(LEARNING_FILE, Context.MODE_PRIVATE).edit().clear().apply()
    }''',
'''    fun clearLearned(context: Context) {
        context.getSharedPreferences(LEARNING_FILE, Context.MODE_PRIVATE).edit().clear().apply()
        synchronized(counterCache) { counterCache.clear() }
    }'''
)
old_counter = '''    private fun loadCounter(context: Context, key: String): Map<String, Int> {
        val raw=context.getSharedPreferences(LEARNING_FILE,Context.MODE_PRIVATE).getString(key,"").orEmpty()
        if(raw.isBlank()) return emptyMap()
        val out=LinkedHashMap<String,Int>()
        raw.lineSequence().forEach { line ->
            val tab=line.lastIndexOf('\\t'); if(tab<=0) return@forEach
            val token=line.substring(0,tab); val count=line.substring(tab+1).toIntOrNull() ?: return@forEach
            if(token.isNotBlank()) out[token]=count
        }
        return out
    }

    private fun saveCounter(context: Context,key:String,map:Map<String,Int>) {
        val raw=map.entries.joinToString("\\n") { "${it.key}\\t${it.value}" }
        context.getSharedPreferences(LEARNING_FILE,Context.MODE_PRIVATE).edit().putString(key,raw).apply()
    }
'''
new_counter = '''    private fun loadCounter(context: Context, key: String): Map<String, Int> {
        synchronized(counterCache) { counterCache[key]?.let { return it } }
        val raw=context.getSharedPreferences(LEARNING_FILE,Context.MODE_PRIVATE).getString(key,"").orEmpty()
        if(raw.isBlank()) {
            val empty=emptyMap<String,Int>()
            synchronized(counterCache) { counterCache[key]=empty }
            return empty
        }
        val out=LinkedHashMap<String,Int>()
        raw.lineSequence().forEach { line ->
            val tab=line.lastIndexOf('\\t'); if(tab<=0) return@forEach
            val token=line.substring(0,tab); val count=line.substring(tab+1).toIntOrNull() ?: return@forEach
            if(token.isNotBlank()) out[token]=count
        }
        val frozen=out.toMap()
        synchronized(counterCache) { counterCache[key]=frozen }
        return frozen
    }

    private fun saveCounter(context: Context,key:String,map:Map<String,Int>) {
        val frozen=map.toMap()
        synchronized(counterCache) { counterCache[key]=frozen }
        val raw=frozen.entries.joinToString("\\n") { "${it.key}\\t${it.value}" }
        context.getSharedPreferences(LEARNING_FILE,Context.MODE_PRIVATE).edit().putString(key,raw).apply()
    }
'''
if old_counter not in s:
    raise SystemExit("Patch failed [counter cache]")
s = s.replace(old_counter, new_counter, 1)
p.write_text(s)

# --- ViaKeyService: SmartCore completely off the key/UI thread ---
p = JAVA / "ViaKeyService.kt"
s = p.read_text()
if "import java.util.concurrent.Executors" not in s:
    s = s.replace("import kotlin.math.roundToInt\n", "import kotlin.math.roundToInt\nimport java.util.concurrent.Executors\n")
if "private val suggestionExecutor" not in s:
    s = s.replace(
        "    private val handler = Handler(Looper.getMainLooper())\n",
        '''    private val handler = Handler(Looper.getMainLooper())
    private val suggestionExecutor = Executors.newSingleThreadExecutor { r -> Thread(r, "ViaKey-SmartCore").apply { priority = Thread.NORM_PRIORITY - 1 } }
    private var suggestionGeneration = 0
    private var asyncSuggestionKey = ""
    private var asyncSuggestionWords: List<String> = emptyList()
    private var pendingSuggestionKey = ""
'''
    )
if "private var keyPreviewText" not in s:
    s = s.replace(
        "    private var keyPreviewPopup: PopupWindow? = null\n",
        "    private var keyPreviewPopup: PopupWindow? = null\n    private var keyPreviewText: TextView? = null\n"
    )
s = s.replace(
'''    override fun onCreate() {
        super.onCreate()
        Prefs.migrateV030(this)
    }''',
'''    override fun onCreate() {
        super.onCreate()
        Prefs.migrateV030(this)
        val tag = LanguageManager.activeTag(this)
        suggestionExecutor.execute { runCatching { SuggestionEngine.prewarm(this, tag) } }
    }'''
)
s = s.replace(
'''        keyPreviewPopup?.dismiss()
        translator.close()
        super.onDestroy()''',
'''        keyPreviewPopup?.dismiss()
        suggestionExecutor.shutdownNow()
        translator.close()
        super.onDestroy()'''
)
s = s.replace(
'''        manualSuggestions = emptyList()
        translationPreview = ""''',
'''        manualSuggestions = emptyList()
        asyncSuggestionKey = ""
        asyncSuggestionWords = emptyList()
        pendingSuggestionKey = ""
        translationPreview = ""''',
1
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
            prefix.isNotEmpty()&&Prefs.suggestions(this)->{
                val key="word|$lang|$previousForPrefix|$prefix|${Prefs.typingAgent(this)}"
                if(asyncSuggestionKey==key) asyncSuggestionWords else {
                    requestSuggestionsAsync(key,prefix,previousForPrefix,lang,false)
                    listOf(prefix)
                }
            }
            Prefs.nextWord(this)&&Prefs.suggestions(this)->{
                val prev=lastWord(before)
                val key="next|$lang|$prev|${Prefs.typingAgent(this)}"
                if(asyncSuggestionKey==key) asyncSuggestionWords else {
                    requestSuggestionsAsync(key,"",prev,lang,true)
                    emptyList()
                }
            }
            else->emptyList()
        }
'''
if old_words not in s:
    raise SystemExit("Patch failed [async words]")
s = s.replace(old_words, new_words, 1)

if "private fun requestSuggestionsAsync" not in s:
    anchor = "    private fun showExpandedSuggestions(anchor:View){"
    func = '''    private fun requestSuggestionsAsync(key:String,prefix:String,previous:String,lang:String,next:Boolean){
        if(pendingSuggestionKey==key) return
        pendingSuggestionKey=key
        val generation=++suggestionGeneration
        suggestionExecutor.execute {
            val result=runCatching {
                if(next){
                    if(Prefs.typingAgent(this)) TypingAgent.nextWords(this,previous,lang,8) else SuggestionEngine.nextWords(this,previous,lang).take(8)
                }else{
                    if(Prefs.typingAgent(this)) TypingAgent.suggestions(this,prefix,previous,lang,8) else SuggestionEngine.suggest(this,prefix,previous,lang,8)
                }
            }.getOrElse { emptyList() }
            handler.post {
                if(generation==suggestionGeneration && pendingSuggestionKey==key){
                    asyncSuggestionKey=key
                    asyncSuggestionWords=result
                    pendingSuggestionKey=""
                    if(::root.isInitialized) updateSuggestions()
                }
            }
        }
    }

'''
    if anchor not in s:
        raise SystemExit("Patch failed [async function anchor]")
    s = s.replace(anchor, func + anchor, 1)

old_expanded = '''        val words=when{emojiSearchMode->EmojiManager.search(emojiSearchQuery);manualSuggestions.isNotEmpty()->manualSuggestions;else->if(Prefs.typingAgent(this)) TypingAgent.suggestions(this,prefix,previousWordBeforePrefix(before,prefix),lang,10) else SuggestionEngine.suggest(this,prefix,previousWordBeforePrefix(before,prefix),lang,10)}
        if(words.isEmpty())return'''
new_expanded = '''        val previous=previousWordBeforePrefix(before,prefix)
        val key="word|$lang|$previous|$prefix|${Prefs.typingAgent(this)}"
        val words=when{
            emojiSearchMode->EmojiManager.search(emojiSearchQuery)
            manualSuggestions.isNotEmpty()->manualSuggestions
            asyncSuggestionKey==key->asyncSuggestionWords
            else->{requestSuggestionsAsync(key,prefix,previous,lang,false);emptyList()}
        }
        if(words.isEmpty())return'''
if old_expanded not in s:
    raise SystemExit("Patch failed [expanded async]")
s = s.replace(old_expanded, new_expanded, 1)

s = s.replace(
    'if(Prefs.autocorrect(this)&&Prefs.aiEnabled(this)&&typed.isNotBlank()&&!isPrivateField()){',
    'if(Prefs.autocorrect(this)&&Prefs.aiEnabled(this)&&typed.isNotBlank()&&!isPrivateField()&&SuggestionEngine.isLoaded(lang)){',
    1
)
s = s.replace(
    'if(Prefs.typingAgent(this)) TypingAgent.recordApplied(this,typed,fixed)',
    'if(Prefs.typingAgent(this)) suggestionExecutor.execute { TypingAgent.recordApplied(this,typed,fixed) }',
    1
)
old_learn = '''        if(Prefs.personalLearning(this)&&finalWord.isNotBlank()&&!isPrivateField()){
            SuggestionEngine.learn(this,finalWord,previous.ifBlank{null},lang)
        }'''
new_learn = '''        if(Prefs.personalLearning(this)&&finalWord.isNotBlank()&&!isPrivateField()){
            val learnWord=finalWord
            val learnPrevious=previous.ifBlank{null}
            suggestionExecutor.execute { SuggestionEngine.learn(this,learnWord,learnPrevious,lang) }
        }'''
if old_learn not in s:
    raise SystemExit("Patch failed [async learn]")
s = s.replace(old_learn, new_learn, 1)

old_reject = '''        SuggestionEngine.recordRejectedCorrection(this,undo.original,undo.corrected,undo.language)
        if(Prefs.typingAgent(this)) TypingAgent.recordRejected(this,undo.original,undo.corrected)'''
new_reject = '''        suggestionExecutor.execute {
            SuggestionEngine.recordRejectedCorrection(this,undo.original,undo.corrected,undo.language)
            if(Prefs.typingAgent(this)) TypingAgent.recordRejected(this,undo.original,undo.corrected)
        }'''
if old_reject not in s:
    raise SystemExit("Patch failed [async reject]")
s = s.replace(old_reject, new_reject, 1)

old_preview = '''    private fun showKeyPreview(anchor:View,label:String){
        if(!Prefs.keyPreview(this)||isPrivateField()||label.isBlank()) return
        keyPreviewPopup?.dismiss()
        val p=ThemeUtil.palette(this)
        val bubble=TextView(this).apply{
            text=label
            textSize=30f*Prefs.fontScale(this@ViaKeyService)
            gravity=Gravity.CENTER
            setTextColor(p.text)
            background=rounded(p.key,14f)
            elevation=dp(10f).toFloat()
        }
        val w=dp(58f); val h=dp(68f)
        val popup=PopupWindow(bubble,w,h,false).apply{
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            isClippingEnabled=false
            elevation=dp(12f).toFloat()
        }
        keyPreviewPopup=popup
        popup.showAsDropDown(anchor,(anchor.width-w)/2,-anchor.height-h-dp(6f))
    }

    private fun hideKeyPreview(){
        keyPreviewPopup?.dismiss()
        keyPreviewPopup=null
    }
'''
new_preview = '''    private fun showKeyPreview(anchor:View,label:String){
        if(!Prefs.keyPreview(this)||isPrivateField()||label.isBlank()) return
        val p=ThemeUtil.palette(this)
        val bubble=keyPreviewText ?: TextView(this).apply{
            gravity=Gravity.CENTER
            elevation=dp(10f).toFloat()
        }.also { keyPreviewText=it }
        bubble.text=label
        bubble.textSize=30f*Prefs.fontScale(this)
        bubble.setTextColor(p.text)
        bubble.background=rounded(p.key,14f)
        val w=dp(58f); val h=dp(68f)
        val popup=keyPreviewPopup ?: PopupWindow(bubble,w,h,false).apply{
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            isClippingEnabled=false
            elevation=dp(12f).toFloat()
        }.also { keyPreviewPopup=it }
        if(popup.isShowing) popup.dismiss()
        popup.showAsDropDown(anchor,(anchor.width-w)/2,-anchor.height-h-dp(6f))
    }

    private fun hideKeyPreview(){
        keyPreviewPopup?.dismiss()
    }
'''
if old_preview not in s:
    raise SystemExit("Patch failed [preview reuse]")
s = s.replace(old_preview, new_preview, 1)
p.write_text(s)

# Version/package names.
p = ROOT / "app/build.gradle.kts"
s = p.read_text()
s = s.replace('versionCode = 11', 'versionCode = 12')
s = s.replace('versionName = "0.3.1"', 'versionName = "0.3.2"')
s = s.replace('applicationIdSuffix = ".agent031"', 'applicationIdSuffix = ".smooth032"')
s = s.replace('manifestPlaceholders["appLabel"] = "ViaKey AI Agent 0.3.1"', 'manifestPlaceholders["appLabel"] = "ViaKey AI Smooth 0.3.2"')
p.write_text(s)

for name in ["MainActivity.kt","SettingsActivity.kt"]:
    p = JAVA / name
    if p.exists():
        p.write_text(p.read_text().replace("0.3.1","0.3.2"))

print("ViaKey 0.3.2 Smooth performance patch applied.")
