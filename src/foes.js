import { CAST } from './cast/index.js';
import { isBaked } from './cast/library.js';
import { createModel } from 'madness-engine/models/model';

/**
 * Who is in the way. The dog people are out on the streets of the city, and
 * they have opinions about cats: the dog walkers and the dog park activists,
 * the allergic neighbours, the council inspectors and the animal control
 * officers, the joggers who were not looking, and the dogs, who are
 * everywhere. Each is a caricature, not of anyone in particular: the cats
 * are equally rude to all of it.
 *
 * `model` is who they are sculpted as (`cast/`, baked in the background as
 * the page loads; the cast is Metroll's, mostly in new clothes). How each
 * takes being clawed is the same for all (`claws.js`):
 *
 *   `toughness`  twice it is how much `hp` they have, when the cats claw them
 *                (a claw takes off one, a tom's two).
 *   `power`      how much it hurts the lady's patience when one gets to her.
 *   `hype`       what shooing them is worth (the purrs).
 *   `speed`      how fast they walk, when they come at the lady.
 *   `shout`      what they say when they notice her.
 *   `hp`         (a boss) how much it takes in all.
 */

export const FOES = Object.freeze({
  // The Pause crowd, and the doomers.
  pauser: { model: 'pauser', name: 'Dog Park Activist', blurb: 'Holds a sign. The sign says WALKIES. Has been holding it since the cats moved in.', toughness: 4, power: 3, hype: 50, radius: 0.37, speed: 2.8, shout: 'WALKIES! WALKIES!' },
  doomer: { model: 'mourner', name: 'Allergic Neighbour', blurb: 'Sneezes at the sight of a cat. Sneezes at the thought of one. Dressed in black for the occasion.', toughness: 5, power: 5, hype: 70, radius: 0.41, speed: 2.2, shout: 'ACHOO! IT\'S HAPPENING!' },
  forecaster: { model: 'coroner', name: 'Weather Presenter', blurb: 'Predicts rain. Predicts hail. Predicts a lot of cats, accurately, for once.', toughness: 6, power: 6, hype: 80, radius: 0.37, speed: 3.0, shout: 'SEVERE CAT WARNING!' },
  rationalist: { model: 'cultist', name: 'Dog Walker', blurb: 'Eleven dogs on eleven leads, all tangled. Does not have a plan for the cats.', toughness: 5, power: 5, hype: 80, radius: 0.38, speed: 1.9, shout: 'HEEL! HEEL! HEEL!' },
  purist: { model: 'purist', name: 'Kennel Club Judge', blurb: 'Will tell you which of your cats is not a real pedigree. All of them.', toughness: 6, power: 6, hype: 90, radius: 0.37, speed: 2.8, shout: 'THAT\'S NOT A BREED!' },
  researcher: { model: 'engineer', name: 'Vet Student', blurb: 'Has found fourteen things wrong with your cats, and a fifteenth on the way.', toughness: 5, power: 6, hype: 70, radius: 0.41, speed: 3.0, shout: 'WHEN WAS THE LAST CHECK-UP?' },
  // The effective altruists.
  altruist: { model: 'hxckid', name: 'Jogger', blurb: 'Does ten miles before breakfast. Will tell you about the ten miles.', toughness: 4, power: 4, hype: 60, radius: 0.35, speed: 4.4, shout: 'ON YOUR LEFT!' },
  longtermist: { model: 'wizard', name: 'Bird Watcher', blurb: 'Cares deeply about eight trillion sparrows. Not about your cats, who are near them.', toughness: 5, power: 6, hype: 90, radius: 0.38, speed: 2.0, shout: 'THE SPARROWS!' },
  // The commune and the theory.
  anarchist: { model: 'punk', name: 'Squirrel Rights Punk', blurb: 'Against all hierarchy, except squirrels. Squirrels are in charge.', toughness: 5, power: 6, hype: 70, radius: 0.37, speed: 4.0, shout: 'SQUIRRELS FIRST!' },
  commune: { model: 'hippie', name: 'Garden Club Member', blurb: 'A meeting about the begonias. The begonias are the cats\' toilet now.', toughness: 4, power: 3, hype: 50, radius: 0.36, speed: 2.6, shout: 'NOT THE BEGONIAS!' },
  theorist: { model: 'poet', name: 'Poet Laureate of Dogs', blurb: 'About to read an ode to a Labrador. At length. In rhyming couplets.', toughness: 4, power: 4, hype: 60, radius: 0.36, speed: 2.8, shout: 'OH, FAITHFUL HOUND!' },
  scroller: { model: 'emo', name: 'Cat Video Addict', blurb: 'Fine. Totally fine. Has watched a thousand cats online. Is afraid of real ones.', toughness: 3, power: 3, hype: 50, radius: 0.35, speed: 2.2, shout: 'I ONLY WATCH THEM!' },
  // Brussels.
  eurocrat: { model: 'eurocrat', name: 'Council Inspector', blurb: 'There is a form for your cats. There is always a form. The form is in a form.', toughness: 5, power: 5, hype: 70, radius: 0.37, speed: 3.0, shout: 'HOW MANY CATS IS THAT?!' },
  striker: { model: 'foreman', name: 'Bin Man', blurb: 'On strike since the bins. Will not be moved. Neither will the bins.', toughness: 6, power: 6, hype: 90, radius: 0.4, speed: 2.8, shout: 'NOT MY BINS!' },
  commuter: { model: 'blader', name: 'Scooter Commuter', blurb: 'Has right of way. The pavement is wherever you are standing.', toughness: 5, power: 5, hype: 70, radius: 0.4, speed: 5.0, shout: 'DING DING!' },
  raver: { model: 'raver', name: 'Night-Shift Raver', blurb: 'Dancing since Friday. It is Monday. The cats were not invited.', toughness: 3, power: 3, hype: 50, radius: 0.35, speed: 4.2, shout: 'WHO LET THE CATS IN?!' },
  doorman: { model: 'clubber', name: 'Bouncer', blurb: 'Your name is not on the list. Neither are the cats\'. The policy is no.', toughness: 9, power: 9, hype: 150, radius: 0.5, speed: 2.4, shout: 'NO CATS.' },
  // The feed.
  replyguy: { model: 'critic', name: 'Know-It-All', blurb: 'Has not met your cats. Knows all about them anyway. Has told you eleven times.', toughness: 4, power: 4, hype: 60, radius: 0.35, speed: 3.6, shout: 'ACTUALLY, CATS ARE—' },
  substacker: { model: 'zinekid', name: 'Pet Columnist', blurb: 'Eleven thousand words on why dogs are better. Paywall after the first paragraph.', toughness: 4, power: 3, hype: 50, radius: 0.34, speed: 3.6, shout: 'SUBSCRIBE FOR DOGS!' },
  farmer: { model: 'streetteam', name: 'Flyer Handler', blurb: 'Free stickers. Free flyers. A free puppy, if you listen to the whole sentence.', toughness: 4, power: 3, hype: 50, radius: 0.37, speed: 4.0, shout: 'FREE PUPPY!' },
  thoughtleader: { model: 'poser', name: 'Dog Influencer', blurb: 'Wears the T-shirt of a dog brand. Knows one trick. It is sit.', toughness: 4, power: 3, hype: 40, radius: 0.37, speed: 3.0, shout: 'SIT! GOOD BOY!' },
  accelerationist: { model: 'nuguy', name: 'Dog Trainer', blurb: 'Wants to break the cats of every habit. Has a lot of conviction, mostly about you.', toughness: 6, power: 7, hype: 90, radius: 0.43, speed: 3.4, shout: 'NO! BAD KITTY!' },
  podcaster: { model: 'dj', name: 'Radio Phone-In Host', blurb: 'Has interviewed every dog in town. Three hours each. Will interview you.', toughness: 3, power: 3, hype: 50, radius: 0.37, speed: 3.0, shout: 'CALLER, YOU\'RE ON AIR!' },
  vc: { model: 'promoter', name: 'Pet Insurer', blurb: 'Will cover your cats. Will not read the claim. Has a podcast about it.', toughness: 5, power: 4, hype: 60, radius: 0.37, speed: 3.6, shout: 'IT\'S PRE-EXISTING!' },
  gatekeeper: { model: 'gatekeeper', name: 'Neighbourhood Watch', blurb: 'Has been on this street since 1979. Will explain why your cats are not allowed.', toughness: 7, power: 7, hype: 110, radius: 0.43, speed: 2.4, shout: 'I\'M CALLING THE COUNCIL!' },
  // Portland Heights, besides.
  yimby: { model: 'hipster', name: 'Dog Day-Care Owner', blurb: 'Wants a dog park on every corner. Has a tote bag about it, and a spreadsheet of where.', toughness: 5, power: 5, hype: 70, radius: 0.37, speed: 3.0, shout: 'A DOG PARK HERE!' },
  nimby: { model: 'neighbour', name: 'Grumpy Neighbour', blurb: 'Loves animals. In principle. Over the fence, in his bathrobe, at eleven at night.', toughness: 5, power: 5, hype: 70, radius: 0.37, speed: 3.4, shout: 'YOUR CATS ARE ON MY LAWN!' },
  folksinger: { model: 'folkie', name: 'Busker', blurb: 'Has written a song about a lost dog. Eleven verses. Your cats come in at verse nine.', toughness: 4, power: 4, hype: 50, radius: 0.37, speed: 3.0, shout: 'WHERE HAS MY DOGGY GONE?' },
  dropout: { model: 'skater', name: 'Dognapper in Training', blurb: 'Left school at nineteen to start a dog-walking app. It is a leash. Has a board.', toughness: 4, power: 5, hype: 60, radius: 0.38, speed: 5.0, shout: 'UBER FOR DOGS!' },
  simulationist: { model: 'stoner', name: 'Dazed Stoner', blurb: 'None of this is real. Has checked. Twice. The cats seemed fairly real.', toughness: 4, power: 4, hype: 50, radius: 0.4, speed: 1.4, shout: 'WHOA. CATS.' },
  cyclist: { model: 'cyclist', name: 'Cyclist', blurb: 'The bike lane is a human right. So is the pavement, apparently. Baguette.', toughness: 5, power: 6, hype: 70, radius: 0.42, speed: 5.2, shout: 'BIKE LANE!' },
  // The Alignment District, besides.
  ethicist: { model: 'medic', name: 'Animal Welfare Officer', blurb: 'Here to count your cats. Has a clipboard the size of a suitcase.', toughness: 5, power: 4, hype: 60, radius: 0.38, speed: 4.4, shout: 'HOW MANY ARE THERE?!' },
  prompter: { model: 'scenekid', name: 'Pet Groomer', blurb: 'Paid to brush poodles. Has a fringe, and a pair of scissors.', toughness: 3, power: 3, hype: 50, radius: 0.34, speed: 3.8, shout: 'JUST A LITTLE TRIM!' },
  shoggoth: { model: 'goth', name: 'Goth Dog Owner', blurb: 'Walks a very large, very black dog. Thinks you don\'t get it. You don\'t.', toughness: 5, power: 5, hype: 70, radius: 0.39, speed: 2.6, shout: 'MY DOG IS A WOLF!' },
  // The Ivory Tower.
  professor: { model: 'gent', name: 'Dog Professor', blurb: 'Has not changed an opinion on dogs since 1994. Has written four books about why. Brolly.', toughness: 4, power: 4, hype: 60, radius: 0.36, speed: 3.2, shout: 'AS I WROTE IN CHAPTER FOUR—' },
  philosopher: { model: 'mime', name: 'Mime', blurb: 'Trapped in an invisible box. Does not know the cats are in it too.', toughness: 4, power: 4, hype: 60, radius: 0.34, speed: 3.4, shout: '...' },
  postdoc: { model: 'archaeologist', name: 'Flea Collar Researcher', blurb: 'Thirty years digging into fleas. Still on the first flea.', toughness: 6, power: 6, hype: 80, radius: 0.37, speed: 3.6, shout: 'WHAT ABOUT THE FLEAS?!' },
  labrat: { model: 'rat', name: 'Rat', blurb: 'Out of the sewers with a crust. Will not be giving it back. Cats are interested.', toughness: 2, power: 2, hype: 40, radius: 0.28, speed: 3.6, shout: 'SQUEAK?!' },
  cat: { model: 'blackcat', name: 'Rival Tomcat', blurb: 'The street\'s toughest alley cat. Does not like your cats. Hisses.', toughness: 3, power: 3, hype: 50, radius: 0.28, speed: 3.8, shout: 'HSSSSS!' },
  // The Pause Compound, besides.
  pallbearer: { model: 'pallbearer', name: 'Undertaker', blurb: 'Carrying one corner of the coffin of the last goldfish. The other three are at the pub.', toughness: 5, power: 5, hype: 70, radius: 0.4, speed: 2.0, shout: 'MAKE WAY!' },
  prepper: { model: 'cowboy', name: 'Dog Prepper', blurb: 'A bunker, a year of dog biscuits and a plan for when the cats come. The plan is the biscuits.', toughness: 5, power: 5, hype: 70, radius: 0.37, speed: 3.6, shout: 'STOCK UP ON BISCUITS!' },
  deadposter: { model: 'zombie', name: 'Sleepwalker', blurb: 'Not awake since 2019. Is walking toward the cats anyway.', toughness: 6, power: 6, hype: 80, radius: 0.39, speed: 1.8, shout: 'ZZZ... WALKIES...' },
  // The Timeline, besides.
  influencer: { model: 'influencer', name: 'Pet Influencer', blurb: 'Ten tricks that will make your dog famous. Number seven will shock you. The ring light is on.', toughness: 4, power: 4, hype: 60, radius: 0.34, speed: 3.6, shout: 'SMASH THAT LIKE!' },
  maincharacter: { model: 'phone', name: 'Dog Vlogger', blurb: 'Filming it. Filming you. Filming the cats chasing you, for the content.', toughness: 4, power: 4, hype: 60, radius: 0.37, speed: 2.2, shout: 'THIS IS GOING VIRAL!' },
  screenshotter: { model: 'paparazzo', name: 'Photographer', blurb: 'Will have a picture of your cats, in court. Has a long lens and a longer grudge.', toughness: 4, power: 4, hype: 60, radius: 0.37, speed: 3.4, shout: 'SMILE! FOR EVIDENCE!' },
  newsletter: { model: 'newsie', name: 'Paper Boy', blurb: 'Extra! Extra! Cat lady has too many cats, in a paper, behind a paywall.', toughness: 3, power: 3, hype: 50, radius: 0.29, speed: 4.6, shout: 'EXTRA! EXTRA!' },
  bird: { model: 'mascot', name: 'The Old Bird', blurb: 'Mascot of a pet shop that closed. Nobody told the bird. Hugs. A bird, near cats.', toughness: 9, power: 3, hype: 120, radius: 0.61, speed: 2.4, shout: 'TWEET? TWEET?!' },
  hottakes: { model: 'hotdog', name: 'Hot Dog Vendor', blurb: 'Hot dogs! Get your hot dogs! Mustard, ketchup, or both? Cats are drawn to the smell.', toughness: 5, power: 5, hype: 70, radius: 0.42, speed: 2.8, shout: 'HOT DOGS! GET \'EM HOT!' },
  // Hype Valley.
  founder: { model: 'suit', name: 'Pet Food Founder', blurb: 'Raising a seed round for premium kibble. Pre-revenue. Pre-product. Pre-cat.', toughness: 6, power: 6, hype: 90, radius: 0.37, speed: 3.2, shout: 'WE\'RE RAISING!' },
  recruiter: { model: 'agent', name: 'Dog Breeder', blurb: 'Has an exciting opportunity for you. It is a litter of seven puppies. There is a waiting list.', toughness: 6, power: 6, hype: 80, radius: 0.37, speed: 3.2, shout: 'ARE YOU OPEN TO A PUPPY?' },
  cryptobro: { model: 'floridaman', name: 'Dogecoin Bro', blurb: 'Pivoted to dogs from crypto, from NFTs, from a timeshare. Has a mullet from each.', toughness: 5, power: 5, hype: 70, radius: 0.4, speed: 3.4, shout: 'TO THE MOON, DOGE!' },
  biohacker: { model: 'runner', name: 'Marathon Dog Walker', blurb: 'Runs a marathon a day with a dog on a lead. Takes a hundred supplements. Has a newspaper.', toughness: 4, power: 4, hype: 60, radius: 0.36, speed: 5.4, shout: 'RUN, BUDDY, RUN!' },
  corgi: { model: 'corgi', name: 'Corgi', blurb: 'Short legs, big opinions. Low, fast, unimpressed. Takes orders from nobody.', toughness: 3, power: 3, hype: 50, radius: 0.32, speed: 3.6, shout: 'WOOF. (CAT. CAT. CAT.)' },
  billionaire: { model: 'mogul', name: 'The Pet Food Baron', blurb: 'Owns the kibble, the tins and the rights to every cat\'s dinner. Would like to buy your pack.', toughness: 10, power: 12, hype: 900, radius: 1.04, speed: 1.6, shout: 'EVERY CAT HAS ITS PRICE!', boss: true, hp: 60 },
  // Brussels-sur-Mer, besides.
  dpo: { model: 'cop', name: 'Animal Control Officer', blurb: 'Here about your cats. All of them. Has a badge, a net, and a form for the net.', toughness: 6, power: 6, hype: 80, radius: 0.37, speed: 3.4, shout: 'THAT IS TOO MANY CATS, MA\'AM!' },
  waiter: { model: 'waiter', name: 'Fishmonger (on Strike)', blurb: 'On strike since the haddock. Will not sell you a sardine. Cats are staring.', toughness: 5, power: 5, hype: 70, radius: 0.36, speed: 4.0, shout: 'THE FISH IS OFF!' },
  cabbie: { model: 'cabbie', name: 'Cab Driver', blurb: 'Twenty years behind the wheel. Has never had a cat in the cab. Is not starting.', toughness: 5, power: 6, hype: 70, radius: 0.38, speed: 3.6, shout: 'NO CATS IN THE CAB!' },
  tourist: { model: 'tourist', name: 'Tourist', blurb: 'Came for the sights. Has found a lady with eleven cats. The map has a form on the back.', toughness: 4, power: 3, hype: 50, radius: 0.39, speed: 2.4, shout: 'WHERE IS THE CASTLE?' },
  nonna: { model: 'nonna', name: 'Rival Cat Lady', blurb: 'Has a different cardigan. Has a different cat. Has a wooden spoon. Is tougher than you.', toughness: 8, power: 8, hype: 120, radius: 0.36, speed: 2.4, shout: 'MY CATS ARE BETTER!' },
  lifeguard: { model: 'lifeguard', name: 'Lifeguard', blurb: 'Bathing is forbidden. Cats are forbidden. Will save you from both.', toughness: 7, power: 7, hype: 100, radius: 0.4, speed: 4.2, shout: 'NO CATS IN THE POOL!' },
  surfer: { model: 'surfer', name: 'Surfer', blurb: 'Riding the wave. The wave is a cat stampede. Stoked.', toughness: 5, power: 5, hype: 70, radius: 0.37, speed: 3.8, shout: 'RIDE THE WAVE, BRO!' },
  // The Compute Farm.
  technician: { model: 'welder', name: 'Kibble Technician', blurb: 'Keeps the ovens hot. Has a mask. Has seen things in the kibble hopper.', toughness: 5, power: 5, hype: 70, radius: 0.4, speed: 2.4, shout: 'MIND THE OVENS!' },
  oncall: { model: 'soundguy', name: 'Night Watchman', blurb: 'Paged at three in the morning. Check. One. Two. Is it plugged in?', toughness: 5, power: 5, hype: 70, radius: 0.37, speed: 3.0, shout: 'WHO GOES THERE?!' },
  wrangler: { model: 'roadie', name: 'Yarn Wrangler', blurb: 'Huge. Bald. Carries a spool of yarn like a flight case. Resents everything.', toughness: 8, power: 8, hype: 130, radius: 0.47, speed: 2.4, shout: 'COMING THROUGH!' },
  guard: { model: 'security', name: 'Pet Shop Security', blurb: 'Has a radio. Is using the radio. Your cats are not on the list.', toughness: 9, power: 9, hype: 140, radius: 0.49, speed: 2.8, shout: 'NO CATS, PLEASE.' },
  robot: { model: 'robot', name: 'Robot Vacuum', blurb: 'Cleans a room at half a hair an hour. Walks toward you at about the same speed. Demo only.', toughness: 6, power: 6, hype: 100, radius: 0.42, speed: 2.0, shout: 'VACUUMING... VACUUMING...' },
  keeper: { model: 'knight', name: 'Knight of the Kennel', blurb: 'Guards the kennel with a sword. The dogs left in 1990. Cannot see out of the helm.', toughness: 7, power: 7, hype: 100, radius: 0.43, speed: 2.4, shout: 'THE KENNEL IS MINE!' },
  // The far side.
  alien: { model: 'alien', name: 'Visiting Alien', blurb: 'Three eyes, two antennae, no opinion whatever on cats. Just visiting. Fond of tuna.', toughness: 5, power: 5, hype: 70, radius: 0.39, speed: 3.0, shout: 'TAKE ME TO YOUR TUNA.' },
  edgecase: { model: 'yeti', name: 'The Colossal Sheepdog', blurb: 'From the far side of the fence, where it has been waiting for years. Large. Shaggy. Lunges.', toughness: 9, power: 9, hype: 600, radius: 0.85, speed: 1.6, shout: 'WOOF. WOOF. WOOF.', boss: true, hp: 45 },
  // And the rest.
  troll: { model: 'troll', name: 'Bridge Troll', blurb: 'Lives under the bridge. Wants a toll. Does not take cards. Does not take cats either.', toughness: 9, power: 9, hype: 150, radius: 0.62, speed: 1.9, shout: 'ROAR! TOLL!' },
  festivalbro: { model: 'beerguy', name: 'Fête Bro', blurb: 'Has a lanyard from the village fête. Was there for the free beer. Will explain the tombola.', toughness: 4, power: 4, hype: 50, radius: 0.45, speed: 2.2, shout: 'WHO WANTS TO TOMBOLA?!' },
  drunk: { model: 'drunk', name: 'The Regular', blurb: 'Fourth pint. Will explain why dogs are better to you. Wrongly.', toughness: 5, power: 5, hype: 60, radius: 0.4, speed: 2.4, shout: 'LISTEN. LISTEN.' },
  prophet: { model: 'doomlord', name: 'The Chief Warden', blurb: 'Has predicted the cat-pocalypse every year since 2003. Has been, technically, early.', toughness: 9, power: 8, hype: 700, radius: 1.0, speed: 1.2, shout: 'THE END IS NIGH! THE END IS PURRING!', boss: true, hp: 45 },
});

