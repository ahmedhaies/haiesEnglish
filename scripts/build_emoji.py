#!/usr/bin/env python3
"""
Build a word -> emoji map so most word cards get a memorable visual, fully
offline (no external image requests). Uses muan/emojilib keywords, with a
hand-picked override table for the most common words to guarantee good picks.

Run: python3 scripts/build_emoji.py --src <dir-with-emojilib.json> --out data
"""
import argparse, json, os, re

# High-value hand picks (win over automatic matches).
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

# Emojilib keyword groups we consider "concrete/depictable"; skip abstract face reactions
# so that a word like "care" doesn't grab a random face. Simple heuristic: prefer emoji
# whose keyword equals the word exactly, plus overrides.

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=".")
    ap.add_argument("--out", default="data")
    args = ap.parse_args()

    lib = json.load(open(os.path.join(args.src, "emojilib.json")))
    recs = json.load(open(os.path.join(args.out, "words.json")))
    words = [r["w"] for r in recs]
    pos = {r["w"]: r.get("p", "") for r in recs}

    def is_flag(emoji, kws):
        # regional-indicator pair (country flags) or explicit "flag" keyword
        if any("flag" in k for k in kws):
            return True
        return all(0x1F1E6 <= ord(c) <= 0x1F1FF for c in emoji if c not in "‍️") and len(emoji) >= 2 and any(0x1F1E6 <= ord(c) <= 0x1F1FF for c in emoji)

    # keyword -> emoji, first occurrence wins (emojilib is ordered smileys->objects)
    kw2emoji = {}
    canonical2emoji = {}
    for emoji, kws in lib.items():
        if not kws or is_flag(emoji, kws):
            continue
        canonical = kws[0].replace("_", " ").lower()
        if canonical not in canonical2emoji:
            canonical2emoji[canonical] = emoji
        for kw in kws:
            kw = kw.replace("_", " ").lower()
            if kw not in kw2emoji:
                kw2emoji[kw] = emoji

    # POS we allow to receive an auto emoji (concrete/depictable)
    DEPICTABLE = {"n", "v", "adj"}
    out = {}
    n_override = n_canon = n_kw = 0
    for w in words:
        if w in OVERRIDES:
            out[w] = OVERRIDES[w]
            n_override += 1
            continue
        if len(w) <= 2 or pos.get(w) not in DEPICTABLE:
            continue
        if w in canonical2emoji:
            out[w] = canonical2emoji[w]
            n_canon += 1
        elif pos.get(w) == "n" and w in kw2emoji:
            out[w] = kw2emoji[w]
            n_kw += 1

    # dedupe-nothing; keep as is
    with open(os.path.join(args.out, "emoji.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    print(f"emoji map: {len(out)}/{len(words)} words ({100*len(out)//len(words)}%)")
    print(f"  overrides={n_override} canonical={n_canon} keyword={n_kw}")
    sample = {w: out[w] for w in words[:400] if w in out}
    print("  sample:", dict(list(sample.items())[:30]))


if __name__ == "__main__":
    main()
