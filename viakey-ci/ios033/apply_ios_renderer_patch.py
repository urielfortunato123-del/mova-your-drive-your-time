from pathlib import Path
import re

ROOT = Path("/tmp/viakey-build")
JAVA = ROOT / "app/src/main/java/com/mova/viakey"

def sub1(text, pattern, repl, label, flags=0):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f"Design patch failed [{label}]")
    return out

# Version / isolated package.
p = ROOT / "app/build.gradle.kts"
s = p.read_text()
s = re.sub(r'versionCode\s*=\s*\d+', 'versionCode = 13', s, count=1)
s = re.sub(r'versionName\s*=\s*"[^"]+"', 'versionName = "0.3.3"', s, count=1)
s = re.sub(r'applicationIdSuffix\s*=\s*"[^"]+"', 'applicationIdSuffix = ".ios033"', s, count=1)
s = re.sub(r'versionNameSuffix\s*=\s*"[^"]+"', 'versionNameSuffix = "-ios"', s, count=1)
s = re.sub(r'manifestPlaceholders\["appLabel"\]\s*=\s*"ViaKey AI [^"]+"',
           'manifestPlaceholders["appLabel"] = "ViaKey AI iOS 0.3.3"', s, count=1)
p.write_text(s)

for name in ("MainActivity.kt", "SettingsActivity.kt"):
    p = JAVA / name
    s = p.read_text().replace("0.3.2", "0.3.3").replace("0.3.1", "0.3.3")
    p.write_text(s)

p = JAVA / "ViaKeyService.kt"
s = p.read_text()

# Renderer imports.
if 'android.graphics.drawable.InsetDrawable' not in s:
    s = s.replace(
        'import android.graphics.drawable.GradientDrawable\n',
        'import android.graphics.drawable.GradientDrawable\nimport android.graphics.drawable.InsetDrawable\nimport android.graphics.drawable.LayerDrawable\nimport android.graphics.drawable.StateListDrawable\n'
    )

# Adaptive geometry: the exact old numeric value is intentionally ignored.
s = sub1(
    s,
    r'\s{8}val keyHeight=[^\n]+\n\s{8}val gap=dp\(Prefs\.keyGap\(this\)\.toFloat\(\)\)\n',
    '''        val screenDp=resources.configuration.screenWidthDp
        val baseKeyHeight=when { screenDp<=360->46.5f; screenDp<=400->47.5f; screenDp<=460->48.5f; else->49.5f }
        val keyHeight=baseKeyHeight*scale*Prefs.keyHeightScale(this)
        // Logical key cells touch each other. The visible spacing is rendered
        // inside each cell, eliminating untouchable strips between keys.
        val gap=dp(Prefs.keyGap(this).toFloat().coerceIn(2f,4f))
''',
    "adaptive-geometry"
)
s = re.sub(r'val baseBottom=dp\(if\(mode=="normal"\) \d+(?:\.\d+)?f else \d+(?:\.\d+)?f\)',
           'val baseBottom=dp(if(mode=="normal") 4f else 8f', s, count=1)
s = re.sub(r'background=rounded\(p\.background,if\(mode=="normal"\)[^\n]+\)',
           'background=rounded(p.background,if(mode=="normal")18f else 22f)', s, count=1)

# Slim iOS-like suggestion strip.
s = re.sub(r'background=rounded\(p\.panel,\d+(?:\.\d+)?f\)', 'background=rounded(p.panel,16f)', s, count=1)
s = re.sub(r'setPadding\([^\n]+\)\n\s*}', 'setPadding(dp(2f),0,dp(2f),0)\n        }', s, count=1)
s = re.sub(r'root\.addView\(row,LinearLayout\.LayoutParams\(-1,dp\(\d+(?:\.\d+)?f\*scale\)\)\.apply\{[^\n]*\}\)',
           'root.addView(row,LinearLayout.LayoutParams(-1,dp(40f*scale)).apply{leftMargin=dp(4f); rightMargin=dp(4f); bottomMargin=dp(3f)})',
           s, count=1)
s = re.sub(r'background=if\(accent\)rounded\(p\.accent,\d+(?:\.\d+)?f\) else null',
           'background=if(accent)rounded(p.accent,13f) else null', s, count=1)

# Physical row proportions.
s = s.replace('LinearLayout.LayoutParams(0,dp(keyHeight),.5f)', 'LinearLayout.LayoutParams(0,dp(keyHeight),.46f)')
s = s.replace('LinearLayout.LayoutParams(0,dp(keyHeight),.44f)', 'LinearLayout.LayoutParams(0,dp(keyHeight),.46f)')
s = re.sub(r'val weight=if\(!symbols && \(label=="⇧"\|\|label=="⌫"\)\)\d+(?:\.\d+)?f else 1f',
           'val weight=if(!symbols && (label=="⇧"||label=="⌫"))1.30f else 1f', s, count=1)

