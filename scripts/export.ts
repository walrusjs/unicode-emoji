import fs from 'fs';
import path from 'path';
import { slugify } from './utils';
import { Emoji } from '../src/types';

// 获取列表数据
const orderedEmojiData = fs.readFileSync('./emoji-order.txt', 'utf-8');
// 获取分组数据
const groupedEmojiData = fs.readFileSync('./emoji-group.txt', 'utf-8');

const orderedEmoji: string[] = [];
const dataByEmoji: Record<string, Emoji> = {};
const emojiComponents = {};

const SKIN_TONE_VARIATION_DESC = /\sskin\stone(?:,|$)/;
const VARIATION_16 = String.fromCodePoint(0xfe0f);

const GROUP_REGEX = /^#\sgroup:\s(?<name>.+)/;
const EMOJI_REGEX = /^[^#]+;\s(?<type>[\w-]+)\s+#\s(?<emoji>\S+)\sE(?<emojiversion>\d+\.\d)\s(?<desc>.+)/;
let currentGroup = null;

groupedEmojiData.split('\n').forEach((line) => {
  const groupMatch = line.match(GROUP_REGEX);
  if (groupMatch) {
    currentGroup = groupMatch.groups.name;
  } else {
    const emojiMatch = line.match(EMOJI_REGEX);
    if (emojiMatch) {
      const {
        groups: { type, emoji, desc, emojiversion }
      } = emojiMatch;
      if (type === 'fully-qualified') {
        if (line.match(SKIN_TONE_VARIATION_DESC)) return;
        dataByEmoji[emoji] = {
          name: null,
          group: currentGroup,
          version: emojiversion,
          skin_tone_support: null
        } as Emoji;
      } else if (type === 'component') {
        emojiComponents[slugify(desc)] = emoji;
      }
    }
  }
});

const ORDERED_EMOJI_REGEX = /.+\s;\s(?<version>[0-9.]+)\s#\s(?<emoji>\S+)\s(?<name>[^:]+)(?::\s)?(?<desc>.+)?/;
let currentEmoji = null;

orderedEmojiData.split('\n').forEach((line) => {
  if (line.length === 0) return;
  const match = line.match(ORDERED_EMOJI_REGEX);
  if (!match) return;

  const {
    groups: { version, emoji, name, desc }
  } = match;

  const isSkinToneVariation = desc && !!desc.match(SKIN_TONE_VARIATION_DESC);
  const fullName = desc && !isSkinToneVariation ? [name, desc].join(' ') : name;

  if (isSkinToneVariation) {
    dataByEmoji[currentEmoji].skin_tone_support = true;
    dataByEmoji[currentEmoji].skin_tone_support_version = version;
  } else {
    const emojiWithOptionalVariation16 = dataByEmoji[emoji] ? emoji : emoji + VARIATION_16;
    const emojiEntry = dataByEmoji[emojiWithOptionalVariation16];
    if (!emojiEntry) {
      if (Object.values(emojiComponents).includes(emoji)) return;
      throw `${emoji} entry from emoji-order.txt match not found in emoji-group.txt`;
    }
    currentEmoji = emojiWithOptionalVariation16;
    orderedEmoji.push(currentEmoji);
    dataByEmoji[currentEmoji].name = fullName.split(/[\s-]/).join('_');
    dataByEmoji[currentEmoji].skin_tone_support = false;
  }
});

fs.writeFileSync(
  path.resolve(__dirname, '../src/emoji.ts'),
  `export const emojis = ${JSON.stringify(dataByEmoji, null, 2)}`
);
