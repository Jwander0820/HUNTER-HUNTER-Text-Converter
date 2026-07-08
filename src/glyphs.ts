export type GlyphLayer = readonly [base: string, mark?: string];

type Row = {
  roma: readonly string[];
  hira: readonly string[];
  kata: readonly string[];
  files: readonly string[];
};

const rows: readonly Row[] = [
  {
    roma: ["a", "i", "u", "e", "o"],
    hira: ["あ", "い", "う", "え", "お"],
    kata: ["ア", "イ", "ウ", "エ", "オ"],
    files: ["1_a.png", "1_i.png", "1_u.png", "1_e.png", "1_o.png"],
  },
  {
    roma: ["ka", "ki", "ku", "ke", "ko"],
    hira: ["か", "き", "く", "け", "こ"],
    kata: ["カ", "キ", "ク", "ケ", "コ"],
    files: ["2_ka.png", "2_ki.png", "2_ku.png", "2_ke.png", "2_ko.png"],
  },
  {
    roma: ["sa", "shi", "su", "se", "so"],
    hira: ["さ", "し", "す", "せ", "そ"],
    kata: ["サ", "シ", "ス", "セ", "ソ"],
    files: ["3_sa.png", "3_shi.png", "3_su.png", "3_se.png", "3_so.png"],
  },
  {
    roma: ["ta", "chi", "tsu", "te", "to"],
    hira: ["た", "ち", "つ", "て", "と"],
    kata: ["タ", "チ", "ツ", "テ", "ト"],
    files: ["4_ta.png", "4_chi.png", "4_tsu.png", "4_te.png", "4_to.png"],
  },
  {
    roma: ["na", "ni", "nu", "ne", "no"],
    hira: ["な", "に", "ぬ", "ね", "の"],
    kata: ["ナ", "ニ", "ヌ", "ネ", "ノ"],
    files: ["5_na.png", "5_ni.png", "5_nu.png", "5_ne.png", "5_no.png"],
  },
  {
    roma: ["ha", "hi", "fu", "he", "ho"],
    hira: ["は", "ひ", "ふ", "へ", "ほ"],
    kata: ["ハ", "ヒ", "フ", "ヘ", "ホ"],
    files: ["6_ha.png", "6_hi.png", "6_fu.png", "6_he.png", "6_ho.png"],
  },
  {
    roma: ["ma", "mi", "mu", "me", "mo"],
    hira: ["ま", "み", "む", "め", "も"],
    kata: ["マ", "ミ", "ム", "メ", "モ"],
    files: ["7_ma.png", "7_mi.png", "7_mu.png", "7_me.png", "7_mo.png"],
  },
  {
    roma: ["ya", "yu", "yo"],
    hira: ["や", "ゆ", "よ"],
    kata: ["ヤ", "ユ", "ヨ"],
    files: ["8_ya.png", "8_yu.png", "8_yo.png"],
  },
  {
    roma: ["ra", "ri", "ru", "re", "ro"],
    hira: ["ら", "り", "る", "れ", "ろ"],
    kata: ["ラ", "リ", "ル", "レ", "ロ"],
    files: ["9_ra.png", "9_ri.png", "9_ru.png", "9_re.png", "9_ro.png"],
  },
  {
    roma: ["wa", "wo", "n"],
    hira: ["わ", "を", "ん"],
    kata: ["ワ", "ヲ", "ン"],
    files: ["0_wa.png", "0_wo.png", "0_n.png"],
  },
];

const smallRows: readonly Row[] = [
  {
    roma: ["la", "li", "lu", "le", "lo"],
    hira: ["ぁ", "ぃ", "ぅ", "ぇ", "ぉ"],
    kata: ["ァ", "ィ", "ゥ", "ェ", "ォ"],
    files: ["1_small_a.png", "1_small_i.png", "1_small_u.png", "1_small_e.png", "1_small_o.png"],
  },
  {
    roma: ["lya", "lyu", "lyo"],
    hira: ["ゃ", "ゅ", "ょ"],
    kata: ["ャ", "ュ", "ョ"],
    files: ["8_small_ya.png", "8_small_yu.png", "8_small_yo.png"],
  },
  {
    roma: ["ltu"],
    hira: ["っ"],
    kata: ["ッ"],
    files: ["4_small_tsu.png"],
  },
];

