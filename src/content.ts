/** Original practice content. Vocabulary headwords come from the supplied textbook photos. */
export type WordEnrichment = {
  example: string;
  exampleZh: string;
  emoji: string;
};

export const wordEnrichment: Record<string, WordEnrichment> = {
  want: { example: 'I want to join the art club.', exampleZh: '我想加入美术社团。', emoji: '🎨' },
  some: { example: 'I have some red paper.', exampleZh: '我有一些红色的纸。', emoji: '📄' },
  'paper-cut': { example: 'This paper-cut is a red flower.', exampleZh: '这张剪纸是一朵红花。', emoji: '🌺' },
  cut: { example: 'Cut the paper carefully.', exampleZh: '小心地剪这张纸。', emoji: '✂️' },
  'cut out': { example: 'We cut out a paper star.', exampleZh: '我们剪出一颗纸星星。', emoji: '⭐' },
  paper: { example: 'Please give me a piece of paper.', exampleZh: '请给我一张纸。', emoji: '📃' },
  beautiful: { example: 'Your picture is beautiful.', exampleZh: '你的画很美。', emoji: '🌷' },
  any: { example: 'Do you have any blue paper?', exampleZh: '你有蓝色的纸吗？', emoji: '🟦' },
  fan: { example: 'I am a football fan.', exampleZh: '我是一个足球迷。', emoji: '⚽' },
  watch: { example: 'We watch a game after school.', exampleZh: '我们放学后看一场比赛。', emoji: '📺' },
  every: { example: 'I read every day.', exampleZh: '我每天都读书。', emoji: '📅' },
  also: { example: 'I like art. I also like music.', exampleZh: '我喜欢美术。我也喜欢音乐。', emoji: '🎨🎵' },
  piano: { example: 'She can play the piano.', exampleZh: '她会弹钢琴。', emoji: '🎹' },

  game: { example: 'This game is fun.', exampleZh: '这个游戏很有趣。', emoji: '🎲' },
  easy: { example: 'This word is easy to spell.', exampleZh: '这个单词很容易拼写。', emoji: '🌱' },
  difficult: { example: 'This game is difficult for me.', exampleZh: '这个游戏对我来说很难。', emoji: '🧩' },
  boat: { example: 'The boat is on the lake.', exampleZh: '小船在湖上。', emoji: '⛵' },
  begin: { example: 'Let us begin the game.', exampleZh: '让我们开始游戏吧。', emoji: '🏁' },
  hard: { example: 'We work hard every day.', exampleZh: '我们每天都努力学习。', emoji: '💪' },
  their: { example: 'Their books are on the desk.', exampleZh: '他们的书在书桌上。', emoji: '📚' },
  sit: { example: 'Please sit on this chair.', exampleZh: '请坐在这把椅子上。', emoji: '🪑' },
  slowly: { example: 'Please walk slowly.', exampleZh: '请慢慢走。', emoji: '🐢' },

  listen: { example: 'Please listen carefully.', exampleZh: '请认真听。', emoji: '👂' },
  'listen to': { example: 'I listen to music after school.', exampleZh: '我放学后听音乐。', emoji: '🎧' },
  exercise: { example: 'We exercise in the park.', exampleZh: '我们在公园里锻炼。', emoji: '🏃' },
  hour: { example: 'I read for an hour.', exampleZh: '我读一个小时的书。', emoji: '⏳' },
  always: { example: 'I always wash my hands before lunch.', exampleZh: '我午饭前总是洗手。', emoji: '🧼' },
  never: { example: 'I never run on the stairs.', exampleZh: '我从不在楼梯上奔跑。', emoji: '🚶' },
  sometimes: { example: 'I sometimes draw after dinner.', exampleZh: '我有时在晚饭后画画。', emoji: '🖍️' },
  often: { example: 'We often play in the park.', exampleZh: '我们经常在公园里玩。', emoji: '🌳' },
  healthy: { example: 'Fruit helps us stay healthy.', exampleZh: '水果帮助我们保持健康。', emoji: '🍎' },
  sleep: { example: 'I sleep well at night.', exampleZh: '我晚上睡得很好。', emoji: '😴' },
  wall: { example: 'There is a picture on the wall.', exampleZh: '墙上有一幅画。', emoji: '🖼️' },
  TV: { example: 'I watch TV with my family.', exampleZh: '我和家人一起看电视。', emoji: '📺' },
  "o'clock": { example: "It is seven o'clock.", exampleZh: '现在是七点整。', emoji: '🕖' },
  bed: { example: 'My cat is under the bed.', exampleZh: '我的猫在床下面。', emoji: '🛏️' },

  where: { example: 'Where is my schoolbag?', exampleZh: '我的书包在哪里？', emoji: '🎒' },
  map: { example: 'Look at this map.', exampleZh: '看这张地图。', emoji: '🗺️' },
  world: { example: 'I want to see the world.', exampleZh: '我想看看这个世界。', emoji: '🌍' },
  China: { example: 'I live in China.', exampleZh: '我住在中国。', emoji: '🇨🇳' },
  Canada: { example: 'My friend lives in Canada.', exampleZh: '我的朋友住在加拿大。', emoji: '🇨🇦' },
  'the US': { example: 'She is from the US.', exampleZh: '她来自美国。', emoji: '🇺🇸' },
  'the UK': { example: 'He wants to visit the UK.', exampleZh: '他想去英国游玩。', emoji: '🇬🇧' },
  of: { example: 'This is a map of China.', exampleZh: '这是一张中国地图。', emoji: '🗺️' },
  speak: { example: 'I can speak English.', exampleZh: '我会说英语。', emoji: '💬' },
  star: { example: 'I can see a bright star.', exampleZh: '我能看见一颗明亮的星星。', emoji: '⭐' },
  so: { example: 'This little cat is so cute!', exampleZh: '这只小猫真可爱！', emoji: '🐱' },
  travel: { example: 'I like to travel with my family.', exampleZh: '我喜欢和家人一起旅行。', emoji: '🧳' },
  them: { example: 'My friends are here. Let us help them.', exampleZh: '我的朋友们在这里。让我们帮助他们吧。', emoji: '🤝' },
  famous: { example: 'The Great Wall is famous.', exampleZh: '长城很有名。', emoji: '🏯' },
  place: { example: 'The park is a good place to play.', exampleZh: '公园是个玩耍的好地方。', emoji: '🏞️' },
  picture: { example: 'This is a picture of my family.', exampleZh: '这是一张我家人的照片。', emoji: '🖼️' },
  people: { example: 'Many people are in the park.', exampleZh: '公园里有许多人。', emoji: '👨‍👩‍👧' },

  city: { example: 'Baoding is a city in China.', exampleZh: '保定是中国的一座城市。', emoji: '🏙️' },
  which: { example: 'Which book do you like?', exampleZh: '你喜欢哪一本书？', emoji: '📕📘' },
  know: { example: 'I know this English word.', exampleZh: '我认识这个英语单词。', emoji: '💡' },
  was: { example: 'I was at home yesterday.', exampleZh: '我昨天在家。', emoji: '🏠' },
  were: { example: 'We were happy yesterday.', exampleZh: '我们昨天很开心。', emoji: '😊' },
  clever: { example: 'What a clever little dog!', exampleZh: '多聪明的小狗啊！', emoji: '🐶' },
  ago: { example: 'I was here two days ago.', exampleZh: '两天前我在这里。', emoji: '📆' },
  show: { example: 'Please show me your picture.', exampleZh: '请给我看看你的画。', emoji: '🖼️' },
  train: { example: 'We go to Beijing by train.', exampleZh: '我们坐火车去北京。', emoji: '🚆' },
  fast: { example: 'This train is very fast.', exampleZh: '这列火车很快。', emoji: '🚄' },
  saw: { example: 'I saw a bird in the tree yesterday.', exampleZh: '我昨天看到树上有一只鸟。', emoji: '🐦' },
  lake: { example: 'The lake is big and beautiful.', exampleZh: '这个湖又大又美。', emoji: '🏞️' },
  hill: { example: 'There is a tree on the hill.', exampleZh: '小山上有一棵树。', emoji: '⛰️' },
  had: { example: 'We had a good time yesterday.', exampleZh: '我们昨天玩得很开心。', emoji: '🎉' },
  hometown: { example: 'Baoding is my hometown.', exampleZh: '保定是我的家乡。', emoji: '🏡' },
  house: { example: 'My house has a blue door.', exampleZh: '我的房子有一扇蓝色的门。', emoji: '🏠' },
  these: { example: 'These flowers are beautiful.', exampleZh: '这些花很美。', emoji: '🌷🌼' },

  wonderful: { example: 'We had a wonderful day.', exampleZh: '我们度过了美好的一天。', emoji: '🌈' },
  holiday: { example: 'I read a lot during the holiday.', exampleZh: '我在假期里读了很多书。', emoji: '🏖️' },
  did: { example: 'I did my homework after dinner yesterday.', exampleZh: '我昨天晚饭后做了作业。', emoji: '✏️' },
  went: { example: 'We went to the zoo yesterday.', exampleZh: '我们昨天去了动物园。', emoji: '🐼' },
  get: { example: 'How do you get to school?', exampleZh: '你怎么到学校？', emoji: '🏫' },
  plane: { example: 'The plane is in the sky.', exampleZh: '飞机在天空中。', emoji: '✈️' },
  about: { example: 'The trip takes about an hour.', exampleZh: '这段旅程大约需要一个小时。', emoji: '⏱️' },
  hundred: { example: 'There are one hundred pages in this book.', exampleZh: '这本书有一百页。', emoji: '💯' },
  clock: { example: 'The clock is on the wall.', exampleZh: '时钟在墙上。', emoji: '🕰️' },
  ate: { example: 'I ate an apple after lunch yesterday.', exampleZh: '我昨天午饭后吃了一个苹果。', emoji: '🍎' },
};

