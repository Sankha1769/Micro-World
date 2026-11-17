/* ================= library structure for the expanded collection ================= */
CATS.length = 0;
CATS.push(
  { id: 'protozoa', name: 'Protozoa', short: 'Protozoa', col: '#6f9a6d' },
  { id: 'animals', name: 'Microscopic Animals', short: 'Animals', col: '#c98770' },
  { id: 'algae', name: 'Microscopic Algae', short: 'Algae', col: '#8aa84f' },
  { id: 'bact', name: 'Bacteria', short: 'Bacteria', col: '#d5aa60' },
  { id: 'fungi', name: 'Microscopic Fungi', short: 'Fungi', col: '#a8745f' },
  { id: 'other', name: 'Other Microscopic Life', short: 'Other', col: '#8f9a86' },
  { id: 'human', name: 'Human Cells', short: 'Human', col: '#b8605a' },
  { id: 'plant', name: 'Plant Cells', short: 'Plant', col: '#5f9a68' },
  { id: 'virus', name: 'Viruses', short: 'Viruses', col: '#8d78b0' });
['amoeba', 'paramecium', 'euglena', 'giardia'].forEach(id => BYID[id].cat = 'protozoa');
BYID.rotifer.cat = 'animals';
const EXTRA = {
  amoeba: { cls: 'Eukaryota · Amoebozoa · Tubulinea', habitat: 'Freshwater ponds, ditches and damp soil', move: 'Crawls by flowing cytoplasm into pseudopodia', feed: 'Heterotroph: engulfs algae and small protists by phagocytosis', repro: 'Asexual binary fission',
    fun: ['Amoeba proteus is among the largest amoebae and can be just visible to the naked eye.', 'It has no cell wall and no fixed shape. The outer ectoplasm is gel-like and the inner endoplasm flows.', 'The contractile vacuole fills and empties repeatedly to pump out the water that leaks in.'], note: 'Shape changes are animated and stylised, not a recorded trajectory. Organelle sizes are approximate.' },
  paramecium: { cls: 'Eukaryota · SAR · Ciliophora · Oligohymenophorea', habitat: 'Stagnant freshwater and pond scum', move: 'Swims by beating cilia, spiralling around its long axis', feed: 'Heterotroph: sweeps bacteria and yeast into the oral groove', repro: 'Binary fission; sexual conjugation exchanges micronuclei',
    fun: ['A single cell carries thousands of cilia that beat in coordinated waves.', 'It fires tiny harpoon-like trichocysts when threatened.', 'If it hits an obstacle it reverses its cilia, backs up and tries a new direction.'], note: 'Only a representative fraction of the cilia is drawn. The beat pattern is a stylised wave.' },
  euglena: { cls: 'Eukaryota · Discoba · Euglenozoa', habitat: 'Freshwater ponds and nutrient-rich puddles', move: 'Whip-like flagellum; also squirming euglenoid movement', feed: 'Mixotroph: photosynthesis in light, absorbs nutrients in the dark', repro: 'Asexual binary fission along the long axis',
    fun: ['The eyespot shades a light sensor at the flagellum base so the cell can steer toward light.', 'Paramylon, its storage carbohydrate, is unique to the euglenoids.', 'It has plant-like chloroplasts that came from an engulfed green alga.'], note: 'Chloroplast and granule numbers are approximate. Swimming is stylised.' },
  giardia: { cls: 'Eukaryota · Metamonada · Fornicata', habitat: 'Small intestine of mammals; cysts in cold fresh water', move: 'Four pairs of flagella; a ventral disc clings to the gut wall', feed: 'Absorbs nutrients from the host gut', repro: 'Binary fission of trophozoites; infectious cysts pass in faeces',
    fun: ['Two nuclei and a flattened face give it a distinctive “face” under the microscope.', 'It causes giardiasis, a common waterborne diarrhoeal illness.', 'Cysts can survive for weeks to months in cold water.'], note: 'Flagellar beating is stylised; the ventral disc is simplified.' },
  rotifer: { cls: 'Animalia · Rotifera · Bdelloidea', habitat: 'Freshwater, damp moss and soil', move: 'Swims with its ciliary crown; crawls leech-like with its foot', feed: 'Filter feeder: cilia sweep algae and bacteria toward the mastax', repro: 'Parthenogenesis: females clone themselves; no males are known in bdelloids',
    fun: ['Bdelloid rotifers can dry out completely and revive when wetted (anhydrobiosis).', 'The mastax is a muscular throat with hard jaws called trophi.', 'Bdelloids appear to have reproduced without males for tens of millions of years.'], note: 'Internal organs are simplified. The crown cilia beat is stylised.' },
  ecoli: { cls: 'Bacteria · Pseudomonadota · Gammaproteobacteria', habitat: 'Intestines of warm-blooded animals; soil and water', move: 'Swims by rotating peritrichous flagella (run and tumble)', feed: 'Heterotroph; ferments or respires sugars', repro: 'Binary fission, as fast as about every 20 minutes under ideal conditions',
    fun: ['Most strains are harmless gut residents; a few cause serious illness.', 'It is one of the most studied organisms in molecular biology.', 'A Gram-negative cell has a thin peptidoglycan wall between two membranes.'], note: 'Flagella and pili are fewer and thicker than in life.' },
  lacto: { cls: 'Bacteria · Bacillota · Bacilli', habitat: 'Mouth, gut and vagina; fermented foods such as yoghurt', move: 'Non-motile', feed: 'Ferments sugars to lactic acid', repro: 'Binary fission, often forming chains',
    fun: ['Lactic acid from these bacteria gives yoghurt and sauerkraut their sour taste.', 'Gram-positive cells have a thick peptidoglycan wall.', 'Some strains are sold as probiotics.'], note: 'Cell dimensions follow typical rods; chain length varies in nature.' },
  spirillum: { cls: 'Bacteria · Pseudomonadota · Betaproteobacteria', habitat: 'Stagnant freshwater with some dissolved organic matter', move: 'Corkscrew swimming with tufts of flagella at both ends', feed: 'Heterotroph; prefers low oxygen (microaerophile)', repro: 'Binary fission',
    fun: ['Spirillum volutans is one of the largest spiral bacteria, reaching several tens of micrometres.', 'It stores polyphosphate in volutin granules.', 'Its rigid helical body differs from the flexible spirochaetes.'], note: 'Flagellar bundles are drawn thicker for visibility.' },
  staph: { cls: 'Bacteria · Bacillota · Bacilli (Staphylococcaceae)', habitat: 'Skin and nasal passages of mammals', move: 'Non-motile', feed: 'Heterotroph (facultative anaerobe)', repro: 'Binary fission in several planes, giving grape-like clusters',
    fun: ['The name comes from the Greek for a bunch of grapes.', 'Some strains, such as MRSA, resist many antibiotics.', 'Many healthy people carry it without symptoms.'], note: 'Cell number in the cluster is representative.' },
};
Object.entries(EXTRA).forEach(([id, x]) => Object.assign(BYID[id], x));
const ORDER = ['amoeba', 'paramecium', 'euglena', 'stentor', 'vorticella', 'giardia', 'trypanosoma', 'plasmodium', 'tetrahymena', 'didinium',
  'tardigrade', 'rotifer', 'daphnia', 'hydra', 'nematode', 'gastrotrich',
  'volvox', 'spirogyra', 'chlamydomonas', 'diatom', 'dinoflagellate', 'desmid', 'oscillatoria',
  'ecoli', 'staph', 'strep', 'lacto', 'spirillum', 'bacillus', 'vibrio', 'anabaena', 'cyano',
  'yeast', 'aspergillus', 'penicillium', 'rhizopus', 'candida',
  'archaea', 'spores', 'ciliate', 'plankton'];
NEW_SPEC.forEach(s => { SPEC.push(s); BYID[s.id] = s; });
{ const idx = new Map(SPEC.map((s, i) => [s.id, i])); SPEC.sort((a, b) => { const ra = ORDER.indexOf(a.id), rb = ORDER.indexOf(b.id); return (ra < 0 ? 1000 + idx.get(a.id) : ra) - (rb < 0 ? 1000 + idx.get(b.id) : rb); }); }
