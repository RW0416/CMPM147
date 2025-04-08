// project.js - purpose and description here
// Author: Your Name
// Date:

// NOTE: This is how we might start a basic JavaaScript OOP project

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

// define a class
const fillers = {
  base: ["vodka", "gin", "rum", "tequila", "whiskey", "brandy"],
  modifier: ["vermouth", "triple sec", "amaretto", "bitters", "coffee liqueur", "blue curaçao", "Campari"],
  mixer: ["lemon juice", "lime juice", "cranberry juice", "soda water", "tonic", "cola", "ginger beer", "pineapple juice", "simple syrup"],
  garnish: ["lime wedge", "mint leaf", "cherry", "orange twist", "salt rim", "sugar rim", "umbrella", "cinnamon stick"],
  glass: ["martini glass", "highball glass", "tumbler", "coupe glass", "mason jar", "shot glass"],
  nameAdjective: ["Smoky", "Fizzy", "Velvet", "Twisted", "Spicy", "Electric", "Frozen", "Mystic", "Funky"],
  nameNoun: ["Sunrise", "Mirage", "Whisper", "Storm", "Blossom", "Pulse", "Fireball", "Enigma", "Squeeze"],
  mlBase: ["45ml", "50ml", "55ml", "60ml"],
  mlModifier: ["10ml", "15ml", "20ml", "25ml", "30ml"],
  mlMixer: ["60ml", "70ml", "80ml", "90ml", "100ml", "110ml", "120ml"],
};

const template = `🍸 Presenting the "$nameAdjective $nameNoun"

Ingredients:
- Base: $mlBase of $base
- Modifier: $mlModifier of $modifier
- Mixer: $mlMixer of $mixer

Serve in a $glass and garnish with a $garnish.
`;


// STUDENTS: You don't need to edit code below this line.

const slotPattern = /\$(\w+)/;

function replacer(match, name) {
  let options = fillers[name];
  if (options) {
    return options[Math.floor(Math.random() * options.length)];
  } else {
    return `<UNKNOWN:${name}>`;
  }
}

function generate() {
  let story = template;
  while (story.match(slotPattern)) {
    story = story.replace(slotPattern, replacer);
  }

  /* global box */
  box.innerText = story;
}

/* global clicker */
clicker.onclick = generate;

generate();
