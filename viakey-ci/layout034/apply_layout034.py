from pathlib import Path
import re

ROOT=Path("/tmp/viakey-build")
JAVA=ROOT/"app/src/main/java/com/mova/viakey"

def replace_between(text,start_marker,end_marker,new_block,label):
    a=text.find(start_marker)
    if a<0: raise SystemExit(f"missing start {label}")
    b=text.find(end_marker,a)
    if b<0: raise SystemExit(f"missing end {label}")
    return text[:a]+new_block+text[b:]

p=ROOT/"app/build.gradle.kts"
s=p.read_text()
s=re.sub(r'versionCode\s*=\s*\d+','versionCode = 14',s,count=1)
s=re.sub(r'versionName\s*=\s*"[^"]+"','versionName = "0.3.4"',s,count=1)
s=re.sub(r'applicationIdSuffix\s*=\s*"[^"]+"','applicationIdSuffix = ".ios034"',s,count=1)
s=re.sub(r'versionNameSuffix\s*=\s*"[^"]+"','versionNameSuffix = "-ios-layout"',s,count=1)
s=re.sub(r'manifestPlaceholders\["appLabel"\]\s*=\s*"[^"]+"','manifestPlaceholders["appLabel"] = "ViaKey AI iOS 0.3.4"',s,count=1)
p.write_text(s)

p=JAVA/"Prefs.kt"; s=p.read_text()
s=s.replace('getBoolean(NUMBER_ROW, true)','getBoolean(NUMBER_ROW, false)')
if 'if (rev < 34)' not in s:
    marker='        edit.apply()\n'
    block='''        if (rev < 34) {
            edit.putBoolean(NUMBER_ROW, false)
                .putBoolean(SECONDARY, false)
                .putInt(GAP, 3)
                .putFloat(KEY_HEIGHT, .99f)
                .putFloat(FONT, 1.0f)
                .putInt(DEFAULTS_REV, 34)
        }
'''
    pos=s.find(marker)
    if pos<0: raise SystemExit("Prefs edit.apply not found")
    s=s[:pos]+block+s[pos:]
p.write_text(s)

for name in ("MainActivity.kt","SettingsActivity.kt"):
    p=JAVA/name; t=p.read_text()
    t=t.replace("0.3.3","0.3.4").replace("0.3.2","0.3.4")
    p.write_text(t)

p=JAVA/"ViaKeyService.kt"; s=p.read_text()

if 'private var toolbarExpanded = false' not in s:
    s=s.replace('private var manualSuggestions: List<String> = emptyList()',
                'private var manualSuggestions: List<String> = emptyList()\n    private var toolbarExpanded = false',1)

needle='        manualSuggestions = emptyList()\n'
start=s.find('override fun onStartInputView')
idx=s.find(needle,start)
if idx>=0 and 'toolbarExpanded = false' not in s[idx:idx+180]:
    s=s[:idx+len(needle)]+'        toolbarExpanded = false\n'+s[idx+len(needle):]

needle='        addBottomRow(p,lang,scale,keyHeight,gap)\n'
idx=s.find(needle)
if idx>=0 and 'addIOSFooter(p,privateMode,lang,scale)' not in s[idx:idx+220]:
    s=s[:idx+len(needle)]+'        if(!symbols && !emojiMode) addIOSFooter(p,privateMode,lang,scale)\n'+s[idx+len(needle):]

suggestion_bar='''    private fun addSuggestionBar(p:ThemeUtil.Palette, privateMode:Boolean, scale:Float, gap:Int){
        val row=LinearLayout(this).apply{
            orientation=LinearLayout.HORIZONTAL
            gravity=Gravity.CENTER
            background=rounded(p.panel,16f)
            setPadding(dp(2f),0,dp(2f),0)
            elevation=0f
        }
        suggestionRow=row
        root.addView(row,LinearLayout.LayoutParams(-1,dp(45f*scale)).apply{
            leftMargin=dp(4f); rightMargin=dp(4f); bottomMargin=dp(3f)
        })
    }

'''
s=replace_between(s,'    private fun addSuggestionBar(','    private fun addBarItem(',suggestion_bar,'suggestion bar')

