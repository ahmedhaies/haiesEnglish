#!/usr/bin/env python3
"""
Build the per-word visual maps, fully offline (no runtime image requests):

  data/emoji.json  word -> emoji character   (colorful, instantly recognizable)
  data/icons.json  word -> SVG path 'd'      (Material Design line icon, tinted)

Every word that names something depictable gets a meaningful picture; the app
falls back to a clean lettered tile for the rest, so no card is ever bare.

Sources (all fetched from GitHub / npm, then bundled — see build note):
  * OpenMoji annotations + tags   (hfg-gmuend/openmoji)
  * emojilib keywords             (muan/emojilib)
  * Material Design Icons         (@mdi/svg  — 7400+ named icons)

Matching is deliberately strict (exact name / lemma / synonym) so a learner
never sees a misleading image; a plain tile is better than a wrong picture.

Run: python3 scripts/build_visuals.py --src <work-dir> --out data
     <work-dir> must contain: emojilib.json, openmoji.json, package/ (@mdi/svg)
"""
import argparse, json, os, re

# High-value hand picks (win over everything — guarantee good picks for the
# most common words).
OVERRIDES = {
    "run": "🏃", "walk": "🚶", "eat": "🍽️", "drink": "🥤", "sleep": "😴",
    "water": "💧", "fire": "🔥", "book": "📖", "time": "⏰", "love": "❤️",
    "house": "🏠", "home": "🏡", "car": "🚗", "money": "💰", "food": "🍔",
    "music": "🎵", "phone": "📱", "computer": "💻", "school": "🏫", "work": "💼",
    "sun": "☀️", "moon": "🌙", "star": "⭐", "tree": "🌳", "flower": "🌸",
    "dog": "🐶", "cat": "🐱", "bird": "🐦", "fish": "🐟", "heart": "❤️",
    "hand": "✋", "eye": "👁️", "smile": "😊", "happy": "😄", "sad": "😢",
    "angry": "😠", "laugh": "😂", "cry": "😭", "think": "🤔", "idea": "💡",
    "read": "📚", "write": "✍️", "speak": "🗣️", "listen": "👂", "look": "👀",
    "buy": "🛒", "sell": "🏷️", "pay": "💳", "travel": "✈️", "fly": "✈️",
    "rain": "🌧️", "snow": "❄️", "wind": "💨", "cloud": "☁️", "sky": "🌌",
    "sea": "🌊", "ocean": "🌊", "beach": "🏖️", "mountain": "⛰️", "river": "🏞️",
    "city": "🏙️", "world": "🌍", "earth": "🌍", "map": "🗺️", "road": "🛣️",
    "king": "🤴", "queen": "👸", "baby": "👶", "family": "👨‍👩‍👧‍👦", "friend": "🤝",
    "man": "👨", "woman": "👩", "boy": "👦", "girl": "👧", "people": "👥",
    "coffee": "☕", "tea": "🍵", "bread": "🍞", "apple": "🍎", "egg": "🥚",
    "meat": "🍖", "milk": "🥛", "fruit": "🍓", "cake": "🍰", "rice": "🍚",
    "clock": "🕐", "key": "🔑", "door": "🚪", "window": "🪟", "light": "💡",
    "color": "🎨", "art": "🎨", "game": "🎮", "sport": "⚽", "ball": "⚽",
    "war": "⚔️", "peace": "☮️", "health": "🩺", "doctor": "👨‍⚕️", "medicine": "💊",
    "science": "🔬", "space": "🚀", "rocket": "🚀", "robot": "🤖", "camera": "📷",
    "letter": "✉️", "mail": "📧", "gift": "🎁", "party": "🎉", "birthday": "🎂",
    "night": "🌃", "day": "🌤️", "morning": "🌅", "winter": "⛄", "summer": "🏝️",
    "language": "💬", "word": "🔤", "question": "❓", "answer": "✅", "problem": "⚠️",
    "power": "⚡", "energy": "⚡", "strong": "💪", "fast": "⚡", "slow": "🐌",
    "hot": "🔥", "cold": "🧊", "new": "🆕", "big": "🐘", "small": "🐜",
    "win": "🏆", "lose": "❌", "goal": "🎯", "success": "🌟", "dream": "💭",
    "future": "🔮", "past": "⏳", "learn": "🎓", "teach": "🧑‍🏫", "study": "📖",
    "understand": "💡", "remember": "🧠", "know": "🧠", "help": "🆘", "care": "🤲",
    "beautiful": "🌸", "clean": "🧼", "dirty": "🧹", "open": "🔓", "close": "🔒",
    "true": "✔️", "false": "✖️", "yes": "👍", "no": "👎", "stop": "🛑", "go": "🟢",
}

DEPICTABLE = {"n", "v", "adj"}