export const unitLabels: Record<number, string> = {
  1: 'School clubs',
  2: 'Sports games and safety',
  3: 'A better me',
  4: 'Countries in the world',
  5: 'Cities and hometowns',
  6: 'What a wonderful trip!',
};

export type GrammarQuestion = {
  id: string;
  unit: number;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  translation: string;
};

/** Original exercises for the app, not quotations from the textbook. */
export const grammarQuestions: GrammarQuestion[] = [
  {
    id: 'u1-want-to', unit: 1,
    prompt: 'I want ___ join the music club.', options: ['to', 'at', 'on'], answer: 'to',
    explanation: '想要做某事，用 want to + 动词原形：want to join。',
    translation: '我想加入音乐社团。',
  },
  {
    id: 'u1-likes-ing', unit: 1,
    prompt: 'She likes ___ pictures.', options: ['draw', 'drawing', 'draws'], answer: 'drawing',
    explanation: '这里用 like + 动词 -ing 表示喜欢做某事：likes drawing。',
    translation: '她喜欢画画。',
  },
  {
    id: 'u1-some', unit: 1,
    prompt: 'I have ___ red paper.', options: ['a', 'an', 'some'], answer: 'some',
    explanation: 'paper 表示纸时通常不可数；“一些纸”用 some paper。',
    translation: '我有一些红色的纸。',
  },
  {
    id: 'u1-any', unit: 1,
    prompt: 'There is not ___ paper in my bag.', options: ['a', 'any', 'an'], answer: 'any',
    explanation: '这是否定句，表示书包里没有纸，用 not any paper。',
    translation: '我的书包里没有纸。',
  },
  {
    id: 'u1-piano', unit: 1,
    prompt: 'I can play ___ piano.', options: ['the', 'an', 'to'], answer: 'the',
    explanation: '表示弹奏某种乐器，常用 play the + 乐器：play the piano。',
    translation: '我会弹钢琴。',
  },
  {
    id: 'u2-can', unit: 2,
    prompt: 'My sister can ___ fast.', options: ['runs', 'running', 'run'], answer: 'run',
    explanation: 'can 后接动词原形，所以用 run。',
    translation: '我的姐姐跑得很快。',
  },
  {
    id: 'u2-imperative', unit: 2,
    prompt: 'Please ___ on this chair.', options: ['sit', 'sits', 'sitting'], answer: 'sit',
    explanation: 'Please 开头的祈使句用动词原形，礼貌地请别人坐下。',
    translation: '请坐在这把椅子上。',
  },
  {
    id: 'u2-their', unit: 2,
    prompt: 'They have a boat. This is ___ boat.', options: ['they', 'them', 'their'], answer: 'their',
    explanation: 'boat 前需要表示“他们的”的词，应该用 their。',
    translation: '他们有一艘船。这是他们的船。',
  },
  {
    id: 'u2-slowly', unit: 2,
    prompt: 'Please walk ___. The floor is wet.', options: ['slowly', 'slowest', 'slowness'], answer: 'slowly',
    explanation: '修饰动作 walk 用副词 slowly，表示慢慢地走。',
    translation: '请慢慢走。地面是湿的。',
  },
  {
    id: 'u3-always', unit: 3,
    prompt: 'I wash my hands before every meal. I ___ wash my hands before meals.',
    options: ['never', 'always', 'sometimes'], answer: 'always',
    explanation: 'before every meal 表示每一顿饭前都这样做，应用 always（总是）。',
    translation: '我每顿饭前都洗手。我总是在饭前洗手。',
  },
  {
    id: 'u3-never', unit: 3,
    prompt: 'I do not run on the stairs at all. I ___ run on the stairs.',
    options: ['often', 'sometimes', 'never'], answer: 'never',
    explanation: 'not ... at all 表示完全不做，与 never（从不）意思一致。',
    translation: '我完全不在楼梯上跑。我从不在楼梯上奔跑。',
  },
  {
    id: 'u3-listen-to', unit: 3,
    prompt: 'We listen ___ music after school.', options: ['on', 'to', 'at'], answer: 'to',
    explanation: 'listen 后接听的内容时要加 to：listen to music。',
    translation: '我们放学后听音乐。',
  },
  {
    id: 'u3-hour', unit: 3,
    prompt: 'I read for ___ hour.', options: ['a', 'an', 'two'], answer: 'an',
    explanation: 'hour 的 h 不发音，单词以元音音素开头，“一小时”用 an hour。',
    translation: '我读一个小时的书。',
  },
  {
    id: 'u3-time', unit: 3,
    prompt: "I go to bed ___ nine o'clock.", options: ['in', 'on', 'at'], answer: 'at',
    explanation: '表示具体的时刻用 at，例如 at nine o’clock。',
    translation: '我九点上床睡觉。',
  },
  {
    id: 'u4-map-of', unit: 4,
    prompt: 'This is a map ___ China.', options: ['of', 'to', 'at'], answer: 'of',
    explanation: 'a map of + 地名，表示某地的地图。',
    translation: '这是一张中国地图。',
  },
  {
    id: 'u4-live-in', unit: 4,
    prompt: 'My friend lives ___ Canada.', options: ['on', 'in', 'at'], answer: 'in',
    explanation: '表示住在某个国家，用 live in + 国家名。',
    translation: '我的朋友住在加拿大。',
  },
  {
    id: 'u4-them', unit: 4,
    prompt: 'These children are my friends. I like ___.', options: ['they', 'their', 'them'], answer: 'them',
    explanation: '动词 like 后作宾语，用宾格 them，表示“他们”。',
    translation: '这些孩子是我的朋友。我喜欢他们。',
  },
  {
    id: 'u5-was', unit: 5,
    prompt: 'I ___ at home yesterday.', options: ['am', 'was', 'were'], answer: 'was',
    explanation: 'yesterday 表示过去；主语是 I，be 动词的过去式用 was。',
    translation: '我昨天在家。',
  },
  {
    id: 'u5-were', unit: 5,
    prompt: 'We ___ in the park yesterday.', options: ['were', 'was', 'are'], answer: 'were',
    explanation: 'yesterday 表示过去；主语是 we，be 动词的过去式用 were。',
    translation: '我们昨天在公园里。',
  },
  {
    id: 'u5-saw', unit: 5,
    prompt: 'I ___ a beautiful lake last Sunday.', options: ['see', 'sees', 'saw'], answer: 'saw',
    explanation: 'last Sunday 表示过去的时间，see 的过去式是 saw。',
    translation: '我上周日看到了一个美丽的湖。',
  },
  {
    id: 'u5-these', unit: 5,
    prompt: 'These ___ are beautiful.', options: ['house', 'houses', 'a house'], answer: 'houses',
    explanation: 'these 表示“这些”，后面接可数名词复数 houses。',
    translation: '这些房子很漂亮。',
  },
  {
    id: 'u6-went', unit: 6,
    prompt: 'We ___ to the zoo yesterday.', options: ['went', 'go', 'goes'], answer: 'went',
    explanation: 'yesterday 表示过去，go 的过去式是 went。',
    translation: '我们昨天去了动物园。',
  },
  {
    id: 'u6-did-go', unit: 6,
    prompt: 'Did you ___ by train?', options: ['went', 'going', 'go'], answer: 'go',
    explanation: 'Did 已经表示过去，后面的实义动词用原形 go。',
    translation: '你是坐火车去的吗？',
  },
  {
    id: 'u6-ate', unit: 6,
    prompt: 'I ___ an apple yesterday.', options: ['eat', 'ate', 'eats'], answer: 'ate',
    explanation: 'yesterday 表示过去，eat 的过去式是 ate。',
    translation: '我昨天吃了一个苹果。',
  },
  {
    id: 'u6-by-plane', unit: 6,
    prompt: 'We went there ___ plane.', options: ['by', 'at', 'to'], answer: 'by',
    explanation: 'by + 交通工具表示出行方式，by plane 表示乘飞机。',
    translation: '我们乘飞机去了那里。',
  },
  {
    id: 'u6-did-not', unit: 6,
    prompt: 'I did not ___ TV yesterday.', options: ['watched', 'watching', 'watch'], answer: 'watch',
    explanation: 'did not 后面接动词原形，所以用 watch。',
    translation: '我昨天没有看电视。',
  },
];

