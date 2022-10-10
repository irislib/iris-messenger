/* eslint no-useless-escape: "off", camelcase: "off" */

import Gun from 'gun'; // eslint-disable-line no-unused-vars
import 'gun/sea';
import _ from "lodash";

// eslint-disable-line no-unused-vars

let isNode = false;
try {
  isNode = Object.prototype.toString.call(global.process) === `[object process]`;
} catch (e) { null; }

const userAgent = !isNode && navigator && navigator.userAgent && navigator.userAgent.toLowerCase();
const isElectron = (userAgent && userAgent.indexOf(' electron/') > -1);

const isMobile = !isNode && (function() {
  if (isElectron) { return false; }
  let check = false;
  (function(a) {if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;})(navigator.userAgent || navigator.vendor || window.opera || '');
  return check;
})();

function gunAsAnotherUser(gun, key, f) { // Hacky way to use multiple users with gun
  const gun2 = new Gun({radisk: false, peers: Object.keys(gun._.opt.peers)}); // TODO: copy other options too
  const user = gun2.user();
  user.auth(key);
  setTimeout(() => {
    const peers = Object.values(gun2.back('opt.peers'));
    peers.forEach(peer => {
      gun2.on('bye', peer);
    });
  }, 20000);
  return f(user);
}

function gunOnceDefined(node) {
  return new Promise(resolve => {
    node.on((val, k, a, eve) => {
      if (val !== undefined) {
        eve.off();
        resolve(val);
      }
    });
  });
}

async function loadGunDepth(chain, maxDepth = 2, opts = {}) {
  opts.maxBreadth = opts.maxBreadth || 50;
  opts.cache = opts.cache || {};

  return chain.then().then(layer => {

    // Depth limit reached, or non-object, or array value returned
    if (maxDepth < 1 || !layer || typeof layer !== 'object' || layer.constructor === Array) {
      return layer;
    }

    let bcount = 0;
    const promises = Object.keys(layer).map(key => {
      // Only fetch links & restrict total search queries to maxBreadth ^ maxDepth requests
      if (!Gun.val.link.is(layer[key]) || ++bcount >= opts.maxBreadth) {
        return;
      }

      // During one recursive lookup, don't fetch the same key multiple times
      if (opts.cache[key]) {
        return opts.cache[key].then(data => {
          layer[key] = data;
        });
      }

      return opts.cache[key] = loadGunDepth(chain.get(key), maxDepth - 1, opts).then(data => {
        layer[key] = data;
      });
    });

    return Promise.all(promises).then(() => layer);
  });
}

