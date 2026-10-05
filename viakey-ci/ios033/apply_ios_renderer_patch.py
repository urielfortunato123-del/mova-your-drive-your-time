from pathlib import Path

ROOT = Path("/tmp/viakey-build")
JAVA = ROOT / "app/src/main/java/com/mova/viakey"

def must(text, old, new, label):
    if old not in text:
        raise SystemExit(f"Design patch failed [{label}]")
    return text.replace(old, new, 1)

# Version / isolated package.
p = ROOT / "app/build.gradle.kts"
s = p.read_text()
s = s.replace('versionCode = 12', 'versionCode = 13')
s = s.replace('versionName = "0.3.2"', 'versionName = "0.3.3"')
s = s.replace('applicationIdSuffix = ".smooth032"', 'applicationIdSuffix = ".ios033"')
s = s.replace('versionNameSuffix = "-smooth"', 'versionNameSuffix = "-ios"')
s = s.replace('ViaKey AI Smooth 0.3.2', 'ViaKey AI iOS 0.3.3')
p.write_text(s)

# Main/settings labels.
for name in ("MainActivity.kt", "SettingsActivity.kt"):
    p = JAVA / name
    s = p.read_text().replace("0.3.2", "0.3.3")
    p.write_text(s)

p = JAVA / "ViaKeyService.kt"
s = p.read_text()

# Renderer imports.
if 'android.graphics.drawable.InsetDrawable' not in s:
    s = s.replace(
        'import android.graphics.drawable.GradientDrawable\n',
        'import android.graphics.drawable.GradientDrawable\nimport android.graphics.drawable.InsetDrawable\nimport android.graphics.drawable.LayerDrawable\nimport android.graphics.drawable.StateListDrawable\n'
    )

# Adaptive physical geometry.
s = must(
    s,
    '        val keyHeight=50.5f*scale*Prefs.keyHeightScale(this)\n        val gap=dp(Prefs.keyGap(this).toFloat())\n',
    '''        val screenDp=resources.configuration.screenWidthDp
        val baseKeyHeight=when { screenDp<=360->46.5f; screenDp<=400->47.5f; screenDp<=460->48.5f; else->49.5f }
        val keyHeight=baseKeyHeight*scale*Prefs.keyHeightScale(this)
        // The logical cell fills the entire row. Visual spacing is drawn inside
        // the cell, so there are no dead strips between neighbouring keys.
        val gap=dp(Prefs.keyGap(this).toFloat().coerceIn(2f,4f))
''',
    "adaptive-geometry"
)
s = s.replace('        val baseBottom=dp(if(mode=="normal") 7f else 11f)', '        val baseBottom=dp(if(mode=="normal") 4f else 8f)')
s = s.replace('background=rounded(p.background,if(mode=="normal")0f else 18f)', 'background=rounded(p.background,if(mode=="normal")18f else 22f)')

# Slimmer iOS-like suggestion strip.
s = s.replace('background=rounded(p.panel,14f)', 'background=rounded(p.panel,16f)')
s = s.replace('setPadding(gap,0,gap,0)', 'setPadding(dp(2f),0,dp(2f),0)')
s = s.replace('LinearLayout.LayoutParams(-1,dp(46f*scale))', 'LinearLayout.LayoutParams(-1,dp(40f*scale))')
s = s.replace('root.addView(row,LinearLayout.LayoutParams(-1,dp(40f*scale)).apply{bottomMargin=gap})', 'root.addView(row,LinearLayout.LayoutParams(-1,dp(40f*scale)).apply{leftMargin=dp(4f); rightMargin=dp(4f); bottomMargin=dp(3f)})')
s = s.replace('background=if(accent)rounded(p.accent,10f) else null', 'background=if(accent)rounded(p.accent,13f) else null')

# Row proportions closer to the physical reference.
s = s.replace('LinearLayout.LayoutParams(0,dp(keyHeight),.5f)', 'LinearLayout.LayoutParams(0,dp(keyHeight),.46f)')
s = s.replace('val weight=if(!symbols && (label=="⇧"||label=="⌫"))1.5f else 1f', 'val weight=if(!symbols && (label=="⇧"||label=="⌫"))1.30f else 1f')

