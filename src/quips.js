/**
 * What the lady says. An old woman in a cardigan with a pack of cats, loose
 * in a city full of people who do not like cats, and who very much like
 * dogs. She is sweet, she is sharp and she is entirely unbothered: the cats
 * do the fighting, and she remarks on it afterwards, to the dog walkers, the
 * neighbours, the inspectors and above all the dogs.
 *
 * A line is picked for what just happened; the people have a line of their
 * own (`shout` in `foes.js`), said when they notice her.
 */

export const QUIPS = Object.freeze({
  shoo: ['Shoo. Shoo, dear.', 'Off you go. They don\'t bite. Much.', 'Oh, was that your spot?', 'Good kitties.', 'That\'s what you get.', 'I did say they were friendly.', 'Mind the claws, dear. Too late.', 'They\'re only playing.'],
  swarm: ['The whole pack! Aren\'t they marvellous?', 'A clowder of cats, and one very surprised man.', 'That\'s what we call a swarm, dear.', 'Teamwork. I taught them everything.', 'Fur everywhere. Mostly on him.', 'Not one of them hesitated. Proud of them.'],
  bonk: ['Oof. Rude.', 'Manners, dear. Honestly.', 'My hip! My good hip!', 'Not the cardigan.', 'Kitties! Little help!', 'Mind the knitting!'],
  fell: ['Oops. Knees, don\'t fail me now.', 'That\'s a long way down for a lady my age.', 'Whoops-a-daisy.', 'I\'m fine. I\'m fine. Where\'s my tea?'],
  flustered: ['Oh, I\'m all in a tizzy. A cup of tea, and I\'ll be fine.', 'Flustered! Quite flustered. Back to my armchair.', 'I need a sit down. And a biscuit.', 'Not at my age. Not before tea.'],
  sharpened: ['Ahh. A sit down. Tea, and a biscuit.', 'Feet up. The cats are on my lap. Perfect.', 'A little rest. Right as rain.', 'Patience restored. Mostly.'],
  like: ['A little love. Lovely.', 'Oh, a heart. For me?', 'The cats are purring. That\'s something.'],
  gpu: ['A golden key! Whatever could it open? Every cat in the street wants to know.', 'A key. I do love a key. The cats love a key more.', 'Gold. Shiny. The cats have already tried to eat it.', 'One more key for the jar.', 'Found one! Don\'t tell the dogs.'],
  stray: ['A new friend! Come along, dear. There\'s tuna.', 'Oh, who\'s this? You\'re coming home with us.', 'Another one? I couldn\'t possibly. Well, perhaps.', 'There\'s always room for one more.', 'It\'s a lovely little thing. And it\'s mine now.'],
  combo: ['They\'re on a roll. A hairball roll.', 'Look at them go.', 'That\'s a lot of people being wrong about cats at once.', 'My little darlings!'],
  district: {
    'Whisker Heights': ['Home. The kettle is on. The cats are not allowed on the table. They are on the table.', 'The suburbs. Every garden has a cat. Mine has eleven.'],
    'The Kennel District': ['Dogs. Everywhere. Take no notice, dears.', 'The Kennel Club. Very grand. Very barky.'],
    'Sardine Bay': ['Smell that? The cats can smell that.', 'The fish quay. I\'ll keep an eye on the cats. They\'ll keep an eye on the fish.'],
    'The Busy Road': ['Cats do not look both ways. I do, dears. I do it for all of you.', 'Four lanes. Hold paws.'],
    'Purrdue University': ['The campus. Three laps round the tower, and you\'re above it all. Like a cat.', 'Office hours. Nobody came. Nobody ever comes.'],
    'Meowtown': ['Downtown. Every screen is a cat video. It\'s lovely, really.', 'Meowtown. So many cats on the screens. Mine are better.'],
    'Zoomie Valley': ['Up the peak of the zoomies. Down into the trough of naps.', 'Zoomie Valley. Three in the morning, every hour of the day.'],
    'The Kibble Works': ['Ovens, hoppers and a smell the cats cannot ignore.', 'Kibble as far as the eye can see. They\'re beside themselves.'],
    'The Pound': ['The Pound. I\'ve never been so tempted to let everyone out.', 'Sprinkler alley. Cats hate water. So do I, in this cardigan.'],
    'The Far Side': ['The edge of the map. Even the dogs don\'t come out this far. Except one.'],
  },
  ready: ['Come along, darlings. Keep up.', 'Alright. Who wants a fight? Not me. Them.', 'Off we go. Don\'t wander. Wander a little.', 'A lady and her cats in a city of dog people. What could go wrong?'],
  won: ['All forty-two keys! And so many cats. A fine day.', 'Forty-two golden keys. Now, whatever do they open? A very big tin of tuna, I hope.', 'Every golden key. Home for tea.'],
});

/** One line from `list`, never the same one twice running for the same `kind`. */
const last = new Map();
export function pick(list, kind = list, rnd = Math.random) {
  if (!list?.length) return '';
  let i = Math.floor(rnd() * list.length);
  if (list.length > 1 && last.get(kind) === i) i = (i + 1) % list.length;
  last.set(kind, i);
  return list[i];
}

/** A quip for `what`, with the district's own lines among them when it has some. */
export function say(what, { district = null, rnd = Math.random } = {}) {
  const own = district && what === 'district' ? QUIPS.district[district] : null;
  const list = own ?? QUIPS[what];
  return Array.isArray(list) ? pick(list, what, rnd) : '';
}
