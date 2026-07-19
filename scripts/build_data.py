#!/usr/bin/env python3
"""
Build the HaiesEnglish word database.

Combines several open datasets into one compact JSON the static site ships
with. No runtime API calls — everything is baked into the repo.

Sources (all open / permissive):
  - Frequency ranking:  google-10000-english (USA)  +  hermitdave/FrequencyWords en_50k
  - Definitions / examples / synonyms (primary):  WordNet 3.0, senses ordered by
    real usage frequency (index.sense tag counts) so the everyday sense is first
  - Definitions (fallback):  wordset/wordset-dictionary (MIT)
  - Function words (override):  scripts/curated.json (hand written, learner friendly)
  - Lemmas:  michmech/lemmatization-lists
  - IPA:  open-dict-data/ipa-dict (en_US)

Output:
  - data/words.json      compact array of word records (minified)
  - data/manifest.json   counts + build metadata

Run:  python3 scripts/build_data.py --src <raw-sources-dir> --out data
"""
import argparse, glob, json, os, re, datetime, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wordnet import WordNet

POS_SHORT = {
    "noun": "n", "verb": "v", "adjective": "adj", "adverb": "adv",
    "pronoun": "pron", "preposition": "prep", "conjunction": "conj",
    "interjection": "interj", "article": "art", "determiner": "det",
    "phrase": "phr", "abbreviation": "abbr",
}

BLOCK = set("""
fuck fucking fucked fucker motherfucker shit shitty bullshit bitch bitches
cunt cock dick dickhead pussy asshole ass whore slut bastard nigger nigga
faggot fag retard damn goddamn wank wanker twat bollocks piss pissed sluts
""".split())

# Fragments produced by splitting contractions on the apostrophe ("don't"->"don").
# These slip past the dictionary as real but wrong words, so drop them.
FRAGMENT = set("""
don didn doesn isn aren wasn weren hasn haven hadn wouldn couldn shouldn
mustn mightn needn daren won cant dont didnt isnt wasnt arent wont couldnt
wouldnt shouldnt havent hasnt hadnt doesnt im ive youre youve youll
hes shes theyre theyve theyll weve thats whats hows lets aint
ll ve ol ya yo em ta na
""".split())


def load_lemma(path):
    lemma = {}
    with open(path, encoding="utf-8-sig") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) == 2:
                lem, form = parts[0].strip().lower(), parts[1].strip().lower()
                if form and lem:
                    lemma[form] = lem
    return lemma


def load_wordset(folder):
    ws = {}
    for fp in glob.glob(os.path.join(folder, "*.json")):
        try:
            d = json.load(open(fp))
        except Exception:
            continue
        for w, e in d.items():
            ws[w.lower()] = e
    return ws


def load_ipa(path):
    ipa = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) >= 2:
                w = parts[0].strip().lower()
                first = parts[1].split(",")[0].strip().strip("/")
                if w and first and w not in ipa:
                    ipa[w] = first
    return ipa


def load_freq(path):
    out, seen = [], set()
    for line in open(path, encoding="utf-8"):
        parts = line.split()
        if not parts:
            continue
        w = parts[0].strip().lower()
        if not re.fullmatch(r"[a-z]+", w):
            continue
        if w in seen:
            continue
        seen.add(w)
        out.append(w)
    return out


