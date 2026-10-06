from pathlib import Path
import re

ROOT=Path("/tmp/viakey-build")
JAVA=ROOT/"app/src/main/java/com/mova/viakey"

def replace_function(text,start_marker,new_block,label):
    a=text.find(start_marker)
    if a<0: raise SystemExit(f"missing function {label}")
    search_from=a+len(start_marker)
    m=re.search(r'\n\s*private fun [A-Za-z_][A-Za-z0-9_]*\s*\(',text[search_from:])
    if not m: raise SystemExit(f"missing next function after {label}")
    b=search_from+m.start()+1
    return text[:a]+new_block+text[b:]

# Version/package.
p=ROOT/"app/build.gradle.kts"
s=p.read_text()
s=re.sub(r'versionCode\s*=\s*\d+','versionCode = 15',s,count=1)
s=re.sub(r'versionName\s*=\s*"[^"]+"','versionName = "0.3.5"',s,count=1)
s=re.sub(r'applicationIdSuffix\s*=\s*"[^"]+"','applicationIdSuffix = ".ios035"',s,count=1)
s=re.sub(r'versionNameSuffix\s*=\s*"[^"]+"','versionNameSuffix = "-ios-tools"',s,count=1)
s=s.replace('manifestPlaceholders["appLabel"] = "ViaKey AI iOS 0.3.4"','manifestPlaceholders["appLabel"] = "ViaKey AI iOS 0.3.5"')
p.write_text(s)

# Keep clean iOS defaults for this revision.
p=JAVA/"Prefs.kt"; s=p.read_text()
if 'if (rev < 35)' not in s:
    marker='        edit.apply()\n'
    block='''        if (rev < 35) {
            edit.putBoolean(NUMBER_ROW, false)
                .putBoolean(SECONDARY, false)
                .putInt(GAP, 3)
                .putFloat(KEY_HEIGHT, .99f)
                .putFloat(FONT, 1.0f)
                .putInt(DEFAULTS_REV, 35)
        }
'''
    pos=s.find(marker)
    if pos<0: raise SystemExit("Prefs edit.apply not found")
    s=s[:pos]+block+s[pos:]
p.write_text(s)

for name in ("MainActivity.kt","SettingsActivity.kt"):
    p=JAVA/name
    t=p.read_text().replace("0.3.4","0.3.5")
    p.write_text(t)

p=JAVA/"ViaKeyService.kt"; s=p.read_text()

if 'private var toolsPanelMode = false' not in s:
    s=s.replace(
        '    private var toolbarExpanded = false\n',
        '    private var toolbarExpanded = false\n    private var toolsPanelMode = false\n    private var resizePanelMode = false\n    private var textEditMode = false\n',
        1
    )

# Reset panel states on a new editor.
needle='        toolbarExpanded = false\n'
start=s.find('override fun onStartInputView')
idx=s.find(needle,start)
if idx>=0 and 'toolsPanelMode = false' not in s[idx:idx+220]:
    extra='        toolsPanelMode = false\n        resizePanelMode = false\n        textEditMode = false\n'
    s=s[:idx+len(needle)]+extra+s[idx+len(needle):]

# Replace normal keyboard body with panel-aware body.
start_marker='        addSuggestionBar(p,privateMode,scale,gap)\n'
a=s.find(start_marker)
if a<0: raise SystemExit("buildKeyboard suggestion marker missing")
b=s.find('        updateSuggestions()\n',a)
if b<0: raise SystemExit("buildKeyboard update marker missing")
b+=len('        updateSuggestions()\n')
new_body='''        addSuggestionBar(p,privateMode,scale,gap)
        when {
            resizePanelMode -> addResizePanel(p,scale)
            textEditMode -> addTextEditPanel(p,scale)
            toolsPanelMode -> addToolsPanel(p,scale)
            emojiMode -> {
                addEmojiPanel(p,privateMode,scale,keyHeight,gap)
                addBottomRow(p,lang,scale,keyHeight,gap)
            }
            else -> {
                if(symbols){
                    addRow(listOf("1","2","3","4","5","6","7","8","9","0"),p,font,keyHeight,gap)
                    addRow(listOf("@","#","$","%","&","-","+","(",")","/"),p,font,keyHeight,gap)
                    addRow(listOf("*","\\\"","'",";",":","!","?","=","_","⌫"),p,font,keyHeight,gap)
                } else {
                    if(Prefs.numberRow(this)) addRow(listOf("1","2","3","4","5","6","7","8","9","0"),p,font*.82f,keyHeight*.82f,gap)
                    keyboardRows(lang).forEach{addRow(it,p,font,keyHeight,gap)}
                }
                addBottomRow(p,lang,scale,keyHeight,gap)
                if(!symbols) addIOSFooter(p,privateMode,lang,scale)
            }
        }
        updateSuggestions()
'''
s=s[:a]+new_body+s[b:]