const animals = [
  'canidae',
  'felidae',
  'cat',
  'cattle',
  'dog',
  'donkey',
  'goat',
  'horse',
  'pig',
  'rabbit',
  'aardvark',
  'aardwolf',
  'albatross',
  'alligator',
  'alpaca',
  'amphibian',
  'anaconda',
  'angelfish',
  'anglerfish',
  'ant',
  'anteater',
  'antelope',
  'antlion',
  'ape',
  'aphid',
  'armadillo',
  'asp',
  'baboon',
  'badger',
  'bandicoot',
  'barnacle',
  'barracuda',
  'basilisk',
  'bass',
  'bat',
  'bear',
  'beaver',
  'bedbug',
  'bee',
  'beetle',
  'bird',
  'bison',
  'blackbird',
  'boa',
  'boar',
  'bobcat',
  'bobolink',
  'bonobo',
  'booby',
  'bovid',
  'bug',
  'butterfly',
  'buzzard',
  'camel',
  'canid',
  'capybara',
  'cardinal',
  'caribou',
  'carp',
  'cat',
  'catshark',
  'caterpillar',
  'catfish',
  'cattle',
  'centipede',
  'cephalopod',
  'chameleon',
  'cheetah',
  'chickadee',
  'chicken',
  'chimpanzee',
  'chinchilla',
  'chipmunk',
  'clam',
  'clownfish',
  'cobra',
  'cockroach',
  'cod',
  'condor',
  'constrictor',
  'coral',
  'cougar',
  'cow',
  'coyote',
  'crab',
  'crane',
  'crawdad',
  'crayfish',
  'cricket',
  'crocodile',
  'crow',
  'cuckoo',
  'cicada',
  'damselfly',
  'deer',
  'dingo',
  'dinosaur',
  'dog',
  'dolphin',
  'donkey',
  'dormouse',
  'dove',
  'dragonfly',
  'dragon',
  'duck',
  'eagle',
  'earthworm',
  'earwig',
  'echidna',
  'eel',
  'egret',
  'elephant',
  'elk',
  'emu',
  'ermine',
  'falcon',
  'ferret',
  'finch',
  'firefly',
  'fish',
  'flamingo',
  'flea',
  'fly',
  'flyingfish',
  'fowl',
  'fox',
  'frog',
  'gamefowl',
  'galliform',
  'gazelle',
  'gecko',
  'gerbil',
  'gibbon',
  'giraffe',
  'goat',
  'goldfish',
  'goose',
  'gopher',
  'gorilla',
  'grasshopper',
  'grouse',
  'guan',
  'guanaco',
  'guineafowl',
  'gull',
  'guppy',
  'haddock',
  'halibut',
  'hamster',
  'hare',
  'harrier',
  'hawk',
  'hedgehog',
  'heron',
  'herring',
  'hippopotamus',
  'hookworm',
  'hornet',
  'horse',
  'hoverfly',
  'hummingbird',
  'hyena',
  'iguana',
  'impala',
  'jackal',
  'jaguar',
  'jay',
  'jellyfish',
  'junglefowl',
  'kangaroo',
  'kingfisher',
  'kite',
  'kiwi',
  'koala',
  'koi',
  'krill',
  'ladybug',
  'lamprey',
  'landfowl',
  'lark',
  'leech',
  'lemming',
  'lemur',
  'leopard',
  'leopon',
  'limpet',
  'lion',
  'lizard',
  'llama',
  'lobster',
  'locust',
  'loon',
  'louse',
  'lungfish',
  'lynx',
  'macaw',
  'mackerel',
  'magpie',
  'mammal',
  'manatee',
  'mandrill',
  'marlin',
  'marmoset',
  'marmot',
  'marsupial',
  'marten',
  'mastodon',
  'meadowlark',
  'meerkat',
  'mink',
  'minnow',
  'mite',
  'mockingbird',
  'mole',
  'mollusk',
  'mongoose',
  'monkey',
  'moose',
  'mosquito',
  'moth',
  'mouse',
  'mule',
  'muskox',
  'narwhal',
  'newt',
  'nightingale',
  'ocelot',
  'octopus',
  'opossum',
  'orangutan',
  'orca',
  'ostrich',
  'otter',
  'owl',
  'ox',
  'panda',
  'panther',
  'parakeet',
  'parrot',
  'parrotfish',
  'partridge',
  'peacock',
  'peafowl',
  'pelican',
  'penguin',
  'perch',
  'pheasant',
  'pig',
  'pigeon',
  'pike',
  'pinniped',
  'piranha',
  'planarian',
  'platypus',
  'pony',
  'porcupine',
  'porpoise',
  'possum',
  'prawn',
  'primate',
  'ptarmigan',
  'puffin',
  'puma',
  'python',
  'quail',
  'quelea',
  'quokka',
  'rabbit',
  'raccoon',
  'rat',
  'rattlesnake',
  'raven',
  'reindeer',
  'reptile',
  'rhinoceros',
  'roadrunner',
  'rodent',
  'rook',
  'rooster',
  'roundworm',
  'sailfish',
  'salamander',
  'salmon',
  'sawfish',
  'scallop',
  'scorpion',
  'seahorse',
  'shark',
  'sheep',
  'shrew',
  'shrimp',
  'silkworm',
  'silverfish',
  'skink',
  'skunk',
  'sloth',
  'slug',
  'smelt',
  'snail',
  'snake',
  'snipe',
  'sole',
  'sparrow',
  'spider',
  'spoonbill',
  'squid',
  'squirrel',
  'starfish',
  'stingray',
  'stoat',
  'stork',
  'sturgeon',
  'swallow',
  'swan',
  'swift',
  'swordfish',
  'swordtail',
  'tahr',
  'takin',
  'tapir',
  'tarantula',
  'tarsier',
  'termite',
  'tern',
  'thrush',
  'tick',
  'tiger',
  'tiglon',
  'toad',
  'tortoise',
  'toucan',
  'trout',
  'tuna',
  'turkey',
  'turtle',
  'tyrannosaurus',
  'urial',
  'vicuna',
  'viper',
  'vole',
  'vulture',
  'wallaby',
  'walrus',
  'wasp',
  'warbler',
  'weasel',
  'whale',
  'whippet',
  'whitefish',
  'wildcat',
  'wildebeest',
  'wildfowl',
  'wolf',
  'wolverine',
  'wombat',
  'woodpecker',
  'worm',
  'wren',
  'xerinae',
  'yak',
  'zebra',
  'alpaca',
  'cat',
  'cattle',
  'chicken',
  'dog',
  'donkey',
  'ferret',
  'gayal',
  'goldfish',
  'guppy',
  'horse',
  'koi',
  'llama',
  'sheep',
  'yak',
  'unicorn',
];