export type AnimatedStory = {
  id: string;
  title: string;
  titleEn: string;
  unit: number;
  scenes: {
    text: string;
    translation: string;
    emoji: string;
    background: 'pink' | 'mint' | 'blue' | 'butter';
  }[];
};

/** Original illustrated stories with browser speech, not textbook audio or video. */
export const animatedStories: AnimatedStory[] = [
  {
    id: 'paper-star-club', title: '一颗小小的纸星星', titleEn: 'The Paper Star', unit: 1,
    scenes: [
      { text: 'Mia wants to join the art club.', translation: '米娅想加入美术社团。', emoji: '🎨', background: 'pink' },
      { text: 'She has some yellow paper.', translation: '她有一些黄色的纸。', emoji: '🟨', background: 'butter' },
      { text: 'She wants to make a star.', translation: '她想做一颗星星。', emoji: '⭐', background: 'blue' },
      { text: 'She draws a star on the paper.', translation: '她在纸上画了一颗星星。', emoji: '✏️', background: 'mint' },
      { text: 'She carefully cuts out the star.', translation: '她小心地剪出这颗星星。', emoji: '✂️', background: 'butter' },
      { text: 'Her friend says, "It is beautiful!"', translation: '她的朋友说：“它真漂亮！”', emoji: '🌟', background: 'pink' },
      { text: 'Mia smiles. Making things is fun!', translation: '米娅笑了。动手做东西真有趣！', emoji: '😊', background: 'mint' },
    ],
  },
  {
    id: 'a-happy-healthy-day', title: '元气满满的一天', titleEn: 'A Healthy Day', unit: 3,
    scenes: [
      { text: "It is seven o'clock. Ben gets up.", translation: '七点了。本起床了。', emoji: '🌞', background: 'butter' },
      { text: 'He washes his hands before breakfast.', translation: '他在早饭前洗手。', emoji: '🧼', background: 'blue' },
      { text: 'He eats an egg and some fruit.', translation: '他吃一个鸡蛋和一些水果。', emoji: '🥚🍎', background: 'pink' },
      { text: 'After school, he exercises in the park.', translation: '放学后，他在公园里锻炼。', emoji: '🏃', background: 'mint' },
      { text: 'He often plays with his friends.', translation: '他经常和朋友们一起玩。', emoji: '⚽', background: 'blue' },
      { text: 'He reads a book after dinner.', translation: '晚饭后，他读一本书。', emoji: '📖', background: 'butter' },
      { text: "At nine o'clock, he goes to bed. Good night!", translation: '九点时，他上床睡觉。晚安！', emoji: '🌙', background: 'pink' },
    ],
  },
  {
    id: 'a-little-train-trip', title: '坐火车去看世界', titleEn: 'A Wonderful Trip', unit: 6,
    scenes: [
      { text: 'Last Sunday, Lily went on a trip with her family.', translation: '上周日，莉莉和家人一起去旅行。', emoji: '🧳', background: 'pink' },
      { text: 'They went to a small town by train.', translation: '他们坐火车去了一个小镇。', emoji: '🚆', background: 'blue' },
      { text: 'The trip took about an hour.', translation: '这段旅程大约用了一个小时。', emoji: '⏳', background: 'butter' },
      { text: 'They saw a beautiful lake.', translation: '他们看到了一个美丽的湖。', emoji: '🏞️', background: 'mint' },
      { text: 'Lily drew a picture of the lake.', translation: '莉莉画了一幅湖的画。', emoji: '🖍️', background: 'blue' },
      { text: 'They ate lunch under a big tree.', translation: '他们在一棵大树下吃了午饭。', emoji: '🌳', background: 'butter' },
      { text: 'They had a wonderful day!', translation: '他们度过了美好的一天！', emoji: '🌈', background: 'pink' },
    ],
  },
];