/** How finely the foes on the board are meshed: half the grid of a close-up. */
export const BOARD_DETAIL = 0.5;

/** How long an attack plays through, and how long a beaten foe takes to go before it is gone. */
export const STRIKE = 0.9;
export const KNOCKED_OUT = 1.35;

/**
 * A foe to look at, standing on (0, 0, 0) and facing +z. `animate(t, moving,
 * how)` makes it live; `body` is the part that turns to face the way it goes.
 * `how`: `chasing` (it hurries), `striking` (the ball is in its reach: it
 * attacks, an attack at a time) and `down` (it is beaten).
 *
 * Each is sculpted and baked in the background as the page loads, and there
 * is nothing to see of it until its bake is in: no stand-in. `ready` says
 * whether it is (always, under node, where nothing bakes and nothing is
 * drawn); `build()` makes its mesh the first time it is wanted, once it is.
 */
export function createFoeMesh(GFX, kind) {
  const def = FOES[kind];
  const group = new GFX.Group();
  group.name = kind;
  const body = new GFX.Group();
  group.add(body);
  let model = null, baked = typeof window === 'undefined';
  const choose = clips();
  return {
    group,
    body,
    get ready() { return baked || (baked = isBaked(def.model, BOARD_DETAIL)); },
    get built() { return model !== null; },
    /** Makes its mesh, if it is baked and isn't made yet; whether it is made. */
    build() {
      if (!model && isBaked(def.model, BOARD_DETAIL)) {
        model = createModel(GFX, CAST[def.model], { detail: BOARD_DETAIL });
        body.add(model.group);
      }
      return model !== null;
    },
    animate(t, moving, { chasing = false, ...how } = {}) {
      if (!model) return;
      model.pose({ ...choose(t, moving, how), time: t, speed: chasing ? 1 : 0.6 });
    },
  };
}

/** Which clip it plays, and how far in: down once beaten, an attack when the ball is in reach, else walking or idle. */
function clips() {
  let clip = 'idle', since = 0;
  return (t, moving, { striking = false, down = false } = {}) => {
    let next = down ? 'ko' : striking ? 'attack' : moving ? 'walk' : 'idle';
    // An attack plays through before it does anything else, and then another, if the ball is still there.
    if (clip === 'attack' && !down && t - since < STRIKE) next = 'attack';
    else if (clip === 'attack' && next === 'attack') since = t;
    if (next !== clip) { clip = next; since = t; }
    return { clip, t: t - since };
  };
}