const adjectives = [
  'average',
  'big',
  'colossal',
  'fat',
  'giant',
  'gigantic',
  'great',
  'huge',
  'immense',
  'large',
  'little',
  'long',
  'mammoth',
  'massive',
  'miniature',
  'petite',
  'puny',
  'short',
  'small',
  'tall',
  'tiny',
  'boiling',
  'breezy',
  'broken',
  'bumpy',
  'chilly',
  'cold',
  'cool',
  'creepy',
  'crooked',
  'cuddly',
  'curly',
  'damaged',
  'damp',
  'dirty',
  'dry',
  'dusty',
  'filthy',
  'flaky',
  'fluffy',
  'wet',
  'broad',
  'chubby',
  'crooked',
  'curved',
  'deep',
  'flat',
  'high',
  'hollow',
  'low',
  'narrow',
  'round',
  'shallow',
  'skinny',
  'square',
  'steep',
  'straight',
  'wide',
  'ancient',
  'brief',
  'early',
  'fast',
  'late',
  'long',
  'modern',
  'old',
  'quick',
  'rapid',
  'short',
  'slow',
  'swift',
  'young',
  'abundant',
  'empty',
  'few',
  'heavy',
  'light',
  'many',
  'numerous',
  'Sound',
  'cooing',
  'deafening',
  'faint',
  'harsh',
  'hissing',
  'hushed',
  'husky',
  'loud',
  'melodic',
  'moaning',
  'mute',
  'noisy',
  'purring',
  'quiet',
  'raspy',
  'resonant',
  'screeching',
  'shrill',
  'silent',
  'soft',
  'squealing',
  'thundering',
  'voiceless',
  'whispering',
  'bitter',
  'delicious',
  'fresh',
  'juicy',
  'ripe',
  'rotten',
  'salty',
  'sour',
  'spicy',
  'stale',
  'sticky',
  'strong',
  'sweet',
  'tasteless',
  'tasty',
  'thirsty',
  'fluttering',
  'fuzzy',
  'greasy',
  'grubby',
  'hard',
  'hot',
  'icy',
  'loose',
  'melted',
  'plastic',
  'prickly',
  'rainy',
  'rough',
  'scattered',
  'shaggy',
  'shaky',
  'sharp',
  'shivering',
  'silky',
  'slimy',
  'slippery',
  'smooth',
  'soft',
  'solid',
  'steady',
  'sticky',
  'tender',
  'tight',
  'uneven',
  'weak',
  'wet',
  'wooden',
  'afraid',
  'angry',
  'annoyed',
  'anxious',
  'arrogant',
  'ashamed',
  'awful',
  'bad',
  'bewildered',
  'bored',
  'combative',
  'condemned',
  'confused',
  'creepy',
  'cruel',
  'dangerous',
  'defeated',
  'defiant',
  'depressed',
  'disgusted',
  'disturbed',
  'eerie',
  'embarrassed',
  'envious',
  'evil',
  'fierce',
  'foolish',
  'frantic',
  'frightened',
  'grieving',
  'helpless',
  'homeless',
  'hungry',
  'hurt',
  'ill',
  'jealous',
  'lonely',
  'mysterious',
  'naughty',
  'nervous',
  'obnoxious',
  'outrageous',
  'panicky',
  'repulsive',
  'scary',
  'scornful',
  'selfish',
  'sore',
  'tense',
  'terrible',
  'thoughtless',
  'tired',
  'troubled',
  'upset',
  'uptight',
  'weary',
  'wicked',
  'worried',
  'agreeable',
  'amused',
  'brave',
  'calm',
  'charming',
  'cheerful',
  'comfortable',
  'cooperative',
  'courageous',
  'delightful',
  'determined',
  'eager',
  'elated',
  'enchanting',
  'encouraging',
  'energetic',
  'enthusiastic',
  'excited',
  'exuberant',
  'fair',
  'faithful',
  'fantastic',
  'fine',
  'friendly',
  'funny',
  'gentle',
  'glorious',
  'good',
  'happy',
  'healthy',
  'helpful',
  'hilarious',
  'jolly',
  'joyous',
  'kind',
  'lively',
  'lovely',
  'lucky',
  'obedient',
  'perfect',
  'pleasant',
  'proud',
  'relieved',
  'silly',
  'smiling',
  'splendid',
  'successful',
  'thoughtful',
  'victorious',
  'vivacious',
  'witty',
  'wonderful',
  'zealous',
  'zany',
  'other',
  'good',
  'new',
  'old',
  'great',
  'high',
  'small',
  'different',
  'large',
  'local',
  'social',
  'important',
  'long',
  'young',
  'national',
  'british',
  'right',
  'early',
  'possible',
  'big',
  'little',
  'political',
  'able',
  'late',
  'general',
  'full',
  'far',
  'low',
  'public',
  'available',
  'bad',
  'main',
  'sure',
  'clear',
  'major',
  'economic',
  'only',
  'likely',
  'real',
  'black',
  'particular',
  'international',
  'special',
  'difficult',
  'certain',
  'open',
  'whole',
  'white',
  'free',
  'short',
  'easy',
  'strong',
  'european',
  'central',
  'similar',
  'human',
  'common',
  'necessary',
  'single',
  'personal',
  'hard',
  'private',
  'poor',
  'financial',
  'wide',
  'foreign',
  'simple',
  'recent',
  'concerned',
  'american',
  'various',
  'close',
  'fine',
  'english',
  'wrong',
  'present',
  'royal',
  'natural',
  'individual',
  'nice',
  'french',
  'nihilist',
  'solipsist',
  'materialist',
  'surrealist',
  'heroic',
  'awesome',
  'hedonist',
  'absurd',
  'current',
  'modern',
  'labour',
  'legal',
  'happy',
  'final',
  'red',
  'normal',
  'serious',
  'previous',
  'total',
  'prime',
  'significant',
  'industrial',
  'sorry',
  'dead',
  'specific',
  'appropriate',
  'top',
  'soviet',
  'basic',
  'military',
  'original',
  'successful',
  'aware',
  'hon',
  'popular',
  'heavy',
  'professional',
  'direct',
  'dark',
  'cold',
  'ready',
  'green',
  'useful',
  'effective',
  'western',
  'traditional',
  'scottish',
  'german',
  'independent',
  'deep',
  'interesting',
  'considerable',
  'involved',
  'physical',
  'hot',
  'existing',
  'responsible',
  'complete',
  'medical',
  'blue',
  'extra',
  'past',
  'male',
  'interested',
  'fair',
  'essential',
  'beautiful',
  'civil',
  'primary',
  'obvious',
  'future',
  'environmental',
  'positive',
  'senior',
  'nuclear',
  'annual',
  'relevant',
  'huge',
  'rich',
  'commercial',
  'safe',
  'regional',
  'practical',
  'official',
  'separate',
  'key',
  'chief',
  'regular',
  'due',
  'additional',
  'active',
  'powerful',
  'complex',
  'standard',
  'impossible',
  'light',
  'warm',
  'middle',
  'fresh',
  'sexual',
  'front',
  'domestic',
  'actual',
  'united',
  'technical',
  'ordinary',
  'cheap',
  'strange',
  'internal',
  'excellent',
  'quiet',
  'soft',
  'potential',
  'northern',
  'religious',
  'quick',
  'very',
  'famous',
  'cultural',
  'proper',
  'broad',
  'joint',
  'formal',
  'limited',
  'conservative',
  'lovely',
  'usual',
  'ltd',
  'unable',
  'rural',
  'initial',
  'substantial',
  'bright',
  'average',
  'leading',
  'reasonable',
  'immediate',
  'suitable',
  'equal',
  'detailed',
  'working',
  'overall',
  'female',
  'afraid',
  'democratic',
  'growing',
  'sufficient',
  'scientific',
  'eastern',
  'correct',
  'inc',
  'irish',
  'expensive',
  'educational',
  'mental',
  'dangerous',
  'critical',
  'increased',
  'familiar',
  'unlikely',
  'double',
  'perfect',
  'slow',
  'tiny',
  'dry',
  'historical',
  'thin',
  'daily',
  'southern',
  'increasing',
  'wild',
  'alone',
  'urban',
  'empty',
  'married',
  'narrow',
  'liberal',
  'supposed',
  'upper',
  'apparent',
  'tall',
  'busy',
  'bloody',
  'prepared',
  'russian',
  'moral',
  'careful',
  'clean',
  'attractive',
  'japanese',
  'vital',
  'thick',
  'alternative',
  'fast',
  'ancient',
  'elderly',
  'rare',
  'external',
  'capable',
  'brief',
  'wonderful',
  'grand',
  'typical',
  'entire',
  'grey',
  'constant',
  'vast',
  'surprised',
  'ideal',
  'terrible',
  'academic',
  'funny',
  'minor',
  'pleased',
  'severe',
  'ill',
  'corporate',
  'negative',
  'permanent',
  'weak',
  'brown',
  'fundamental',
  'odd',
  'crucial',
  'inner',
  'used',
  'criminal',
  'contemporary',
  'sharp',
  'sick',
  'near',
  'roman',
  'massive',
  'unique',
  'secondary',
  'parliamentary',
  'african',
  'unknown',
  'subsequent',
  'angry',
  'alive',
  'guilty',
  'lucky',
  'enormous',
  'well',
  'yellow',
  'unusual',
  'net',
  'tough',
  'dear',
  'extensive',
  'glad',
  'remaining',
  'agricultural',
  'alright',
  'healthy',
  'italian',
  'principal',
  'tired',
  'efficient',
  'comfortable',
  'chinese',
  'relative',
  'friendly',
  'conventional',
  'willing',
  'sudden',
  'proposed',
  'voluntary',
  'slight',
  'valuable',
  'dramatic',
  'golden',
  'temporary',
  'federal',
  'keen',
  'flat',
  'silent',
  'indian',
  'worried',
  'pale',
  'statutory',
  'welsh',
  'dependent',
  'firm',
  'wet',
  'competitive',
  'armed',
  'radical',
  'outside',
  'acceptable',
  'sensitive',
  'living',
  'pure',
  'global',
  'emotional',
  'sad',
  'secret',
  'rapid',
  'adequate',
  'fixed',
  'sweet',
  'administrative',
  'wooden',
  'remarkable',
  'comprehensive',
  'surprising',
  'solid',
  'rough',
  'mere',
  'mass',
  'brilliant',
  'maximum',
  'absolute',
  'electronic',
  'visual',
  'electric',
  'cool',
  'spanish',
  'literary',
  'continuing',
  'supreme',
  'chemical',
  'genuine',
  'exciting',
  'written',
  'advanced',
  'extreme',
  'classical',
  'fit',
  'favourite',
  'widespread',
  'confident',
  'straight',
  'proud',
  'numerous',
  'opposite',
  'distinct',
  'mad',
  'helpful',
  'given',
  'disabled',
  'consistent',
  'anxious',
  'nervous',
  'awful',
  'stable',
  'constitutional',
  'satisfied',
  'conscious',
  'developing',
  'strategic',
  'holy',
  'smooth',
  'dominant',
  'remote',
  'theoretical',
  'outstanding',
  'pink',
  'pretty',
  'clinical',
  'minimum',
  'honest',
  'impressive',
  'related',
  'residential',
  'extraordinary',
  'plain',
  'visible',
  'accurate',
  'distant',
  'still',
  'greek',
  'complicated',
  'musical',
  'precise',
  'gentle',
  'broken',
  'live',
  'silly',
  'fat',
  'tight',
  'monetary',
  'round',
  'psychological',
  'violent',
  'unemployed',
  'inevitable',
  'junior',
  'sensible',
  'grateful',
  'pleasant',
  'dirty',
  'structural',
  'welcome',
  'deaf',
  'above',
  'continuous',
  'blind',
  'overseas',
  'mean',
  'entitled',
  'delighted',
  'loose',
  'occasional',
  'evident',
  'desperate',
  'fellow',
  'universal',
  'square',
  'steady',
  'classic',
  'equivalent',
  'intellectual',
  'victorian',
  'level',
  'ultimate',
  'creative',
  'lost',
  'medieval',
  'clever',
  'linguistic',
  'convinced',
  'judicial',
  'raw',
  'sophisticated',
  'asleep',
  'vulnerable',
  'illegal',
  'outer',
  'revolutionary',
  'bitter',
  'changing',
  'australian',
  'native',
  'imperial',
  'strict',
  'wise',
  'informal',
  'flexible',
  'collective',
  'frequent',
  'experimental',
  'spiritual',
  'intense',
  'rational',
  'generous',
  'inadequate',
  'prominent',
  'logical',
  'bare',
  'historic',
  'modest',
  'dutch',
  'acute',
  'electrical',
  'valid',
  'weekly',
  'gross',
  'automatic',
  'loud',
  'reliable',
  'mutual',
  'liable',
  'multiple',
  'ruling',
  'curious',
  'sole',
  'managing',
  'pregnant',
  'latin',
  'nearby',
  'exact',
  'underlying',
  'identical',
  'satisfactory',
  'marginal',
  'distinctive',
  'electoral',
  'urgent',
  'presidential',
  'controversial',
  'everyday',
  'encouraging',
  'organic',
  'continued',
  'expected',
  'statistical',
  'desirable',
  'innocent',
  'improved',
  'exclusive',
  'marked',
  'experienced',
  'unexpected',
  'superb',
  'sheer',
  'disappointed',
  'frightened',
  'gastric',
  'romantic',
  'naked',
  'reluctant',
  'magnificent',
  'convenient',
  'established',
  'closed',
  'uncertain',
  'artificial',
  'diplomatic',
  'tremendous',
  'marine',
  'mechanical',
  'retail',
  'institutional',
  'mixed',
  'required',
  'biological',
  'known',
  'functional',
  'straightforward',
  'superior',
  'digital',
  'spectacular',
  'unhappy',
  'confused',
  'unfair',
  'aggressive',
  'spare',
  'painful',
  'abstract',
  'asian',
  'associated',
  'legislative',
  'monthly',
  'intelligent',
  'hungry',
  'explicit',
  'nasty',
  'just',
  'faint',
  'coloured',
  'ridiculous',
  'amazing',
  'comparable',
  'successive',
  'realistic',
  'back',
  'decent',
  'decentralized',
  'bitcoin',
  'cypherpunk',
  'unnecessary',
  'flying',
  'random',
  'influential',
  'dull',
  'genetic',
  'neat',
  'marvellous',
  'crazy',
  'damp',
  'giant',
  'secure',
  'bottom',
  'skilled',
  'subtle',
  'elegant',
  'brave',
  'lesser',
  'parallel',
  'steep',
  'intensive',
  'casual',
  'tropical',
  'lonely',
  'partial',
  'preliminary',
  'concrete',
  'alleged',
  'assistant',
  'vertical',
  'upset',
  'delicate',
  'mild',
  'occupational',
  'excessive',
  'progressive',
  'exceptional',
  'integrated',
  'striking',
  'continental',
  'okay',
  'harsh',
  'combined',
  'fierce',
  'handsome',
  'characteristic',
  'chronic',
  'compulsory',
  'interim',
  'objective',
  'splendid',
  'magic',
  'systematic',
  'obliged',
  'payable',
  'fun',
  'horrible',
  'primitive',
  'fascinating',
  'ideological',
  'metropolitan',
  'surrounding',
  'estimated',
  'peaceful',
  'premier',
  'operational',
  'technological',
  'kind',
  'advisory',
  'hostile',
  'precious',
  'accessible',
  'determined',
  'excited',
  'impressed',
  'provincial',
  'smart',
  'endless',
  'isolated',
  'drunk',
  'geographical',
  'like',
  'dynamic',
  'boring',
  'forthcoming',
  'unfortunate',
  'definite',
  'super',
  'notable',
  'indirect',
  'stiff',
  'wealthy',
  'awkward',
  'lively',
  'neutral',
  'artistic',
  'content',
  'mature',
  'colonial',
  'ambitious',
  'evil',
  'magnetic',
  'verbal',
  'legitimate',
  'sympathetic',
  'empirical',
  'head',
  'shallow',
  'vague',
  'naval',
  'depressed',
  'shared',
  'added',
  'shocked',
  'mid',
  'worthwhile',
  'qualified',
  'missing',
  'blank',
  'absent',
  'favourable',
  'polish',
  'israeli',
  'developed',
  'profound',
  'representative',
  'enthusiastic',
  'dreadful',
  'rigid',
  'reduced',
  'cruel',
  'coastal',
  'peculiar',
  'swiss',
  'crude',
  'extended',
  'selected',
  'eager',
  'canadian',
  'bold',
  'relaxed',
  'corresponding',
  'running',
  'planned',
  'applicable',
  'immense',
  'allied',
  'comparative',
  'uncomfortable',
  'conservation',
  'productive',
  'beneficial',
  'bored',
  'charming',
  'minimal',
  'mobile',
  'turkish',
  'orange',
  'rear',
  'passive',
  'suspicious',
  'overwhelming',
  'fatal',
  'resulting',
  'symbolic',
  'registered',
  'neighbouring',
  'calm',
  'irrelevant',
  'patient',
  'compact',
  'profitable',
  'rival',
  'loyal',
  'moderate',
  'distinguished',
  'interior',
  'noble',
  'insufficient',
  'eligible',
  'mysterious',
  'varying',
  'managerial',
  'molecular',
  'olympic',
  'linear',
  'prospective',
  'printed',
  'parental',
  'diverse',
  'elaborate',
  'furious',
  'fiscal',
  'burning',
  'useless',
  'semantic',
  'embarrassed',
  'inherent',
  'philosophical',
  'deliberate',
  'awake',
  'variable',
  'promising',
  'unpleasant',
  'varied',
  'sacred',
  'selective',
  'inclined',
  'tender',
  'hidden',
  'worthy',
  'intermediate',
  'sound',
  'protective',
  'fortunate',
  'slim',
  'defensive',
  'divine',
  'stuck',
  'driving',
  'invisible',
  'misleading',
  'circular',
  'mathematical',
  'inappropriate',
  'liquid',
  'persistent',
  'solar',
  'doubtful',
  'manual',
  'architectural',
  'intact',
  'incredible',
  'devoted',
  'prior',
  'tragic',
  'respectable',
  'optimistic',
  'convincing',
  'unacceptable',
  'decisive',
  'competent',
  'spatial',
  'respective',
  'binding',
  'relieved',
  'nursing',
  'toxic',
  'select',
  'redundant',
  'integral',
  'then',
  'probable',
  'amateur',
  'fond',
  'passing',
  'specified',
  'territorial',
  'horizontal',
  'inland',
  'cognitive',
  'regulatory',
  'miserable',
  'resident',
  'polite',
  'scared',
  'gothic',
  'civilian',
  'instant',
  'lengthy',
  'adverse',
  'korean',
  'unconscious',
  'anonymous',
  'aesthetic',
  'orthodox',
  'static',
  'unaware',
  'costly',
  'fantastic',
  'foolish',
  'fashionable',
  'causal',
  'compatible',
  'wee',
  'implicit',
  'dual',
  'ok',
  'cheerful',
  'subjective',
  'forward',
  'surviving',
  'exotic',
  'purple',
  'cautious',
  'visiting',
  'aggregate',
  'ethical',
  'teenage',
  'dying',
  'disastrous',
  'delicious',
  'confidential',
  'underground',
  'thorough',
  'grim',
  'autonomous',
  'atomic',
  'frozen',
  'colourful',
  'injured',
  'uniform',
  'ashamed',
  'glorious',
  'wicked',
  'coherent',
  'rising',
  'shy',
  'novel',
  'balanced',
  'delightful',
  'arbitrary',
  'adjacent',
  'worrying',
  'weird',
  'unchanged',
  'rolling',
  'evolutionary',
  'intimate',
  'sporting',
  'disciplinary',
  'formidable',
  'lexical',
  'noisy',
  'gradual',
  'accused',
  'homeless',
  'supporting',
  'coming',
  'renewed',
  'excess',
  'retired',
  'rubber',
  'chosen',
  'outdoor',
  'embarrassing',
  'preferred',
  'bizarre',
  'appalling',
  'agreed',
  'imaginative',
  'governing',
  'accepted',
  'vocational',
  'mighty',
  'puzzled',
  'worldwide',
  'organisational',
  'sunny',
  'eldest',
  'eventual',
  'spontaneous',
  'vivid',
  'rude',
  'faithful',
  'ministerial',
  'innovative',
  'controlled',
  'conceptual',
  'unwilling',
  'civic',
  'meaningful',
  'alive',
  'brainy',
  'breakable',
  'busy',
  'careful',
  'cautious',
  'clever',
  'concerned',
  'crazy',
  'curious',
  'dead',
  'different',
  'difficult',
  'doubtful',
  'easy',
  'famous',
  'fragile',
  'helpful',
  'helpless',
  'important',
  'impossible',
  'innocent',
  'inquisitive',
  'modern',
  'open',
  'outstanding',
  'poor',
  'powerful',
  'puzzled',
  'real',
  'rich',
  'shy',
  'sleepy',
  'super',
  'tame',
  'uninterested',
  'wandering',
  'wild',
  'wrong',
  'adorable',
  'alert',
  'average',
  'beautiful',
  'blonde',
  'bloody',
  'blushing',
  'bright',
  'clean',
  'clear',
  'cloudy',
  'colorful',
  'crowded',
  'cute',
  'dark',
  'drab',
  'distinct',
  'dull',
  'elegant',
  'fancy',
  'filthy',
  'glamorous',
  'gleaming',
  'graceful',
  'grotesque',
  'homely',
  'light',
  'misty',
  'motionless',
  'muddy',
  'plain',
  'poised',
  'quaint',
  'shiny',
  'smoggy',
  'sparkling',
  'spotless',
  'stormy',
  'strange',
  'ugly',
  'unsightly',
  'unusual',
  'bad',
  'better',
  'beautiful',
  'big',
  'black',
  'blue',
  'bright',
  'clumsy',
  'crazy',
  'dizzy',
  'dull',
  'fat',
  'frail',
  'friendly',
  'funny',
  'great',
  'green',
  'gigantic',
  'gorgeous',
  'grumpy',
  'handsome',
  'happy',
  'horrible',
  'itchy',
  'jittery',
  'jolly',
  'kind',
  'long',
  'lazy',
  'magnificent',
  'magenta',
  'many',
  'mighty',
  'mushy',
  'nasty',
  'new',
  'nice',
  'nosy',
  'nutty',
  'nutritious',
  'odd',
  'orange',
  'ordinary',
  'pretty',
  'precious',
  'prickly',
  'purple',
  'quaint',
  'quiet',
  'quick',
  'quickest',
  'rainy',
  'rare',
  'ratty',
  'red',
  'roasted',
  'robust',
  'round',
  'sad',
  'scary',
  'scrawny',
  'short',
  'silly',
  'stingy',
  'strange',
  'striped',
  'spotty',
  'tart',
  'tall',
  'tame',
  'tan',
  'tender',
  'testy',
  'tricky',
  'tough',
  'ugly',
  'ugliest',
  'vast',
  'watery',
  'wasteful',
  'wonderful',
  'yellow',
  'yummy',
  'zany',
];