helper='''    private fun addToolbarButton(row:LinearLayout,p:ThemeUtil.Palette,label:String,weight:Float=.75f,active:Boolean=false,action:()->Unit){
        val v=TextView(this).apply{
            text=label
            textSize=if(label.length<=2)20f else 12f
            gravity=Gravity.CENTER
            isSingleLine=true
            setTextColor(if(active)Color.WHITE else p.text)
            background=if(active)rounded(p.accent,13f) else null
            includeFontPadding=false
            setOnClickListener{feedback();action()}
        }
        row.addView(v,LinearLayout.LayoutParams(0,-1,weight).apply{setMargins(dp(.5f),dp(3f),dp(.5f),dp(3f))})
    }

    private fun editorMenuAction(id:Int){
        currentInputConnection?.performContextMenuAction(id)
        scheduleSuggestionUpdate(24L)
    }

'''
if 'private fun addToolbarButton' not in s:
    pos=s.find('    private fun updateSuggestions(){')
    if pos<0: raise SystemExit('updateSuggestions missing')
    s=s[:pos]+helper+s[pos:]

new_update='''    private fun updateSuggestions(){
        val row=suggestionRow?:return
        val p=ThemeUtil.palette(this)
        row.removeAllViews()

        if(toolbarExpanded && !isPrivateField()){
            addToolbarButton(row,p,"‹",.58f){toolbarExpanded=false;updateSuggestions()}
            addToolbarButton(row,p,"⚙",.82f){openSettings()}
            addToolbarButton(row,p,"▤",.82f){pasteClipboard()}
            addToolbarButton(row,p,"↶",.82f){editorMenuAction(android.R.id.undo)}
            addToolbarButton(row,p,"↷",.82f){editorMenuAction(android.R.id.redo)}
            addToolbarButton(row,p,"□",.82f){editorMenuAction(android.R.id.selectAll)}
            addToolbarButton(row,p,"⧉",.82f){editorMenuAction(android.R.id.copy)}
            addToolbarButton(row,p,"▣",.82f){editorMenuAction(android.R.id.paste)}
            addToolbarButton(row,p,"›",.58f){toolbarExpanded=false;updateSuggestions()}
            return
        }

        if(isPrivateField()){
            addToolbarButton(row,p,"›",.58f){toolbarExpanded=true;updateSuggestions()}
            addBarItem(row,p,"PRIVADO",2.6f)
            addToolbarButton(row,p,"⚙",.70f){openSettings()}
            return
        }

        if(emojiSearchMode){
            val matches=EmojiManager.search(emojiSearchQuery)
            if(emojiSearchQuery.isBlank()){
                addBarItem(row,p,"buscar emoji",1.6f)
                addBarItem(row,p,"digite uma palavra",1.4f)
                addBarItem(row,p,"✕",.55f){emojiSearchMode=false;emojiSearchQuery="";rebuild()}
            } else {
                for(i in 0..1){
                    val e=matches.getOrNull(i)
                    addBarItem(row,p,e?:"…",1f){if(e!=null){commitEmoji(e);emojiSearchMode=false;emojiSearchQuery="";rebuild()}}
                }
                addBarItem(row,p,"✕",.55f){emojiSearchMode=false;emojiSearchQuery="";rebuild()}
            }
            return
        }

        val before=currentInputConnection?.getTextBeforeCursor(220,0)?.toString().orEmpty()
        val prefix=currentPrefix(before)
        val lang=LanguageManager.activeTag(this)
        val previousForPrefix=previousWordBeforePrefix(before,prefix)
        val math=if(Prefs.autoMath(this))MathEngine.suggest(before) else null
        val words=when{
            manualSuggestions.isNotEmpty()->manualSuggestions
            prefix.isNotEmpty()&&Prefs.suggestions(this)->{
                val key="word|"+lang+"|"+previousForPrefix+"|"+prefix+"|"+Prefs.typingAgent(this)
                if(asyncSuggestionKey==key) asyncSuggestionWords else {
                    requestSuggestionsAsync(key,prefix,previousForPrefix,lang,false)
                    listOf(prefix)
                }
            }
            Prefs.nextWord(this)&&Prefs.suggestions(this)->{
                val prev=lastWord(before)
                val key="next|"+lang+"|"+prev+"|"+Prefs.typingAgent(this)
                if(asyncSuggestionKey==key) asyncSuggestionWords else {
                    requestSuggestionsAsync(key,"",prev,lang,true)
                    emptyList()
                }
            }
            else->emptyList()
        }

        val pair=shortLang(Prefs.translationSource(this))+"›"+shortLang(Prefs.translationTarget(this))
        addToolbarButton(row,p,"›",.52f){toolbarExpanded=true;updateSuggestions()}

        if(math!=null){
            addBarItem(row,p,"="+math.label,1f,accent=true){commitMathResult(math)}
            repeat(2){i->
                val w=words.getOrNull(i)
                addBarItem(row,p,w?:"",1f){if(w!=null)replacePrefix(prefix,w)}
            }
        } else if(Prefs.translationActive(this)&&translationPreview.isNotBlank()){
            addBarItem(row,p,translationPreview.take(24),1.30f,accent=true){replaceAllText(translationPreview)}
            repeat(2){i->
                val w=words.getOrNull(i)
                addBarItem(row,p,w?:"",1f){if(w!=null)replacePrefix(prefix,w)}
            }
        } else {
            repeat(3){i->
                val w=words.getOrNull(i)
                addBarItem(row,p,w?:"",1f){if(w!=null)replacePrefix(prefix,w)}
            }
        }

        val translatorLabel=when{
            translationBusy->"A…"
            Prefs.translationActive(this)&&translationPreview.isNotBlank()->"A✓"
            Prefs.translationActive(this)->pair
            else->"A≡"
        }
        addToolbarButton(row,p,translatorLabel,.70f,Prefs.translationActive(this)){translateWholeTextNow()}
    }

'''
s=replace_between(s,'    private fun updateSuggestions(){','private fun requestSuggestionsAsync(',new_update,'update suggestions')