# Suggestions: chevron opens a full Gboard-like tools panel.
new_update='''    private fun updateSuggestions(){
        val row=suggestionRow?:return
        val p=ThemeUtil.palette(this)
        row.removeAllViews()

        if(toolsPanelMode || resizePanelMode || textEditMode){
            addToolbarButton(row,p,"✕",.55f){
                toolsPanelMode=false;resizePanelMode=false;textEditMode=false;rebuild()
            }
            addToolbarButton(row,p,"▣",.70f){pasteClipboard()}
            addToolbarButton(row,p,"GIF",.72f){}
            addToolbarButton(row,p,"⚙",.70f){openSettings()}
            addToolbarButton(row,p,"A≡",.72f){translateWholeTextNow()}
            addToolbarButton(row,p,"◉",.70f){openSettings()}
            addToolbarButton(row,p,"🎙",.70f){switchToNextInputMethod(false)}
            return
        }

        if(isPrivateField()){
            addToolbarButton(row,p,"›",.55f){toolsPanelMode=true;rebuild()}
            addBarItem(row,p,"PRIVADO",2.7f)
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
                    addBarItem(row,p,e?:"…",1f){
                        if(e!=null){commitEmoji(e);emojiSearchMode=false;emojiSearchQuery="";rebuild()}
                    }
                }
                addBarItem(row,p,"✕",.55f){emojiSearchMode=false;emojiSearchQuery="";rebuild()}
            }
            return
        }

        val before=currentInputConnection?.getTextBeforeCursor(220,0)?.toString().orEmpty()
        val prefix=currentPrefix(before)
        val lang=LanguageManager.activeTag(this)
        val previous=previousWordBeforePrefix(before,prefix)
        val math=if(Prefs.autoMath(this))MathEngine.suggest(before) else null
        val words=when{
            manualSuggestions.isNotEmpty()->manualSuggestions
            prefix.isNotEmpty()&&Prefs.suggestions(this)->liveSuggestions(prefix,previous,lang,false)
            Prefs.nextWord(this)&&Prefs.suggestions(this)->liveSuggestions("",lastWord(before),lang,true)
            else->emptyList()
        }

        addToolbarButton(row,p,"›",.52f){toolsPanelMode=true;rebuild()}

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

        val pair=shortLang(Prefs.translationSource(this))+"›"+shortLang(Prefs.translationTarget(this))
        val translatorLabel=when{
            translationBusy->"A…"
            Prefs.translationActive(this)&&translationPreview.isNotBlank()->"A✓"
            Prefs.translationActive(this)->pair
            else->"A≡"
        }
        addToolbarButton(row,p,translatorLabel,.70f,Prefs.translationActive(this)){translateWholeTextNow()}
    }

'''
s=replace_function(s,'    private fun updateSuggestions(){',new_update,'update suggestions')

# Bring comma and period back around the space bar.
bottom='''    private fun addBottomRow(p:ThemeUtil.Palette,lang:String,scale:Float,keyHeight:Float,gap:Int){
        val row=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER}
        val left=if(emojiMode||symbols)"ABC" else "?123"
        row.addView(keyButton(left,p.panel,p.text,15.5f,keyHeight){
            emojiMode=false
            symbols=left!="ABC"
            rebuild()
        },weightedParams(1.02f,keyHeight,gap))

        val comma=keyButton(",",p.key,p.text,22f,keyHeight){commit(",")}
        comma.setOnLongClickListener{showPunctuationPopup(comma);true}
        row.addView(comma,weightedParams(.66f,keyHeight,gap))

        val space=keyButton(LanguageManager.spaceLabel(lang),p.key,p.text,16f,keyHeight){}
        attachSpaceGesture(space)
        row.addView(space,weightedParams(3.30f*Prefs.spaceScale(this),keyHeight,gap))

        val period=keyButton(".",p.key,p.text,22f,keyHeight){commit(".")}
        period.setOnLongClickListener{showPunctuationPopup(period);true}
        row.addView(period,weightedParams(.66f,keyHeight,gap))

        row.addView(keyButton("↵",p.panel,p.text,21f,keyHeight){handleEnter()},weightedParams(1.00f,keyHeight,gap))
        root.addView(row)
    }

'''
s=replace_function(s,'    private fun addBottomRow(',bottom,'bottom row')