# Homograph / slang traps: the frequent meaning is NOT the depictable one, so an
# auto match would mislead. Force a clean tile for these.
SKIP_WORDS = {
    "saw", "means", "mean", "rule", "resume", "stole", "guy", "suit", "will",
    "may", "march", "spring", "fall", "bat", "club", "match", "second", "back",
    "part", "present", "patient", "kind", "fine", "well", "left", "right",
    "point", "state", "case", "company", "party", "act", "play", "shot", "board",
    "capital", "check", "date", "fair", "figure", "iron", "letter", "letters",
    "note", "novel", "object", "order", "period", "press", "race",
    "scale", "sign", "single", "spot",
    "square", "stamp", "story", "trip", "type", "wave",
    "board", "block", "bill", "bar", "bow", "can", "cross", "fan", "file",
    "jam", "key", "mine", "nail", "pitch", "pool", "post", "roll", "seal",
    "sink", "tie", "tip", "trunk", "well", "yard", "bank", "bark", "beam",
}
# Icons whose only MDI match is a wrong/UI meaning for the common word sense.
ICON_TRAP = {"resume", "saw", "will", "second", "check", "board", "note", "post"}

# Emoji whose first scalar falls in these ranges are risky as a *noun* picture
# (emoticon / fantasy faces) — skip them in the fuzzy keyword bucket.
FACE_RANGES = [(0x1F600, 0x1F64F), (0x1F470, 0x1F47F), (0x1F910, 0x1F92F),
               (0x1F970, 0x1F9AF)]

# Abstract-noun endings almost never have a correct concrete picture.
ABSTRACT_SUF = ("tion", "sion", "ment", "ness", "ity", "ism", "ance", "ence",
                "ship", "hood", "ology", "ality", "acy", "ancy")


def _scalars(ch):
    return [ord(c) for c in ch if ord(c) > 0x2100]


def emoji_ok(ch, fuzzy=False, noun_tag=False):
    """Reject emoji that tend to render as tofu on older devices, and (for the
    fuzzy keyword bucket) face emoji that mislead as object pictures."""
    cps = _scalars(ch)
    if not cps:
        return True
    if fuzzy and any(0x1FA70 <= c <= 0x1FAFF for c in cps):
        return False   # Symbols & Pictographs Extended-A: newest, tofu-prone
    if noun_tag:
        base = cps[0]
        if any(lo <= base <= hi for lo, hi in FACE_RANGES):
            return False
    return True


def lemmas(w):
    """A few naive base forms so plurals / inflections still match."""
    out = [w]
    for suf, rep in (("ies", "y"), ("ches", "ch"), ("shes", "sh"), ("ses", "s"),
                     ("es", ""), ("s", ""), ("ing", ""), ("ing", "e"),
                     ("ed", ""), ("ed", "e"), ("er", ""), ("est", "")):
        if w.endswith(suf) and len(w) - len(suf) + len(rep) >= 3:
            out.append(w[: len(w) - len(suf)] + rep)
    # de-duplicate, keep order
    seen, res = set(), []
    for x in out:
        if x not in seen:
            seen.add(x); res.append(x)
    return res


def load_emoji_maps(src):
    exact = {}   # name -> emoji  (annotation / canonical keyword)
    tag = {}     # keyword -> emoji
    # OpenMoji: clean annotations + rich tags
    omoji = json.load(open(os.path.join(src, "openmoji.json")))
    for e in omoji:
        if e.get("skintone") or e.get("group") in ("flags",):
            continue
        ch = e.get("emoji", "").strip()
        if not ch:
            continue
        ann = (e.get("annotation") or "").strip().lower()
        if ann and " " not in ann and ann not in exact:
            exact[ann] = ch
        for tg in (e.get("tags") or "").split(","):
            tg = tg.strip().lower()
            if tg and " " not in tg and tg not in tag:
                tag[tg] = ch
    # emojilib: canonical (first keyword) + all keywords
    elib = json.load(open(os.path.join(src, "emojilib.json")))
    for ch, kws in elib.items():
        if not kws:
            continue
        if any("flag" in k for k in kws):
            continue
        canon = kws[0].replace("_", " ").lower()
        if " " not in canon and canon not in exact:
            exact[canon] = ch
        for kw in kws:
            kw = kw.replace("_", " ").lower()
            if kw and " " not in kw and kw not in tag:
                tag[kw] = ch
    return exact, tag


PATH_RE = re.compile(r'\bd="([^"]+)"')


