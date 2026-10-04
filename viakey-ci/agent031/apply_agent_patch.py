from pathlib import Path

ROOT = Path("/tmp/viakey-build")
JAVA = ROOT / "app/src/main/java/com/mova/viakey"

def replace_once(path: Path, old: str, new: str, label: str):
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"Patch failed [{label}] in {path}: pattern not found")
    path.write_text(text.replace(old, new, 1))

# Build/version + clean side-by-side package for Agent 0.3.1.
p = ROOT / "app/build.gradle.kts"
s = p.read_text()
s = s.replace('create("test") {', 'create("side") {')
s = s.replace('versionCode = 10', 'versionCode = 11')
s = s.replace('versionName = "0.3.0"', 'versionName = "0.3.1"')
s = s.replace('applicationIdSuffix = ".test"', 'applicationIdSuffix = ".agent031"')
s = s.replace('applicationIdSuffix = ".lab030"', 'applicationIdSuffix = ".agent031"')
s = s.replace('versionNameSuffix = "-test"', 'versionNameSuffix = "-agent"')
s = s.replace('manifestPlaceholders["appLabel"] = "ViaKey AI Test"', 'manifestPlaceholders["appLabel"] = "ViaKey AI Agent 0.3.1"')
s = s.replace('manifestPlaceholders["appLabel"] = "ViaKey AI LAB 0.3"', 'manifestPlaceholders["appLabel"] = "ViaKey AI Agent 0.3.1"')
p.write_text(s)

# Kotlin typing fix retained from 0.3.0 CI.
p = JAVA / "SuggestionEngine.kt"
s = p.read_text().replace(
    'private val neighborMap: Map<Char, Set<Char>> = buildMap {',
    'private val neighborMap: Map<Char, MutableSet<Char>> = buildMap {'
)
p.write_text(s)

# Prefs: one dedicated typing-agent switch, enabled by default.
p = JAVA / "Prefs.kt"
s = p.read_text()
if 'private const val TYPING_AGENT' not in s:
    s = s.replace(
        'private const val KEY_PREVIEW = "key_preview"',
        'private const val KEY_PREVIEW = "key_preview"\n    private const val TYPING_AGENT = "typing_agent"'
    )
if 'fun typingAgent(c: Context)' not in s:
    s = s.replace(
        'fun setKeyPreview(c: Context, v: Boolean) = prefs(c).edit().putBoolean(KEY_PREVIEW, v).apply()',
        'fun setKeyPreview(c: Context, v: Boolean) = prefs(c).edit().putBoolean(KEY_PREVIEW, v).apply()\n    fun typingAgent(c: Context) = prefs(c).getBoolean(TYPING_AGENT, true)\n    fun setTypingAgent(c: Context, v: Boolean) = prefs(c).edit().putBoolean(TYPING_AGENT, v).apply()'
    )
s = s.replace('if (rev < 30) {', 'if (rev < 31) {')
s = s.replace(
    '.putBoolean(KEY_PREVIEW, true)\n                .putInt(DEFAULTS_REV, 30)',
    '.putBoolean(KEY_PREVIEW, true)\n                .putBoolean(TYPING_AGENT, true)\n                .putInt(DEFAULTS_REV, 31)'
)
p.write_text(s)

# Settings UI.
p = JAVA / "SettingsActivity.kt"
s = p.read_text().replace('ViaKey AI 0.3.0', 'ViaKey AI 0.3.1')
anchor = 'root.addView(toggle("ViaKey SmartCore",Prefs.aiEnabled(this),muted){Prefs.setAiEnabled(this,it)})'
if 'Agente de digitação' not in s:
    s = s.replace(
        anchor,
        anchor + '\n        root.addView(toggle("Agente de digitação",Prefs.typingAgent(this),muted){Prefs.setTypingAgent(this,it)})\n        root.addView(note("Um agente local observa contexto, confiança e correções rejeitadas para ajudar o SmartCore sem tomar o texto à força.",muted))'
    )