# Insert tools, text editing and resize panels before legacy addFooter.
insert_pos=s.find('    private fun addFooter(')
if insert_pos<0: raise SystemExit("addFooter insertion point missing")
panel_code='''    private fun toolTile(p:ThemeUtil.Palette,label:String,action:()->Unit)=TextView(this).apply{
        text=label
        textSize=15f
        gravity=Gravity.CENTER_VERTICAL
        setTextColor(p.text)
        background=rounded(p.panel,18f)
        setPadding(dp(14f),0,dp(12f),0)
        isSingleLine=true
        setOnClickListener{feedback();action()}
    }

    private fun addToolsPanel(p:ThemeUtil.Palette,scale:Float){
        fun pairRow(a:String,aa:()->Unit,b:String,bb:()->Unit){
            val r=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL}
            r.addView(toolTile(p,a,aa),LinearLayout.LayoutParams(0,dp(46f*scale),1f).apply{setMargins(dp(7f),dp(5f),dp(4f),dp(5f))})
            r.addView(toolTile(p,b,bb),LinearLayout.LayoutParams(0,dp(46f*scale),1f).apply{setMargins(dp(4f),dp(5f),dp(7f),dp(5f))})
            root.addView(r)
        }
        pairRow("▣  Área de transferência",{pasteClipboard()},"☺  Emoji",{
            toolsPanelMode=false;emojiMode=true;symbols=false;rebuild()
        })
        pairRow("☝  Uma mão",{
            val m=Prefs.keyboardMode(this)
            Prefs.setKeyboardMode(this,when(m){"right"->"left";"left"->"normal";else->"right"})
            toolsPanelMode=false;rebuild()
        },"↔  Edição de texto",{
            toolsPanelMode=false;textEditMode=true;rebuild()
        })
        pairRow("⌁  Compartilhar ViaKey",{shareViaKey()},"▣  Redimensionar",{
            toolsPanelMode=false;resizePanelMode=true;rebuild()
        })
        pairRow("⌨  Flutuante",{
            Prefs.setKeyboardMode(this,"compact");toolsPanelMode=false;rebuild()
        },"↶  Desfazer",{editorMenuAction(android.R.id.undo)})

        val last=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL}
        last.addView(toolTile(p,"!  Feedback / ajustes",{openSettings()}),
            LinearLayout.LayoutParams(0,dp(46f*scale),1f).apply{setMargins(dp(7f),dp(5f),dp(7f),dp(5f))})
        root.addView(last)
    }

    private fun sendNavKey(code:Int){
        currentInputConnection?.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN,code))
        currentInputConnection?.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,code))
    }

    private fun addTextEditPanel(p:ThemeUtil.Palette,scale:Float){
        root.addView(TextView(this).apply{
            text="Edição de texto";textSize=16f;gravity=Gravity.CENTER;setTextColor(p.secondaryText)
        },LinearLayout.LayoutParams(-1,dp(36f*scale)))

        fun actionRow(vararg items:Pair<String,()->Unit>){
            val r=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL}
            items.forEach{(label,action)->
                r.addView(toolTile(p,label,action),LinearLayout.LayoutParams(0,dp(48f*scale),1f).apply{
                    setMargins(dp(4f),dp(4f),dp(4f),dp(4f))
                })
            }
            root.addView(r)
        }
        actionRow(
            "←" to {sendNavKey(KeyEvent.KEYCODE_DPAD_LEFT)},
            "→" to {sendNavKey(KeyEvent.KEYCODE_DPAD_RIGHT)},
            "↑" to {sendNavKey(KeyEvent.KEYCODE_DPAD_UP)},
            "↓" to {sendNavKey(KeyEvent.KEYCODE_DPAD_DOWN)}
        )
        actionRow(
            "Selecionar tudo" to {editorMenuAction(android.R.id.selectAll)},
            "Copiar" to {editorMenuAction(android.R.id.copy)},
            "Colar" to {editorMenuAction(android.R.id.paste)}
        )
        actionRow("Voltar" to {textEditMode=false;toolsPanelMode=true;rebuild()})
    }

    private fun addResizePanel(p:ThemeUtil.Palette,scale:Float){
        root.addView(TextView(this).apply{
            text="Redimensionar teclado";textSize=17f;gravity=Gravity.CENTER;setTextColor(p.text)
        },LinearLayout.LayoutParams(-1,dp(38f*scale)))

        fun control(label:String,value:()->Int,minus:()->Unit,plus:()->Unit){
            val r=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER_VERTICAL}
            r.addView(TextView(this).apply{
                text=label+"  "+value()+"%";textSize=15f;setTextColor(p.text);gravity=Gravity.CENTER_VERTICAL
            },LinearLayout.LayoutParams(0,dp(46f*scale),1f).apply{leftMargin=dp(14f)})
            r.addView(toolTile(p,"−",minus),LinearLayout.LayoutParams(dp(58f),dp(42f*scale)).apply{setMargins(dp(3f),dp(2f),dp(3f),dp(2f))})
            r.addView(toolTile(p,"+",plus),LinearLayout.LayoutParams(dp(58f),dp(42f*scale)).apply{setMargins(dp(3f),dp(2f),dp(9f),dp(2f))})
            root.addView(r)
        }

        control("Altura",{(Prefs.heightScale(this)*100).roundToInt()},{
            Prefs.setHeightScale(this,(Prefs.heightScale(this)-.05f).coerceAtLeast(.70f));rebuild()
        },{
            Prefs.setHeightScale(this,(Prefs.heightScale(this)+.05f).coerceAtMost(1.40f));rebuild()
        })
        control("Largura",{(Prefs.widthScale(this)*100).roundToInt()},{
            Prefs.setWidthScale(this,(Prefs.widthScale(this)-.04f).coerceAtLeast(.80f));rebuild()
        },{
            Prefs.setWidthScale(this,(Prefs.widthScale(this)+.04f).coerceAtMost(1f));rebuild()
        })
        control("Teclas",{(Prefs.keyHeightScale(this)*100).roundToInt()},{
            Prefs.setKeyHeightScale(this,(Prefs.keyHeightScale(this)-.05f).coerceAtLeast(.75f));rebuild()
        },{
            Prefs.setKeyHeightScale(this,(Prefs.keyHeightScale(this)+.05f).coerceAtMost(1.35f));rebuild()
        })

        val actions=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL}
        actions.addView(toolTile(p,"Redefinir",{
            Prefs.applyProfile(this,"normal");rebuild()
        }),LinearLayout.LayoutParams(0,dp(46f*scale),1f).apply{setMargins(dp(7f),dp(7f),dp(4f),dp(7f))})
        actions.addView(toolTile(p,"Concluído",{
            resizePanelMode=false;toolsPanelMode=true;rebuild()
        }),LinearLayout.LayoutParams(0,dp(46f*scale),1f).apply{setMargins(dp(4f),dp(7f),dp(7f),dp(7f))})
        root.addView(actions)
    }

    private fun shareViaKey(){
        runCatching{
            val send=Intent(Intent.ACTION_SEND).apply{
                type="text/plain"
                putExtra(Intent.EXTRA_TEXT,"ViaKey AI — teclado inteligente para Android")
            }
            startActivity(Intent.createChooser(send,"Compartilhar ViaKey").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        }
    }

'''
s=s[:insert_pos]+panel_code+s[insert_pos:]

p.write_text(s)

for needle,text in [
    ('0.3.5',(ROOT/'app/build.gradle.kts').read_text()),
    ('Área de transferência',s),
    ('Redimensionar teclado',s),
    ('?123',s),
    ('addResizePanel',s)
]:
    if needle not in text: raise SystemExit("sanity failed: "+needle)

print("ViaKey 0.3.5 tools + resize applied")
