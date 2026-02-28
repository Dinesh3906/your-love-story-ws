
/**
 * Universal Censorship Utility
 * Designed to obfuscate vulgar and 18+ language while preserving narrative flavor.
 * This is a critical layer for Play Store compliance.
 */

// Comprehensive list of sensitive patterns
// This regex covers thousands of variations (leet-speak, repeating letters, etc.)
const PROFANITY_REGEX = /\b(a[5s][5s]|a[5s][5s]h[o0]l[e3]|b[i1][t7]ch|cl[i1][t7]|c[o0]ck|f[u0u*k]ck|h[o0]rn[y1]|p[o0]rn|p[u0u*s][s5]y|sh[i1][t7]|sl[u0u*t7]|v[a4]g[i1]n[a4]|w[h0]r[e3]|k[i1]nk|l[u0u*s][t7]|n[u0u*]d[e3]|p[e3]n[i1]s|v[i1]rg[i1]n|[o0]rg[a4][s5]m|cum|m[a4][s5][t7][u0u*]rb[a4][t7][e3]|th[r0]e[e3][s5][o0]m[e3]|m[i1]l[f4]|d[i1]l[f4]|n[i1]m?ph[o0]|h[o0][o0]k[e3])\b/gi;

// Secondary list for words that might be parts of other words or need specific matching
const SENSITIVE_WORDS = [
    'sex', 'anal', 'rape', 'penis', 'boob', 'tits', 'naked', 'explicit',
    'nipple', 'vagina', 'clitoris', 'erection', 'threesome', 'foursome',
    'bondage', 'bdsm', 'submissive', 'dominant', 'condom', 'lube',
    'stripping', 'prostitute', 'escort', 'orgasm', 'ejaculation',
    'pedophile', 'incest', 'bestiality', 'beastiality', 'snuff',
    'missionary', 'doggy', 'cowgirl', 'blowjob', 'handjob', 'rimming',
    'facial', 'creampie', 'squirt', 'dildo', 'vibrator', 'masturbate',
    'cumming', 'squirting', 'gangbang', 'deepthroat', 'bukkake', 'swallow',
    'gagging', 'spanking', 'flogging', 'strapon', 'anilingus', 'cunnilingus',
    'ejaculate', 'creampieing', 'squirted', 'penetrate', 'penetration', 'gaping',
    'throbbing', 'glistening', 'moist', 'wetness', 'lubricated', 'undressed',
    'thrust', 'thrusting', 'shuddering', 'climaxing', 'vibrating', 'grinding',
    'pumping', 'dripping', 'gushing', 'clenched', 'aroused', 'hardened'
];

export const censorText = (text: string): string => {
    if (!text) return text;

    let censored = text;

    // 1. Catch spaced vulgarity (e.g., "f u c k") - DO THIS FIRST
    const spacedRegex = /(f\s*[u*]\s*c\s*k|s\s*e\s*x|p\s*[o0*]\s*r\s*n|p\s*[u*]\s*s\s*s\s*y|d\s*[i!1]\s*c\s*k)/gi;
    censored = censored.replace(spacedRegex, (match) => {
        return match[0] + '*'.repeat(match.length - 1);
    });

    // 2. Apply primary regex (catches words with leet-speak and common variations)
    censored = censored.replace(PROFANITY_REGEX, (match) => {
        if (match.length <= 2) return match[0] + '*';
        return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });

    // 3. Apply secondary list for literal matches
    SENSITIVE_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
        censored = censored.replace(regex, (match) => {
            if (match.length <= 2) return match[0] + '*';
            return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
        });
    });

    return censored;
};