s = s.replace(
    'Prefs.clearLocalData(this);SuggestionEngine.clearLearned(this);Toast',
    'Prefs.clearLocalData(this);SuggestionEngine.clearLearned(this);TypingAgent.clear(this);Toast'
)
p.write_text(s)

# Main screen copy.
p = JAVA / "MainActivity.kt"
s = p.read_text().replace('ViaKey 0.3.0', 'ViaKey 0.3.1')
s = s.replace('SmartCore contextual local', 'SmartCore contextual + Agente de Digitação local')
p.write_text(s)

# Service orchestration.
p = JAVA / "ViaKeyService.kt"
s = p.read_text()
s = s.replace(
    'prefix.isNotEmpty()&&Prefs.suggestions(this)->SuggestionEngine.suggest(this,prefix,previousForPrefix,lang,8)',
    'prefix.isNotEmpty()&&Prefs.suggestions(this)->if(Prefs.typingAgent(this)) TypingAgent.suggestions(this,prefix,previousForPrefix,lang,8) else SuggestionEngine.suggest(this,prefix,previousForPrefix,lang,8)'
)
s = s.replace(
    'Prefs.nextWord(this)&&Prefs.suggestions(this)->SuggestionEngine.nextWords(this,lastWord(before),lang)',
    'Prefs.nextWord(this)&&Prefs.suggestions(this)->if(Prefs.typingAgent(this)) TypingAgent.nextWords(this,lastWord(before),lang) else SuggestionEngine.nextWords(this,lastWord(before),lang)'
)
s = s.replace(
    'else->SuggestionEngine.suggest(this,prefix,previousWordBeforePrefix(before,prefix),lang,10)',
    'else->if(Prefs.typingAgent(this)) TypingAgent.suggestions(this,prefix,previousWordBeforePrefix(before,prefix),lang,10) else SuggestionEngine.suggest(this,prefix,previousWordBeforePrefix(before,prefix),lang,10)'
)
old = '''        if(Prefs.autocorrect(this)&&Prefs.aiEnabled(this)&&typed.isNotBlank()&&!isPrivateField()){
            correction=SuggestionEngine.correct(this,typed,previous,lang)
        }
'''
new = '''        if(Prefs.autocorrect(this)&&Prefs.aiEnabled(this)&&typed.isNotBlank()&&!isPrivateField()){
            correction=if(Prefs.typingAgent(this)){
                val decision=TypingAgent.decideCorrection(this,typed,previous,lang)
                if(decision.shouldApply && !decision.correction.isNullOrBlank()) SuggestionEngine.Correction(decision.correction,decision.confidence,0.0) else null
            }else SuggestionEngine.correct(this,typed,previous,lang)
        }
'''
if old not in s:
    raise SystemExit("Patch failed [autocorrect block]")
s = s.replace(old, new, 1)
s = s.replace(
    'lastAutoCorrection=AutoCorrectionUndo(typed,fixed,previous,lang,SystemClock.uptimeMillis())\n            finalWord=fixed',
    'lastAutoCorrection=AutoCorrectionUndo(typed,fixed,previous,lang,SystemClock.uptimeMillis())\n            if(Prefs.typingAgent(this)) TypingAgent.recordApplied(this,typed,fixed)\n            finalWord=fixed'
)
s = s.replace(
    'SuggestionEngine.recordRejectedCorrection(this,undo.original,undo.corrected,undo.language)\n        lastAutoCorrection=null',
    'SuggestionEngine.recordRejectedCorrection(this,undo.original,undo.corrected,undo.language)\n        if(Prefs.typingAgent(this)) TypingAgent.recordRejected(this,undo.original,undo.corrected)\n        lastAutoCorrection=null'
)
p.write_text(s)

print("ViaKey 0.3.1 Typing Agent patch applied.")
