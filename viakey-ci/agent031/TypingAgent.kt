package com.mova.viakey

import android.content.Context
import java.text.Normalizer
import java.util.Locale
import kotlin.math.abs
import kotlin.math.ln

/**
 * ViaKey Typing Agent 1.0
 *
 * One local agent dedicated to typing quality. It orchestrates SmartCore
 * suggestions/corrections, applies conservative guardrails and adapts its
 * confidence to corrections the user accepts or rejects. No typed text is
 * sent to a server.
 */
object TypingAgent {
    private const val FILE = "viakey_typing_agent_v1"
    private const val MAX_PAIRS = 350

    data class Decision(
        val correction: String?,
        val confidence: Double,
        val reason: String,
        val shouldApply: Boolean
    )

    private fun normalize(value: String): String =
        Normalizer.normalize(value.lowercase(Locale.ROOT), Normalizer.Form.NFD)
            .replace(Regex("\\p{Mn}+"), "")
            .replace('ç', 'c')
            .replace('ñ', 'n')
            .trim()

    fun suggestions(
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

    fun nextWords(context: Context, previous: String, tag: String, limit: Int = 6): List<String> =
        SuggestionEngine.nextWords(context, previous, tag).take(limit)

    fun decideCorrection(context: Context, typed: String, previous: String, tag: String): Decision {
        val token = typed.trim()
        if (token.length < 2) return Decision(null, 0.0, "token_curto", false)
        if (looksProtected(token)) return Decision(null, 0.0, "token_especial", false)

        val smart = SuggestionEngine.correct(context, token, previous, tag)
            ?: return Decision(null, 0.0, "sem_candidato", false)

        val candidate = smart.value
        if (normalize(candidate) == normalize(token) && candidate.equals(token, ignoreCase = true)) {
            return Decision(null, smart.confidence, "ja_valido", false)
        }

        val pairKey = "${normalize(token)}\u001F${normalize(candidate)}"
        val stats = loadStats(context)[pairKey]
        val applied = stats?.first ?: 0
        val rejected = stats?.second ?: 0
        val trustBoost = ln(1.0 + applied) * 0.025 - ln(1.0 + rejected) * 0.10
        val adjusted = (smart.confidence + trustBoost).coerceIn(0.0, 0.995)

        val lengthDelta = abs(candidate.length - token.length)
        val hasContext = previous.isNotBlank()
        val baseThreshold = when {
            token.length <= 3 -> 0.88
            hasContext -> 0.68
            else -> 0.74
        }
        val rejectionPenalty = (rejected * 0.025).coerceAtMost(0.16)
        val threshold = (baseThreshold + rejectionPenalty).coerceAtMost(0.94)

        val safeShape = lengthDelta <= when {
            token.length <= 4 -> 1
            token.length <= 8 -> 2
            else -> 3
        }
        val apply = safeShape && adjusted >= threshold
        val reason = when {
            !safeShape -> "mudanca_grande"
            rejected >= 2 -> "usuario_rejeitou_antes"
            hasContext && apply -> "contexto_confiante"
            apply -> "correcao_confiante"
            else -> "confianca_baixa"
        }
        return Decision(candidate, adjusted, reason, apply)
    }

    fun recordApplied(context: Context, original: String, correction: String) {
        updatePair(context, original, correction, rejected = false)
    }

    fun recordRejected(context: Context, original: String, correction: String) {
        updatePair(context, original, correction, rejected = true)
    }

    fun clear(context: Context) {
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE).edit().clear().apply()
    }

    private fun looksProtected(token: String): Boolean {
        if (token.contains('@') || token.contains('/') || token.contains(':')) return true
        if (token.any { it.isDigit() }) return true
        if (token.any { !it.isLetter() && it != '\'' && it != '-' }) return true
        val letters = token.filter { it.isLetter() }
        if (letters.length in 2..6 && letters.all { it.isUpperCase() }) return true
        val internalCaps = letters.drop(1).count { it.isUpperCase() }
        return internalCaps >= 2
    }

    private fun updatePair(context: Context, original: String, correction: String, rejected: Boolean) {
        val a = normalize(original)
        val b = normalize(correction)
        if (a.isBlank() || b.isBlank() || a == b) return
        val prefs = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
        val map = loadStats(context).toMutableMap()
        val key = "$a\u001F$b"
        val old = map[key] ?: (0 to 0)
        map[key] = if (rejected) old.first to (old.second + 1) else (old.first + 1) to old.second
        if (map.size > MAX_PAIRS) {
            map.entries.sortedBy { it.value.first + it.value.second }.take(map.size - MAX_PAIRS).forEach { map.remove(it.key) }
        }
        val raw = map.entries.joinToString("\n") { (k, v) -> "$k\t${v.first}\t${v.second}" }
        prefs.edit().putString("pairs", raw).apply()
    }

    private fun loadStats(context: Context): Map<String, Pair<Int, Int>> {
        val raw = context.getSharedPreferences(FILE, Context.MODE_PRIVATE).getString("pairs", "").orEmpty()
        if (raw.isBlank()) return emptyMap()
        val out = LinkedHashMap<String, Pair<Int, Int>>()
        raw.lineSequence().forEach { line ->
            val parts = line.split('\t')
            if (parts.size == 3) {
                val applied = parts[1].toIntOrNull() ?: return@forEach
                val rejected = parts[2].toIntOrNull() ?: return@forEach
                out[parts[0]] = applied to rejected
            }
        }
        return out
    }
}