# Replace the entire keyButton function with the renderer-backed variant.
s = sub1(
    s,
    r'    private fun keyButton\(label:CharSequence,bg:Int,fg:Int,font:Float,height:Float,action:\(\)->Unit\)=TextView\(this\)\.apply\{.*?\n    private fun press',
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
    }

    private fun press''',
    "key-button",
    re.S
)

# Replace press function regardless of the previous animation implementation.
s = sub1(
    s,
    r'    private fun press\(v:View,on:Boolean\)\{.*?\n    \}\n    private fun toolButton',
    '''    private fun press(v:View,on:Boolean){
        v.animate().cancel()
        // Never shrink the logical touch target under the finger.
        v.translationY=if(on) dp(.55f).toFloat() else 0f
        v.alpha=if(on) .985f else 1f
        v.scaleX=1f;v.scaleY=1f
    }
    private fun toolButton''',
    "press-feedback",
    re.S
)

# Replace logical margins with full cells, then draw the visual gap inside.
s = sub1(
    s,
    r'    private fun weightedParams\(weight:Float,height:Float,gap:Int\)=.*?\n    private fun rounded\(color:Int,radius:Float\)=GradientDrawable\(\)\.apply\{setColor\(color\);cornerRadius=dp\(radius\)\.toFloat\(\)\}\n',
    '''    private fun weightedParams(weight:Float,height:Float,gap:Int)=LinearLayout.LayoutParams(0,dp(height),weight)
    private fun rounded(color:Int,radius:Float)=GradientDrawable().apply{setColor(color);cornerRadius=dp(radius).toFloat()}

    /**
     * ViaKey Key Renderer v1
     * Visible keycap and logical hit area are deliberately different sizes.
     */
    private fun iosKeyDrawable(color:Int):StateListDrawable{
        val p=ThemeUtil.palette(this)
        val dark=ThemeUtil.isDark(this)
        val corner=dp(7.2f).toFloat()
        val xInset=dp(1.25f)
        val yInset=dp(1.75f)

        fun face(faceColor:Int, pressed:Boolean):InsetDrawable{
            val shadow=GradientDrawable().apply{
                setColor(if(dark) Color.argb(if(pressed)18 else 72,0,0,0) else Color.argb(if(pressed)14 else 58,0,0,0))
                cornerRadius=corner
            }
            val cap=GradientDrawable().apply{
                setColor(faceColor)
                cornerRadius=corner
                setStroke(dp(.30f),if(dark)Color.argb(36,255,255,255) else Color.argb(24,0,0,0))
            }
            val layers=LayerDrawable(arrayOf(shadow,cap)).apply{
                setLayerInset(0,0,dp(if(pressed).2f else 1.3f),0,0)
                setLayerInset(1,0,0,0,dp(if(pressed).7f else 1.7f))
            }
            return InsetDrawable(layers,xInset,yInset,xInset,yInset)
        }

        val pressedColor=if(color==p.key)p.keyPressed else blend(color,p.keyPressed,.26f)
        return StateListDrawable().apply{
            addState(intArrayOf(android.R.attr.state_pressed),face(pressedColor,true))
            addState(intArrayOf(),face(color,false))
        }
    }

    private fun blend(a:Int,b:Int,t:Float):Int{
        val u=t.coerceIn(0f,1f);val v=1f-u
        return Color.argb(
            (Color.alpha(a)*v+Color.alpha(b)*u).roundToInt(),
            (Color.red(a)*v+Color.red(b)*u).roundToInt(),
            (Color.green(a)*v+Color.green(b)*u).roundToInt(),
            (Color.blue(a)*v+Color.blue(b)*u).roundToInt()
        )
    }
''',
    "key-renderer",
    re.S
)

# Same material for the key popup.
s = s.replace('background=rounded(p.key,14f)', 'background=iosKeyDrawable(p.key)')
s = s.replace('bubble.background=rounded(p.key,10f)', 'bubble.background=iosKeyDrawable(p.key)')
s = s.replace('val w=dp(56f); val h=dp(64f)', 'val w=dp(54f); val h=dp(62f)')
s = s.replace('val w=dp(56f);val h=dp(64f)', 'val w=dp(54f);val h=dp(62f)')

p.write_text(s)
print("ViaKey 0.3.3 iOS Key Renderer patch applied.")