export default {
  loadGunDepth,
  gunOnceDefined,
  gunAsAnotherUser,
  async getHash (str, format = `base64`) {
    if (!str) {
      return undefined;
    }
    const hash = await Gun.SEA.work(str, undefined, undefined, {name: `SHA-256`});
    if (hash.length > 44) {
      throw new Error(`Gun.SEA.work returned an invalid SHA-256 hash longer than 44 chars: ${hash}. This is probably due to a sea.js bug on Safari.`);
    }
    if (format === `hex`) {
      return this.base64ToHex(hash);
    }
    return hash;
  },

  capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
  },

  generateName() {
    return `${this.capitalize(_.sample(adjectives))} ${this.capitalize(_.sample(animals))}`;
  },

  base64ToHex(str) {
    const raw = atob(str);
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      const hex = raw.charCodeAt(i).toString(16);
      result += (hex.length === 2 ? hex : `0${ hex}`);
    }
    return result;
  },

  timeoutPromise(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((resolve => {
        setTimeout(() => {
          resolve();
        }, timeout);
      })),
    ]);
  },

  getCaret(el) {
    if (el.selectionStart) {
      return el.selectionStart;
    } else if (document.selection) {
      el.focus();
      const r = document.selection.createRange();
      if (r === null) {
        return 0;
      }
      const re = el.createTextRange(), rc = re.duplicate();
      re.moveToBookmark(r.getBookmark());
      rc.setEndPoint('EndToStart', re);
      return rc.text.length;
    }
    return 0;
  },

  injectCss() {
    const elementId = `irisStyle`;
    if (document.getElementById(elementId)) {
      return;
    }
    const sheet = document.createElement(`style`);
    sheet.id = elementId;
    sheet.innerHTML = `
      .iris-follow-button .hover {
        display: none;
      }

      .iris-follow-button.following:hover .hover {
        display: inline;
      }

      .iris-follow-button.following:hover .nonhover {
        display: none;
      }

      .iris-identicon * {
        box-sizing: border-box;
      }

      .iris-identicon {
        vertical-align: middle;
        border-radius: 50%;
        text-align: center;
        display: inline-block;
        position: relative;
        max-width: 100%;
      }

      .iris-distance {
        z-index: 2;
        position: absolute;
        left:0%;
        top:2px;
        width: 100%;
        text-align: right;
        color: #fff;
        text-shadow: 0 0 1px #000;
        font-size: 75%;
        line-height: 75%;
        font-weight: bold;
      }

      .iris-pie {
        border-radius: 50%;
        position: absolute;
        top: 0;
        left: 0;
        box-shadow: 0px 0px 0px 0px #82FF84;
        padding-bottom: 100%;
        max-width: 100%;
        -webkit-transition: all 0.2s ease-in-out;
        -moz-transition: all 0.2s ease-in-out;
        transition: all 0.2s ease-in-out;
      }

      .iris-card {
        padding: 10px;
        background-color: #f7f7f7;
        color: #777;
        border: 1px solid #ddd;
        display: flex;
        flex-direction: row;
        overflow: hidden;
      }

      .iris-card a {
        -webkit-transition: color 150ms;
        transition: color 150ms;
        text-decoration: none;
        color: #337ab7;
      }

      .iris-card a:hover, .iris-card a:active {
        text-decoration: underline;
        color: #23527c;
      }

      .iris-pos {
        color: #3c763d;
      }

      .iris-neg {
        color: #a94442;
      }

      .iris-identicon img {
        position: absolute;
        top: 0;
        left: 0;
        max-width: 100%;
        border-radius: 50%;
        border-color: transparent;
        border-style: solid;
      }

      .iris-chat-open-button {
        background-color: #1e1e1e;
        color: #fff;
        padding: 15px;
        cursor: pointer;
        user-select: none;
      }

      .iris-chat-open-button svg {
        width: 1em;
      }

      .iris-chat-open-button, .iris-chat-box {
        position: fixed;
        bottom: 0.5rem;
        right: 0.5rem;
        border-radius: 8px;
        font-family: system-ui;
        font-size: 15px;
      }

      .iris-chat-box {
        background-color: #fff;
        max-height: 25rem;
        box-shadow: 2px 2px 20px rgba(0, 0, 0, 0.2);
        height: calc(100% - 44px);
        display: flex;
        flex-direction: column;
        width: 320px;
        color: rgb(38, 38, 38);
      }

      .iris-chat-box.minimized {
        height: auto;
      }

      .iris-chat-box.minimized .iris-chat-header {
        border-radius: 8px;
        cursor: pointer;
      }

      .iris-chat-box.minimized .iris-chat-messages, .iris-chat-box.minimized .iris-typing-indicator, .iris-chat-box.minimized .iris-chat-input-wrapper, .iris-chat-box.minimized .iris-chat-minimize, .iris-chat-box.minimized .iris-chat-close {
        display: none;
      }

      .iris-chat-header {
        background-color: #1e1e1e;
        height: 44px;
        color: #fff;
        border-radius: 8px 8px 0 0;
        text-align: center;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        flex: none;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .iris-chat-header-text {
        flex: 1;
      }

      .iris-online-indicator {
        color: #bfbfbf;
        margin-right: 5px;
        font-size: 12px;
        user-select: none;
        flex: none;
      }

      .iris-online-indicator.yes {
        color: #80bf5f;
      }

      .iris-typing-indicator {
        display: none;
        background-color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        padding: 2px;
        color: #777;
      }

      .iris-typing-indicator.yes {
        display: block;
      }

      .iris-chat-messages {
        flex: 1;
        padding: 15px;
        overflow-y: scroll;
      }

      .iris-chat-input-wrapper {
        flex: none;
        padding: 15px;
        background-color: #efefef;
        display: flex;
        flex-direction: row;
        border-radius: 0 0 8px 8px;
      }

      .iris-chat-input-wrapper textarea {
        padding: 15px 8px;
        border-radius: 4px;
        border: 1px solid rgba(0,0,0,0);
        width: auto;
        font-size: 15px;
        resize: none;
        flex: 1;
      }

      .iris-chat-input-wrapper textarea:focus {
        outline: none;
        border: 1px solid #6dd0ed;
      }

      .iris-chat-input-wrapper button svg {
        display: inline-block;
        font-size: inherit;
        height: 1em;
        width: 1em;
        overflow: visible;
        vertical-align: -0.125em;
      }

      .iris-chat-input-wrapper button, .iris-chat-input-wrapper button:hover, .iris-chat-input-wrapper button:active, .iris-chat-input-wrapper button:focus {
        flex: none;
        color: #999;
        background-color: transparent;
        font-size: 30px;
        padding: 5px;
        border: 1px solid rgba(0,0,0,0);
        border-radius: 4px;
        margin-left: 5px;
      }

      .iris-chat-input-wrapper button:active, .iris-chat-input-wrapper button:focus {
        outline: none;
        border: 1px solid #6dd0ed;
      }

      .iris-chat-message {
        display: flex;
        flex-direction: column;
        margin-bottom: 2px;
        overflow-wrap: break-word;
      }

      .iris-msg-content {
        background-color: #efefef;
        padding: 6px 10px;
        border-radius: 8px;
        box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.1);
        flex: none;
        max-width: 75%;
      }

      .emoji {
        font-size: 1.3em;
        line-height: 1em;
      }

      .iris-chat-message .emoji-only {
        font-size: 3em;
        text-align: center;
      }

      .iris-seen {
        color: rgba(0, 0, 0, 0.45);
        user-select: none;
      }

      .iris-seen.yes {
        color: #4fc3f7;
      }

      .iris-seen svg {
        width: 18px;
      }

      .iris-delivered-checkmark {
        display: none;
      }

      .delivered .iris-delivered-checkmark {
        display: initial;
      }

      .iris-chat-minimize, .iris-chat-close {
        user-select: none;
        cursor: pointer;
        width: 45px;
        line-height: 44px;
      }

      .iris-chat-message.their {
        align-items: flex-start;
      }

      .iris-chat-message.their + .iris-chat-message.our .iris-msg-content, .day-separator + .iris-chat-message.our .iris-msg-content {
        margin-top: 15px;
        border-radius: 8px 0px 8px 8px;
      }

      .iris-chat-message.their:first-of-type .iris-msg-content {
        border-radius: 0px 8px 8px 8px;
      }

      .iris-chat-message.our:first-of-type .iris-msg-content {
        border-radius: 8px 0px 8px 8px;
      }

      .iris-chat-message.our + .iris-chat-message.their .iris-msg-content, .day-separator + .iris-chat-message.their .iris-msg-content {
        margin-top: 15px;
        border-radius: 0px 8px 8px 8px;
      }

      .iris-chat-message.our {
        align-items: flex-end;
      }

      .iris-chat-message.our .iris-msg-content {
        background-color: #c5ecf7;
      }

      .iris-chat-message .time {
        text-align: right;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.45);
      }

      .iris-non-string {
        color: blue;
      }

      .day-separator {
        display: inline-block;
        border-radius: 8px;
        background-color: rgba(227, 249, 255, 0.91);
        padding: 6px 10px;
        margin-top: 15px;
        margin-left: auto;
        margin-right: auto;
        text-transform: uppercase;
        font-size: 13px;
        color: rgba(74, 74, 74, 0.88);
        box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.1);
        user-select: none;
      }

      .day-separator:first-of-type {
        margin-top: 0;
      }

      *[contenteditable="true"]:not(:focus) {
        cursor: pointer;
      }

      *[contenteditable="true"] {
        outline: none;
      }

      [placeholder]:empty:before {
        content: attr(placeholder);
        color: #999;
      }

      [placeholder]:empty:focus {
        cursor: text;
      }
      `;
    document.head.prepend(sheet);
  },

  getUrlParameter(sParam, sParams) {
    const sPageURL = sParams || window.location.search.substring(1);
    const sURLVariables = sPageURL.split('&');
    let sParameterName, i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
    }
  },

  formatTime(date) {
    const t = date.toLocaleTimeString(undefined, {timeStyle: 'short'});
    const s = t.split(':');
    if (s.length === 3) { // safari tries to display seconds
      return `${s[0] }:${ s[1] }${s[2].slice(2)}`;
    }
    return t;
  },

  formatDate(date) {
    const t = date.toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'});
    const s = t.split(':');
    if (s.length === 3) { // safari tries to display seconds
      return `${s[0] }:${ s[1] }${s[2].slice(2)}`;
    }
    return t;
  },

  debounce(func, wait, immediate) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  },

  getDaySeparatorText(date, dateStr, now, nowStr) {
    if (!now) {
      now = new Date();
      nowStr = now.toLocaleDateString({dateStyle: 'short'});
    }
    if (dateStr === nowStr) {
      return 'today';
    }
    const dayDifference = Math.round((now - date) / (1000 * 60 * 60 * 24));
    if (dayDifference === 0) {
      return 'today';
    }
    if (dayDifference === 1) {
      return 'yesterday';
    }
    if (dayDifference <= 5) {
      return date.toLocaleDateString(undefined, {weekday: 'long'});
    }
    return dateStr;
  },

  getProfileLink(pub) {
    return `${window.location.origin}/#/profile/${encodeURIComponent(pub)}`;
  },

  truncateString(s, length = 30) {
    return s.length > length ? `${s.slice(0, length)}...` : s;
  },

  createElement(type, cls, parent) {
    const el = document.createElement(type);
    if (cls) {
      el.setAttribute('class', cls);
    }
    if (parent) {
      parent.appendChild(el);
    }
    return el;
  },

  isNode,
  isElectron,
  isMobile
};