s=re.sub(r'val weight=if\(!symbols && \(label=="⇧"\|\|label=="⌫"\)\)\d+(?:\.\d+)?f else 1f',
         'val weight=if(!symbols && (label=="⇧"||label=="⌫"))1.48f else 1f',s,count=1)

bottom='''    private fun addBottomRow(p:ThemeUtil.Palette,lang:String,scale:Float,keyHeight:Float,gap:Int){
        val row=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER}
        val left=if(emojiMode||symbols)"ABC" else "123"
        row.addView(keyButton(left,p.panel,p.text,17f,keyHeight){
            emojiMode=false
            symbols=left!="ABC"
            rebuild()
        },weightedParams(1.28f,keyHeight,gap))

        val space=keyButton(shortLang(lang),p.key,p.secondaryText,10.5f,keyHeight){}
        space.gravity=Gravity.END or Gravity.CENTER_VERTICAL
        space.setPadding(0,0,dp(10f),0)
        attachSpaceGesture(space)
        row.addView(space,weightedParams(3.95f*Prefs.spaceScale(this),keyHeight,gap))

        row.addView(keyButton("↵",p.panel,p.text,23f,keyHeight){handleEnter()},weightedParams(1.28f,keyHeight,gap))
        root.addView(row)
    }

    private fun addIOSFooter(p:ThemeUtil.Palette,privateMode:Boolean,lang:String,scale:Float){
        val footer=LinearLayout(this).apply{
            orientation=LinearLayout.HORIZONTAL
            gravity=Gravity.CENTER_VERTICAL
            setPadding(dp(10f),dp(3f),dp(10f),dp(2f))
        }
        val emoji=TextView(this).apply{
            text="☺︎"
            textSize=29f
            gravity=Gravity.CENTER
            setTextColor(p.text)
            includeFontPadding=false
            setOnClickListener{feedback();emojiMode=true;symbols=false;rebuild()}
            setOnLongClickListener{feedback();emojiSearchMode=true;emojiSearchQuery="";emojiMode=false;rebuild();true}
        }
        footer.addView(emoji,LinearLayout.LayoutParams(dp(54f),dp(48f*scale)))
        footer.addView(View(this),LinearLayout.LayoutParams(0,dp(48f*scale),1f))
        val mic=TextView(this).apply{
            text="🎙︎"
            textSize=27f
            gravity=Gravity.CENTER
            setTextColor(p.text)
            includeFontPadding=false
            setOnClickListener{feedback();switchToNextInputMethod(false)}
            setOnLongClickListener{openSettings();true}
        }
        footer.addView(mic,LinearLayout.LayoutParams(dp(54f),dp(48f*scale)))
        root.addView(footer)
    }

'''
s=replace_between(s,'    private fun addBottomRow(','private fun addFooter(',bottom,'bottom row')

s=re.sub(r'val corner=dp\([^\n]+\)\.toFloat\(\)','val corner=dp(8.0f).toFloat()',s,count=1)
s=re.sub(r'val xInset=dp\([^\n]+\)','val xInset=dp(1.55f)',s,count=1)
s=re.sub(r'val yInset=dp\([^\n]+\)','val yInset=dp(1.60f)',s,count=1)

p.write_text(s)

for needle,text in [
    ('0.3.4',(ROOT/'app/build.gradle.kts').read_text()),
    ('toolbarExpanded',s),('addIOSFooter',s),('A≡',s),('3.95f',s)
]:
    if needle not in text: raise SystemExit("sanity failed: "+needle)
print("ViaKey 0.3.4 iOS geometry applied")
