import { hasEmbeddedWordStructure, Lexer, MAX_SYNTAX_NESTING } from "./lexer.js";
import { parse, parseRegion } from "./parser.js";
/**
 * Compute the structural parts of a word by re-scanning the source.
 * This is the "cold path" — only called when consumers actually need parts.
 *
 * Returns undefined for simple words (no quotes, expansions, or special structure).
 */
export function computeWordParts(source, word, depth = 0) {
    // Bound the re-lex to the word's span. A word inside a substitution script carries the
    // whole original as its source, so an unbounded scan would overrun the word into an
    // adjacent delimiter (e.g. a backtick or `)` immediately after it). For top-level words
    // word.end is the natural boundary, so the bound is a no-op.
    const lexer = new Lexer(source, word.pos, word.end);
    lexer._nestingDepth = depth;
    const parts = lexer.buildWordParts(word.pos);
    if (!parts)
        return undefined;
    resolveCollected(lexer);
    return parts;
}
/** Compute structural parts for a word-like span that may contain shell operators or whitespace. */
export function computeEmbeddedWordParts(source, word, depth = 0) {
    if (!hasEmbeddedWordStructure(source, word.pos, word.end))
        return undefined;
    const lexer = new Lexer(source, word.pos, word.end);
    lexer._nestingDepth = depth;
    const parts = lexer.buildEmbeddedWordParts(word.pos);
    if (!parts)
        return undefined;
    resolveCollected(lexer);
    return parts;
}
/**
 * Compute parts for an unquoted heredoc body.
 * Heredoc bodies use different scanning rules than shell words: newlines are
 * literal and single/double quotes have no special meaning.
 */
export function computeHereDocBodyParts(source, word, depth = 0) {
    const lexer = new Lexer(source, word.pos, word.end);
    lexer._nestingDepth = depth;
    const parts = lexer.buildHereDocParts(word.pos, word.end);
    if (!parts)
        return undefined;
    resolveCollected(lexer);
    return parts;
}
/**
 * Resolve each collected substitution's inner script. The script is parsed *in place*
 * against the original source over the window [innerStart, innerStart + inner.length),
 * so every node is born with absolute pos/end — no slicing, no re-basing — and nested
 * substitutions compose because deeper words re-lex the original on demand.
 *
 * Escaped backticks rebuild `inner` with the escapes removed, so it is no longer a verbatim
 * substring of the source and carries no innerStart; those parse the rebuilt slice and stay
 * relative to it — the single exception to absolute offsets. Only these scripts carry a
 * non-enumerable `source` property holding the decoded string their positions index.
 */
function resolveCollected(lexer) {
    const source = lexer.getSource();
    for (const [e, innerDepth] of lexer.getCollectedExpansions()) {
        if (e.inner !== undefined) {
            const depth = innerDepth + 1;
            if (depth > MAX_SYNTAX_NESTING + 1) {
                // Past the flagged boundary script — stop descending and leave the
                // substitution unresolved rather than materializing unbounded structure.
            }
            else if (e.innerStart !== undefined) {
                e.script = parseRegion(source, e.innerStart, e.innerStart + e.inner.length, depth);
            }
            else {
                // Escaped-backtick scripts parse from the decoded slice. Each nesting level
                // doubles the escaping, so their depth is bounded by input size already.
                e.script = parse(e.inner);
                Object.defineProperty(e.script, "source", { value: e.inner, enumerable: false });
            }
            e.inner = undefined;
            e.innerStart = undefined;
        }
    }
}
