import type { Auxiliary, ConjugationRow, Person, Tense } from "./types";

/** person -> form, for a single tense */
type TenseTable = Record<Person, string>;

export interface IrregularVerbDef {
  infinitive: string;
  auxiliary: Auxiliary;
  pastParticiple: string;
  present: TenseTable;
  imparfait: TenseTable;
  futurSimple: TenseTable;
  conditionnelPresent: TenseTable;
  subjonctifPresent: TenseTable;
  /** impératif only has 2s/1p/2p forms in French */
  imperatif: Pick<TenseTable, "2s" | "1p" | "2p">;
}

const P = (js: string, tu: string, il: string, ns: string, vs: string, ils: string): TenseTable => ({
  "1s": js,
  "2s": tu,
  "3s": il,
  "1p": ns,
  "2p": vs,
  "3p": ils,
});

/**
 * Hand-verified conjugation tables for the highest-frequency irregular verbs.
 * plus-que-parfait and passé composé are derived at generation time from
 * `auxiliary` + `pastParticiple` (imparfait/present of avoir/être + participle),
 * not stored here, to avoid duplicating avoir/être's own tables.
 */
export const IRREGULAR_VERBS: IrregularVerbDef[] = [
  {
    infinitive: "être",
    auxiliary: "avoir",
    pastParticiple: "été",
    present: P("suis", "es", "est", "sommes", "êtes", "sont"),
    imparfait: P("étais", "étais", "était", "étions", "étiez", "étaient"),
    futurSimple: P("serai", "seras", "sera", "serons", "serez", "seront"),
    conditionnelPresent: P("serais", "serais", "serait", "serions", "seriez", "seraient"),
    subjonctifPresent: P("sois", "sois", "soit", "soyons", "soyez", "soient"),
    imperatif: { "2s": "sois", "1p": "soyons", "2p": "soyez" },
  },
  {
    infinitive: "avoir",
    auxiliary: "avoir",
    pastParticiple: "eu",
    present: P("ai", "as", "a", "avons", "avez", "ont"),
    imparfait: P("avais", "avais", "avait", "avions", "aviez", "avaient"),
    futurSimple: P("aurai", "auras", "aura", "aurons", "aurez", "auront"),
    conditionnelPresent: P("aurais", "aurais", "aurait", "aurions", "auriez", "auraient"),
    subjonctifPresent: P("aie", "aies", "ait", "ayons", "ayez", "aient"),
    imperatif: { "2s": "aie", "1p": "ayons", "2p": "ayez" },
  },
  {
    infinitive: "aller",
    auxiliary: "etre",
    pastParticiple: "allé",
    present: P("vais", "vas", "va", "allons", "allez", "vont"),
    imparfait: P("allais", "allais", "allait", "allions", "alliez", "allaient"),
    futurSimple: P("irai", "iras", "ira", "irons", "irez", "iront"),
    conditionnelPresent: P("irais", "irais", "irait", "irions", "iriez", "iraient"),
    subjonctifPresent: P("aille", "ailles", "aille", "allions", "alliez", "aillent"),
    imperatif: { "2s": "va", "1p": "allons", "2p": "allez" },
  },
  {
    infinitive: "faire",
    auxiliary: "avoir",
    pastParticiple: "fait",
    present: P("fais", "fais", "fait", "faisons", "faites", "font"),
    imparfait: P("faisais", "faisais", "faisait", "faisions", "faisiez", "faisaient"),
    futurSimple: P("ferai", "feras", "fera", "ferons", "ferez", "feront"),
    conditionnelPresent: P("ferais", "ferais", "ferait", "ferions", "feriez", "feraient"),
    subjonctifPresent: P("fasse", "fasses", "fasse", "fassions", "fassiez", "fassent"),
    imperatif: { "2s": "fais", "1p": "faisons", "2p": "faites" },
  },
  {
    infinitive: "pouvoir",
    auxiliary: "avoir",
    pastParticiple: "pu",
    present: P("peux", "peux", "peut", "pouvons", "pouvez", "peuvent"),
    imparfait: P("pouvais", "pouvais", "pouvait", "pouvions", "pouviez", "pouvaient"),
    futurSimple: P("pourrai", "pourras", "pourra", "pourrons", "pourrez", "pourront"),
    conditionnelPresent: P("pourrais", "pourrais", "pourrait", "pourrions", "pourriez", "pourraient"),
    subjonctifPresent: P("puisse", "puisses", "puisse", "puissions", "puissiez", "puissent"),
    imperatif: { "2s": "peux", "1p": "pouvons", "2p": "pouvez" },
  },
  {
    infinitive: "vouloir",
    auxiliary: "avoir",
    pastParticiple: "voulu",
    present: P("veux", "veux", "veut", "voulons", "voulez", "veulent"),
    imparfait: P("voulais", "voulais", "voulait", "voulions", "vouliez", "voulaient"),
    futurSimple: P("voudrai", "voudras", "voudra", "voudrons", "voudrez", "voudront"),
    conditionnelPresent: P("voudrais", "voudrais", "voudrait", "voudrions", "voudriez", "voudraient"),
    subjonctifPresent: P("veuille", "veuilles", "veuille", "voulions", "vouliez", "veuillent"),
    imperatif: { "2s": "veuille", "1p": "veuillons", "2p": "veuillez" },
  },
  {
    infinitive: "devoir",
    auxiliary: "avoir",
    pastParticiple: "dû",
    present: P("dois", "dois", "doit", "devons", "devez", "doivent"),
    imparfait: P("devais", "devais", "devait", "devions", "deviez", "devaient"),
    futurSimple: P("devrai", "devras", "devra", "devrons", "devrez", "devront"),
    conditionnelPresent: P("devrais", "devrais", "devrait", "devrions", "devriez", "devraient"),
    subjonctifPresent: P("doive", "doives", "doive", "devions", "deviez", "doivent"),
    imperatif: { "2s": "dois", "1p": "devons", "2p": "devez" },
  },
  {
    infinitive: "savoir",
    auxiliary: "avoir",
    pastParticiple: "su",
    present: P("sais", "sais", "sait", "savons", "savez", "savent"),
    imparfait: P("savais", "savais", "savait", "savions", "saviez", "savaient"),
    futurSimple: P("saurai", "sauras", "saura", "saurons", "saurez", "sauront"),
    conditionnelPresent: P("saurais", "saurais", "saurait", "saurions", "sauriez", "sauraient"),
    subjonctifPresent: P("sache", "saches", "sache", "sachions", "sachiez", "sachent"),
    imperatif: { "2s": "sache", "1p": "sachons", "2p": "sachez" },
  },
  {
    infinitive: "voir",
    auxiliary: "avoir",
    pastParticiple: "vu",
    present: P("vois", "vois", "voit", "voyons", "voyez", "voient"),
    imparfait: P("voyais", "voyais", "voyait", "voyions", "voyiez", "voyaient"),
    futurSimple: P("verrai", "verras", "verra", "verrons", "verrez", "verront"),
    conditionnelPresent: P("verrais", "verrais", "verrait", "verrions", "verriez", "verraient"),
    subjonctifPresent: P("voie", "voies", "voie", "voyions", "voyiez", "voient"),
    imperatif: { "2s": "vois", "1p": "voyons", "2p": "voyez" },
  },
  {
    infinitive: "venir",
    auxiliary: "etre",
    pastParticiple: "venu",
    present: P("viens", "viens", "vient", "venons", "venez", "viennent"),
    imparfait: P("venais", "venais", "venait", "venions", "veniez", "venaient"),
    futurSimple: P("viendrai", "viendras", "viendra", "viendrons", "viendrez", "viendront"),
    conditionnelPresent: P("viendrais", "viendrais", "viendrait", "viendrions", "viendriez", "viendraient"),
    subjonctifPresent: P("vienne", "viennes", "vienne", "venions", "veniez", "viennent"),
    imperatif: { "2s": "viens", "1p": "venons", "2p": "venez" },
  },
  {
    infinitive: "prendre",
    auxiliary: "avoir",
    pastParticiple: "pris",
    present: P("prends", "prends", "prend", "prenons", "prenez", "prennent"),
    imparfait: P("prenais", "prenais", "prenait", "prenions", "preniez", "prenaient"),
    futurSimple: P("prendrai", "prendras", "prendra", "prendrons", "prendrez", "prendront"),
    conditionnelPresent: P("prendrais", "prendrais", "prendrait", "prendrions", "prendriez", "prendraient"),
    subjonctifPresent: P("prenne", "prennes", "prenne", "prenions", "preniez", "prennent"),
    imperatif: { "2s": "prends", "1p": "prenons", "2p": "prenez" },
  },
  {
    infinitive: "mettre",
    auxiliary: "avoir",
    pastParticiple: "mis",
    present: P("mets", "mets", "met", "mettons", "mettez", "mettent"),
    imparfait: P("mettais", "mettais", "mettait", "mettions", "mettiez", "mettaient"),
    futurSimple: P("mettrai", "mettras", "mettra", "mettrons", "mettrez", "mettront"),
    conditionnelPresent: P("mettrais", "mettrais", "mettrait", "mettrions", "mettriez", "mettraient"),
    subjonctifPresent: P("mette", "mettes", "mette", "mettions", "mettiez", "mettent"),
    imperatif: { "2s": "mets", "1p": "mettons", "2p": "mettez" },
  },
  {
    infinitive: "dire",
    auxiliary: "avoir",
    pastParticiple: "dit",
    present: P("dis", "dis", "dit", "disons", "dites", "disent"),
    imparfait: P("disais", "disais", "disait", "disions", "disiez", "disaient"),
    futurSimple: P("dirai", "diras", "dira", "dirons", "direz", "diront"),
    conditionnelPresent: P("dirais", "dirais", "dirait", "dirions", "diriez", "diraient"),
    subjonctifPresent: P("dise", "dises", "dise", "disions", "disiez", "disent"),
    imperatif: { "2s": "dis", "1p": "disons", "2p": "dites" },
  },
  {
    infinitive: "partir",
    auxiliary: "etre",
    pastParticiple: "parti",
    present: P("pars", "pars", "part", "partons", "partez", "partent"),
    imparfait: P("partais", "partais", "partait", "partions", "partiez", "partaient"),
    futurSimple: P("partirai", "partiras", "partira", "partirons", "partirez", "partiront"),
    conditionnelPresent: P("partirais", "partirais", "partirait", "partirions", "partiriez", "partiraient"),
    subjonctifPresent: P("parte", "partes", "parte", "partions", "partiez", "partent"),
    imperatif: { "2s": "pars", "1p": "partons", "2p": "partez" },
  },
  {
    infinitive: "sortir",
    auxiliary: "etre",
    pastParticiple: "sorti",
    present: P("sors", "sors", "sort", "sortons", "sortez", "sortent"),
    imparfait: P("sortais", "sortais", "sortait", "sortions", "sortiez", "sortaient"),
    futurSimple: P("sortirai", "sortiras", "sortira", "sortirons", "sortirez", "sortiront"),
    conditionnelPresent: P("sortirais", "sortirais", "sortirait", "sortirions", "sortiriez", "sortiraient"),
    subjonctifPresent: P("sorte", "sortes", "sorte", "sortions", "sortiez", "sortent"),
    imperatif: { "2s": "sors", "1p": "sortons", "2p": "sortez" },
  },
  {
    infinitive: "dormir",
    auxiliary: "avoir",
    pastParticiple: "dormi",
    present: P("dors", "dors", "dort", "dormons", "dormez", "dorment"),
    imparfait: P("dormais", "dormais", "dormait", "dormions", "dormiez", "dormaient"),
    futurSimple: P("dormirai", "dormiras", "dormira", "dormirons", "dormirez", "dormiront"),
    conditionnelPresent: P("dormirais", "dormirais", "dormirait", "dormirions", "dormiriez", "dormiraient"),
    subjonctifPresent: P("dorme", "dormes", "dorme", "dormions", "dormiez", "dorment"),
    imperatif: { "2s": "dors", "1p": "dormons", "2p": "dormez" },
  },
  {
    infinitive: "sentir",
    auxiliary: "avoir",
    pastParticiple: "senti",
    present: P("sens", "sens", "sent", "sentons", "sentez", "sentent"),
    imparfait: P("sentais", "sentais", "sentait", "sentions", "sentiez", "sentaient"),
    futurSimple: P("sentirai", "sentiras", "sentira", "sentirons", "sentirez", "sentiront"),
    conditionnelPresent: P("sentirais", "sentirais", "sentirait", "sentirions", "sentiriez", "sentiraient"),
    subjonctifPresent: P("sente", "sentes", "sente", "sentions", "sentiez", "sentent"),
    imperatif: { "2s": "sens", "1p": "sentons", "2p": "sentez" },
  },
  {
    infinitive: "connaître",
    auxiliary: "avoir",
    pastParticiple: "connu",
    present: P("connais", "connais", "connaît", "connaissons", "connaissez", "connaissent"),
    imparfait: P("connaissais", "connaissais", "connaissait", "connaissions", "connaissiez", "connaissaient"),
    futurSimple: P("connaîtrai", "connaîtras", "connaîtra", "connaîtrons", "connaîtrez", "connaîtront"),
    conditionnelPresent: P(
      "connaîtrais", "connaîtrais", "connaîtrait", "connaîtrions", "connaîtriez", "connaîtraient",
    ),
    subjonctifPresent: P(
      "connaisse", "connaisses", "connaisse", "connaissions", "connaissiez", "connaissent",
    ),
    imperatif: { "2s": "connais", "1p": "connaissons", "2p": "connaissez" },
  },
  {
    infinitive: "courir",
    auxiliary: "avoir",
    pastParticiple: "couru",
    present: P("cours", "cours", "court", "courons", "courez", "courent"),
    imparfait: P("courais", "courais", "courait", "courions", "couriez", "couraient"),
    futurSimple: P("courrai", "courras", "courra", "courrons", "courrez", "courront"),
    conditionnelPresent: P("courrais", "courrais", "courrait", "courrions", "courriez", "courraient"),
    subjonctifPresent: P("coure", "coures", "coure", "courions", "couriez", "courent"),
    imperatif: { "2s": "cours", "1p": "courons", "2p": "courez" },
  },
  {
    infinitive: "croire",
    auxiliary: "avoir",
    pastParticiple: "cru",
    present: P("crois", "crois", "croit", "croyons", "croyez", "croient"),
    imparfait: P("croyais", "croyais", "croyait", "croyions", "croyiez", "croyaient"),
    futurSimple: P("croirai", "croiras", "croira", "croirons", "croirez", "croiront"),
    conditionnelPresent: P("croirais", "croirais", "croirait", "croirions", "croiriez", "croiraient"),
    subjonctifPresent: P("croie", "croies", "croie", "croyions", "croyiez", "croient"),
    imperatif: { "2s": "crois", "1p": "croyons", "2p": "croyez" },
  },
  {
    infinitive: "écrire",
    auxiliary: "avoir",
    pastParticiple: "écrit",
    present: P("écris", "écris", "écrit", "écrivons", "écrivez", "écrivent"),
    imparfait: P("écrivais", "écrivais", "écrivait", "écrivions", "écriviez", "écrivaient"),
    futurSimple: P("écrirai", "écriras", "écrira", "écrirons", "écrirez", "écriront"),
    conditionnelPresent: P("écrirais", "écrirais", "écrirait", "écririons", "écririez", "écriraient"),
    subjonctifPresent: P("écrive", "écrives", "écrive", "écrivions", "écriviez", "écrivent"),
    imperatif: { "2s": "écris", "1p": "écrivons", "2p": "écrivez" },
  },
  {
    infinitive: "lire",
    auxiliary: "avoir",
    pastParticiple: "lu",
    present: P("lis", "lis", "lit", "lisons", "lisez", "lisent"),
    imparfait: P("lisais", "lisais", "lisait", "lisions", "lisiez", "lisaient"),
    futurSimple: P("lirai", "liras", "lira", "lirons", "lirez", "liront"),
    conditionnelPresent: P("lirais", "lirais", "lirait", "lirions", "liriez", "liraient"),
    subjonctifPresent: P("lise", "lises", "lise", "lisions", "lisiez", "lisent"),
    imperatif: { "2s": "lis", "1p": "lisons", "2p": "lisez" },
  },
  {
    infinitive: "boire",
    auxiliary: "avoir",
    pastParticiple: "bu",
    present: P("bois", "bois", "boit", "buvons", "buvez", "boivent"),
    imparfait: P("buvais", "buvais", "buvait", "buvions", "buviez", "buvaient"),
    futurSimple: P("boirai", "boiras", "boira", "boirons", "boirez", "boiront"),
    conditionnelPresent: P("boirais", "boirais", "boirait", "boirions", "boiriez", "boiraient"),
    subjonctifPresent: P("boive", "boives", "boive", "buvions", "buviez", "boivent"),
    imperatif: { "2s": "bois", "1p": "buvons", "2p": "buvez" },
  },
  {
    infinitive: "vivre",
    auxiliary: "avoir",
    pastParticiple: "vécu",
    present: P("vis", "vis", "vit", "vivons", "vivez", "vivent"),
    imparfait: P("vivais", "vivais", "vivait", "vivions", "viviez", "vivaient"),
    futurSimple: P("vivrai", "vivras", "vivra", "vivrons", "vivrez", "vivront"),
    conditionnelPresent: P("vivrais", "vivrais", "vivrait", "vivrions", "vivriez", "vivraient"),
    subjonctifPresent: P("vive", "vives", "vive", "vivions", "viviez", "vivent"),
    imperatif: { "2s": "vis", "1p": "vivons", "2p": "vivez" },
  },
  {
    infinitive: "naître",
    auxiliary: "etre",
    pastParticiple: "né",
    present: P("nais", "nais", "naît", "naissons", "naissez", "naissent"),
    imparfait: P("naissais", "naissais", "naissait", "naissions", "naissiez", "naissaient"),
    futurSimple: P("naîtrai", "naîtras", "naîtra", "naîtrons", "naîtrez", "naîtront"),
    conditionnelPresent: P("naîtrais", "naîtrais", "naîtrait", "naîtrions", "naîtriez", "naîtraient"),
    subjonctifPresent: P("naisse", "naisses", "naisse", "naissions", "naissiez", "naissent"),
    imperatif: { "2s": "nais", "1p": "naissons", "2p": "naissez" },
  },
  {
    infinitive: "mourir",
    auxiliary: "etre",
    pastParticiple: "mort",
    present: P("meurs", "meurs", "meurt", "mourons", "mourez", "meurent"),
    imparfait: P("mourais", "mourais", "mourait", "mourions", "mouriez", "mouraient"),
    futurSimple: P("mourrai", "mourras", "mourra", "mourrons", "mourrez", "mourront"),
    conditionnelPresent: P("mourrais", "mourrais", "mourrait", "mourrions", "mourriez", "mourraient"),
    subjonctifPresent: P("meure", "meures", "meure", "mourions", "mouriez", "meurent"),
    imperatif: { "2s": "meurs", "1p": "mourons", "2p": "mourez" },
  },
  {
    infinitive: "recevoir",
    auxiliary: "avoir",
    pastParticiple: "reçu",
    present: P("reçois", "reçois", "reçoit", "recevons", "recevez", "reçoivent"),
    imparfait: P("recevais", "recevais", "recevait", "recevions", "receviez", "recevaient"),
    futurSimple: P("recevrai", "recevras", "recevra", "recevrons", "recevrez", "recevront"),
    conditionnelPresent: P("recevrais", "recevrais", "recevrait", "recevrions", "recevriez", "recevraient"),
    subjonctifPresent: P("reçoive", "reçoives", "reçoive", "recevions", "receviez", "reçoivent"),
    imperatif: { "2s": "reçois", "1p": "recevons", "2p": "recevez" },
  },
  {
    infinitive: "tenir",
    auxiliary: "avoir",
    pastParticiple: "tenu",
    present: P("tiens", "tiens", "tient", "tenons", "tenez", "tiennent"),
    imparfait: P("tenais", "tenais", "tenait", "tenions", "teniez", "tenaient"),
    futurSimple: P("tiendrai", "tiendras", "tiendra", "tiendrons", "tiendrez", "tiendront"),
    conditionnelPresent: P("tiendrais", "tiendrais", "tiendrait", "tiendrions", "tiendriez", "tiendraient"),
    subjonctifPresent: P("tienne", "tiennes", "tienne", "tenions", "teniez", "tiennent"),
    imperatif: { "2s": "tiens", "1p": "tenons", "2p": "tenez" },
  },
  {
    infinitive: "valoir",
    auxiliary: "avoir",
    pastParticiple: "valu",
    present: P("vaux", "vaux", "vaut", "valons", "valez", "valent"),
    imparfait: P("valais", "valais", "valait", "valions", "valiez", "valaient"),
    futurSimple: P("vaudrai", "vaudras", "vaudra", "vaudrons", "vaudrez", "vaudront"),
    conditionnelPresent: P("vaudrais", "vaudrais", "vaudrait", "vaudrions", "vaudriez", "vaudraient"),
    subjonctifPresent: P("vaille", "vailles", "vaille", "valions", "valiez", "vaillent"),
    imperatif: { "2s": "vaux", "1p": "valons", "2p": "valez" },
  },
  {
    infinitive: "rire",
    auxiliary: "avoir",
    pastParticiple: "ri",
    present: P("ris", "ris", "rit", "rions", "riez", "rient"),
    imparfait: P("riais", "riais", "riait", "riions", "riiez", "riaient"),
    futurSimple: P("rirai", "riras", "rira", "rirons", "rirez", "riront"),
    conditionnelPresent: P("rirais", "rirais", "rirait", "ririons", "ririez", "riraient"),
    subjonctifPresent: P("rie", "ries", "rie", "riions", "riiez", "rient"),
    imperatif: { "2s": "ris", "1p": "rions", "2p": "riez" },
  },
  {
    infinitive: "comprendre",
    auxiliary: "avoir",
    pastParticiple: "compris",
    present: P("comprends", "comprends", "comprend", "comprenons", "comprenez", "comprennent"),
    imparfait: P(
      "comprenais", "comprenais", "comprenait", "comprenions", "compreniez", "comprenaient",
    ),
    futurSimple: P(
      "comprendrai", "comprendras", "comprendra", "comprendrons", "comprendrez", "comprendront",
    ),
    conditionnelPresent: P(
      "comprendrais", "comprendrais", "comprendrait", "comprendrions", "comprendriez", "comprendraient",
    ),
    subjonctifPresent: P(
      "comprenne", "comprennes", "comprenne", "comprenions", "compreniez", "comprennent",
    ),
    imperatif: { "2s": "comprends", "1p": "comprenons", "2p": "comprenez" },
  },
  {
    infinitive: "apprendre",
    auxiliary: "avoir",
    pastParticiple: "appris",
    present: P("apprends", "apprends", "apprend", "apprenons", "apprenez", "apprennent"),
    imparfait: P("apprenais", "apprenais", "apprenait", "apprenions", "appreniez", "apprenaient"),
    futurSimple: P(
      "apprendrai", "apprendras", "apprendra", "apprendrons", "apprendrez", "apprendront",
    ),
    conditionnelPresent: P(
      "apprendrais", "apprendrais", "apprendrait", "apprendrions", "apprendriez", "apprendraient",
    ),
    subjonctifPresent: P("apprenne", "apprennes", "apprenne", "apprenions", "appreniez", "apprennent"),
    imperatif: { "2s": "apprends", "1p": "apprenons", "2p": "apprenez" },
  },
  {
    infinitive: "devenir",
    auxiliary: "etre",
    pastParticiple: "devenu",
    present: P("deviens", "deviens", "devient", "devenons", "devenez", "deviennent"),
    imparfait: P("devenais", "devenais", "devenait", "devenions", "deveniez", "devenaient"),
    futurSimple: P("deviendrai", "deviendras", "deviendra", "deviendrons", "deviendrez", "deviendront"),
    conditionnelPresent: P(
      "deviendrais", "deviendrais", "deviendrait", "deviendrions", "deviendriez", "deviendraient",
    ),
    subjonctifPresent: P("devienne", "deviennes", "devienne", "devenions", "deveniez", "deviennent"),
    imperatif: { "2s": "deviens", "1p": "devenons", "2p": "devenez" },
  },
  {
    infinitive: "falloir",
    auxiliary: "avoir",
    pastParticiple: "fallu",
    present: P("", "", "faut", "", "", ""),
    imparfait: P("", "", "fallait", "", "", ""),
    futurSimple: P("", "", "faudra", "", "", ""),
    conditionnelPresent: P("", "", "faudrait", "", "", ""),
    subjonctifPresent: P("", "", "faille", "", "", ""),
    imperatif: { "2s": "", "1p": "", "2p": "" },
  },
  {
    infinitive: "pleuvoir",
    auxiliary: "avoir",
    pastParticiple: "plu",
    present: P("", "", "pleut", "", "", ""),
    imparfait: P("", "", "pleuvait", "", "", ""),
    futurSimple: P("", "", "pleuvra", "", "", ""),
    conditionnelPresent: P("", "", "pleuvrait", "", "", ""),
    subjonctifPresent: P("", "", "pleuve", "", "", ""),
    imperatif: { "2s": "", "1p": "", "2p": "" },
  },
];

/** falloir/pleuvoir are impersonal — only the 3s row is real, others are blank and skipped at generation time. */
export const IMPERSONAL_VERBS = new Set(["falloir", "pleuvoir"]);

export function irregularVerbToRows(def: IrregularVerbDef): ConjugationRow[] {
  const rows: ConjugationRow[] = [];
  const tenseTables: [Tense, TenseTable][] = [
    ["present", def.present],
    ["imparfait", def.imparfait],
    ["futur_simple", def.futurSimple],
    ["conditionnel_present", def.conditionnelPresent],
    ["subjonctif_present", def.subjonctifPresent],
  ];
  for (const [tense, table] of tenseTables) {
    for (const person of Object.keys(table) as Person[]) {
      const form = table[person];
      if (form) rows.push({ tense, person, form, isIrregular: true });
    }
  }
  for (const person of Object.keys(def.imperatif) as ("2s" | "1p" | "2p")[]) {
    const form = def.imperatif[person];
    if (form) rows.push({ tense: "imperatif", person, form, isIrregular: true });
  }
  return rows;
}
