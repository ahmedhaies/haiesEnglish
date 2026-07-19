"""
Minimal WordNet 3.0 reader.

Returns each word's senses ordered by real usage frequency (WordNet's
semantic-concordance tag counts from index.sense), so the everyday meaning
comes first — e.g. "run" -> "move fast by using one's feet" rather than an
obscure sense. Provides definition, an example, synonyms and part of speech.

Expects the standard WordNet dict files in one folder:
  data.noun data.verb data.adj data.adv  index.sense
(e.g. from NLTK's corpora/wordnet.zip).
"""
import os, re

POS_NAME = {"1": "noun", "2": "verb", "3": "adjective", "4": "adverb", "5": "adjective"}


def _parse_gloss(g):
    exs = re.findall(r'"([^"]*)"', g)
    idx = g.find('"')
    defn = (g[:idx] if idx != -1 else g).strip().rstrip(";").strip()
    exs = [e.strip() for e in exs if len(e.strip()) > 3 and " " in e.strip()]
    return defn, exs


def _load_data(path):
    out = {}
    with open(path, encoding="latin-1") as f:
        for line in f:
            if line.startswith("  "):
                continue
            parts = line.split(" | ", 1)
            head = parts[0].split()
            if len(head) < 4:
                continue
            offset = head[0]
            try:
                w_cnt = int(head[3], 16)
            except ValueError:
                continue
            lemmas, i = [], 4
            for _ in range(w_cnt):
                if i < len(head):
                    lemmas.append(head[i].replace("_", " "))
                i += 2
            defn, exs = ("", [])
            if len(parts) > 1:
                defn, exs = _parse_gloss(parts[1].strip())
            out[offset] = (defn, exs, lemmas)
    return out


class WordNet:
    def __init__(self, folder):
        self.data = {
            "1": _load_data(os.path.join(folder, "data.noun")),
            "2": _load_data(os.path.join(folder, "data.verb")),
            "3": _load_data(os.path.join(folder, "data.adj")),
            "4": _load_data(os.path.join(folder, "data.adv")),
        }
        self.senses = {}
        with open(os.path.join(folder, "index.sense"), encoding="latin-1") as f:
            for line in f:
                parts = line.split()
                if len(parts) < 4:
                    continue
                sense_key, offset, sense_num, tag_cnt = parts[0], parts[1], int(parts[2]), int(parts[3])
                lemma = sense_key.split("%")[0].replace("_", " ").lower()
                ss_type = sense_key.split("%")[1].split(":")[0]
                self.senses.setdefault(lemma, []).append((tag_cnt, sense_num, ss_type, offset))

    def __contains__(self, word):
        return word.lower() in self.senses

    def entry(self, word):
        """Return senses [{pos, def, ex, syn, cnt}] ordered by frequency, or None."""
        word = word.lower()
        sl = self.senses.get(word)
        if not sl:
            return None
        sl = sorted(sl, key=lambda x: (-x[0], x[1]))
        out, seen = [], set()
        for cnt, num, pos, offset in sl:
            dpos = "3" if pos == "5" else pos
            gl = self.data.get(dpos, {}).get(offset)
            if not gl:
                continue
            defn, exs, lemmas = gl
            if not defn or defn.lower() in seen:
                continue
            seen.add(defn.lower())
            syn = [l.lower() for l in lemmas if l.lower() != word]
            out.append({"pos": POS_NAME[pos], "def": defn, "ex": exs[0] if exs else None, "syn": syn, "cnt": cnt})
        return out or None