def load_icon_maps(src):
    """name/alias -> svg path 'd' (concatenated sub-paths)."""
    meta = json.load(open(os.path.join(src, "package", "meta.json")))
    svgdir = os.path.join(src, "package", "svg")
    name2path = {}
    alias2name = {}
    for m in meta:
        name = m["name"].lower()
        for a in m.get("aliases", []):
            a = a.lower()
            if " " not in a and a not in alias2name:
                alias2name[a] = name
    icons = {}     # name -> path d
    for m in meta:
        name = m["name"].lower()
        # only single-token names are candidates for word matching
        p = os.path.join(svgdir, m["name"] + ".svg")
        if not os.path.exists(p):
            continue
        svg = open(p, encoding="utf-8").read()
        ds = PATH_RE.findall(svg)
        if not ds:
            continue
        icons[name] = " ".join(ds)
    return icons, alias2name


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=".")
    ap.add_argument("--out", default="data")
    args = ap.parse_args()

    recs = json.load(open(os.path.join(args.out, "words.json")))
    emoji_exact, emoji_tag = load_emoji_maps(args.src)
    icon_path, icon_alias = load_icon_maps(args.src)

    def find_emoji_exact(forms):
        for f in forms:
            if f in emoji_exact:
                return emoji_exact[f]
        return None

    def find_icon_exact(forms):
        for f in forms:
            if f in icon_path:
                return f
            if f in icon_alias and icon_alias[f] in icon_path:
                return icon_alias[f]
        return None

    def find_emoji_tag(forms):
        for f in forms:
            if f in emoji_tag:
                return emoji_tag[f]
        return None

    emoji_out, icon_out = {}, {}
    used_paths = {}   # icon name -> path (only store paths actually used)
    counts = {"override": 0, "emoji_exact": 0, "icon_exact": 0,
              "emoji_syn": 0, "icon_syn": 0, "emoji_tag": 0, "none": 0}

    for r in recs:
        w = r["w"]
        pos = r.get("p", "")
        syns = [s.lower() for s in (r.get("s") or []) if isinstance(s, str)]
        forms = lemmas(w)

        # 1) curated override (emoji) — always wins
        if w in OVERRIDES:
            emoji_out[w] = OVERRIDES[w]; counts["override"] += 1; continue
        # short / function / homograph-trap words: clean tile is clearer
        if len(w) <= 2 or pos not in DEPICTABLE or w in SKIP_WORDS:
            counts["none"] += 1; continue

        # 2) exact emoji (annotation / canonical == word or lemma)
        em = find_emoji_exact(forms)
        if em and emoji_ok(em):
            emoji_out[w] = em; counts["emoji_exact"] += 1; continue
        # 3) exact icon (name / alias == word or lemma)
        ic = find_icon_exact(forms)
        if ic and w not in ICON_TRAP:
            icon_out[w] = ic; used_paths[ic] = icon_path[ic]; counts["icon_exact"] += 1; continue
        # 4) synonym -> icon (icons stay literal; slang synonyms mislead as emoji)
        ic = find_icon_exact(syns)
        if ic:
            icon_out[w] = ic; used_paths[ic] = icon_path[ic]; counts["icon_syn"] += 1; continue
        # 5) tag/keyword emoji — nouns only, skip abstract nouns + face/tofu emoji
        if pos == "n" and not w.endswith(ABSTRACT_SUF):
            em = find_emoji_tag(forms)
            if em and emoji_ok(em, fuzzy=True, noun_tag=True):
                emoji_out[w] = em; counts["emoji_tag"] += 1; continue
        counts["none"] += 1

    # icons.json stores word -> path directly (paths repeat rarely; simplest)
    icons_final = {w: used_paths[name] for w, name in icon_out.items()}

    with open(os.path.join(args.out, "emoji.json"), "w", encoding="utf-8") as f:
        json.dump(emoji_out, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(args.out, "icons.json"), "w", encoding="utf-8") as f:
        json.dump(icons_final, f, ensure_ascii=False, separators=(",", ":"))

    total = len(recs)
    vis = len(emoji_out) + len(icons_final)
    print(f"words: {total}")
    print(f"emoji: {len(emoji_out)}  icons: {len(icons_final)}  "
          f"=> visual coverage {vis}/{total} ({100*vis//total}%)")
    print("  breakdown:", counts)
    isz = os.path.getsize(os.path.join(args.out, 'icons.json'))
    esz = os.path.getsize(os.path.join(args.out, 'emoji.json'))
    print(f"  emoji.json {esz//1024}KB  icons.json {isz//1024}KB")
    # quick quality sample across the frequency range
    sample_idx = [50, 120, 300, 700, 1500, 3000, 5000, 7000, 8000]
    print("  sample:")
    for i in sample_idx:
        if i < total:
            w = recs[i]["w"]
            v = emoji_out.get(w) or ("[icon]" if w in icons_final else "[tile]")
            print(f"    #{i:<5} {w:<16} {v}")


if __name__ == "__main__":
    main()