def clean_syn(lst, word, limit=4):
    out = []
    seen = {word.lower()}
    # single words first, then short multiword
    for pool in (lambda s: " " not in s, lambda s: True):
        for s in lst or []:
            if not isinstance(s, str):
                continue
            s = s.strip().lower()
            if not s or s in seen or len(s) > 22:
                continue
            if pool(s):
                out.append(s)
                seen.add(s)
            if len(out) >= limit:
                return out
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=".")
    ap.add_argument("--out", default="data")
    ap.add_argument("--curated", default="scripts/curated.json")
    ap.add_argument("--target", type=int, default=8500)
    args = ap.parse_args()

    S = args.src
    print("Loading sources...")
    lemma = load_lemma(os.path.join(S, "lemma_en.txt"))
    ws = load_wordset(os.path.join(S, "wordset"))
    ipa = load_ipa(os.path.join(S, "ipa_en_US.txt"))
    wn = WordNet(os.path.join(S, "wn_extract", "wordnet"))
    curated = {k.lower(): v for k, v in json.load(open(args.curated)).items()}

    freq_g = load_freq(os.path.join(S, "freq_usa.txt"))
    freq_s = load_freq(os.path.join(S, "freq_50k.txt"))
    rank_g = {w: i for i, w in enumerate(freq_g)}
    rank_s = {w: i for i, w in enumerate(freq_s)}
    ng, nsz = len(freq_g), len(freq_s)

    cands = set(freq_g) | set(freq_s)

    def score(w):
        g = rank_g.get(w, ng) / ng
        s = rank_s.get(w, nsz) / nsz
        return (min(g, s), g + s)

    ordered = sorted(cands, key=score)

    def base_form(w):
        if w in wn or w in ws:
            return w
        if w in lemma and (lemma[w] in wn or lemma[w] in ws):
            return lemma[w]
        for suf, rep in [("ies", "y"), ("es", ""), ("s", ""), ("ed", ""),
                         ("ing", ""), ("ed", "e"), ("ing", "e"), ("ied", "y")]:
            if w.endswith(suf) and len(w) - len(suf) + len(rep) >= 2:
                cand = w[: -len(suf)] + rep
                if cand in wn or cand in ws:
                    return cand
        return lemma.get(w, w)

    records, used = [], set()

    def build_from_wordnet(key):
        senses = wn.entry(key)
        if not senses:
            return None
        prim = senses[0]
        rec = {"w": key, "p": POS_SHORT.get(prim["pos"], prim["pos"]), "d": prim["def"]}
        # example: primary sense, else best other sense with one
        ex = prim["ex"]
        if not ex:
            for s in senses[1:]:
                if s["ex"]:
                    ex = s["ex"]
                    break
        if ex:
            rec["e"] = ex
        syn = clean_syn(prim["syn"], key)
        if syn:
            rec["s"] = syn
        extra = []
        for s in senses[1:]:
            mm = {"p": POS_SHORT.get(s["pos"], s["pos"]), "d": s["def"]}
            if s["ex"]:
                mm["e"] = s["ex"]
            extra.append(mm)
            if len(extra) >= 2:
                break
        if extra:
            rec["m"] = extra
        return rec

    def build_from_wordset(key):
        e = ws.get(key)
        if not e or not e.get("meanings"):
            return None
        meanings = e["meanings"]
        prim = meanings[0]
        d = (prim.get("def") or "").strip()
        if not d:
            return None
        rec = {"w": key, "p": POS_SHORT.get(prim.get("speech_part", ""), prim.get("speech_part", "")), "d": d}
        ex = prim.get("example")
        if not ex:
            for m in meanings:
                if m.get("example"):
                    ex = m["example"]
                    break
        if ex:
            rec["e"] = ex.strip()
        syn = clean_syn(prim.get("synonyms"), key)
        if syn:
            rec["s"] = syn
        extra, seen_d = [], {d.lower()}
        for m in meanings[1:]:
            dd = (m.get("def") or "").strip()
            if not dd or dd.lower() in seen_d:
                continue
            seen_d.add(dd.lower())
            mm = {"p": POS_SHORT.get(m.get("speech_part", ""), m.get("speech_part", "")), "d": dd}
            if m.get("example"):
                mm["e"] = m["example"].strip()
            extra.append(mm)
            if len(extra) >= 2:
                break
        if extra:
            rec["m"] = extra
        return rec

    def build_from_curated(key):
        c = curated[key]
        rec = {"w": key, "p": POS_SHORT.get(c.get("pos", ""), c.get("pos", "")), "d": c["def"]}
        if c.get("example"):
            rec["e"] = c["example"]
        syn = clean_syn(c.get("syn"), key)
        if syn:
            rec["s"] = syn
        return rec

    for w in ordered:
        if w in BLOCK or w in FRAGMENT:
            continue
        if w in curated:
            key, builder = w, build_from_curated
        else:
            b = base_form(w)
            if b in BLOCK or b in FRAGMENT or b in used:
                continue
            if b in curated:
                key, builder = b, build_from_curated
            elif b in wn:
                key, builder = b, build_from_wordnet
            elif b in ws:
                key, builder = b, build_from_wordset
            else:
                continue
        # short words that aren't explicitly curated are almost always chemical
        # symbols / abbreviations in WordNet (i->iodine, at->astatine) — skip them
        if len(key) <= 2 and key not in curated:
            continue
        if key in used:
            continue
        rec = builder(key)
        if not rec:
            continue
        used.add(key)
        ip = ipa.get(key)
        if ip:
            rec["i"] = ip
        # fallback example from wordset if none yet
        if "e" not in rec and key in ws:
            for m in ws[key].get("meanings", []):
                if m.get("example"):
                    rec["e"] = m["example"].strip()
                    break
        records.append(rec)
        if len(records) >= args.target:
            break

    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out, "words.json"), "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, separators=(",", ":"))

    with_ex = sum(1 for r in records if r.get("e"))
    with_ipa = sum(1 for r in records if r.get("i"))
    with_syn = sum(1 for r in records if r.get("s"))
    with_extra = sum(1 for r in records if r.get("m"))
    manifest = {
        "total": len(records),
        "withExample": with_ex,
        "withIpa": with_ipa,
        "withSynonyms": with_syn,
        "withExtraSenses": with_extra,
        "wordsPerDayDefault": 15,
        "unitSize": 50,
        "builtAt": datetime.datetime.utcnow().strftime("%Y-%m-%d"),
        "sources": [
            "WordNet 3.0 (Princeton) — frequency-ranked senses",
            "google-10000-english (USA)",
            "hermitdave/FrequencyWords en_50k",
            "wordset/wordset-dictionary (MIT)",
            "michmech/lemmatization-lists",
            "open-dict-data/ipa-dict (en_US)",
        ],
    }
    with open(os.path.join(args.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    size = os.path.getsize(os.path.join(args.out, "words.json"))
    print(f"Wrote {len(records)} words -> {args.out}/words.json ({size/1024/1024:.2f} MB)")
    print(f"  with example:  {with_ex} ({100*with_ex//len(records)}%)")
    print(f"  with ipa:      {with_ipa} ({100*with_ipa//len(records)}%)")
    print(f"  with synonyms: {with_syn} ({100*with_syn//len(records)}%)")
    print(f"  extra senses:  {with_extra}")
    print("  first 25:", [r["w"] for r in records[:25]])


if __name__ == "__main__":
    main()