const voicedRows: readonly Row[] = [
  {
    roma: ["ga", "gi", "gu", "ge", "go"],
    hira: ["が", "ぎ", "ぐ", "げ", "ご"],
    kata: ["ガ", "ギ", "グ", "ゲ", "ゴ"],
    files: ["2_ka.png", "2_ki.png", "2_ku.png", "2_ke.png", "2_ko.png"],
  },
  {
    roma: ["za", "ji", "zu", "ze", "zo"],
    hira: ["ざ", "じ", "ず", "ぜ", "ぞ"],
    kata: ["ザ", "ジ", "ズ", "ゼ", "ゾ"],
    files: ["3_sa.png", "3_shi.png", "3_su.png", "3_se.png", "3_so.png"],
  },
  {
    roma: ["da", "di", "du", "de", "do"],
    hira: ["だ", "ぢ", "づ", "で", "ど"],
    kata: ["ダ", "ヂ", "ヅ", "デ", "ド"],
    files: ["4_ta.png", "4_chi.png", "4_tsu.png", "4_te.png", "4_to.png"],
  },
  {
    roma: ["ba", "bi", "bu", "be", "bo"],
    hira: ["ば", "び", "ぶ", "べ", "ぼ"],
    kata: ["バ", "ビ", "ブ", "ベ", "ボ"],
    files: ["6_ha.png", "6_hi.png", "6_fu.png", "6_he.png", "6_ho.png"],
  },
];

const halfVoicedRow: Row = {
  roma: ["pa", "pi", "pu", "pe", "po"],
  hira: ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
  kata: ["パ", "ピ", "プ", "ペ", "ポ"],
  files: ["6_ha.png", "6_hi.png", "6_fu.png", "6_he.png", "6_ho.png"],
};

export const glyphMap: Readonly<Record<string, GlyphLayer>> = buildGlyphMap();
export const romajiTokens = Object.keys(glyphMap)
  .filter((key) => /^[a-z.~*-]+$/i.test(key))
  .sort((a, b) => b.length - a.length || a.localeCompare(b));

function buildGlyphMap(): Record<string, GlyphLayer> {
  const map: Record<string, GlyphLayer> = {};

  for (const row of rows) {
    addRow(map, row);
  }

  addAliases(map, {
    si: "shi",
    ti: "chi",
    tu: "tsu",
    hu: "fu",
  });

  for (const row of smallRows) {
    addRow(map, row);
  }

  addAliases(map, {
    xa: "la",
    xi: "li",
    xu: "lu",
    xe: "le",
    xo: "lo",
    xya: "lya",
    xyu: "lyu",
    xyo: "lyo",
    xtu: "ltu",
  });

  for (const row of voicedRows) {
    addRow(map, row, "0_ex_zm.png");
  }

  addAliases(map, {
    zi: "ji",
  });

  addRow(map, halfVoicedRow, "0_ex_hzm.png");

  map.zm = ["0_ex_zm.png"];
  map.hzm = ["0_ex_hzm.png"];
  map.lm = ["0_ex_lm.png"];
  map["-"] = ["0_ex_lm.png"];
  map["~"] = ["0_ex_lm.png"];
  map["ー"] = ["0_ex_lm.png"];
  map["."] = ["10_dot.png"];
  map.dot = ["10_dot.png"];

  return map;
}

function addRow(map: Record<string, GlyphLayer>, row: Row, mark?: string): void {
  row.files.forEach((file, index) => {
    const layer: GlyphLayer = mark ? [file, mark] : [file];
    map[row.roma[index]] = layer;
    map[row.hira[index]] = layer;
    map[row.kata[index]] = layer;
  });
}

function addAliases(map: Record<string, GlyphLayer>, aliases: Record<string, string>): void {
  for (const [alias, source] of Object.entries(aliases)) {
    map[alias] = map[source];
  }
}