# Key typography.
s = must(
    s,
    '    private fun keyButton(label:CharSequence,bg:Int,fg:Int,font:Float,height:Float,action:()->Unit)=TextView(this).apply{text=label;textSize=font;gravity=Gravity.CENTER;setTextColor(fg);background=rounded(bg,9f);elevation=dp(3f).toFloat();setPadding(dp(2f),0,dp(2f),0);setOnTouchListener{v,e->when(e.actionMasked){MotionEvent.ACTION_DOWN->{press(v,true);feedback();if(label.length==1&&label[0].isLetterOrDigit())showKeyPreview(this,label.toString())};MotionEvent.ACTION_UP,MotionEvent.ACTION_CANCEL->{hideKeyPreview();press(v,false)}};false};setOnClickListener{lastAutoCorrection=null;action();manualSuggestions=emptyList()}}',
    '''    private fun keyButton(label:CharSequence,bg:Int,fg:Int,font:Float,height:Float,action:()->Unit)=TextView(this).apply{
        text=label
        textSize=font
        gravity=Gravity.CENTER
        setTextColor(fg)
        typeface=Typeface.create("sans-serif-medium",Typeface.NORMAL)
        letterSpacing=0f
        background=iosKeyDrawable(bg)
        elevation=0f
        setPadding(dp(.5f),0,dp(.5f),0)
        includeFontPadding=false
        setOnTouchListener{v,e->when(e.actionMasked){MotionEvent.ACTION_DOWN->{press(v,true);feedback();if(label.length==1&&label[0].isLetterOrDigit())showKeyPreview(this,label.toString())};MotionEvent.ACTION_UP,MotionEvent.ACTION_CANCEL->{hideKeyPreview();press(v,false)}};false}
        setOnClickListener{lastAutoCorrection=null;action();manualSuggestions=emptyList()}
    }''',
    "key-button"
)

# Press feedback: no shrinking hit target.
old_press = '''    private fun press(v:View,on:Boolean){
        v.animate().cancel()
        if(on){
            v.translationY=dp(1.5f).toFloat();v.scaleX=.985f;v.scaleY=.985f;v.alpha=.92f
        }else{
            v.translationY=0f;v.scaleX=1f;v.scaleY=1f;v.alpha=1f
        }
    }
'''
new_press = '''    private fun press(v:View,on:Boolean){
        v.animate().cancel()
        v.translationY=if(on) dp(.55f).toFloat() else 0f
        v.alpha=if(on) .985f else 1f
        v.scaleX=1f;v.scaleY=1f
    }
'''
s = must(s, old_press, new_press, "press-feedback")

# Replace margin-based buttons with continuous hit cells + inset keycaps.
old_renderer = '''    private fun weightedParams(weight:Float,height:Float,gap:Int)=LinearLayout.LayoutParams(0,dp(height),weight).apply{setMargins(gap/2,gap/2,gap/2,gap/2)}
    private fun rounded(color:Int,radius:Float)=GradientDrawable().apply{setColor(color);cornerRadius=dp(radius).toFloat()}
'''
new_renderer = '''    private fun weightedParams(weight:Float,height:Float,gap:Int)=LinearLayout.LayoutParams(0,dp(height),weight)
    private fun rounded(color:Int,radius:Float)=GradientDrawable().apply{setColor(color);cornerRadius=dp(radius).toFloat()}

    /**
     * ViaKey Key Renderer v1.
     * The View fills the whole logical cell, while only the visible keycap is
     * inset. Fast taps landing in the visual gap still belong to a real key.
     */
    private fun iosKeyDrawable(color:Int):StateListDrawable{
        val p=ThemeUtil.palette(this)
        val dark=ThemeUtil.isDark(this)
        val corner=dp(7.2f).toFloat()
        val xInset=dp(1.25f)
        val yInset=dp(1.75f)

        fun face(faceColor:Int, pressed:Boolean):InsetDrawable{
            val shadow=GradientDrawable().apply{
                setColor(if(dark) Color.argb(if(pressed) 18 else 72,0,0,0) else Color.argb(if(pressed) 14 else 58,0,0,0))
                cornerRadius=corner
            }
            val cap=GradientDrawable().apply{
                setColor(faceColor)
                cornerRadius=corner
                setStroke(dp(.30f), if(dark) Color.argb(36,255,255,255) else Color.argb(24,0,0,0))
            }
            val layers=LayerDrawable(arrayOf(shadow,cap)).apply{
                setLayerInset(0,0,dp(if(pressed) .2f else 1.3f),0,0)
                setLayerInset(1,0,0,0,dp(if(pressed) .7f else 1.7f))
            }
            return InsetDrawable(layers,xInset,yInset,xInset,yInset)
        }

        val pressedColor=if(color==p.key) p.keyPressed else blend(color,p.keyPressed,.26f)
        return StateListDrawable().apply{
            addState(intArrayOf(android.R.attr.state_pressed),face(pressedColor,true))
            addState(intArrayOf(),face(color,false))
        }
    }

    private fun blend(a:Int,b:Int,t:Float):Int{
        val u=t.coerceIn(0f,1f); val v=1f-u
        return Color.argb(
            (Color.alpha(a)*v+Color.alpha(b)*u).roundToInt(),
            (Color.red(a)*v+Color.red(b)*u).roundToInt(),
            (Color.green(a)*v+Color.green(b)*u).roundToInt(),
            (Color.blue(a)*v+Color.blue(b)*u).roundToInt()
        )
    }
'''
s = must(s, old_renderer, new_renderer, "key-renderer")

# Preview uses the same key material.
s = s.replace('background=rounded(p.key,14f)', 'background=iosKeyDrawable(p.key)')
s = s.replace('val w=dp(56f); val h=dp(64f)', 'val w=dp(54f); val h=dp(62f)')

p.write_text(s)
print("ViaKey 0.3.3 iOS Key Renderer patch applied.")
