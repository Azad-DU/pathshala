import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import type { Chapter } from '@/types/library';

interface BookContentFile {
  id: string;
  chapters: Chapter[];
}

const MAX_CACHE = 4;
const bookCache = new Map<string, Chapter[]>();

function getBookAssetModule(bookId: string): number | null {
  switch (bookId) {
    case 'rt-aatmprichy':
      return require('./books/rt-aatmprichy.txt') as number;
    case 'rt-aatmshkti':
      return require('./books/rt-aatmshkti.txt') as number;
    case 'rt-aadhunik-sahitj':
      return require('./books/rt-aadhunik-sahitj.txt') as number;
    case 'rt-aashrmer-rup-o-bikash':
      return require('./books/rt-aashrmer-rup-o-bikash.txt') as number;
    case 'rt-itihas':
      return require('./books/rt-itihas.txt') as number;
    case 'rt-krtar-ichchhay-krm':
      return require('./books/rt-krtar-ichchhay-krm.txt') as number;
    case 'rt-kalantr':
      return require('./books/rt-kalantr.txt') as number;
    case 'rt-khrisht':
      return require('./books/rt-khrisht.txt') as number;
    case 'rt-grnthsmalochna':
      return require('./books/rt-grnthsmalochna.txt') as number;
    case 'rt-charitrpuja':
      return require('./books/rt-charitrpuja.txt') as number;
    case 'rt-chithiptr':
      return require('./books/rt-chithiptr.txt') as number;
    case 'rt-chhnd':
      return require('./books/rt-chhnd.txt') as number;
    case 'rt-chhelebela':
      return require('./books/rt-chhelebela.txt') as number;
    case 'rt-japanjatri':
      return require('./books/rt-japanjatri.txt') as number;
    case 'rt-jabha-jatrir-ptr':
      return require('./books/rt-jabha-jatrir-ptr.txt') as number;
    case 'rt-jibnsmriti':
      return require('./books/rt-jibnsmriti.txt') as number;
    case 'rt-dhrm':
      return require('./books/rt-dhrm.txt') as number;
    case 'rt-dhrm-drshn':
      return require('./books/rt-dhrm-drshn.txt') as number;
    case 'rt-pnychbhut':
      return require('./books/rt-pnychbhut.txt') as number;
    case 'rt-pther-snychy':
      return require('./books/rt-pther-snychy.txt') as number;
    case 'rt-prichy':
      return require('./books/rt-prichy.txt') as number;
    case 'rt-plliprkriti':
      return require('./books/rt-plliprkriti.txt') as number;
    case 'rt-pshchim-jatrir-dayari':
      return require('./books/rt-pshchim-jatrir-dayari.txt') as number;
    case 'rt-parsje':
      return require('./books/rt-parsje.txt') as number;
    case 'rt-prachinsahitj':
      return require('./books/rt-prachinsahitj.txt') as number;
    case 'rt-bangla-shbdtttb':
      return require('./books/rt-bangla-shbdtttb.txt') as number;
    case 'rt-banglabhasha-prichy':
      return require('./books/rt-banglabhasha-prichy.txt') as number;
    case 'rt-bichitr-prbndh':
      return require('./books/rt-bichitr-prbndh.txt') as number;
    case 'rt-bijnyan':
      return require('./books/rt-bijnyan.txt') as number;
    case 'rt-bibidh':
      return require('./books/rt-bibidh.txt') as number;
    case 'rt-bishbprichy':
      return require('./books/rt-bishbprichy.txt') as number;
    case 'rt-bishbbharti':
      return require('./books/rt-bishbbharti.txt') as number;
    case 'rt-bjktiprsngg':
      return require('./books/rt-bjktiprsngg.txt') as number;
    case 'rt-bjnggkoutuk-probondho':
      return require('./books/rt-bjnggkoutuk-probondho.txt') as number;
    case 'rt-bhartbrsh':
      return require('./books/rt-bhartbrsh.txt') as number;
    case 'rt-mhatma-gandhi':
      return require('./books/rt-mhatma-gandhi.txt') as number;
    case 'rt-manusher-dhrm':
      return require('./books/rt-manusher-dhrm.txt') as number;
    case 'rt-raja-prja':
      return require('./books/rt-raja-prja.txt') as number;
    case 'rt-rashiyar-chithi':
      return require('./books/rt-rashiyar-chithi.txt') as number;
    case 'rt-loksahitj':
      return require('./books/rt-loksahitj.txt') as number;
    case 'rt-shbdtttb':
      return require('./books/rt-shbdtttb.txt') as number;
    case 'rt-shantiniketn':
      return require('./books/rt-shantiniketn.txt') as number;
    case 'rt-shantiniketn-brhmchrjashrm':
      return require('./books/rt-shantiniketn-brhmchrjashrm.txt') as number;
    case 'rt-shiksha':
      return require('./books/rt-shiksha.txt') as number;
    case 'rt-shilp':
      return require('./books/rt-shilp.txt') as number;
    case 'rt-snggit':
      return require('./books/rt-snggit.txt') as number;
    case 'rt-snggitchinta':
      return require('./books/rt-snggitchinta.txt') as number;
    case 'rt-snychy':
      return require('./books/rt-snychy.txt') as number;
    case 'rt-sbhjtar-sngkt':
      return require('./books/rt-sbhjtar-sngkt.txt') as number;
    case 'rt-smbayniti':
      return require('./books/rt-smbayniti.txt') as number;
    case 'rt-smaj':
      return require('./books/rt-smaj.txt') as number;
    case 'rt-smuh':
      return require('./books/rt-smuh.txt') as number;
    case 'rt-samyik-sarsnggrh':
      return require('./books/rt-samyik-sarsnggrh.txt') as number;
    case 'rt-samyik-sahitj-smalochna':
      return require('./books/rt-samyik-sahitj-smalochna.txt') as number;
    case 'rt-sahitj':
      return require('./books/rt-sahitj.txt') as number;
    case 'rt-sahitjer-pthe':
      return require('./books/rt-sahitjer-pthe.txt') as number;
    case 'rt-sahitjer-sbrup':
      return require('./books/rt-sahitjer-sbrup.txt') as number;
    case 'rt-sbdesh-probondho':
      return require('./books/rt-sbdesh-probondho.txt') as number;
    case 'rt-yurop-prbasir-ptr':
      return require('./books/rt-yurop-prbasir-ptr.txt') as number;
    case 'rt-yurop-jatrir-dayari':
      return require('./books/rt-yurop-jatrir-dayari.txt') as number;
    case 'rt-creative-unity':
      return require('./books/rt-creative-unity.txt') as number;
    case 'rt-nationalism':
      return require('./books/rt-nationalism.txt') as number;
    case 'rt-sadhana':
      return require('./books/rt-sadhana.txt') as number;
    case 'rt-the-center-of-indian-culture':
      return require('./books/rt-the-center-of-indian-culture.txt') as number;
    case 'rt-gora':
      return require('./books/rt-gora.txt') as number;
    case 'rt-ghre-baire':
      return require('./books/rt-ghre-baire.txt') as number;
    case 'rt-chturngg':
      return require('./books/rt-chturngg.txt') as number;
    case 'rt-char-adhjay':
      return require('./books/rt-char-adhjay.txt') as number;
    case 'rt-chokher-bali':
      return require('./books/rt-chokher-bali.txt') as number;
    case 'rt-dui-bon':
      return require('./books/rt-dui-bon.txt') as number;
    case 'rt-nouka-dubi':
      return require('./books/rt-nouka-dubi.txt') as number;
    case 'rt-prjaptir-nirbndh':
      return require('./books/rt-prjaptir-nirbndh.txt') as number;
    case 'rt-bu-thakuranir-hat':
      return require('./books/rt-bu-thakuranir-hat.txt') as number;
    case 'rt-malnych-uponnash':
      return require('./books/rt-malnych-uponnash.txt') as number;
    case 'rt-jogajog-uponnash':
      return require('./books/rt-jogajog-uponnash.txt') as number;
    case 'rt-rajrshi':
      return require('./books/rt-rajrshi.txt') as number;
    case 'rt-shesher-kbita':
      return require('./books/rt-shesher-kbita.txt') as number;
    case 'rt-achlaytn':
      return require('./books/rt-achlaytn.txt') as number;
    case 'rt-aruprtn':
      return require('./books/rt-aruprtn.txt') as number;
    case 'rt-rinshodh':
      return require('./books/rt-rinshodh.txt') as number;
    case 'rt-kalmrigya':
      return require('./books/rt-kalmrigya.txt') as number;
    case 'rt-kaler-jatra':
      return require('./books/rt-kaler-jatra.txt') as number;
    case 'rt-kahini-natok':
      return require('./books/rt-kahini-natok.txt') as number;
    case 'rt-guru':
      return require('./books/rt-guru.txt') as number;
    case 'rt-grihprbesh':
      return require('./books/rt-grihprbesh.txt') as number;
    case 'rt-goray-gld':
      return require('./books/rt-goray-gld.txt') as number;
    case 'rt-chndalika':
      return require('./books/rt-chndalika.txt') as number;
    case 'rt-chitranggda':
      return require('./books/rt-chitranggda.txt') as number;
    case 'rt-chirkumar-sbha':
      return require('./books/rt-chirkumar-sbha.txt') as number;
    case 'rt-dakghr':
      return require('./books/rt-dakghr.txt') as number;
    case 'rt-tpti':
      return require('./books/rt-tpti.txt') as number;
    case 'rt-taser-desh':
      return require('./books/rt-taser-desh.txt') as number;
    case 'rt-ntraj':
      return require('./books/rt-ntraj.txt') as number;
    case 'rt-ntir-puja':
      return require('./books/rt-ntir-puja.txt') as number;
    case 'rt-nbin':
      return require('./books/rt-nbin.txt') as number;
    case 'rt-nlini':
      return require('./books/rt-nlini.txt') as number;
    case 'rt-nritjnatj-chndalika':
      return require('./books/rt-nritjnatj-chndalika.txt') as number;
    case 'rt-nritjnatj-chitranggda':
      return require('./books/rt-nritjnatj-chitranggda.txt') as number;
    case 'rt-nritjnatj-mayar-khela':
      return require('./books/rt-nritjnatj-mayar-khela.txt') as number;
    case 'rt-pritran':
      return require('./books/rt-pritran.txt') as number;
    case 'rt-prishodh':
      return require('./books/rt-prishodh.txt') as number;
    case 'rt-prkritir-prtishodh':
      return require('./books/rt-prkritir-prtishodh.txt') as number;
    case 'rt-prayshchitt':
      return require('./books/rt-prayshchitt.txt') as number;
    case 'rt-phalguni':
      return require('./books/rt-phalguni.txt') as number;
    case 'rt-bsnt':
      return require('./books/rt-bsnt.txt') as number;
    case 'rt-bashri':
      return require('./books/rt-bashri.txt') as number;
    case 'rt-balmikiprtibha':
      return require('./books/rt-balmikiprtibha.txt') as number;
    case 'rt-balmikiprtibha-prthm-sngskrn':
      return require('./books/rt-balmikiprtibha-prthm-sngskrn.txt') as number;
    case 'rt-biday-abhishap':
      return require('./books/rt-biday-abhishap.txt') as number;
    case 'rt-bisrjn':
      return require('./books/rt-bisrjn.txt') as number;
    case 'rt-bisrjn-sngkshipt':
      return require('./books/rt-bisrjn-sngkshipt.txt') as number;
    case 'rt-boikunther-khata':
      return require('./books/rt-boikunther-khata.txt') as number;
    case 'rt-bjnggkoutuk-natok':
      return require('./books/rt-bjnggkoutuk-natok.txt') as number;
    case 'rt-bhgnhridy':
      return require('./books/rt-bhgnhridy.txt') as number;
    case 'rt-malnych-natok':
      return require('./books/rt-malnych-natok.txt') as number;
    case 'rt-malini':
      return require('./books/rt-malini.txt') as number;
    case 'rt-mayar-khela':
      return require('./books/rt-mayar-khela.txt') as number;
    case 'rt-mukut':
      return require('./books/rt-mukut.txt') as number;
    case 'rt-muktdhara':
      return require('./books/rt-muktdhara.txt') as number;
    case 'rt-muktir-upay':
      return require('./books/rt-muktir-upay.txt') as number;
    case 'rt-jogajog-natok':
      return require('./books/rt-jogajog-natok.txt') as number;
    case 'rt-rktkrbi':
      return require('./books/rt-rktkrbi.txt') as number;
    case 'rt-raja':
      return require('./books/rt-raja.txt') as number;
    case 'rt-raja-o-rani':
      return require('./books/rt-raja-o-rani.txt') as number;
    case 'rt-rudrchnd':
      return require('./books/rt-rudrchnd.txt') as number;
    case 'rt-shapmochn':
      return require('./books/rt-shapmochn.txt') as number;
    case 'rt-shardotsb':
      return require('./books/rt-shardotsb.txt') as number;
    case 'rt-shesh-brshn':
      return require('./books/rt-shesh-brshn.txt') as number;
    case 'rt-sheshrksha':
      return require('./books/rt-sheshrksha.txt') as number;
    case 'rt-shodhbodh':
      return require('./books/rt-shodhbodh.txt') as number;
    case 'rt-shjama':
      return require('./books/rt-shjama.txt') as number;
    case 'rt-shrabngatha':
      return require('./books/rt-shrabngatha.txt') as number;
    case 'rt-sundr':
      return require('./books/rt-sundr.txt') as number;
    case 'rt-hasjkoutuk':
      return require('./books/rt-hasjkoutuk.txt') as number;
    case 'rt-autumn-festival':
      return require('./books/rt-autumn-festival.txt') as number;
    case 'rt-chitra':
      return require('./books/rt-chitra.txt') as number;
    case 'rt-malini-2':
      return require('./books/rt-malini-2.txt') as number;
    case 'rt-red-oleanders':
      return require('./books/rt-red-oleanders.txt') as number;
    case 'rt-sacrifice':
      return require('./books/rt-sacrifice.txt') as number;
    case 'rt-sanyasi-or-the-ascetic':
      return require('./books/rt-sanyasi-or-the-ascetic.txt') as number;
    case 'rt-the-gardener':
      return require('./books/rt-the-gardener.txt') as number;
    case 'rt-the-king-and-the-queen':
      return require('./books/rt-the-king-and-the-queen.txt') as number;
    case 'rt-the-trial':
      return require('./books/rt-the-trial.txt') as number;
    case 'rt-the-waterfall':
      return require('./books/rt-the-waterfall.txt') as number;
    case 'rt-anubad-kbita':
      return require('./books/rt-anubad-kbita.txt') as number;
    case 'rt-anudit-kbita':
      return require('./books/rt-anudit-kbita.txt') as number;
    case 'rt-aakashprdip':
      return require('./books/rt-aakashprdip.txt') as number;
    case 'rt-aarogj':
      return require('./books/rt-aarogj.txt') as number;
    case 'rt-utsrg':
      return require('./books/rt-utsrg.txt') as number;
    case 'rt-knika':
      return require('./books/rt-knika.txt') as number;
    case 'rt-ktha':
      return require('./books/rt-ktha.txt') as number;
    case 'rt-kbita':
      return require('./books/rt-kbita.txt') as number;
    case 'rt-klpna':
      return require('./books/rt-klpna.txt') as number;
    case 'rt-kahini-kobita':
      return require('./books/rt-kahini-kobita.txt') as number;
    case 'rt-kshnika':
      return require('./books/rt-kshnika.txt') as number;
    case 'rt-kri-o-koml':
      return require('./books/rt-kri-o-koml.txt') as number;
    case 'rt-khapchhara':
      return require('./books/rt-khapchhara.txt') as number;
    case 'rt-kheya':
      return require('./books/rt-kheya.txt') as number;
    case 'rt-glpslp-kobita':
      return require('./books/rt-glpslp-kobita.txt') as number;
    case 'rt-gitanyjli':
      return require('./books/rt-gitanyjli.txt') as number;
    case 'rt-gitali':
      return require('./books/rt-gitali.txt') as number;
    case 'rt-gitimalj':
      return require('./books/rt-gitimalj.txt') as number;
    case 'rt-chitrbichitr':
      return require('./books/rt-chitrbichitr.txt') as number;
    case 'rt-chitra-2':
      return require('./books/rt-chitra-2.txt') as number;
    case 'rt-choitali':
      return require('./books/rt-choitali.txt') as number;
    case 'rt-chhbi-o-gan':
      return require('./books/rt-chhbi-o-gan.txt') as number;
    case 'rt-chhra':
      return require('./books/rt-chhra.txt') as number;
    case 'rt-chhrar-chhbi':
      return require('./books/rt-chhrar-chhbi.txt') as number;
    case 'rt-jnmdine':
      return require('./books/rt-jnmdine.txt') as number;
    case 'rt-ndi':
      return require('./books/rt-ndi.txt') as number;
    case 'rt-nbjatk':
      return require('./books/rt-nbjatk.txt') as number;
    case 'rt-noibedj':
      return require('./books/rt-noibedj.txt') as number;
    case 'rt-ptrput':
      return require('./books/rt-ptrput.txt') as number;
    case 'rt-prishesh':
      return require('./books/rt-prishesh.txt') as number;
    case 'rt-platka':
      return require('./books/rt-platka.txt') as number;
    case 'rt-punshch':
      return require('./books/rt-punshch.txt') as number;
    case 'rt-purbi':
      return require('./books/rt-purbi.txt') as number;
    case 'rt-prbhatsnggit':
      return require('./books/rt-prbhatsnggit.txt') as number;
    case 'rt-prhasini':
      return require('./books/rt-prhasini.txt') as number;
    case 'rt-prantik':
      return require('./books/rt-prantik.txt') as number;
    case 'rt-bnbani':
      return require('./books/rt-bnbani.txt') as number;
    case 'rt-blaka':
      return require('./books/rt-blaka.txt') as number;
    case 'rt-bichitrita':
      return require('./books/rt-bichitrita.txt') as number;
    case 'rt-bithika':
      return require('./books/rt-bithika.txt') as number;
    case 'rt-bhanusingh-thakurer-pdabli':
      return require('./books/rt-bhanusingh-thakurer-pdabli.txt') as number;
    case 'rt-mhuya':
      return require('./books/rt-mhuya.txt') as number;
    case 'rt-mansi':
      return require('./books/rt-mansi.txt') as number;
    case 'rt-rupantr':
      return require('./books/rt-rupantr.txt') as number;
    case 'rt-rogshjjay':
      return require('./books/rt-rogshjjay.txt') as number;
    case 'rt-lekhn':
      return require('./books/rt-lekhn.txt') as number;
    case 'rt-shishu':
      return require('./books/rt-shishu.txt') as number;
    case 'rt-shishu-bholanath':
      return require('./books/rt-shishu-bholanath.txt') as number;
    case 'rt-shesh-lekha':
      return require('./books/rt-shesh-lekha.txt') as number;
    case 'rt-shesh-sptk':
      return require('./books/rt-shesh-sptk.txt') as number;
    case 'rt-shjamli':
      return require('./books/rt-shjamli.txt') as number;
    case 'rt-sndhjasnggit':
      return require('./books/rt-sndhjasnggit.txt') as number;
    case 'rt-sanai':
      return require('./books/rt-sanai.txt') as number;
    case 'rt-sejuti':
      return require('./books/rt-sejuti.txt') as number;
    case 'rt-sonar-tri':
      return require('./books/rt-sonar-tri.txt') as number;
    case 'rt-sphulingg':
      return require('./books/rt-sphulingg.txt') as number;
    case 'rt-sphulingg-aprchlit-snggrh':
      return require('./books/rt-sphulingg-aprchlit-snggrh.txt') as number;
    case 'rt-sphulingg-sngjojn':
      return require('./books/rt-sphulingg-sngjojn.txt') as number;
    case 'rt-smrn':
      return require('./books/rt-smrn.txt') as number;
    case 'rt-collected-poems-and-plays':
      return require('./books/rt-collected-poems-and-plays.txt') as number;
    case 'rt-crossing':
      return require('./books/rt-crossing.txt') as number;
    case 'rt-fireflies':
      return require('./books/rt-fireflies.txt') as number;
    case 'rt-fruit-gathering':
      return require('./books/rt-fruit-gathering.txt') as number;
    case 'rt-gitanjali':
      return require('./books/rt-gitanjali.txt') as number;
    case 'rt-lover-s-gift':
      return require('./books/rt-lover-s-gift.txt') as number;
    case 'rt-one-hundred-poems-of-kabir':
      return require('./books/rt-one-hundred-poems-of-kabir.txt') as number;
    case 'rt-poems':
      return require('./books/rt-poems.txt') as number;
    case 'rt-stray-birds':
      return require('./books/rt-stray-birds.txt') as number;
    case 'rt-the-child':
      return require('./books/rt-the-child.txt') as number;
    case 'rt-the-crescent-moon':
      return require('./books/rt-the-crescent-moon.txt') as number;
    case 'rt-the-fugitive-i':
      return require('./books/rt-the-fugitive-i.txt') as number;
    case 'rt-the-fugitive-ii':
      return require('./books/rt-the-fugitive-ii.txt') as number;
    case 'rt-the-fugitive-iii':
      return require('./books/rt-the-fugitive-iii.txt') as number;
    case 'rt-aanushthanik':
      return require('./books/rt-aanushthanik.txt') as number;
    case 'rt-aanushthanik-snggit':
      return require('./books/rt-aanushthanik-snggit.txt') as number;
    case 'rt-kalmrigya-gitbitan':
      return require('./books/rt-kalmrigya-gitbitan.txt') as number;
    case 'rt-chndalika-gitbitan':
      return require('./books/rt-chndalika-gitbitan.txt') as number;
    case 'rt-chitranggda-gitbitan':
      return require('./books/rt-chitranggda-gitbitan.txt') as number;
    case 'rt-jatiy-snggit':
      return require('./books/rt-jatiy-snggit.txt') as number;
    case 'rt-natjgiti':
      return require('./books/rt-natjgiti.txt') as number;
    case 'rt-prishisht-1-nritjnatj-mayar-khela':
      return require('./books/rt-prishisht-1-nritjnatj-mayar-khela.txt') as number;
    case 'rt-prishisht-2-prishodh':
      return require('./books/rt-prishisht-2-prishodh.txt') as number;
    case 'rt-prishisht-3-rbichchhaya':
      return require('./books/rt-prishisht-3-rbichchhaya.txt') as number;
    case 'rt-prishisht-4':
      return require('./books/rt-prishisht-4.txt') as number;
    case 'rt-puja':
      return require('./books/rt-puja.txt') as number;
    case 'rt-puja-o-prarthna':
      return require('./books/rt-puja-o-prarthna.txt') as number;
    case 'rt-prkriti':
      return require('./books/rt-prkriti.txt') as number;
    case 'rt-prem':
      return require('./books/rt-prem.txt') as number;
    case 'rt-prem-o-prkriti':
      return require('./books/rt-prem-o-prkriti.txt') as number;
    case 'rt-balmikiprtibha-gitbitan':
      return require('./books/rt-balmikiprtibha-gitbitan.txt') as number;
    case 'rt-bichitr':
      return require('./books/rt-bichitr.txt') as number;
    case 'rt-bhanusingh-thakurer-pdabli-gitbitan':
      return require('./books/rt-bhanusingh-thakurer-pdabli-gitbitan.txt') as number;
    case 'rt-mayar-khela-gitbitan':
      return require('./books/rt-mayar-khela-gitbitan.txt') as number;
    case 'rt-shjama-gitbitan':
      return require('./books/rt-shjama-gitbitan.txt') as number;
    case 'rt-sbdesh-gaan':
      return require('./books/rt-sbdesh-gaan.txt') as number;
    case 'rt-anjanj':
      return require('./books/rt-anjanj.txt') as number;
    case 'rt-glpguchchh':
      return require('./books/rt-glpguchchh.txt') as number;
    case 'rt-glpslp-golpo':
      return require('./books/rt-glpslp-golpo.txt') as number;
    case 'rt-tinsnggi':
      return require('./books/rt-tinsnggi.txt') as number;
    case 'rt-lipika':
      return require('./books/rt-lipika.txt') as number;
    case 'rt-english-stories':
      return require('./books/rt-english-stories.txt') as number;
    case 'rt-anubad-chrcha':
      return require('./books/rt-anubad-chrcha.txt') as number;
    case 'rt-aalochna':
      return require('./books/rt-aalochna.txt') as number;
    case 'rt-ingraji-path-prthm-bhag':
      return require('./books/rt-ingraji-path-prthm-bhag.txt') as number;
    case 'rt-ingraji-shjshiksha-prthm-o-dbitiy-bhag':
      return require('./books/rt-ingraji-shjshiksha-prthm-o-dbitiy-bhag.txt') as number;
    case 'rt-oupnishd-brhm':
      return require('./books/rt-oupnishd-brhm.txt') as number;
    case 'rt-kbi-kahini':
      return require('./books/rt-kbi-kahini.txt') as number;
    case 'rt-bnphul':
      return require('./books/rt-bnphul.txt') as number;
    case 'rt-bibidh-prsngg':
      return require('./books/rt-bibidh-prsngg.txt') as number;
    case 'rt-brhmmntr':
      return require('./books/rt-brhmmntr.txt') as number;
    case 'rt-mntri-abhishek':
      return require('./books/rt-mntri-abhishek.txt') as number;
    case 'rt-shoishbsnggit':
      return require('./books/rt-shoishbsnggit.txt') as number;
    case 'rt-sngskrit-shiksha-dbitiy-bhag':
      return require('./books/rt-sngskrit-shiksha-dbitiy-bhag.txt') as number;
    case 'rt-smalochna':
      return require('./books/rt-smalochna.txt') as number;
    case 'rt-shj-path-prthm-o-dbitiy-bhag':
      return require('./books/rt-shj-path-prthm-o-dbitiy-bhag.txt') as number;
    default:
      return null;
  }
}

export async function loadRabindranathBookChaptersAsync(
  bookId: string
): Promise<Chapter[]> {
  const cached = bookCache.get(bookId);
  if (cached) {
    bookCache.delete(bookId);
    bookCache.set(bookId, cached);
    return cached;
  }

  const assetModule = getBookAssetModule(bookId);
  if (assetModule === null) return [];

  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) return [];

  let parsed: BookContentFile;
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    parsed = (await res.json()) as BookContentFile;
  } else {
    parsed = (await new File(uri).json()) as BookContentFile;
  }

  const chapters = parsed?.chapters ?? [];
  if (chapters.length > 0) {
    if (bookCache.size >= MAX_CACHE) {
      const oldestKey = bookCache.keys().next().value;
      if (oldestKey !== undefined) {
        bookCache.delete(oldestKey);
      }
    }
    bookCache.set(bookId, chapters);
  }
  return chapters;
}
